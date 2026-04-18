import { Router } from 'express';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { generateToken, requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// ── POST /api/auth/login ──
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() },
      ],
    });

    if (!user) {
      // Log failed attempt
      await AuditLog.create({
        action: 'Login Failed',
        user: username,
        target: 'Auth System',
        status: 'failed',
        ip: req.ip,
        details: 'User not found',
      });
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Check if locked
    if (user.isLocked()) {
      await AuditLog.create({
        action: 'Login Blocked',
        user: username,
        userId: user._id,
        target: 'Auth System',
        status: 'failed',
        ip: req.ip,
        details: 'Account locked due to too many failed attempts',
      });
      return res.status(423).json({
        error: 'Account locked due to too many failed attempts. Try again in 15 minutes.',
      });
    }

    // Check if suspended
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account suspended. Contact administrator.' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.recordFailedAttempt();
      await AuditLog.create({
        action: 'Login Failed',
        user: username,
        userId: user._id,
        target: 'Auth System',
        status: 'failed',
        ip: req.ip,
        details: `Wrong password (attempt ${user.failedAttempts})`,
      });
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Success! Record login and generate token
    await user.recordLogin();
    const token = generateToken(user._id);

    // Audit log
    await AuditLog.create({
      action: 'User Login',
      user: user.username,
      userId: user._id,
      target: 'Auth System',
      status: 'success',
      ip: req.ip,
      details: `Logged in successfully (total logins: ${user.loginCount})`,
    });

    // Emit via socket if available
    if (req.app.get('io')) {
      req.app.get('io').emit('auditLog', {
        action: 'User Login',
        user: user.username,
        target: 'Auth System',
        status: 'success',
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// ── POST /api/auth/register ──
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, name, role } = req.body;

    if (!username || !email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required (username, email, password, name).' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check if user already exists
    const existing = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
    });
    if (existing) {
      return res.status(409).json({ error: 'Username or email already exists.' });
    }

    const user = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      name,
      role: role || 'Read Only',
    });
    await user.save();

    const token = generateToken(user._id);

    await AuditLog.create({
      action: 'User Registered',
      user: user.username,
      userId: user._id,
      target: 'Auth System',
      status: 'success',
      ip: req.ip,
      details: `New user registered with role: ${user.role}`,
    });

    res.status(201).json({
      success: true,
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    console.error('Register error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Username or email already exists.' });
    }
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// ── GET /api/auth/me ── (Get current user)
router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

// ── PUT /api/auth/me ── (Update own profile)
router.put('/me', requireAuth, async (req, res) => {
  try {
    const { name, email } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email.toLowerCase();
    updates.updatedAt = new Date();

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// ── PUT /api/auth/password ── (Change password)
router.put('/password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    await AuditLog.create({
      action: 'Password Changed',
      user: user.username,
      userId: user._id,
      target: 'Auth System',
      status: 'success',
      ip: req.ip,
    });

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

// ══════════════════════════════════════════════════════════════
//  Admin User Management (requires Super Admin / Security Analyst)
// ══════════════════════════════════════════════════════════════

// ── GET /api/auth/users ── (List all users)
router.get('/users', requireAuth, async (req, res) => {
  try {
    const { search, role, status } = req.query;
    const filter = {};
    if (role && role !== 'all') filter.role = role;
    if (status && status !== 'all') filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// ── POST /api/auth/users ── (Create new user - admin only)
router.post('/users', requireAuth, requireRole('Super Admin'), async (req, res) => {
  try {
    const { username, email, password, name, role, status } = req.body;

    const user = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: password || 'CyberShield@2026',
      name,
      role: role || 'Read Only',
      status: status || 'active',
    });
    await user.save();

    await AuditLog.create({
      action: 'User Created',
      user: req.user.username,
      userId: req.user._id,
      target: user.username,
      status: 'success',
      ip: req.ip,
      details: `Created user ${user.username} with role ${user.role}`,
    });

    if (req.app.get('io')) {
      req.app.get('io').emit('auditLog', {
        action: 'User Created',
        user: req.user.username,
        target: user.username,
        status: 'success',
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(201).json(user.toJSON());
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Username or email already exists.' });
    }
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

// ── PUT /api/auth/users/:id ── (Update user - admin only)
router.put('/users/:id', requireAuth, requireRole('Super Admin'), async (req, res) => {
  try {
    const { name, email, role, status } = req.body;
    const updates = { updatedAt: new Date() };
    if (name) updates.name = name;
    if (email) updates.email = email.toLowerCase();
    if (role) updates.role = role;
    if (status) updates.status = status;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found.' });

    await AuditLog.create({
      action: 'User Updated',
      user: req.user.username,
      userId: req.user._id,
      target: user.username,
      status: 'success',
      ip: req.ip,
      details: `Updated fields: ${Object.keys(updates).join(', ')}`,
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

// ── DELETE /api/auth/users/:id ── (Delete user - admin only)
router.delete('/users/:id', requireAuth, requireRole('Super Admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.role === 'Super Admin') {
      return res.status(403).json({ error: 'Cannot delete Super Admin accounts.' });
    }

    await User.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      action: 'User Deleted',
      user: req.user.username,
      userId: req.user._id,
      target: user.username,
      status: 'success',
      ip: req.ip,
    });

    res.json({ success: true, message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// ── PUT /api/auth/users/:id/reset-password ── (Reset password - admin only)
router.put('/users/:id/reset-password', requireAuth, requireRole('Super Admin'), async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.password = newPassword || 'CyberShield@2026';
    user.failedAttempts = 0;
    user.lockedUntil = undefined;
    await user.save();

    await AuditLog.create({
      action: 'Password Reset',
      user: req.user.username,
      userId: req.user._id,
      target: user.username,
      status: 'success',
      ip: req.ip,
    });

    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

export default router;
