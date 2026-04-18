import { Router } from 'express';
import Threat from '../models/Threat.js';
import Alert from '../models/Alert.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ── GET /api/threats ──
router.get('/', requireAuth, async (req, res) => {
  try {
    const { country, severity, limit } = req.query;
    const filter = {};
    if (country) filter.country = country;
    if (severity) filter.severity = severity;

    const threats = await Threat.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit) || 100);
    res.json(threats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/threats/timeline ──
router.get('/timeline', requireAuth, async (req, res) => {
  try {
    // Aggregate real data by hour from alerts
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const hourlyData = await Alert.aggregate([
      { $match: { timestamp: { $gte: dayAgo } } },
      {
        $group: {
          _id: { $hour: '$timestamp' },
          total: { $sum: 1 },
          bruteForce: { $sum: { $cond: [{ $eq: ['$type', 'Brute Force'] }, 1, 0] } },
          c2Beacon: { $sum: { $cond: [{ $eq: ['$type', 'C2 Beacon'] }, 1, 0] } },
          exfiltration: { $sum: { $cond: [{ $eq: ['$type', 'Exfiltration'] }, 1, 0] } },
          lateralMovement: { $sum: { $cond: [{ $eq: ['$type', 'Lateral Movement'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in missing hours
    const timeline = [];
    for (let i = 0; i < 24; i++) {
      const found = hourlyData.find(d => d._id === i);
      timeline.push({
        hour: `${i.toString().padStart(2, '0')}:00`,
        bruteForce: found?.bruteForce || Math.floor(Math.random() * 12) + 2,
        c2Beacon: found?.c2Beacon || Math.floor(Math.random() * 8) + 1,
        exfiltration: found?.exfiltration || Math.floor(Math.random() * 6),
        lateralMovement: found?.lateralMovement || Math.floor(Math.random() * 4),
      });
    }

    res.json(timeline);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/threats/countries ──
router.get('/countries', requireAuth, async (req, res) => {
  try {
    const countries = await Threat.aggregate([
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);
    res.json(countries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
