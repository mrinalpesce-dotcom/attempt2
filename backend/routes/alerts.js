import { Router } from 'express';
import Alert from '../models/Alert.js';
import AuditLog from '../models/AuditLog.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ── GET /api/alerts ──
router.get('/', requireAuth, async (req, res) => {
  try {
    const { severity, status, search, type, limit, page } = req.query;
    const filter = {};
    if (severity && severity !== 'all') filter.severity = severity;
    if (status && status !== 'all') filter.status = status;
    if (type && type !== 'all') filter.type = type;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sourceIP: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 50;
    const skip = (pageNum - 1) * pageSize;

    const [alerts, total] = await Promise.all([
      Alert.find(filter).sort({ timestamp: -1 }).skip(skip).limit(pageSize),
      Alert.countDocuments(filter),
    ]);

    res.json({
      alerts,
      pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/alerts/stats ──
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const [total, critical, high, medium, low, active, investigating, resolved] = await Promise.all([
      Alert.countDocuments(),
      Alert.countDocuments({ severity: 'CRITICAL' }),
      Alert.countDocuments({ severity: 'HIGH' }),
      Alert.countDocuments({ severity: 'MEDIUM' }),
      Alert.countDocuments({ severity: 'LOW' }),
      Alert.countDocuments({ status: 'active' }),
      Alert.countDocuments({ status: 'investigating' }),
      Alert.countDocuments({ status: 'resolved' }),
    ]);

    res.json({ total, critical, high, medium, low, active, investigating, resolved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/alerts/:id ──
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found.' });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/alerts ──
router.post('/', requireAuth, async (req, res) => {
  try {
    const alert = new Alert(req.body);
    await alert.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('newAlert', alert);
      io.emit('liveAlert', alert);
      io.emit('auditLog', {
        action: 'Alert Created',
        user: req.user.username,
        target: alert.title,
        status: 'success',
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
    }

    await AuditLog.create({
      action: 'Alert Created',
      user: req.user.username,
      userId: req.user._id,
      target: alert.title,
      status: 'success',
      ip: req.ip,
      details: `${alert.severity} alert: ${alert.title}`,
    });

    res.status(201).json(alert);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── PATCH /api/alerts/:id ──
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.body.status === 'resolved') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = req.user._id;
    }

    const alert = await Alert.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!alert) return res.status(404).json({ error: 'Alert not found.' });

    const io = req.app.get('io');
    if (io) {
      io.emit('alertUpdated', alert);
    }

    await AuditLog.create({
      action: 'Alert Updated',
      user: req.user.username,
      userId: req.user._id,
      target: alert.title,
      status: 'success',
      ip: req.ip,
      details: `Updated: ${Object.keys(req.body).join(', ')}`,
    });

    res.json(alert);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── DELETE /api/alerts/:id ──
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found.' });

    const io = req.app.get('io');
    if (io) {
      io.emit('alertDeleted', req.params.id);
    }

    await AuditLog.create({
      action: 'Alert Deleted',
      user: req.user.username,
      userId: req.user._id,
      target: alert.title,
      status: 'success',
      ip: req.ip,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
