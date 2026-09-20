import { db } from '../db/connection.js';
import { executePaginatedQuery, parsePaginationParams } from '../utils/paginate.js';
import { PaginatedResponse } from '../utils/response.js';
import { AppError } from '../middleware/error.middleware.js';
import { INVENTORY_TRANSACTION_TYPES, InventoryTransactionType } from '../config/constants.js';

export interface LedgerEntry {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  unit: string;
  change_qty: number;
  balance_after: number;
  transaction_type: InventoryTransactionType;
  reference_id: number;
  reference_type: string;
  performed_by: number;
  performer_name: string;
  notes: string | null;
  created_at: string;
}

export interface StockReconciliationRow {
  product_id: number;
  sku: string;
  product_name: string;
  unit: string;
  system_stock: number;
  ledger_calculated_stock: number;
  variance: number;
  status: 'BALANCED' | 'DISCREPANCY';
}

export class AuditService {
  static getInventoryLedger(queryParams: {
    page?: unknown;
    limit?: unknown;
    product_id?: unknown;
    transaction_type?: unknown;
    start_date?: unknown;
    end_date?: unknown;
  }): PaginatedResponse<LedgerEntry> {
    const { page, limit, offset } = parsePaginationParams(queryParams);

    let whereClause = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (queryParams.product_id) {
      whereClause += ' AND il.product_id = ?';
      params.push(Number(queryParams.product_id));
    }

    if (queryParams.transaction_type) {
      whereClause += ' AND il.transaction_type = ?';
      params.push(String(queryParams.transaction_type));
    }

    if (queryParams.start_date) {
      whereClause += ' AND date(il.created_at) >= ?';
      params.push(String(queryParams.start_date));
    }

    if (queryParams.end_date) {
      whereClause += ' AND date(il.created_at) <= ?';
      params.push(String(queryParams.end_date));
    }

    const dataSql = `
      SELECT il.*, p.name as product_name, p.sku, p.unit, u.full_name as performer_name
      FROM inventory_ledger il
      JOIN products p ON il.product_id = p.id
      JOIN system_users u ON il.performed_by = u.id
      ${whereClause}
      ORDER BY il.id DESC
    `;

    const countSql = `
      SELECT COUNT(*) as count
      FROM inventory_ledger il
      ${whereClause}
    `;

    const { data, pagination } = executePaginatedQuery<LedgerEntry>(dataSql, countSql, params, {
      page,
      limit,
      offset,
    });

    return { success: true, data, pagination };
  }

  static getLedgerByProductId(productId: number, queryParams: { page?: unknown; limit?: unknown }): PaginatedResponse<LedgerEntry> {
    return this.getInventoryLedger({
      ...queryParams,
      product_id: productId,
    });
  }

  // Stock Reconciliation formula: System stock vs Sum of Inward - Outward
  static getStockReconciliation(): {
    summary: { total_products: number; balanced_count: number; discrepancy_count: number };
    rows: StockReconciliationRow[];
  } {
    const rows = db
      .prepare(`
        SELECT 
          p.id as product_id,
          p.sku,
          p.name as product_name,
          p.unit,
          p.current_stock as system_stock,
          COALESCE(SUM(il.change_qty), 0) as ledger_calculated_stock,
          (p.current_stock - COALESCE(SUM(il.change_qty), 0)) as variance,
          CASE 
            WHEN (p.current_stock - COALESCE(SUM(il.change_qty), 0)) = 0 THEN 'BALANCED'
            ELSE 'DISCREPANCY'
          END as status
        FROM products p
        LEFT JOIN inventory_ledger il ON p.id = il.product_id
        WHERE p.is_active = 1
        GROUP BY p.id
        ORDER BY variance DESC, p.name ASC
      `)
      .all() as StockReconciliationRow[];

    const discrepancyCount = rows.filter(r => r.status === 'DISCREPANCY').length;

    return {
      summary: {
        total_products: rows.length,
        balanced_count: rows.length - discrepancyCount,
        discrepancy_count: discrepancyCount,
      },
      rows,
    };
  }

  // Manual Stock Adjustment (Requires OWNER role, logs with mandatory justification)
  static recordStockAdjustment(data: {
    product_id: number;
    adjustment_qty: number; // positive or negative
    reason: string;
    performed_by: number;
  }): LedgerEntry {
    const product = db
      .prepare('SELECT id, name, sku, unit, current_stock FROM products WHERE id = ?')
      .get(data.product_id) as { id: number; name: string; sku: string; unit: string; current_stock: number } | undefined;

    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    if (data.adjustment_qty === 0) {
      throw new AppError('Adjustment quantity cannot be 0', 400, 'INVALID_QUANTITY');
    }

    const newStock = product.current_stock + data.adjustment_qty;
    if (newStock < 0) {
      throw new AppError(
        `Adjustment would result in negative stock balance (${newStock}). Current: ${product.current_stock}`,
        400,
        'NEGATIVE_STOCK'
      );
    }

    const executeAdjustment = db.transaction(() => {
      // 1. Update product current_stock
      db.prepare('UPDATE products SET current_stock = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?').run(
        newStock,
        data.product_id
      );

      // 2. Insert into immutable ledger
      const result = db
        .prepare(`
          INSERT INTO inventory_ledger (
            product_id, change_qty, balance_after, transaction_type,
            reference_id, reference_type, performed_by, notes
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          data.product_id,
          data.adjustment_qty,
          newStock,
          INVENTORY_TRANSACTION_TYPES.DAMAGE_ADJUSTMENT,
          data.performed_by,
          'manual_adjustment',
          data.performed_by,
          `Manual stock adjustment: ${data.reason.trim()}`
        );

      return Number(result.lastInsertRowid);
    });

    const ledgerId = executeAdjustment();

    const entry = db
      .prepare(`
        SELECT il.*, p.name as product_name, p.sku, p.unit, u.full_name as performer_name
        FROM inventory_ledger il
        JOIN products p ON il.product_id = p.id
        JOIN system_users u ON il.performed_by = u.id
        WHERE il.id = ?
      `)
      .get(ledgerId) as LedgerEntry;

    return entry;
  }

  // Generate CSV format of ledger for external accountant/auditor review
  static exportLedgerCsv(): string {
    const records = db
      .prepare(`
        SELECT 
          il.id,
          il.created_at,
          p.sku,
          p.name as product_name,
          il.change_qty,
          il.balance_after,
          il.transaction_type,
          il.reference_type,
          il.reference_id,
          u.full_name as performed_by,
          il.notes
        FROM inventory_ledger il
        JOIN products p ON il.product_id = p.id
        JOIN system_users u ON il.performed_by = u.id
        ORDER BY il.id DESC
      `)
      .all() as Array<Record<string, unknown>>;

    const headers = [
      'Log ID',
      'Timestamp',
      'SKU',
      'Product Name',
      'Change Qty',
      'Balance After',
      'Event Type',
      'Ref Type',
      'Ref ID',
      'Performed By',
      'Notes',
    ];

    const lines = [headers.join(',')];

    for (const r of records) {
      const row = [
        r.id,
        `"${r.created_at}"`,
        `"${r.sku}"`,
        `"${String(r.product_name).replace(/"/g, '""')}"`,
        r.change_qty,
        r.balance_after,
        r.transaction_type,
        r.reference_type,
        r.reference_id,
        `"${r.performed_by}"`,
        `"${String(r.notes || '').replace(/"/g, '""')}"`,
      ];
      lines.push(row.join(','));
    }

    return lines.join('\n');
  }
}
