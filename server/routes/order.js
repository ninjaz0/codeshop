const express = require('express');
const { getDb } = require('../db/init');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.post('/checkout', (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;

    const checkoutTransaction = db.transaction(() => {
      const cartItems = db.prepare(`
        SELECT ci.id as cart_id, ci.product_id, ci.quantity,
               p.name, p.price, p.status, p.delivery_type, p.fixed_content, p.stock_count
        FROM cart_items ci JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
      `).all(userId);

      if (cartItems.length === 0) throw { status: 400, message: '购物车为空' };

      let totalAmount = 0;
      for (const item of cartItems) {
        if (item.status !== 'on_sale') throw { status: 400, message: `商品"${item.name}"已下架` };
        if (item.delivery_type === 'unique') {
          const avail = db.prepare("SELECT COUNT(*) as c FROM virtual_keys WHERE product_id = ? AND status = 'available'").get(item.product_id);
          if (avail.c < item.quantity) throw { status: 400, message: `商品"${item.name}"库存不足` };
        }
        totalAmount += item.price * item.quantity;
      }

      const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
      if (user.balance < totalAmount) throw { status: 400, message: `余额不足，需要 ¥${totalAmount.toFixed(2)}，当前余额 ¥${user.balance.toFixed(2)}` };

      db.prepare("UPDATE users SET balance = balance - ?, updated_at = datetime('now','localtime') WHERE id = ?").run(totalAmount, userId);
      const updatedUser = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
      if (updatedUser.balance < 0) throw { status: 400, message: '余额不足，请重试' };

      const orderResult = db.prepare("INSERT INTO orders (user_id, total_amount) VALUES (?, ?)").run(userId, totalAmount);
      const orderId = orderResult.lastInsertRowid;

      for (const item of cartItems) {
        let deliveryContent = '';
        if (item.delivery_type === 'fixed') {
          deliveryContent = item.fixed_content || '';
        }

        const oiResult = db.prepare("INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, delivery_content) VALUES (?,?,?,?,?,?)").run(orderId, item.product_id, item.name, item.quantity, item.price, deliveryContent);
        const orderItemId = oiResult.lastInsertRowid;

        if (item.delivery_type === 'unique') {
          const keys = db.prepare("SELECT id, content FROM virtual_keys WHERE product_id = ? AND status = 'available' LIMIT ?").all(item.product_id, item.quantity);
          if (keys.length < item.quantity) throw { status: 400, message: `商品"${item.name}"卡密不足` };
          const keyContents = keys.map(k => k.content).join('\n');
          db.prepare("UPDATE order_items SET delivery_content = ? WHERE id = ?").run(keyContents, orderItemId);
          for (const key of keys) {
            db.prepare("UPDATE virtual_keys SET status = 'sold', order_item_id = ? WHERE id = ? AND status = 'available'").run(orderItemId, key.id);
          }
          db.prepare('UPDATE products SET stock_count = stock_count - ? WHERE id = ?').run(item.quantity, item.product_id);
        }
      }

      db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
      return { orderId, totalAmount, newBalance: updatedUser.balance };
    });

    const result = checkoutTransaction();
    res.status(201).json({ message: '订单创建成功', orderId: result.orderId, totalAmount: result.totalAmount, balance: result.newBalance });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('Checkout error:', err);
    res.status(500).json({ error: '结算失败，请稍后重试' });
  }
});

router.get('/', (req, res) => {
  try {
    const db = getDb();
    const orders = db.prepare('SELECT id, total_amount, status, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    orders.forEach(order => {
      const ic = db.prepare('SELECT SUM(quantity) as total FROM order_items WHERE order_id = ?').get(order.id);
      order.itemCount = ic.total || 0;
    });
    res.json({ orders });
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ error: '获取订单列表失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!order) return res.status(404).json({ error: '订单不存在' });
    const items = db.prepare('SELECT oi.*, p.image_url, p.delivery_type FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?').all(order.id);
    res.json({ order, items });
  } catch (err) {
    console.error('Get order detail error:', err);
    res.status(500).json({ error: '获取订单详情失败' });
  }
});

module.exports = router;
