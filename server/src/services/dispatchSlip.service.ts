import { db } from '../db/connection.js';
import { executePaginatedQuery, parsePaginationParams } from '../utils/paginate.js';
import { PaginatedResponse } from '../utils/response.js';
import { AppError } from '../middleware/error.middleware.js';
import { ORDER_STATUSES, INVENTORY_TRANSACTION_TYPES } from '../config/constants.js';

export interface DispatchSlipItemInput {
  product_id: number;
  dispatched_qty: number;
}

export interface DispatchSlipRecord {
  id: number;
  slip_number: string;
  order_booker_id: number;
  booker_name: string;
  dispatch_date: string;
  status: 'DISPATCHED' | 'RECONCILED';
  notes: string | null;
  created_by: number;
  creator_name: string;
  items?: Array<{
    id: number;
    product_id: number;
    product_name: string;
    sku: string;
    dispatched_qty: number;
    returned_qty: number;
    billed_qty: number;
  }>;
}

export class DispatchSlipService {
  static getSlips(queryParams: {
    page?: unknown;
    limit?: unknown;
    booker_id?: unknown;
    status?: unknown;
  }): PaginatedResponse<DispatchSlipRecord> {
    const { page, limit, offset } = parsePaginationParams(queryParams);

    let whereClause = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (queryParams.booker_id) {
      whereClause += ' AND s.order_booker_id = ?';
      params.push(Number(queryParams.booker_id));
    }

    if (queryParams.status) {
      whereClause += ' AND s.status = ?';
      params.push(String(queryParams.status));
    }

    const dataSql = `
      SELECT s.*, b.name as booker_name, u.full_name as creator_name
      FROM dispatch_slips s
      JOIN order_bookers b ON s.order_booker_id = b.id
      JOIN system_users u ON s.created_by = u.id
      ${whereClause}
      ORDER BY s.id DESC
    `;

    const countSql = `
      SELECT COUNT(*) as count
      FROM dispatch_slips s
      ${whereClause}
    `;

    const { data, pagination } = executePaginatedQuery<DispatchSlipRecord>(dataSql, countSql, params, {
      page,
      limit,
      offset,
    });

    return { success: true, data, pagination };
  }

  static getSlipById(id: number): DispatchSlipRecord {
    const slip = db
      .prepare(`
        SELECT s.*, b.name as booker_name, u.full_name as creator_name
        FROM dispatch_slips s
        JOIN order_bookers b ON s.order_booker_id = b.id
        JOIN system_users u ON s.created_by = u.id
        WHERE s.id = ?
      `)
      .get(id) as DispatchSlipRecord | undefined;

    if (!slip) {
      throw new AppError('Dispatch slip not found', 404, 'SLIP_NOT_FOUND');
    }

    const items = db
      .prepare(`
        SELECT dsi.*, p.name as product_name, p.sku
        FROM dispatch_slip_items dsi
        JOIN products p ON dsi.product_id = p.id
        WHERE dsi.dispatch_slip_id = ?
      `)
      .all(id) as DispatchSlipRecord['items'];

    slip.items = items;
    return slip;
  }

