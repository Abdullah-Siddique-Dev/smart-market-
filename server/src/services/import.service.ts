import { db } from '../db/connection.js';
import { executePaginatedQuery, parsePaginationParams } from '../utils/paginate.js';
import { PaginatedResponse } from '../utils/response.js';
import { AppError } from '../middleware/error.middleware.js';
import { INVENTORY_TRANSACTION_TYPES } from '../config/constants.js';

export interface ImportRecord {
  id: number;
  import_number: string;
  product_id: number;
  product_name: string;
  sku: string;
  quantity: number;
  unit_cost: number;
  supplier_info: string | null;
  import_date: string;
  received_by: number;
  receiver_name: string;
  created_at: string;
}

export class ImportService {
  static getImports(queryParams: { page?: unknown; limit?: unknown }): PaginatedResponse<ImportRecord> {
    const { page, limit, offset } = parsePaginationParams(queryParams);

    const dataSql = `
      SELECT pi.*, p.name as product_name, p.sku, u.full_name as receiver_name
      FROM product_imports pi
      JOIN products p ON pi.product_id = p.id
      JOIN system_users u ON pi.received_by = u.id
      ORDER BY pi.id DESC
    `;
    const countSql = `SELECT COUNT(*) as count FROM product_imports`;

    const { data, pagination } = executePaginatedQuery<ImportRecord>(dataSql, countSql, [], {
      page,
      limit,
      offset,
    });

    return { success: true, data, pagination };
  }

  static getImportById(id: number): ImportRecord {
    const record = db
      .prepare(`
        SELECT pi.*, p.name as product_name, p.sku, u.full_name as receiver_name
        FROM product_imports pi
        JOIN products p ON pi.product_id = p.id
        JOIN system_users u ON pi.received_by = u.id
        WHERE pi.id = ?
      `)
      .get(id) as ImportRecord | undefined;

    if (!record) {
      throw new AppError('Import record not found', 404, 'IMPORT_NOT_FOUND');
    }

    return record;
  }

  static recordImport(data: {
    product_id: number;
    quantity: number;
    unit_cost: number;
    supplier_info?: string;
    import_date?: string;
    update_master_cost?: boolean;
    received_by: number;
  }): ImportRecord {
    const product = db.prepare('SELECT id, name, current_stock FROM products WHERE id = ?').get(data.product_id) as
      | { id: number; name: string; current_stock: number }
      | undefined;

    if (!product) {
      throw new AppError('Product does not exist', 404, 'PRODUCT_NOT_FOUND');
    }

    if (data.quantity <= 0) {
      throw new AppError('Import quantity must be greater than zero', 400, 'INVALID_QUANTITY');
    }

    if (data.unit_cost < 0) {
      throw new AppError('Unit cost cannot be negative', 400, 'INVALID_COST');
    }

    const importNumber = `IMP-${Date.now().toString().slice(-6)}`;
    const importDate = data.import_date || new Date().toISOString().slice(0, 10);
    const newStock = product.current_stock + data.quantity;

    // ATOMIC TRANSACTION: Inward record + Stock Increment + Immutable Audit Ledger
    const executeInward = db.transaction(() => {
      // 1. Insert into product_imports
      const importResult = db
        .prepare(`
          INSERT INTO product_imports (import_number, product_id, quantity, unit_cost, supplier_info, import_date, received_by)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          importNumber,
          data.product_id,
          data.quantity,
          data.unit_cost,
          data.supplier_info || null,
          importDate,
          data.received_by
        );

      const importId = Number(importResult.lastInsertRowid);

      // 2. Increment physical product stock (and update cost if requested)
      if (data.update_master_cost) {
        db.prepare(`
          UPDATE products
          SET current_stock = current_stock + ?, purchase_price = ?, updated_at = datetime('now', 'localtime')
          WHERE id = ?
        `).run(data.quantity, data.unit_cost, data.product_id);
      } else {
        db.prepare(`
          UPDATE products
          SET current_stock = current_stock + ?, updated_at = datetime('now', 'localtime')
          WHERE id = ?
        `).run(data.quantity, data.product_id);
      }

      // 3. Append to immutable inventory ledger
      db.prepare(`
        INSERT INTO inventory_ledger (product_id, change_qty, balance_after, transaction_type, reference_id, reference_type, performed_by, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        data.product_id,
        data.quantity,
        newStock,
        INVENTORY_TRANSACTION_TYPES.IMPORT,
        importId,
        'product_imports',
        data.received_by,
        `Import shipment received: ${importNumber}`
      );

      return importId;
    });

    const newImportId = executeInward();
    return this.getImportById(newImportId);
  }
}
