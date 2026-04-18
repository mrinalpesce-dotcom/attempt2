import { Router } from 'express';
import Log from '../models/Log.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ── GET /api/logs ──
router.get('/', requireAuth, async (req, res) => {
  try {
    const { level, search, limit, page, source } = req.query;
    const filter = {};
    if (level && level !== 'all') filter.level = level;
    if (source && source !== 'all') filter.source = source;
    if (search) {
      filter.$or = [
        { event: { $regex: search, $options: 'i' } },
        { source: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 100;
    const skip = (pageNum - 1) * pageSize;

    const [logs, total] = await Promise.all([
      Log.find(filter).sort({ timestamp: -1 }).skip(skip).limit(pageSize),
      Log.countDocuments(filter),
    ]);

    res.json({
      logs,
      pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/logs/stats ──
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const [total, info, warning, error, critical, sources] = await Promise.all([
      Log.countDocuments(),
      Log.countDocuments({ level: 'info' }),
      Log.countDocuments({ level: 'warning' }),
      Log.countDocuments({ level: 'error' }),
      Log.countDocuments({ level: 'critical' }),
      Log.aggregate([
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);
    res.json({ total, info, warning, error, critical, sources });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/logs ──
router.post('/', requireAuth, async (req, res) => {
  try {
    const log = new Log(req.body);
    await log.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('liveLog', { ...log.toObject(), _id: log._id.toString() });
    }

    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── DELETE /api/logs ── (Clear logs - admin only)
router.delete('/', requireAuth, async (req, res) => {
  try {
    const { before } = req.query;
    const filter = {};
    if (before) filter.timestamp = { $lt: new Date(before) };

    const result = await Log.deleteMany(filter);
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
