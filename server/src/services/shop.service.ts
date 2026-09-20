import { db } from '../db/connection.js';
import { executePaginatedQuery, parsePaginationParams } from '../utils/paginate.js';
import { PaginatedResponse } from '../utils/response.js';
import { AppError } from '../middleware/error.middleware.js';

export interface ShopRecord {
  id: number;
  shop_name: string;
  owner_name: string | null;
  phone: string | null;
  address: string | null;
  outstanding_balance: number;
  credit_limit: number;
  created_at: string;
}

export class ShopService {
  static getShops(queryParams: { page?: unknown; limit?: unknown; search?: unknown }): PaginatedResponse<ShopRecord> {
    const { page, limit, offset } = parsePaginationParams(queryParams);
    const search = queryParams.search ? String(queryParams.search).trim() : '';

    let whereClause = '';
    const params: string[] = [];

    if (search) {
      whereClause = 'WHERE shop_name LIKE ? OR phone LIKE ? OR owner_name LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const dataSql = `SELECT * FROM retail_shops ${whereClause} ORDER BY shop_name ASC`;
    const countSql = `SELECT COUNT(*) as count FROM retail_shops ${whereClause}`;

    const { data, pagination } = executePaginatedQuery<ShopRecord>(dataSql, countSql, params, {
      page,
      limit,
      offset,
    });

    return { success: true, data, pagination };
  }

  static getShopById(id: number): ShopRecord {
    const shop = db.prepare('SELECT * FROM retail_shops WHERE id = ?').get(id) as ShopRecord | undefined;
    if (!shop) throw new AppError('Retail shop not found', 404, 'SHOP_NOT_FOUND');
    return shop;
  }

  static createShop(data: {
    shop_name: string;
    owner_name?: string;
    phone?: string;
    address?: string;
    credit_limit?: number;
  }): ShopRecord {
    const result = db
      .prepare(`
        INSERT INTO retail_shops (shop_name, owner_name, phone, address, credit_limit, outstanding_balance)
        VALUES (?, ?, ?, ?, ?, 0.0)
      `)
      .run(
        data.shop_name.trim(),
        data.owner_name?.trim() || null,
        data.phone?.trim() || null,
        data.address?.trim() || null,
        data.credit_limit || 0.0
      );

    return this.getShopById(Number(result.lastInsertRowid));
  }

  static updateShop(
    id: number,
    data: {
      shop_name?: string;
      owner_name?: string;
      phone?: string;
      address?: string;
      credit_limit?: number;
    }
  ): ShopRecord {
    const existing = this.getShopById(id);

    db.prepare(`
      UPDATE retail_shops
      SET shop_name = ?, owner_name = ?, phone = ?, address = ?, credit_limit = ?
      WHERE id = ?
    `).run(
      data.shop_name?.trim() ?? existing.shop_name,
      data.owner_name?.trim() ?? existing.owner_name,
      data.phone?.trim() ?? existing.phone,
      data.address?.trim() ?? existing.address,
      data.credit_limit ?? existing.credit_limit,
      id
    );

    return this.getShopById(id);
  }

  // Khata / Ledger History: Bills issued + Payments received
  static getShopLedger(id: number): {
    shop: ShopRecord;
    bills: Array<{ id: number; bill_number: string; bill_date: string; net_amount: number; paid_amount: number; payment_status: string }>;
    payments: Array<{ id: number; amount: number; payment_date: string; payment_method: string; notes: string | null; receiver_name: string }>;
  } {
    const shop = this.getShopById(id);

    const bills = db
      .prepare(`
        SELECT id, bill_number, bill_date, net_amount, paid_amount, payment_status
        FROM bills
        WHERE shop_id = ?
        ORDER BY id DESC
      `)
      .all(id) as Array<{ id: number; bill_number: string; bill_date: string; net_amount: number; paid_amount: number; payment_status: string }>;

    const payments = db
      .prepare(`
        SELECT sp.id, sp.amount, sp.payment_date, sp.payment_method, sp.notes, u.full_name as receiver_name
        FROM shop_payments sp
        JOIN system_users u ON sp.received_by = u.id
        WHERE sp.shop_id = ?
        ORDER BY sp.id DESC
      `)
      .all(id) as Array<{ id: number; amount: number; payment_date: string; payment_method: string; notes: string | null; receiver_name: string }>;

    return { shop, bills, payments };
  }

  // Record a payment and reduce the running balance
  static recordPayment(
    shopId: number,
    data: { amount: number; payment_method?: string; notes?: string; received_by: number }
  ): { payment_id: number; new_balance: number } {
    const shop = this.getShopById(shopId);

    if (data.amount <= 0) {
      throw new AppError('Payment amount must be greater than zero', 400, 'INVALID_AMOUNT');
    }

    const executePayment = db.transaction(() => {
      const result = db
        .prepare(`
          INSERT INTO shop_payments (shop_id, amount, payment_date, payment_method, notes, received_by)
          VALUES (?, ?, datetime('now', 'localtime'), ?, ?, ?)
        `)
        .run(shopId, data.amount, data.payment_method || 'CASH', data.notes || null, data.received_by);

      const newBalance = Math.max(0, shop.outstanding_balance - data.amount);
      db.prepare('UPDATE retail_shops SET outstanding_balance = ? WHERE id = ?').run(newBalance, shopId);

      return { paymentId: Number(result.lastInsertRowid), newBalance };
    });

    const { paymentId, newBalance } = executePayment();
    return { payment_id: paymentId, new_balance: newBalance };
  }
}
