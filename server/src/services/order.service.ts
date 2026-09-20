import { db } from '../db/connection.js';
import { executePaginatedQuery, parsePaginationParams } from '../utils/paginate.js';
import { PaginatedResponse } from '../utils/response.js';
import { AppError } from '../middleware/error.middleware.js';
import { ORDER_STATUSES, OrderStatus } from '../config/constants.js';

export interface OrderItemInput {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface OrderHeader {
  id: number;
  order_number: string;
  shop_id: number;
  shop_name: string;
  order_booker_id?: number | null;
  booker_name?: string | null;
  order_source?: string;
  order_date: string;
  status: OrderStatus;
  total_amount: number;
  notes: string | null;
  created_by: number;
  creator_name: string;
  created_at: string;
  items?: Array<{
    id: number;
    product_id: number;
    product_name: string;
    sku: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>;
}

export class OrderService {
  static getOrders(queryParams: {
    page?: unknown;
    limit?: unknown;
    status?: unknown;
    booker_id?: unknown;
    shop_id?: unknown;
    start_date?: unknown;
    end_date?: unknown;
  }): PaginatedResponse<OrderHeader> {
    const { page, limit, offset } = parsePaginationParams(queryParams);

    let whereClause = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (queryParams.status) {
      whereClause += ' AND o.status = ?';
      params.push(String(queryParams.status));
    }

    if (queryParams.booker_id) {
      whereClause += ' AND o.order_booker_id = ?';
      params.push(Number(queryParams.booker_id));
    }

    if (queryParams.shop_id) {
      whereClause += ' AND o.shop_id = ?';
      params.push(Number(queryParams.shop_id));
    }

    if (queryParams.start_date) {
      whereClause += ' AND o.order_date >= ?';
      params.push(String(queryParams.start_date));
    }

    if (queryParams.end_date) {
      whereClause += ' AND o.order_date <= ?';
      params.push(String(queryParams.end_date));
    }

    const dataSql = `
      SELECT o.*, s.shop_name, COALESCE(b.name, 'Direct Counter') as booker_name, u.full_name as creator_name
      FROM orders o
      JOIN retail_shops s ON o.shop_id = s.id
      LEFT JOIN order_bookers b ON o.order_booker_id = b.id
      JOIN system_users u ON o.created_by = u.id
      ${whereClause}
      ORDER BY o.id DESC
    `;

    const countSql = `
      SELECT COUNT(*) as count
      FROM orders o
      JOIN retail_shops s ON o.shop_id = s.id
      LEFT JOIN order_bookers b ON o.order_booker_id = b.id
      ${whereClause}
    `;

    const { data, pagination } = executePaginatedQuery<OrderHeader>(dataSql, countSql, params, {
      page,
      limit,
      offset,
    });

    return { success: true, data, pagination };
  }

  static getOrderById(id: number): OrderHeader {
    const order = db
      .prepare(`
        SELECT o.*, s.shop_name, COALESCE(b.name, 'Direct Counter') as booker_name, u.full_name as creator_name
        FROM orders o
        JOIN retail_shops s ON o.shop_id = s.id
        LEFT JOIN order_bookers b ON o.order_booker_id = b.id
        JOIN system_users u ON o.created_by = u.id
        WHERE o.id = ?
      `)
      .get(id) as OrderHeader | undefined;

    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    const items = db
      .prepare(`
        SELECT oi.*, p.name as product_name, p.sku
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `)
      .all(id) as OrderHeader['items'];

    order.items = items;
    return order;
  }

  static createOrder(data: {
    shop_id: number;
    order_booker_id?: number | null;
    order_source?: string;
    order_date?: string;
    notes?: string;
    items: OrderItemInput[];
    created_by: number;
  }): OrderHeader {
    if (!data.items || data.items.length === 0) {
      throw new AppError('An order must contain at least one line item', 400, 'EMPTY_ORDER');
    }

    // Verify shop
    const shop = db.prepare('SELECT id FROM retail_shops WHERE id = ?').get(data.shop_id);
    if (!shop) throw new AppError('Retail shop not found', 404, 'SHOP_NOT_FOUND');

    let bookerId = data.order_booker_id || null;
    if (bookerId) {
      const booker = db.prepare('SELECT id FROM order_bookers WHERE id = ?').get(bookerId);
      if (!booker) throw new AppError('Order booker not found', 404, 'BOOKER_NOT_FOUND');
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    const orderDate = data.order_date || new Date().toISOString().slice(0, 10);
    const orderSource = data.order_source || 'MANUAL_WHATSAPP';

    const executeCreate = db.transaction(() => {
      let totalAmount = 0;
      for (const item of data.items) {
        if (item.quantity <= 0) throw new AppError('Item quantity must be > 0', 400, 'INVALID_QUANTITY');
        if (item.unit_price < 0) throw new AppError('Unit price cannot be negative', 400, 'INVALID_PRICE');
        totalAmount += item.quantity * item.unit_price;
      }

      const orderResult = db
        .prepare(`
          INSERT INTO orders (order_number, shop_id, order_booker_id, order_source, order_date, status, total_amount, notes, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          orderNumber,
          data.shop_id,
          bookerId,
          orderSource,
          orderDate,
          ORDER_STATUSES.PENDING,
          totalAmount,
          data.notes || null,
          data.created_by
        );

      const orderId = Number(orderResult.lastInsertRowid);

      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const item of data.items) {
        insertItem.run(orderId, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price);
      }

      return orderId;
    });

    const newOrderId = executeCreate();
    return this.getOrderById(newOrderId);
  }

  static updateOrderStatus(id: number, status: OrderStatus): OrderHeader {
    const existing = db.prepare('SELECT status FROM orders WHERE id = ?').get(id) as
      | { status: OrderStatus }
      | undefined;

    if (!existing) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (existing.status === ORDER_STATUSES.BILLED) {
      throw new AppError('Cannot alter status of an order that has already been BILLED', 400, 'ORDER_ALREADY_BILLED');
    }

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
    return this.getOrderById(id);
  }

  static updateOrder(
    id: number,
    data: {
      order_booker_id?: number;
      notes?: string;
      items?: OrderItemInput[];
    }
  ): OrderHeader {
    const existing = db.prepare('SELECT status FROM orders WHERE id = ?').get(id) as
      | { status: OrderStatus }
      | undefined;

    if (!existing) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (existing.status !== ORDER_STATUSES.PENDING) {
      throw new AppError('Only orders in PENDING status can be edited', 400, 'ORDER_NOT_PENDING');
    }

    const executeUpdate = db.transaction(() => {
      if (data.order_booker_id) {
        db.prepare('UPDATE orders SET order_booker_id = ? WHERE id = ?').run(data.order_booker_id, id);
      }
      if (data.notes !== undefined) {
        db.prepare('UPDATE orders SET notes = ? WHERE id = ?').run(data.notes, id);
      }

      if (data.items && data.items.length > 0) {
        db.prepare('DELETE FROM order_items WHERE order_id = ?').run(id);

        let totalAmount = 0;
        const insertItem = db.prepare(`
          INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total)
          VALUES (?, ?, ?, ?, ?)
        `);

        for (const item of data.items) {
          const lineTotal = item.quantity * item.unit_price;
          totalAmount += lineTotal;
          insertItem.run(id, item.product_id, item.quantity, item.unit_price, lineTotal);
        }

        db.prepare('UPDATE orders SET total_amount = ? WHERE id = ?').run(totalAmount, id);
      }
    });

    executeUpdate();
    return this.getOrderById(id);
  }
}
