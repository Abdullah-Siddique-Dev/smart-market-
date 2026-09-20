import { db } from '../db/connection.js';
import { executePaginatedQuery, parsePaginationParams } from '../utils/paginate.js';
import { PaginatedResponse } from '../utils/response.js';
import { AppError } from '../middleware/error.middleware.js';

export interface ProductRecord {
  id: number;
  sku: string;
  name: string;
  unit: string;
  purchase_price: number;
  selling_price: number;
  current_stock: number;
  min_stock_alert: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export class ProductService {
  static getProducts(
    queryParams: { page?: unknown; limit?: unknown; search?: unknown; is_active?: unknown },
    isOwner: boolean
  ): PaginatedResponse<Partial<ProductRecord>> {
    const { page, limit, offset } = parsePaginationParams(queryParams);
    const search = queryParams.search ? String(queryParams.search).trim() : '';
    const isActiveFilter = queryParams.is_active !== undefined ? Number(queryParams.is_active) : 1;

    let whereClause = 'WHERE is_active = ?';
    const params: (string | number)[] = [isActiveFilter];

    if (search) {
      whereClause += ' AND (name LIKE ? OR sku LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const selectFields = isOwner
      ? 'id, sku, name, unit, purchase_price, selling_price, current_stock, min_stock_alert, is_active, created_at, updated_at'
      : 'id, sku, name, unit, selling_price, current_stock, min_stock_alert, is_active, created_at, updated_at';

    const dataSql = `SELECT ${selectFields} FROM products ${whereClause} ORDER BY name ASC`;
    const countSql = `SELECT COUNT(*) as count FROM products ${whereClause}`;

    const { data, pagination } = executePaginatedQuery<Partial<ProductRecord>>(
      dataSql,
      countSql,
      params,
      { page, limit, offset }
    );

    return { success: true, data, pagination };
  }

  static getProductById(id: number, isOwner: boolean): Partial<ProductRecord> {
    const selectFields = isOwner
      ? 'id, sku, name, unit, purchase_price, selling_price, current_stock, min_stock_alert, is_active, created_at, updated_at'
      : 'id, sku, name, unit, selling_price, current_stock, min_stock_alert, is_active, created_at, updated_at';

    const product = db.prepare(`SELECT ${selectFields} FROM products WHERE id = ?`).get(id) as
      | Partial<ProductRecord>
      | undefined;

    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    return product;
  }

  static createProduct(data: {
    sku: string;
    name: string;
    unit?: string;
    purchase_price: number;
    selling_price: number;
    current_stock?: number;
    min_stock_alert?: number;
  }): ProductRecord {
    const existing = db.prepare('SELECT id FROM products WHERE sku = ?').get(data.sku);
    if (existing) {
      throw new AppError(`A product with SKU "${data.sku}" already exists`, 409, 'DUPLICATE_SKU');
    }

    if (data.selling_price < data.purchase_price) {
      throw new AppError('Selling price cannot be less than purchase price', 400, 'INVALID_PRICE');
    }

    const unit = data.unit || 'BOX';
    const current_stock = Math.max(0, data.current_stock || 0);
    const min_stock_alert = Math.max(0, data.min_stock_alert ?? 10);

    const result = db
      .prepare(`
        INSERT INTO products (sku, name, unit, purchase_price, selling_price, current_stock, min_stock_alert, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `)
      .run(
        data.sku.trim(),
        data.name.trim(),
        unit,
        data.purchase_price,
        data.selling_price,
        current_stock,
        min_stock_alert
      );

    return this.getProductById(Number(result.lastInsertRowid), true) as ProductRecord;
  }

  static updateProduct(
    id: number,
    data: {
      sku?: string;
      name?: string;
      unit?: string;
      purchase_price?: number;
      selling_price?: number;
      min_stock_alert?: number;
      is_active?: number;
    }
  ): Partial<ProductRecord> {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as ProductRecord | undefined;
    if (!existing) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    if (data.sku && data.sku !== existing.sku) {
      const duplicate = db.prepare('SELECT id FROM products WHERE sku = ? AND id != ?').get(data.sku, id);
      if (duplicate) {
        throw new AppError(`SKU "${data.sku}" is already in use by another product`, 409, 'DUPLICATE_SKU');
      }
    }

    const purchasePrice = data.purchase_price ?? existing.purchase_price;
    const sellingPrice = data.selling_price ?? existing.selling_price;

    if (sellingPrice < purchasePrice) {
      throw new AppError('Selling price cannot be less than purchase price', 400, 'INVALID_PRICE');
    }

    db.prepare(`
      UPDATE products
      SET sku = ?, name = ?, unit = ?, purchase_price = ?, selling_price = ?, min_stock_alert = ?, is_active = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(
      data.sku?.trim() ?? existing.sku,
      data.name?.trim() ?? existing.name,
      data.unit ?? existing.unit,
      purchasePrice,
      sellingPrice,
      data.min_stock_alert ?? existing.min_stock_alert,
      data.is_active ?? existing.is_active,
      id
    );

    return this.getProductById(id, true);
  }

  static deactivateProduct(id: number): void {
    const result = db.prepare('UPDATE products SET is_active = 0, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?').run(id);
    if (result.changes === 0) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }
  }

  static getLowStockProducts(): Partial<ProductRecord>[] {
    return db
      .prepare(`
        SELECT id, sku, name, unit, current_stock, min_stock_alert
        FROM products
        WHERE is_active = 1 AND current_stock <= min_stock_alert
        ORDER BY current_stock ASC
      `)
      .all() as Partial<ProductRecord>[];
  }

  static searchProductsForPos(searchQuery: string): Partial<ProductRecord>[] {
    const term = `%${searchQuery.trim()}%`;
    return db
      .prepare(`
        SELECT id, sku, name, unit, selling_price, current_stock
        FROM products
        WHERE is_active = 1 AND (sku LIKE ? OR name LIKE ?)
        ORDER BY name ASC
        LIMIT 20
      `)
      .all(term, term) as Partial<ProductRecord>[];
  }
}
