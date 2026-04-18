import { Router } from 'express';
import AuditLog from '../models/AuditLog.js';
import BlockedIP from '../models/BlockedIP.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ══════════════ Audit Logs ══════════════

// ── GET /api/admin/audit ──
router.get('/audit', requireAuth, async (req, res) => {
  try {
    const { user, action, status, limit } = req.query;
    const filter = {};
    if (user) filter.user = { $regex: user, $options: 'i' };
    if (action) filter.action = { $regex: action, $options: 'i' };
    if (status && status !== 'all') filter.status = status;

    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit) || 50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/audit ──
router.post('/audit', requireAuth, async (req, res) => {
  try {
    const log = new AuditLog({
      ...req.body,
      userId: req.user._id,
    });
    await log.save();

    const io = req.app.get('io');
    if (io) io.emit('auditLog', log);

    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ══════════════ Blocked IPs ══════════════

// ── GET /api/admin/blocked-ips ──
router.get('/blocked-ips', requireAuth, async (req, res) => {
  try {
    const ips = await BlockedIP.find().sort({ blockedAt: -1 });
    res.json(ips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/blocked-ips ──
router.post('/blocked-ips', requireAuth, async (req, res) => {
  try {
    const existing = await BlockedIP.findOne({ ip: req.body.ip });
    if (existing) {
      return res.status(409).json({ error: 'IP already blocked.' });
    }

    const blocked = new BlockedIP({
      ...req.body,
      blockedBy: req.user.username,
      userId: req.user._id,
    });
    await blocked.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('ipBlocked', blocked);
      io.emit('auditLog', {
        action: 'IP Blocked',
        user: req.user.username,
        target: req.body.ip,
        status: 'success',
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
    }

    await AuditLog.create({
      action: 'IP Blocked',
      user: req.user.username,
      userId: req.user._id,
      target: req.body.ip,
      status: 'success',
      ip: req.ip,
      details: `Reason: ${req.body.reason || 'Manual block'}`,
    });

    res.status(201).json(blocked);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── DELETE /api/admin/blocked-ips/:ip ──
router.delete('/blocked-ips/:ip', requireAuth, async (req, res) => {
  try {
    const result = await BlockedIP.findOneAndDelete({ ip: req.params.ip });
    if (!result) return res.status(404).json({ error: 'Blocked IP not found.' });

    const io = req.app.get('io');
    if (io) {
      io.emit('ipUnblocked', req.params.ip);
      io.emit('auditLog', {
        action: 'IP Unblocked',
        user: req.user.username,
        target: req.params.ip,
        status: 'success',
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
    }

    await AuditLog.create({
      action: 'IP Unblocked',
      user: req.user.username,
      userId: req.user._id,
      target: req.params.ip,
      status: 'success',
      ip: req.ip,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
