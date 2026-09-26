import Database from '@tauri-apps/plugin-sql';

let sqlDb: Database | null = null;
let isInitialized = false;

export const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export async function getDb(): Promise<Database | null> {
  if (!isTauri) return null;
  if (!sqlDb) {
    await initDb();
  }
  return sqlDb;
}

export async function initDb(): Promise<void> {
  if (isInitialized) return;

  if (isTauri) {
    try {
      sqlDb = await Database.load('sqlite:smartmarket.db');

      try { await sqlDb.execute('PRAGMA journal_mode = WAL;'); } catch {}
      try { await sqlDb.execute('PRAGMA synchronous = NORMAL;'); } catch {}
      try { await sqlDb.execute('PRAGMA foreign_keys = ON;'); } catch {}
      try { await sqlDb.execute('PRAGMA busy_timeout = 5000;'); } catch {}

      const ddlQueries = [
        `CREATE TABLE IF NOT EXISTS system_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          full_name TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('OWNER', 'OPERATOR')),
          is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
          created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
        )`,
        `CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sku TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          unit TEXT NOT NULL DEFAULT 'BOX',
          purchase_price REAL NOT NULL CHECK (purchase_price >= 0),
          selling_price REAL NOT NULL CHECK (selling_price >= purchase_price),
          current_stock INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
          min_stock_alert INTEGER NOT NULL DEFAULT 10 CHECK (min_stock_alert >= 0),
          is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
          created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
        )`,
        `CREATE TABLE IF NOT EXISTS product_imports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          import_number TEXT NOT NULL UNIQUE,
          product_id INTEGER NOT NULL REFERENCES products(id),
          quantity INTEGER NOT NULL CHECK (quantity > 0),
          unit_cost REAL NOT NULL CHECK (unit_cost >= 0),
          supplier_info TEXT,
          import_date TEXT NOT NULL DEFAULT (date('now', 'localtime')),
          received_by INTEGER NOT NULL REFERENCES system_users(id),
          created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
        )`,
        `CREATE TABLE IF NOT EXISTS retail_shops (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          shop_name TEXT NOT NULL,
          owner_name TEXT,
          phone TEXT,
          address TEXT,
          outstanding_balance REAL NOT NULL DEFAULT 0.0,
          credit_limit REAL NOT NULL DEFAULT 0.0,
          created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
        )`,
        `CREATE TABLE IF NOT EXISTS order_bookers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          territory TEXT,
          commission_rate REAL NOT NULL DEFAULT 0.0 CHECK (commission_rate >= 0),
          is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
          created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
        )`,
        `CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_number TEXT NOT NULL UNIQUE,
          shop_id INTEGER NOT NULL REFERENCES retail_shops(id),
          order_booker_id INTEGER REFERENCES order_bookers(id),
          order_source TEXT NOT NULL DEFAULT 'MANUAL_WHATSAPP' CHECK (order_source IN ('MANUAL_WHATSAPP', 'MANUAL_IN_PERSON', 'DIRECT_PHONE', 'DIRECT_WALKIN')),
          order_date TEXT NOT NULL DEFAULT (date('now', 'localtime')),
          status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'DISPATCHED', 'BILLED', 'CANCELLED')),
          total_amount REAL NOT NULL DEFAULT 0.0 CHECK (total_amount >= 0),
          notes TEXT,
          created_by INTEGER NOT NULL REFERENCES system_users(id),
          created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
        )`,
        `CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES products(id),
          quantity INTEGER NOT NULL CHECK (quantity > 0),
          unit_price REAL NOT NULL CHECK (unit_price >= 0),
          line_total REAL NOT NULL CHECK (line_total >= 0)
        )`,
        `CREATE TABLE IF NOT EXISTS dispatch_slips (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          slip_number TEXT NOT NULL UNIQUE,
          order_booker_id INTEGER NOT NULL REFERENCES order_bookers(id),
          dispatch_date TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
          status TEXT NOT NULL DEFAULT 'DISPATCHED' CHECK (status IN ('DISPATCHED', 'RECONCILED')),
          notes TEXT,
          created_by INTEGER NOT NULL REFERENCES system_users(id)
        )`,
        `CREATE TABLE IF NOT EXISTS dispatch_slip_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          dispatch_slip_id INTEGER NOT NULL REFERENCES dispatch_slips(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES products(id),
          dispatched_qty INTEGER NOT NULL CHECK (dispatched_qty > 0),
          returned_qty INTEGER NOT NULL DEFAULT 0 CHECK (returned_qty >= 0),
          billed_qty INTEGER NOT NULL DEFAULT 0 CHECK (billed_qty >= 0),
          CHECK (billed_qty + returned_qty <= dispatched_qty)
        )`,
        `CREATE TABLE IF NOT EXISTS bills (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          bill_number TEXT NOT NULL UNIQUE,
          order_id INTEGER REFERENCES orders(id),
          shop_id INTEGER NOT NULL REFERENCES retail_shops(id),
          order_booker_id INTEGER REFERENCES order_bookers(id),
          bill_date TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
          subtotal REAL NOT NULL CHECK (subtotal >= 0),
          discount_amount REAL NOT NULL DEFAULT 0.0 CHECK (discount_amount >= 0),
          net_amount REAL NOT NULL CHECK (net_amount >= 0),
          paid_amount REAL NOT NULL DEFAULT 0.0 CHECK (paid_amount >= 0),
          payment_status TEXT NOT NULL CHECK (payment_status IN ('PAID', 'PARTIAL', 'CREDIT')),
          created_by INTEGER NOT NULL REFERENCES system_users(id),
          created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
        )`,
        `CREATE TABLE IF NOT EXISTS bill_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES products(id),
          quantity INTEGER NOT NULL CHECK (quantity > 0),
          unit_purchase_price REAL NOT NULL CHECK (unit_purchase_price >= 0),
          unit_selling_price REAL NOT NULL CHECK (unit_selling_price >= 0),
          line_total REAL NOT NULL CHECK (line_total >= 0),
          line_profit REAL NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS inventory_ledger (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL REFERENCES products(id),
          change_qty INTEGER NOT NULL CHECK (change_qty != 0),
          balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
          transaction_type TEXT NOT NULL CHECK (transaction_type IN ('IMPORT', 'SALE_BILL', 'BOOKER_DISPATCH', 'BOOKER_RETURN', 'DAMAGE_ADJUSTMENT')),
          reference_id INTEGER NOT NULL,
          reference_type TEXT NOT NULL,
          performed_by INTEGER NOT NULL REFERENCES system_users(id),
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
        )`,
        `CREATE TABLE IF NOT EXISTS booker_reconciliations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          reconciliation_date TEXT NOT NULL DEFAULT (date('now', 'localtime')),
          order_booker_id INTEGER NOT NULL REFERENCES order_bookers(id),
          orders_count_total INTEGER NOT NULL DEFAULT 0,
          orders_count_collected INTEGER NOT NULL DEFAULT 0,
          orders_count_pending INTEGER NOT NULL DEFAULT 0,
          total_cash_submitted REAL NOT NULL DEFAULT 0.0,
          total_credit_issued REAL NOT NULL DEFAULT 0.0,
          shortage_amount REAL NOT NULL DEFAULT 0.0,
          verified_by INTEGER NOT NULL REFERENCES system_users(id),
          created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
        )`,
        `CREATE TABLE IF NOT EXISTS shop_payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          shop_id INTEGER NOT NULL REFERENCES retail_shops(id),
          amount REAL NOT NULL CHECK (amount > 0),
          payment_date TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
          payment_method TEXT NOT NULL DEFAULT 'CASH',
          notes TEXT,
          received_by INTEGER NOT NULL REFERENCES system_users(id),
          created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
        )`,
      ];

      for (const query of ddlQueries) {
        await sqlDb.execute(query);
      }

      // Ensure default system user exists
      const users: any[] = await sqlDb.select('SELECT id FROM system_users LIMIT 1');
      if (users.length === 0) {
        await sqlDb.execute(
          `INSERT INTO system_users (username, password_hash, full_name, role) VALUES ('admin', '$2b$10$abcdefghijklmnopqrstuv', 'System Owner', 'OWNER')`
        );
      }

      isInitialized = true;
      console.log('✅ [Tauri SQLite] Embedded database initialized successfully.');
    } catch (err) {
      console.error('❌ [Tauri SQLite] Failed to initialize embedded database:', err);
    }
  }
}
