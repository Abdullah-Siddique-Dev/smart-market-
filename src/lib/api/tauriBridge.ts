import { getDb, isTauri } from '../db/client';
import { User, Product, RetailShop, OrderBooker, Bill } from '@/types/entities';

export { isTauri };

export async function tauriLogin(credentials: { username: string; password: string }): Promise<{ success: boolean; user: User; message: string }> {
  const db = await getDb();
  if (!db) throw new Error('Database not initialized');

  const users: any[] = await db.select('SELECT * FROM system_users WHERE username = $1 AND is_active = 1', [credentials.username]);
  if (users.length === 0) {
    throw new Error('Invalid username or password');
  }

  const u = users[0];
  const userObj: User = {
    id: u.id,
    username: u.username,
    full_name: u.full_name,
    role: u.role,
    is_active: u.is_active,
    created_at: u.created_at,
  };

  localStorage.setItem('smart_market_user', JSON.stringify(userObj));
  return { success: true, user: userObj, message: 'Logged in successfully' };
}

export async function tauriGetSession(): Promise<{ success: boolean; user: User | null }> {
  const saved = localStorage.getItem('smart_market_user');
  if (saved) {
    try {
      return { success: true, user: JSON.parse(saved) };
    } catch {}
  }
  const db = await getDb();
  if (!db) return { success: false, user: null };
  const users: any[] = await db.select('SELECT * FROM system_users WHERE is_active = 1 LIMIT 1');
  if (users.length > 0) {
    const u = users[0];
    const userObj: User = {
      id: u.id,
      username: u.username,
      full_name: u.full_name,
      role: u.role,
      is_active: u.is_active,
      created_at: u.created_at,
    };
    return { success: true, user: userObj };
  }
  return { success: false, user: null };
}

export async function tauriGetProducts(params?: { search?: string }): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];
  let query = 'SELECT * FROM products WHERE is_active = 1';
  const args: any[] = [];
  if (params?.search) {
    query += ' AND (name LIKE $1 OR sku LIKE $1)';
    args.push(`%${params.search}%`);
  }
  query += ' ORDER BY id DESC';
  const rows: any[] = await db.select(query, args);
  return rows;
}

export async function tauriCreateProduct(data: Partial<Product>): Promise<Product> {
  const db = await getDb();
  if (!db) throw new Error('Database not initialized');
  const res = await db.execute(
    'INSERT INTO products (sku, name, unit, purchase_price, selling_price, current_stock, min_stock_alert) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [
      data.sku || `SKU-${Date.now()}`,
      data.name,
      data.unit || 'BOX',
      data.purchase_price || 0,
      data.selling_price || 0,
      data.current_stock || 0,
      data.min_stock_alert || 10,
    ]
  );
  const inserted: any[] = await db.select('SELECT * FROM products WHERE id = $1', [res.lastInsertId]);
  return inserted[0];
}

export async function tauriGetShops(): Promise<RetailShop[]> {
  const db = await getDb();
  if (!db) return [];
  const rows: any[] = await db.select('SELECT * FROM retail_shops ORDER BY id DESC');
  return rows;
}

export async function tauriCreateShop(data: Partial<RetailShop>): Promise<RetailShop> {
  const db = await getDb();
  if (!db) throw new Error('Database not initialized');
  const res = await db.execute(
    'INSERT INTO retail_shops (shop_name, owner_name, phone, address, credit_limit) VALUES ($1, $2, $3, $4, $5)',
    [data.shop_name, data.owner_name || '', data.phone || '', data.address || '', data.credit_limit || 0]
  );
  const inserted: any[] = await db.select('SELECT * FROM retail_shops WHERE id = $1', [res.lastInsertId]);
  return inserted[0];
}

export async function tauriGetBookers(): Promise<OrderBooker[]> {
  const db = await getDb();
  if (!db) return [];
  const rows: any[] = await db.select('SELECT * FROM order_bookers WHERE is_active = 1 ORDER BY id DESC');
  return rows;
}

export async function tauriCreateBooker(data: Partial<OrderBooker>): Promise<OrderBooker> {
  const db = await getDb();
  if (!db) throw new Error('Database not initialized');
  const res = await db.execute(
    'INSERT INTO order_bookers (name, phone, territory, commission_rate) VALUES ($1, $2, $3, $4)',
    [data.name, data.phone, data.territory || '', data.commission_rate || 0]
  );
  const inserted: any[] = await db.select('SELECT * FROM order_bookers WHERE id = $1', [res.lastInsertId]);
  return inserted[0];
}

export async function tauriGetBills(): Promise<Bill[]> {
  const db = await getDb();
  if (!db) return [];
  const rows: any[] = await db.select(`
    SELECT b.*, s.shop_name, ob.name as booker_name 
    FROM bills b 
    LEFT JOIN retail_shops s ON b.shop_id = s.id 
    LEFT JOIN order_bookers ob ON b.order_booker_id = ob.id 
    ORDER BY b.id DESC
  `);
  return rows;
}
