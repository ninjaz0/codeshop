const express = require('express');
const multer = require('multer');
const path = require('path');
const { getDb } = require('../db/init');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { generateCodes } = require('../utils/codeGen');

const router = express.Router();
router.use(authMiddleware);
router.use(adminMiddleware);

// Multer config for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `product_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  }
});

// ==================== Product Management ====================

router.get('/products', (req, res) => {
  try {
    const db = getDb();
    const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
    products.forEach(p => {
      if (p.delivery_type === 'unique') {
        const c = db.prepare("SELECT COUNT(*) as count FROM virtual_keys WHERE product_id = ? AND status = 'available'").get(p.id);
        p.stock_count = c.count;
      }
    });
    res.json({ products });
  } catch (err) {
    console.error('Admin get products error:', err);
    res.status(500).json({ error: '获取商品列表失败' });
  }
});

router.post('/products', upload.single('image'), (req, res) => {
  try {
    const { name, description, price, delivery_type, fixed_content, stock_count } = req.body;
    if (!name || !price) return res.status(400).json({ error: '商品名称和价格不能为空' });

    const image_url = req.file ? `/uploads/${req.file.filename}` : '';
    const db = getDb();
    const result = db.prepare(
      "INSERT INTO products (name, description, price, image_url, delivery_type, fixed_content, stock_count) VALUES (?,?,?,?,?,?,?)"
    ).run(name, description || '', parseFloat(price), image_url, delivery_type || 'unique', fixed_content || '', parseInt(stock_count) || 0);

    res.status(201).json({ message: '商品创建成功', productId: result.lastInsertRowid });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: '创建商品失败' });
  }
});

router.put('/products/:id', upload.single('image'), (req, res) => {
  try {
    const { name, description, price, status, delivery_type, fixed_content, stock_count } = req.body;
    const db = getDb();
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ error: '商品不存在' });

    const image_url = req.file ? `/uploads/${req.file.filename}` : product.image_url;
    db.prepare(
      "UPDATE products SET name=?, description=?, price=?, image_url=?, status=?, delivery_type=?, fixed_content=?, stock_count=?, updated_at=datetime('now','localtime') WHERE id=?"
    ).run(
      name || product.name, description ?? product.description, price ? parseFloat(price) : product.price,
      image_url, status || product.status, delivery_type || product.delivery_type,
      fixed_content ?? product.fixed_content, stock_count != null ? parseInt(stock_count) : product.stock_count,
      req.params.id
    );
    res.json({ message: '商品更新成功' });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: '更新商品失败' });
  }
});

router.delete('/products/:id', (req, res) => {
  try {
    const db = getDb();
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ error: '商品不存在' });

    // ON DELETE SET NULL on order_items handles preserving order history
    // ON DELETE CASCADE on virtual_keys and cart_items cleans up related records
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);

    res.json({ message: '商品已删除' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: '删除商品失败' });
  }
});

// ==================== Redemption Code Management ====================

router.get('/codes', (req, res) => {
  try {
    const db = getDb();
    const codes = db.prepare(`
      SELECT rc.*, u.username as used_by_name
      FROM redemption_codes rc LEFT JOIN users u ON rc.used_by = u.id
      ORDER BY rc.created_at DESC
    `).all();
    res.json({ codes });
  } catch (err) {
    console.error('Get codes error:', err);
    res.status(500).json({ error: '获取兑换码列表失败' });
  }
});

router.post('/codes', (req, res) => {
  try {
    const { count, faceValue } = req.body;
    if (!count || !faceValue || count < 1 || faceValue <= 0) {
      return res.status(400).json({ error: '请输入有效的数量和面值' });
    }
    const codes = generateCodes(Math.min(count, 100), faceValue);
    const db = getDb();
    const insert = db.prepare('INSERT INTO redemption_codes (code, face_value) VALUES (?, ?)');
    const insertMany = db.transaction((codes) => {
      for (const c of codes) insert.run(c.code, c.faceValue);
    });
    insertMany(codes);
    res.status(201).json({ message: `成功生成 ${codes.length} 个兑换码`, codes: codes.map(c => c.code) });
  } catch (err) {
    console.error('Generate codes error:', err);
    res.status(500).json({ error: '生成兑换码失败' });
  }
});

