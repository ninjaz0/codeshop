const express = require('express');
const { getDb } = require('../db/init');

const router = express.Router();

/**
 * GET /api/products
 * List all on-sale products (public, no auth required)
 * SECURITY: Does NOT expose fixed_content or virtual keys
 */
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const products = db.prepare(`
      SELECT id, name, description, price, image_url, status, delivery_type, stock_count, created_at
      FROM products
      WHERE status = 'on_sale'
      ORDER BY created_at DESC
    `).all();

    // For unique-type products, calculate real-time available stock
    const productsWithStock = products.map(p => {
      if (p.delivery_type === 'unique') {
        const countResult = db.prepare(
          "SELECT COUNT(*) as count FROM virtual_keys WHERE product_id = ? AND status = 'available'"
        ).get(p.id);
        p.stock_count = countResult.count;
      }
      return p;
    });

    res.json({ products: productsWithStock });
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ error: '获取商品列表失败' });
  }
});

/**
 * GET /api/products/:id
 * Get single product detail (public)
 * SECURITY: Does NOT expose fixed_content or virtual keys
 */
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const product = db.prepare(`
      SELECT id, name, description, price, image_url, status, delivery_type, stock_count, created_at
      FROM products
      WHERE id = ?
    `).get(req.params.id);

    if (!product) {
      return res.status(404).json({ error: '商品不存在' });
    }

    // Real-time stock for unique type
    if (product.delivery_type === 'unique') {
      const countResult = db.prepare(
        "SELECT COUNT(*) as count FROM virtual_keys WHERE product_id = ? AND status = 'available'"
      ).get(product.id);
      product.stock_count = countResult.count;
    }

    res.json({ product });
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({ error: '获取商品详情失败' });
  }
});

module.exports = router;
