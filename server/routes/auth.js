const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/init');
const { JWT_SECRET, authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user account
 */
router.post('/register', (req, res) => {
  try {
    const { username, password, invitationCode } = req.body;

    if (!username || !password || !invitationCode) {
      return res.status(400).json({ error: '用户名、密码和邀请码不能为空' });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: '用户名长度需在3-20个字符之间' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度不能少于6个字符' });
    }

    const db = getDb();
    
    db.transaction(() => {
      const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
      if (existing) {
        throw new Error('用户名已被注册');
      }

      // Check invitation code
      const trimmedInvite = invitationCode.trim().toUpperCase();
      const invite = db.prepare('SELECT id, status FROM invitation_codes WHERE code = ?').get(trimmedInvite);
      if (!invite) {
        throw new Error('无效的邀请码');
      }
      if (invite.status !== 'unused') {
        throw new Error('邀请码已被使用');
      }

      const hash = bcrypt.hashSync(password, 10);
      const result = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hash);
      const userId = result.lastInsertRowid;

      // Mark invitation code as used
      db.prepare(`UPDATE invitation_codes SET status = 'used', used_by = ?, used_at = datetime('now', 'localtime') WHERE id = ?`).run(userId, invite.id);

      const token = jwt.sign(
        { id: userId, username, role: 'user' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: '注册成功',
        token,
        user: { id: userId, username, role: 'user', balance: 0 }
      });
    })();
  } catch (err) {
    if (['用户名已被注册', '无效的邀请码', '邀请码已被使用'].includes(err.message)) {
      return res.status(400).json({ error: err.message });
    }
    console.error('Register error:', err);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

/**
 * POST /api/auth/login
 * Login and receive JWT token
 */
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        balance: user.balance
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info (requires auth)
 */
router.get('/me', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT id, username, role, balance, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json({ user });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

module.exports = router;
