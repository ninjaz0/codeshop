const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/init');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// All user routes require authentication
router.use(authMiddleware);

/**
 * POST /api/user/recharge
 * Redeem a code to add balance (CRITICAL: transaction + anti-concurrent)
 */
router.post('/recharge', (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: '请输入有效的兑换码' });
    }

    const trimmedCode = code.trim().toUpperCase();
    const db = getDb();

    // Use a transaction to prevent concurrent redemption of the same code
    const rechargeTransaction = db.transaction(() => {
      // 1. Find the code and check status
      const redemptionCode = db.prepare(
        'SELECT * FROM redemption_codes WHERE code = ?'
      ).get(trimmedCode);

      if (!redemptionCode) {
        throw { status: 404, message: '兑换码不存在' };
      }

      if (redemptionCode.status === 'used') {
        throw { status: 400, message: '该兑换码已被使用' };
      }

      // 2. Mark code as used
      db.prepare(
        "UPDATE redemption_codes SET status = 'used', used_by = ?, used_at = datetime('now', 'localtime') WHERE id = ? AND status = 'unused'"
      ).run(userId, redemptionCode.id);

      // Verify the update actually happened (anti-concurrent)
      const updated = db.prepare('SELECT status FROM redemption_codes WHERE id = ?').get(redemptionCode.id);
      if (updated.status !== 'used') {
        throw { status: 409, message: '兑换码核销失败，请重试' };
      }

      // 3. Add balance to user
      db.prepare(
        'UPDATE users SET balance = balance + ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?'
      ).run(redemptionCode.face_value, userId);

      // 4. Get updated balance
      const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);

      return {
        addedAmount: redemptionCode.face_value,
        newBalance: user.balance
      };
    });

    const result = rechargeTransaction();

    res.json({
      message: `充值成功！已充值 ¥${result.addedAmount.toFixed(2)}`,
      addedAmount: result.addedAmount,
      balance: result.newBalance
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error('Recharge error:', err);
    res.status(500).json({ error: '充值失败，请稍后重试' });
  }
});

/**
 * GET /api/user/balance
 * Get current balance
 */
router.get('/balance', (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
    res.json({ balance: user.balance });
  } catch (err) {
    console.error('Get balance error:', err);
    res.status(500).json({ error: '获取余额失败' });
  }
});

/**
 * PUT /api/user/profile
 * Update username
 */
router.put('/profile', (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user.id;

    if (!username || username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: '用户名长度需在3-20个字符之间' });
    }

    const db = getDb();

    // Check if new username is taken by another user
    const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, userId);
    if (existing) {
      return res.status(409).json({ error: '用户名已被使用' });
    }

    db.prepare("UPDATE users SET username = ?, updated_at = datetime('now', 'localtime') WHERE id = ?").run(username, userId);

    res.json({ message: '用户名修改成功', username });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: '修改失败，请稍后重试' });
  }
});

/**
 * PUT /api/user/password
 * Change password
 */
router.put('/password', (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: '请输入旧密码和新密码' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: '新密码长度不能少于6个字符' });
    }

    const db = getDb();
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId);

    if (!bcrypt.compareSync(oldPassword, user.password_hash)) {
      return res.status(401).json({ error: '旧密码错误' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now', 'localtime') WHERE id = ?").run(newHash, userId);

    res.json({ message: '密码修改成功' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: '修改密码失败，请稍后重试' });
  }
});

module.exports = router;