  static generateSlip(data: {
    order_booker_id: number;
    order_ids?: number[];
    items?: DispatchSlipItemInput[];
    notes?: string;
    created_by: number;
  }): DispatchSlipRecord {
    const booker = db.prepare('SELECT id FROM order_bookers WHERE id = ?').get(data.order_booker_id);
    if (!booker) throw new AppError('Order booker not found', 404, 'BOOKER_NOT_FOUND');

    const slipNumber = `SLP-${Date.now().toString().slice(-6)}`;

    // Consolidate items from order_ids or direct items array
    const itemMap = new Map<number, number>();

    if (data.order_ids && data.order_ids.length > 0) {
      const placeholders = data.order_ids.map(() => '?').join(',');
      const orderItems = db
        .prepare(`
          SELECT product_id, quantity
          FROM order_items
          WHERE order_id IN (${placeholders})
        `)
        .all(...data.order_ids) as Array<{ product_id: number; quantity: number }>;

      for (const item of orderItems) {
        itemMap.set(item.product_id, (itemMap.get(item.product_id) || 0) + item.quantity);
      }
    }

    if (data.items) {
      for (const item of data.items) {
        itemMap.set(item.product_id, (itemMap.get(item.product_id) || 0) + item.dispatched_qty);
      }
    }

    if (itemMap.size === 0) {
      throw new AppError('Cannot generate a dispatch slip with 0 items', 400, 'EMPTY_SLIP');
    }

    const executeGenerate = db.transaction(() => {
      // 1. Insert slip
      const result = db
        .prepare(`
          INSERT INTO dispatch_slips (slip_number, order_booker_id, dispatch_date, status, notes, created_by)
          VALUES (?, ?, datetime('now', 'localtime'), 'DISPATCHED', ?, ?)
        `)
        .run(slipNumber, data.order_booker_id, data.notes || null, data.created_by);

      const slipId = Number(result.lastInsertRowid);

      // 2. Insert items
      const insertItem = db.prepare(`
        INSERT INTO dispatch_slip_items (dispatch_slip_id, product_id, dispatched_qty, returned_qty, billed_qty)
        VALUES (?, ?, ?, 0, 0)
      `);

      for (const [productId, qty] of itemMap.entries()) {
        insertItem.run(slipId, productId, qty);
      }

      // 3. If orders were linked, mark them DISPATCHED
      if (data.order_ids && data.order_ids.length > 0) {
        const placeholders = data.order_ids.map(() => '?').join(',');
        db.prepare(`
          UPDATE orders
          SET status = '${ORDER_STATUSES.DISPATCHED}'
          WHERE id IN (${placeholders})
        `).run(...data.order_ids);
      }

      return slipId;
    });

    const newSlipId = executeGenerate();
    return this.getSlipById(newSlipId);
  }

  static reconcileSlip(
    slipId: number,
    reconciledItems: Array<{
      product_id: number;
      returned_qty: number;
      billed_qty: number;
    }>,
    userId: number
  ): DispatchSlipRecord {
    const slip = this.getSlipById(slipId);
    if (slip.status === 'RECONCILED') {
      throw new AppError('This dispatch slip is already marked as RECONCILED', 400, 'ALREADY_RECONCILED');
    }

    const executeReconciliation = db.transaction(() => {
      const updateItem = db.prepare(`
        UPDATE dispatch_slip_items
        SET returned_qty = ?, billed_qty = ?
        WHERE dispatch_slip_id = ? AND product_id = ?
      `);

      for (const item of reconciledItems) {
        const currentItem = slip.items?.find(i => i.product_id === item.product_id);
        if (!currentItem) {
          throw new AppError(`Product ${item.product_id} not found on this dispatch slip`, 400, 'ITEM_NOT_ON_SLIP');
        }

        if (item.returned_qty + item.billed_qty > currentItem.dispatched_qty) {
          throw new AppError(
            `Sum of returned (${item.returned_qty}) and billed (${item.billed_qty}) exceeds dispatched (${currentItem.dispatched_qty}) for product ${item.product_id}`,
            400,
            'RECONCILIATION_EXCEEDS_DISPATCH'
          );
        }

        updateItem.run(item.returned_qty, item.billed_qty, slipId, item.product_id);

        // If returned_qty > 0, return physical stock to warehouse and log in inventory_ledger
        if (item.returned_qty > 0) {
          const product = db.prepare('SELECT current_stock FROM products WHERE id = ?').get(item.product_id) as {
            current_stock: number;
          };
          const newBalance = product.current_stock + item.returned_qty;

          db.prepare('UPDATE products SET current_stock = ? WHERE id = ?').run(newBalance, item.product_id);

          db.prepare(`
            INSERT INTO inventory_ledger (product_id, change_qty, balance_after, transaction_type, reference_id, reference_type, performed_by, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            item.product_id,
            item.returned_qty,
            newBalance,
            INVENTORY_TRANSACTION_TYPES.BOOKER_RETURN,
            slipId,
            'dispatch_slips',
            userId,
            `Unsold stock returned from slip: ${slip.slip_number}`
          );
        }
      }

      db.prepare("UPDATE dispatch_slips SET status = 'RECONCILED' WHERE id = ?").run(slipId);
    });

    executeReconciliation();
    return this.getSlipById(slipId);
  }
}
