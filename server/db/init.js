const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'store.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    // Enable WAL mode for better concurrent read performance
    db.pragma('journal_mode = WAL');
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    initTables();
    seedAdmin();
  }
  return db;
}

function initTables() {
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Products table
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      price REAL NOT NULL,
      image_url TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'on_sale',
      delivery_type TEXT NOT NULL DEFAULT 'unique',
      fixed_content TEXT DEFAULT '',
      stock_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Cart items table
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(user_id, product_id)
    );

    -- Orders table
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Order items table
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name TEXT NOT NULL DEFAULT '',
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      delivery_content TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    );

    -- Redemption codes table
    CREATE TABLE IF NOT EXISTS redemption_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      face_value REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'unused',
      used_by INTEGER,
      used_at TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (used_by) REFERENCES users(id)
    );

    -- Virtual keys table
    CREATE TABLE IF NOT EXISTS virtual_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available',
      order_item_id INTEGER,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (order_item_id) REFERENCES order_items(id)
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_redemption_code ON redemption_codes(code);
    CREATE INDEX IF NOT EXISTS idx_virtual_keys_product ON virtual_keys(product_id);
    CREATE INDEX IF NOT EXISTS idx_virtual_keys_status ON virtual_keys(product_id, status);

    -- Invitation codes table
    CREATE TABLE IF NOT EXISTS invitation_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'unused',
      used_by INTEGER,
      used_at TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (used_by) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_invitation_code ON invitation_codes(code);
  `);

  console.log('✅ Database tables initialized');

  // Migration: make order_items.product_id nullable if needed
  try {
    const tableInfo = db.prepare("PRAGMA table_info(order_items)").all();
    const productIdCol = tableInfo.find(c => c.name === 'product_id');
    if (productIdCol && productIdCol.notnull === 1) {
      console.log('⬆️  Migrating order_items to allow nullable product_id...');
      db.pragma('foreign_keys = OFF');
      db.exec('DROP TABLE IF EXISTS order_items_new');
      db.exec(`
        CREATE TABLE order_items_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          product_id INTEGER,
          product_name TEXT NOT NULL DEFAULT '',
          quantity INTEGER NOT NULL,
          unit_price REAL NOT NULL,
          delivery_content TEXT DEFAULT '',
          created_at TEXT DEFAULT (datetime('now', 'localtime')),
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
        );
        INSERT INTO order_items_new SELECT * FROM order_items;
        DROP TABLE order_items;
        ALTER TABLE order_items_new RENAME TO order_items;
        CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
      `);
      db.pragma('foreign_keys = ON');
      console.log('✅ Migration complete');
    }
  } catch (e) {
    db.pragma('foreign_keys = ON');
    console.error('Migration error:', e.message);
  }
}

function seedAdmin() {
  const existingAdmin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (!existingAdmin) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('admin', hash, 'admin');
    console.log('✅ Seed admin account created (admin / admin123)');
  }
}

module.exports = { getDb };
