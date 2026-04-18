import { Router } from 'express';
import Playbook from '../models/Playbook.js';
import AuditLog from '../models/AuditLog.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ── GET /api/playbooks ──
router.get('/', requireAuth, async (req, res) => {
  try {
    const playbooks = await Playbook.find().sort({ startedAt: -1 }).limit(20);
    res.json(playbooks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/playbooks/execute ──
router.post('/execute', requireAuth, async (req, res) => {
  try {
    const { playbookId, title, steps, triggeredBy, alertId } = req.body;

    const playbook = new Playbook({
      playbookId,
      title,
      status: 'running',
      triggeredBy: triggeredBy || req.user.username,
      alertId,
      steps: steps.map(s => ({ text: s.text || s, status: 'pending' })),
      startedAt: new Date(),
    });
    await playbook.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('playbookStarted', { _id: playbook._id, playbookId, title, status: 'running' });

      // Execute steps one by one with delays
      for (let i = 0; i < playbook.steps.length; i++) {
        setTimeout(async () => {
          playbook.steps[i].status = 'completed';
          playbook.steps[i].completedAt = new Date();

          io.emit('playbookStepComplete', {
            _id: playbook._id,
            playbookId,
            stepIndex: i,
            stepText: playbook.steps[i].text,
            totalSteps: playbook.steps.length,
            progress: Math.round(((i + 1) / playbook.steps.length) * 100),
          });

          if (i === playbook.steps.length - 1) {
            playbook.status = 'completed';
            playbook.completedAt = new Date();
            playbook.result = {
              success: true,
              stepsCompleted: playbook.steps.length,
              duration: `${((Date.now() - playbook.startedAt.getTime()) / 1000).toFixed(1)}s`,
              threatsNeutralized: Math.floor(Math.random() * 3) + 1,
            };
            await playbook.save();

            io.emit('playbookCompleted', {
              _id: playbook._id,
              playbookId,
              title,
              status: 'completed',
              result: playbook.result,
            });
          }
        }, (i + 1) * 1200);
      }
    }

    await AuditLog.create({
      action: 'Playbook Executed',
      user: req.user.username,
      userId: req.user._id,
      target: title,
      status: 'success',
      ip: req.ip,
    });

    res.status(201).json(playbook);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── GET /api/playbooks/:id ──
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const playbook = await Playbook.findById(req.params.id);
    if (!playbook) return res.status(404).json({ error: 'Playbook not found.' });
    res.json(playbook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
