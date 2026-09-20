-- Smart Market OS - SQLite Relational Schema
-- Enforce Foreign Keys
PRAGMA foreign_keys = ON;

-- 1. System Users Table
CREATE TABLE IF NOT EXISTS system_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'OPERATOR')),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 2. Products Master Catalog
CREATE TABLE IF NOT EXISTS products (
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
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- 3. Product Imports (Inward Stock Receiving)
CREATE TABLE IF NOT EXISTS product_imports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  import_number TEXT NOT NULL UNIQUE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_cost REAL NOT NULL CHECK (unit_cost >= 0),
  supplier_info TEXT,
  import_date TEXT NOT NULL DEFAULT (date('now', 'localtime')),
  received_by INTEGER NOT NULL REFERENCES system_users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_imports_product ON product_imports(product_id);
CREATE INDEX IF NOT EXISTS idx_imports_date ON product_imports(import_date);

-- 4. Retail Shops (Customers)
CREATE TABLE IF NOT EXISTS retail_shops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_name TEXT NOT NULL,
  owner_name TEXT,
  phone TEXT,
  address TEXT,
  outstanding_balance REAL NOT NULL DEFAULT 0.0,
  credit_limit REAL NOT NULL DEFAULT 0.0,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_retail_shops_name ON retail_shops(shop_name);

-- 5. Order Bookers (Field Representatives)
CREATE TABLE IF NOT EXISTS order_bookers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  territory TEXT,
  commission_rate REAL NOT NULL DEFAULT 0.0 CHECK (commission_rate >= 0),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 6. Orders Header (Supports manual entry from WhatsApp, in-person, phone)
CREATE TABLE IF NOT EXISTS orders (
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
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_booker ON orders(order_booker_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_source ON orders(order_source);

-- 7. Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price REAL NOT NULL CHECK (unit_price >= 0),
  line_total REAL NOT NULL CHECK (line_total >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- 8. Dispatch Slips (Gate Pass)
CREATE TABLE IF NOT EXISTS dispatch_slips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slip_number TEXT NOT NULL UNIQUE,
  order_booker_id INTEGER NOT NULL REFERENCES order_bookers(id),
  dispatch_date TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  status TEXT NOT NULL DEFAULT 'DISPATCHED' CHECK (status IN ('DISPATCHED', 'RECONCILED')),
  notes TEXT,
  created_by INTEGER NOT NULL REFERENCES system_users(id)
);

CREATE INDEX IF NOT EXISTS idx_dispatch_slips_booker ON dispatch_slips(order_booker_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_slips_status ON dispatch_slips(status);

-- 9. Dispatch Slip Items
CREATE TABLE IF NOT EXISTS dispatch_slip_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dispatch_slip_id INTEGER NOT NULL REFERENCES dispatch_slips(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  dispatched_qty INTEGER NOT NULL CHECK (dispatched_qty > 0),
  returned_qty INTEGER NOT NULL DEFAULT 0 CHECK (returned_qty >= 0),
  billed_qty INTEGER NOT NULL DEFAULT 0 CHECK (billed_qty >= 0),
  CHECK (billed_qty + returned_qty <= dispatched_qty)
);

CREATE INDEX IF NOT EXISTS idx_dispatch_items_slip ON dispatch_slip_items(dispatch_slip_id);

-- 10. Bills / Final Invoices
CREATE TABLE IF NOT EXISTS bills (
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
);

CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(bill_date);
CREATE INDEX IF NOT EXISTS idx_bills_shop ON bills(shop_id);
CREATE INDEX IF NOT EXISTS idx_bills_booker ON bills(order_booker_id);

-- 11. Bill Items (Snapshots purchase cost for immutable historical profit)
CREATE TABLE IF NOT EXISTS bill_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_purchase_price REAL NOT NULL CHECK (unit_purchase_price >= 0),
  unit_selling_price REAL NOT NULL CHECK (unit_selling_price >= 0),
  line_total REAL NOT NULL CHECK (line_total >= 0),
  line_profit REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bill_items_bill ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_product ON bill_items(product_id);

-- 12. Inventory Ledger (IMMUTABLE ANTI-CORRUPTION AUDIT TRAIL)
CREATE TABLE IF NOT EXISTS inventory_ledger (
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
);

CREATE INDEX IF NOT EXISTS idx_ledger_product ON inventory_ledger(product_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created_at ON inventory_ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_ledger_type ON inventory_ledger(transaction_type);

-- 13. Order Booker Daily Reconciliations
CREATE TABLE IF NOT EXISTS booker_reconciliations (
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
);

-- 14. Shop Payments (Khata settlement)
CREATE TABLE IF NOT EXISTS shop_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id INTEGER NOT NULL REFERENCES retail_shops(id),
  amount REAL NOT NULL CHECK (amount > 0),
  payment_date TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  payment_method TEXT NOT NULL DEFAULT 'CASH',
  notes TEXT,
  received_by INTEGER NOT NULL REFERENCES system_users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_shop_payments_shop ON shop_payments(shop_id);