// ==================== Virtual Key Management ====================

router.get('/keys/:productId', (req, res) => {
  try {
    const db = getDb();
    const keys = db.prepare('SELECT * FROM virtual_keys WHERE product_id = ? ORDER BY created_at DESC').all(req.params.productId);
    res.json({ keys });
  } catch (err) {
    console.error('Get keys error:', err);
    res.status(500).json({ error: '获取卡密列表失败' });
  }
});

router.post('/keys', (req, res) => {
  try {
    const { productId, keys } = req.body;
    if (!productId || !keys || !Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({ error: '请提供商品ID和卡密列表' });
    }
    const db = getDb();
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) return res.status(404).json({ error: '商品不存在' });

    const insert = db.prepare('INSERT INTO virtual_keys (product_id, content) VALUES (?, ?)');
    const insertMany = db.transaction((keys) => {
      for (const key of keys) insert.run(productId, key);
    });
    insertMany(keys);

    // Update stock count
    const count = db.prepare("SELECT COUNT(*) as c FROM virtual_keys WHERE product_id = ? AND status = 'available'").get(productId);
    db.prepare('UPDATE products SET stock_count = ? WHERE id = ?').run(count.c, productId);

    res.status(201).json({ message: `成功添加 ${keys.length} 个卡密` });
  } catch (err) {
    console.error('Add keys error:', err);
    res.status(500).json({ error: '添加卡密失败' });
  }
});

router.delete('/keys/:id', (req, res) => {
  try {
    const db = getDb();
    const key = db.prepare('SELECT * FROM virtual_keys WHERE id = ?').get(req.params.id);
    if (!key) return res.status(404).json({ error: '卡密不存在' });
    if (key.status === 'sold') return res.status(400).json({ error: '已售出的卡密不能删除' });
    db.prepare('DELETE FROM virtual_keys WHERE id = ?').run(req.params.id);
    // Update stock count
    const count = db.prepare("SELECT COUNT(*) as c FROM virtual_keys WHERE product_id = ? AND status = 'available'").get(key.product_id);
    db.prepare('UPDATE products SET stock_count = ? WHERE id = ?').run(count.c, key.product_id);
    res.json({ message: '卡密已删除' });
  } catch (err) {
    console.error('Delete key error:', err);
    res.status(500).json({ error: '删除卡密失败' });
  }
});

router.delete('/codes/:id', (req, res) => {
  try {
    const db = getDb();
    const code = db.prepare('SELECT * FROM redemption_codes WHERE id = ?').get(req.params.id);
    if (!code) return res.status(404).json({ error: '兑换码不存在' });
    if (code.status === 'used') return res.status(400).json({ error: '已使用的兑换码不能删除' });
    db.prepare('DELETE FROM redemption_codes WHERE id = ?').run(req.params.id);
    res.json({ message: '兑换码已删除' });
  } catch (err) {
    console.error('Delete code error:', err);
    res.status(500).json({ error: '删除兑换码失败' });
  }
});

// ==================== Order Management ====================

router.get('/orders', (req, res) => {
  try {
    const db = getDb();
    const orders = db.prepare(`
      SELECT o.*, u.username FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC
    `).all();
    orders.forEach(order => {
      const ic = db.prepare('SELECT SUM(quantity) as total FROM order_items WHERE order_id = ?').get(order.id);
      order.itemCount = ic.total || 0;
    });
    res.json({ orders });
  } catch (err) {
    console.error('Admin get orders error:', err);
    res.status(500).json({ error: '获取订单列表失败' });
  }
});

