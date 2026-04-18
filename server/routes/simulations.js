import { Router } from 'express';
import Simulation from '../models/Simulation.js';
import AuditLog from '../models/AuditLog.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ── GET /api/simulations ──
router.get('/', requireAuth, async (req, res) => {
  try {
    const sims = await Simulation.find()
      .populate('runBy', 'username name')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(sims);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/simulations ──
router.post('/', requireAuth, async (req, res) => {
  try {
    const sim = new Simulation({
      ...req.body,
      status: 'running',
      runBy: req.user._id,
    });
    await sim.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('simulationStarted', sim);
      io.emit('auditLog', {
        action: 'Simulation Run',
        user: req.user.username,
        target: sim.name,
        status: 'success',
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
    }

    await AuditLog.create({
      action: 'Simulation Run',
      user: req.user.username,
      userId: req.user._id,
      target: sim.name,
      status: 'success',
      ip: req.ip,
    });

    // Emit progress updates
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) progress = 100;
      if (io) {
        io.emit('simulationProgress', {
          id: sim._id,
          name: sim.name,
          progress,
          phase: progress < 30 ? 'Scanning...' : progress < 60 ? 'Analyzing...' : progress < 90 ? 'Testing exploits...' : 'Generating report...',
        });
      }
      if (progress >= 100) clearInterval(progressInterval);
    }, 800);

    // Complete after 5 seconds
    setTimeout(async () => {
      sim.status = 'completed';
      sim.completedAt = new Date();
      sim.results = {
        vulnerabilitiesFound: Math.floor(Math.random() * 10) + 1,
        exploitsSuccessful: Math.floor(Math.random() * 5),
        riskScore: (Math.random() * 100).toFixed(1),
        duration: `${(Math.random() * 30 + 5).toFixed(1)}s`,
        packetsAnalyzed: Math.floor(Math.random() * 50000) + 10000,
      };
      await sim.save();
      if (io) io.emit('simulationCompleted', sim);
    }, 5000);

    res.status(201).json(sim);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── GET /api/simulations/:id ──
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const sim = await Simulation.findById(req.params.id).populate('runBy', 'username name');
    if (!sim) return res.status(404).json({ error: 'Simulation not found.' });
    res.json(sim);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
