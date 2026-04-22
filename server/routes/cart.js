const express = require('express');
const { getDb } = require('../db/init');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

/**
 * GET /api/cart
 * Get current user's cart items
 */
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const items = db.prepare(`
      SELECT ci.id, ci.product_id, ci.quantity, ci.created_at,
             p.name, p.price, p.image_url, p.status, p.delivery_type, p.stock_count
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
      ORDER BY ci.created_at DESC
    `).all(req.user.id);

    // Update real-time stock for unique-type products
    items.forEach(item => {
      if (item.delivery_type === 'unique') {
        const countResult = db.prepare(
          "SELECT COUNT(*) as count FROM virtual_keys WHERE product_id = ? AND status = 'available'"
        ).get(item.product_id);
        item.stock_count = countResult.count;
      }
    });

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    res.json({ items, totalAmount });
  } catch (err) {
    console.error('Get cart error:', err);
    res.status(500).json({ error: '获取购物车失败' });
  }
});

/**
 * POST /api/cart
 * Add product to cart (or increment quantity)
 */
router.post('/', (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ error: '商品ID不能为空' });
    }

    const db = getDb();

    // Verify product exists and is on sale
    const product = db.prepare("SELECT * FROM products WHERE id = ? AND status = 'on_sale'").get(productId);
    if (!product) {
      return res.status(404).json({ error: '商品不存在或已下架' });
    }

    // Check if already in cart
    const existing = db.prepare(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?'
    ).get(req.user.id, productId);

    if (existing) {
      db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id);
    } else {
      db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)').run(
        req.user.id, productId, quantity
      );
    }

    res.json({ message: '已加入购物车' });
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ error: '加入购物车失败' });
  }
});

/**
 * PUT /api/cart/:id
 * Update cart item quantity
 */
router.put('/:id', (req, res) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: '数量必须大于0' });
    }

    const db = getDb();
    const item = db.prepare('SELECT * FROM cart_items WHERE id = ? AND user_id = ?').get(
      req.params.id, req.user.id
    );

    if (!item) {
      return res.status(404).json({ error: '购物车商品不存在' });
    }

    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, req.params.id);
    res.json({ message: '数量已更新' });
  } catch (err) {
    console.error('Update cart error:', err);
    res.status(500).json({ error: '更新失败' });
  }
});

/**
 * DELETE /api/cart/:id
 * Remove item from cart
 */
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(
      req.params.id, req.user.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: '购物车商品不存在' });
    }

    res.json({ message: '已从购物车移除' });
  } catch (err) {
    console.error('Delete cart item error:', err);
    res.status(500).json({ error: '删除失败' });
  }
});

/**
 * DELETE /api/cart
 * Clear all cart items for current user
 */
router.delete('/', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
    res.json({ message: '购物车已清空' });
  } catch (err) {
    console.error('Clear cart error:', err);
    res.status(500).json({ error: '清空购物车失败' });
  }
});

module.exports = router;