router.get('/orders/:id', (req, res) => {
  try {
    const db = getDb();
    const order = db.prepare('SELECT o.*, u.username FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: '订单不存在' });
    const items = db.prepare('SELECT oi.*, p.image_url, p.delivery_type FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?').all(order.id);
    res.json({ order, items });
  } catch (err) {
    console.error('Admin get order detail error:', err);
    res.status(500).json({ error: '获取订单详情失败' });
  }
});


// ====== User Management ======

// Get all users
router.get('/users', (req, res) => {
  try {
    const db = getDb();
    const users = db.prepare(`
      SELECT id, username, balance, role, created_at 
      FROM users 
      ORDER BY id DESC
    `).all();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user balance
router.put('/users/:id/balance', (req, res) => {
  const { balance } = req.body;
  if (typeof balance !== 'number' || balance < 0) {
    return res.status(400).json({ error: 'Invalid balance amount' });
  }
  
  try {
    const db = getDb();
    db.prepare(`UPDATE users SET balance = ?, updated_at = datetime('now', 'localtime') WHERE id = ?`).run(balance, req.params.id);
    res.json({ message: 'Balance updated successfully' });
  } catch (error) {
    console.error('Balance update error:', error);
    res.status(500).json({ error: 'Failed to update balance' });
  }
});

// Update user role
router.put('/users/:id/role', (req, res) => {
  const { role } = req.body;
  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  
  try {
    const db = getDb();
    // prevent changing own role
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }
    db.prepare(`UPDATE users SET role = ?, updated_at = datetime('now', 'localtime') WHERE id = ?`).run(role, req.params.id);
    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Role update error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// Delete user
router.delete('/users/:id', (req, res) => {
  try {
    const db = getDb();
    const userId = parseInt(req.params.id);
    
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    
    db.transaction(() => {
      // Set user_id to NULL in redemption_codes and invitation_codes
      db.prepare('UPDATE redemption_codes SET used_by = NULL WHERE used_by = ?').run(userId);
      db.prepare('UPDATE invitation_codes SET used_by = NULL WHERE used_by = ?').run(userId);
      
      // Nullify order_item_id in virtual_keys to prevent foreign key constraint failure
      db.prepare(`
        UPDATE virtual_keys 
        SET order_item_id = NULL 
        WHERE order_item_id IN (
          SELECT id FROM order_items WHERE order_id IN (
            SELECT id FROM orders WHERE user_id = ?
          )
        )
      `).run(userId);

      // Delete orders associated with user (order_items will be cascade deleted by DB)
      db.prepare('DELETE FROM orders WHERE user_id = ?').run(userId);
      
      // Delete user (cart_items will be cascade deleted by DB)
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    })();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ====== Invitation Codes ======

// Get all invitation codes
router.get('/invitations', (req, res) => {
  try {
    const db = getDb();
    const codes = db.prepare(`
      SELECT ic.*, u.username as used_by_name 
      FROM invitation_codes ic 
      LEFT JOIN users u ON ic.used_by = u.id 
      ORDER BY ic.created_at DESC
    `).all();
    res.json({ codes });
  } catch (err) {
    console.error('Get invitations error:', err);
    res.status(500).json({ error: 'Failed to fetch invitation codes' });
  }
});

// Generate invitation codes
router.post('/invitations', (req, res) => {
  const { count = 1 } = req.body;
  if (count < 1 || count > 100) return res.status(400).json({ error: 'Count must be between 1 and 100' });
  
  try {
    const db = getDb();
    const rawCodes = generateCodes(count, 0);
    const finalCodes = rawCodes.map(c => 'INV-' + c.code);
    
    db.transaction(() => {
      const insert = db.prepare('INSERT INTO invitation_codes (code) VALUES (?)');
      for (const code of finalCodes) {
        insert.run(code);
      }
    })();
    
    res.json({ message: 'Success', codes: finalCodes });
  } catch (err) {
    console.error('Generate invitations error:', err);
    res.status(500).json({ error: 'Failed to generate invitation codes' });
  }
});

// Delete invitation code
router.delete('/invitations/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM invitation_codes WHERE id = ?').run(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Delete invitation error:', err);
    res.status(500).json({ error: 'Failed to delete invitation code' });
  }
});

module.exports = router;
