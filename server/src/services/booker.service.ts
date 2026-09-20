import { db } from '../db/connection.js';
import { executePaginatedQuery, parsePaginationParams } from '../utils/paginate.js';
import { PaginatedResponse } from '../utils/response.js';
import { AppError } from '../middleware/error.middleware.js';
import { ORDER_STATUSES } from '../config/constants.js';

export interface BookerRecord {
  id: number;
  name: string;
  phone: string;
  territory: string | null;
  commission_rate: number;
  is_active: number;
  created_at: string;
}

export interface BookerPerformance {
  booker: BookerRecord;
  orders_assigned: number;
  orders_collected: number;
  orders_pending: number;
  total_sales_amount: number;
  cash_collected_amount: number;
  credit_issued_amount: number;
  estimated_commission: number;
}

export class BookerService {
  static getBookers(queryParams: { page?: unknown; limit?: unknown; search?: unknown }): PaginatedResponse<BookerRecord> {
    const { page, limit, offset } = parsePaginationParams(queryParams);
    const search = queryParams.search ? String(queryParams.search).trim() : '';

    let whereClause = '';
    const params: string[] = [];

    if (search) {
      whereClause = 'WHERE name LIKE ? OR phone LIKE ? OR territory LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const dataSql = `SELECT * FROM order_bookers ${whereClause} ORDER BY name ASC`;
    const countSql = `SELECT COUNT(*) as count FROM order_bookers ${whereClause}`;

    const { data, pagination } = executePaginatedQuery<BookerRecord>(dataSql, countSql, params, {
      page,
      limit,
      offset,
    });

    return { success: true, data, pagination };
  }

  static getBookerById(id: number): BookerRecord {
    const booker = db.prepare('SELECT * FROM order_bookers WHERE id = ?').get(id) as BookerRecord | undefined;
    if (!booker) throw new AppError('Order booker not found', 404, 'BOOKER_NOT_FOUND');
    return booker;
  }

  static createBooker(data: {
    name: string;
    phone: string;
    territory?: string;
    commission_rate?: number;
  }): BookerRecord {
    const result = db
      .prepare(`
        INSERT INTO order_bookers (name, phone, territory, commission_rate, is_active)
        VALUES (?, ?, ?, ?, 1)
      `)
      .run(
        data.name.trim(),
        data.phone.trim(),
        data.territory?.trim() || null,
        data.commission_rate || 0.0
      );

    return this.getBookerById(Number(result.lastInsertRowid));
  }

  static updateBooker(
    id: number,
    data: {
      name?: string;
      phone?: string;
      territory?: string;
      commission_rate?: number;
      is_active?: number;
    }
  ): BookerRecord {
    const existing = this.getBookerById(id);

    db.prepare(`
      UPDATE order_bookers
      SET name = ?, phone = ?, territory = ?, commission_rate = ?, is_active = ?
      WHERE id = ?
    `).run(
      data.name?.trim() ?? existing.name,
      data.phone?.trim() ?? existing.phone,
      data.territory?.trim() ?? existing.territory,
      data.commission_rate ?? existing.commission_rate,
      data.is_active ?? existing.is_active,
      id
    );

    return this.getBookerById(id);
  }

  // Booker Performance Metrics (Assigned vs Collected vs Pending, Cash vs Credit)
  static getBookerPerformance(bookerId: number): BookerPerformance {
    const booker = this.getBookerById(bookerId);

    // Orders counts
    const assignedRow = db
      .prepare('SELECT COUNT(*) as count FROM orders WHERE order_booker_id = ?')
      .get(bookerId) as { count: number };

    const collectedRow = db
      .prepare(`SELECT COUNT(*) as count FROM orders WHERE order_booker_id = ? AND status = '${ORDER_STATUSES.BILLED}'`)
      .get(bookerId) as { count: number };

    const pendingRow = db
      .prepare(`SELECT COUNT(*) as count FROM orders WHERE order_booker_id = ? AND status IN ('${ORDER_STATUSES.PENDING}', '${ORDER_STATUSES.DISPATCHED}')`)
      .get(bookerId) as { count: number };

    // Bills and financial breakdown
    const financialsRow = db
      .prepare(`
        SELECT 
          COALESCE(SUM(net_amount), 0) as total_sales,
          COALESCE(SUM(paid_amount), 0) as cash_collected,
          COALESCE(SUM(CASE WHEN payment_status = 'CREDIT' OR (net_amount - paid_amount) > 0 THEN (net_amount - paid_amount) ELSE 0 END), 0) as credit_issued
        FROM bills
        WHERE order_booker_id = ?
      `)
      .get(bookerId) as { total_sales: number; cash_collected: number; credit_issued: number };

    const commission = (financialsRow.total_sales * booker.commission_rate) / 100;

    return {
      booker,
      orders_assigned: assignedRow.count,
      orders_collected: collectedRow.count,
      orders_pending: pendingRow.count,
      total_sales_amount: financialsRow.total_sales,
      cash_collected_amount: financialsRow.cash_collected,
      credit_issued_amount: financialsRow.credit_issued,
      estimated_commission: commission,
    };
  }

  // Today's Reconciliation Status for Booker
  static getTodayReconciliation(bookerId: number): Record<string, unknown> {
    const today = new Date().toISOString().slice(0, 10);
    const existing = db
      .prepare('SELECT * FROM booker_reconciliations WHERE order_booker_id = ? AND reconciliation_date = ?')
      .get(bookerId, today);

    const perf = this.getBookerPerformance(bookerId);

    return {
      reconciliation_date: today,
      is_settled: !!existing,
      settlement_record: existing || null,
      current_metrics: perf,
    };
  }

  // End-of-Day Settlement
  static reconcileBooker(
    bookerId: number,
    data: {
      total_cash_submitted: number;
      shortage_amount?: number;
      verified_by: number;
    }
  ): Record<string, unknown> {
    const perf = this.getBookerPerformance(bookerId);
    const today = new Date().toISOString().slice(0, 10);

    const shortage =
      data.shortage_amount !== undefined
        ? data.shortage_amount
        : Math.max(0, perf.cash_collected_amount - data.total_cash_submitted);

    const result = db
      .prepare(`
        INSERT INTO booker_reconciliations (
          reconciliation_date, order_booker_id, orders_count_total, orders_count_collected,
          orders_count_pending, total_cash_submitted, total_credit_issued, shortage_amount, verified_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        today,
        bookerId,
        perf.orders_assigned,
        perf.orders_collected,
        perf.orders_pending,
        data.total_cash_submitted,
        perf.credit_issued_amount,
        shortage,
        data.verified_by
      );

    return {
      id: Number(result.lastInsertRowid),
      order_booker_id: bookerId,
      settled_at: new Date().toISOString(),
      orders_settled: perf.orders_collected,
      orders_pending: perf.orders_pending,
      cash_submitted: data.total_cash_submitted,
      shortage_flagged: shortage,
    };
  }
}
