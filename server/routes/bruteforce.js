import { Router } from 'express';
import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ── POST /api/bruteforce/start ──
router.post('/start', requireAuth, async (req, res) => {
  const { targetIP, targetUser, service, delay, wordlist } = req.body;

  const words = wordlist || [
    'password', '123456', 'admin', 'letmein', 'welcome', 'monkey', 'dragon',
    'master', 'qwerty', 'login', 'abc123', 'root', 'pass', 'test', 'guest',
    'shadow', 'sunshine', 'superman', 'hunter2', 'CyberShield@2026',
  ];

  const sessionId = new mongoose.Types.ObjectId().toString();
  const io = req.app.get('io');

  if (io) {
    io.emit('bruteForceStarted', {
      sessionId,
      targetIP,
      targetUser,
      service,
      wordlistSize: words.length,
      timestamp: new Date().toISOString(),
    });
  }

  await AuditLog.create({
    action: 'Brute Force Sim',
    user: req.user.username,
    userId: req.user._id,
    target: `${targetIP}:${service}`,
    status: 'success',
    ip: req.ip,
    details: `Wordlist size: ${words.length}, Target user: ${targetUser}`,
  });

  let index = 0;
  const interval = setInterval(() => {
    if (index >= words.length) {
      clearInterval(interval);
      if (io) {
        io.emit('bruteForceComplete', {
          sessionId,
          found: false,
          totalAttempts: words.length,
        });
      }
      return;
    }

    const pw = words[index];
    const isCorrect = pw === 'CyberShield@2026' && targetUser === 'admin';

    if (io) {
      io.emit('bruteForceAttempt', {
        sessionId,
        attempt: index + 1,
        total: words.length,
        password: pw,
        success: isCorrect,
        progress: ((index + 1) / words.length * 100).toFixed(1),
      });
    }

    if (isCorrect) {
      clearInterval(interval);
      if (io) {
        io.emit('bruteForceComplete', {
          sessionId,
          found: true,
          password: pw,
          totalAttempts: index + 1,
        });
      }
    }

    index++;
  }, delay || 200);

  res.json({ sessionId, status: 'started', wordlistSize: words.length });
});

export default router;
