import { db } from '../db/connection.js';
import { executePaginatedQuery, parsePaginationParams } from '../utils/paginate.js';
import { PaginatedResponse } from '../utils/response.js';
import { AppError } from '../middleware/error.middleware.js';
import { ORDER_STATUSES, INVENTORY_TRANSACTION_TYPES, PAYMENT_STATUSES, PaymentStatus } from '../config/constants.js';

export interface BillItemInput {
  product_id: number;
  quantity: number;
  unit_selling_price: number;
}

export interface CreateBillRequest {
  order_id?: number;
  shop_id: number;
  order_booker_id: number;
  items: BillItemInput[];
  discount_amount?: number;
  payment_status: PaymentStatus;
  paid_amount: number;
  created_by: number;
}

export interface BillResponse {
  success: boolean;
  bill: {
    id: number;
    bill_number: string;
    net_amount: number;
    stock_deducted: boolean;
  };
  stock_warnings?: string[];
}

export interface BillDetails {
  id: number;
  bill_number: string;
  order_id: number | null;
  shop_id: number;
  shop_name: string;
  shop_phone: string | null;
  shop_address: string | null;
  order_booker_id: number;
  booker_name: string;
  bill_date: string;
  subtotal: number;
  discount_amount: number;
  net_amount: number;
  paid_amount: number;
  payment_status: PaymentStatus;
  created_by: number;
  creator_name: string;
  created_at: string;
  items?: Array<{
    id: number;
    product_id: number;
    product_name: string;
    sku: string;
    quantity: number;
    unit_selling_price: number;
    unit_purchase_price: number;
    line_total: number;
    line_profit: number;
  }>;
}

export class BillService {
  static getBills(queryParams: {
    page?: unknown;
    limit?: unknown;
    shop_id?: unknown;
    booker_id?: unknown;
    start_date?: unknown;
    end_date?: unknown;
  }): PaginatedResponse<BillDetails> {
    const { page, limit, offset } = parsePaginationParams(queryParams);

    let whereClause = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (queryParams.shop_id) {
      whereClause += ' AND b.shop_id = ?';
      params.push(Number(queryParams.shop_id));
    }

    if (queryParams.booker_id) {
      whereClause += ' AND b.order_booker_id = ?';
      params.push(Number(queryParams.booker_id));
    }

    if (queryParams.start_date) {
      whereClause += ' AND b.bill_date >= ?';
      params.push(String(queryParams.start_date));
    }

    if (queryParams.end_date) {
      whereClause += ' AND b.bill_date <= ?';
      params.push(String(queryParams.end_date));
    }

    const dataSql = `
      SELECT b.*, s.shop_name, s.phone as shop_phone, s.address as shop_address,
             bk.name as booker_name, u.full_name as creator_name
      FROM bills b
      JOIN retail_shops s ON b.shop_id = s.id
      JOIN order_bookers bk ON b.order_booker_id = bk.id
      JOIN system_users u ON b.created_by = u.id
      ${whereClause}
      ORDER BY b.id DESC
    `;

    const countSql = `
      SELECT COUNT(*) as count
      FROM bills b
      JOIN retail_shops s ON b.shop_id = s.id
      JOIN order_bookers bk ON b.order_booker_id = bk.id
      ${whereClause}
    `;

    const { data, pagination } = executePaginatedQuery<BillDetails>(dataSql, countSql, params, {
      page,
      limit,
      offset,
    });

    return { success: true, data, pagination };
  }

  static getBillById(id: number): BillDetails {
    const bill = db
      .prepare(`
        SELECT b.*, s.shop_name, s.phone as shop_phone, s.address as shop_address,
               bk.name as booker_name, u.full_name as creator_name
        FROM bills b
        JOIN retail_shops s ON b.shop_id = s.id
        JOIN order_bookers bk ON b.order_booker_id = bk.id
        JOIN system_users u ON b.created_by = u.id
        WHERE b.id = ?
      `)
      .get(id) as BillDetails | undefined;

    if (!bill) {
      throw new AppError('Bill not found', 404, 'BILL_NOT_FOUND');
    }

    const items = db
      .prepare(`
        SELECT bi.*, p.name as product_name, p.sku
        FROM bill_items bi
        JOIN products p ON bi.product_id = p.id
        WHERE bi.bill_id = ?
      `)
      .all(id) as BillDetails['items'];

    bill.items = items;
    return bill;
  }

  // ATOMIC CORE TRANSACTION: Bill Creation + Stock Decrement + Audit Ledger Entry
  static createBill(data: CreateBillRequest): BillResponse {
    if (!data.items || data.items.length === 0) {
      throw new AppError('Bill must contain at least one product item', 400, 'EMPTY_BILL');
    }

    const shop = db.prepare('SELECT id, outstanding_balance FROM retail_shops WHERE id = ?').get(data.shop_id) as
      | { id: number; outstanding_balance: number }
      | undefined;
    if (!shop) throw new AppError('Retail shop not found', 404, 'SHOP_NOT_FOUND');

    const booker = db.prepare('SELECT id FROM order_bookers WHERE id = ?').get(data.order_booker_id);
    if (!booker) throw new AppError('Order booker not found', 404, 'BOOKER_NOT_FOUND');

    const billNumber = `INV-${Date.now().toString().slice(-6)}`;
    const stockWarnings: string[] = [];

    const executeBillingTransaction = db.transaction(() => {
      let subtotal = 0;

      // 1. Validate items and verify physical stock availability
      const validatedItems: Array<{
        product_id: number;
        quantity: number;
        unit_selling_price: number;
        unit_purchase_price: number;
        line_total: number;
        line_profit: number;
        new_stock: number;
      }> = [];

      for (const item of data.items) {
        if (item.quantity <= 0) throw new AppError('Quantity must be greater than 0', 400, 'INVALID_QUANTITY');
        if (item.unit_selling_price < 0) throw new AppError('Price cannot be negative', 400, 'INVALID_PRICE');

        const product = db
          .prepare('SELECT id, name, sku, purchase_price, current_stock, min_stock_alert FROM products WHERE id = ?')
          .get(item.product_id) as
          | {
              id: number;
              name: string;
              sku: string;
              purchase_price: number;
              current_stock: number;
              min_stock_alert: number;
            }
          | undefined;

        if (!product) {
          throw new AppError(`Product ID ${item.product_id} does not exist`, 404, 'PRODUCT_NOT_FOUND');
        }

        if (product.current_stock < item.quantity) {
          throw new AppError(
            `Insufficient warehouse stock for "${product.name}" (${product.sku}). Requested: ${item.quantity}, Available: ${product.current_stock}`,
            400,
            'INSUFFICIENT_STOCK'
          );
        }

        const lineTotal = item.quantity * item.unit_selling_price;
        const lineProfit = (item.unit_selling_price - product.purchase_price) * item.quantity;
        const newStock = product.current_stock - item.quantity;

        if (newStock <= product.min_stock_alert) {
          stockWarnings.push(`"${product.name}" is now at low stock: ${newStock} remaining.`);
        }

        subtotal += lineTotal;
        validatedItems.push({
          product_id: product.id,
          quantity: item.quantity,
          unit_selling_price: item.unit_selling_price,
          unit_purchase_price: product.purchase_price, // SNAPSHOT landed cost
          line_total: lineTotal,
          line_profit: lineProfit,
          new_stock: newStock,
        });
      }

      const discount = Math.max(0, data.discount_amount || 0);
      const netAmount = Math.max(0, subtotal - discount);
      const paidAmount = Math.max(0, data.paid_amount || 0);

      // 2. Insert into bills
      const billResult = db
        .prepare(`
          INSERT INTO bills (bill_number, order_id, shop_id, order_booker_id, bill_date, subtotal, discount_amount, net_amount, paid_amount, payment_status, created_by)
          VALUES (?, ?, ?, ?, datetime('now', 'localtime'), ?, ?, ?, ?, ?, ?)
        `)
        .run(
          billNumber,
          data.order_id || null,
          data.shop_id,
          data.order_booker_id,
          subtotal,
          discount,
          netAmount,
          paidAmount,
          data.payment_status,
          data.created_by
        );

      const billId = Number(billResult.lastInsertRowid);

      // 3. Insert bill_items & Atomically Decrement Physical Stock & Log to Immutable Ledger
      const insertItemStmt = db.prepare(`
        INSERT INTO bill_items (bill_id, product_id, quantity, unit_purchase_price, unit_selling_price, line_total, line_profit)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const decrementStockStmt = db.prepare(`
        UPDATE products
        SET current_stock = current_stock - ?, updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `);

      const insertLedgerStmt = db.prepare(`
        INSERT INTO inventory_ledger (product_id, change_qty, balance_after, transaction_type, reference_id, reference_type, performed_by, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const vi of validatedItems) {
        // Insert item snapshot
        insertItemStmt.run(
          billId,
          vi.product_id,
          vi.quantity,
          vi.unit_purchase_price,
          vi.unit_selling_price,
          vi.line_total,
          vi.line_profit
        );

        // Decrement stock
        decrementStockStmt.run(vi.quantity, vi.product_id);

        // Append to immutable ledger
        insertLedgerStmt.run(
          vi.product_id,
          -vi.quantity,
          vi.new_stock,
          INVENTORY_TRANSACTION_TYPES.SALE_BILL,
          billId,
          'bills',
          data.created_by,
          `Sale Invoice: ${billNumber}`
        );
      }

      // 4. Update Retail Shop Khata (Balance)
      const unpaidPortion = Math.max(0, netAmount - paidAmount);
      if (unpaidPortion > 0 || data.payment_status === PAYMENT_STATUSES.CREDIT) {
        db.prepare('UPDATE retail_shops SET outstanding_balance = outstanding_balance + ? WHERE id = ?').run(
          unpaidPortion,
          data.shop_id
        );
      }

      // 5. If linked to an order, transition order to BILLED
      if (data.order_id) {
        db.prepare(`UPDATE orders SET status = '${ORDER_STATUSES.BILLED}' WHERE id = ?`).run(data.order_id);
      }

      return { billId, netAmount };
    });

    const { billId, netAmount } = executeBillingTransaction();

    return {
      success: true,
      bill: {
        id: billId,
        bill_number: billNumber,
        net_amount: netAmount,
        stock_deducted: true, // Confirms atomic operation execution
      },
      ...(stockWarnings.length > 0 ? { stock_warnings: stockWarnings } : {}),
    };
  }

  // Convert an existing Order into a Bill
  static convertOrderToBill(params: {
    order_id: number;
    discount_amount?: number;
    payment_status: PaymentStatus;
    paid_amount: number;
    created_by: number;
  }): BillResponse {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(params.order_id) as
      | { id: number; shop_id: number; order_booker_id: number; status: string }
      | undefined;

    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (order.status === ORDER_STATUSES.BILLED) {
      throw new AppError('This order has already been BILLED', 400, 'ALREADY_BILLED');
    }

    const orderItems = db
      .prepare('SELECT product_id, quantity, unit_price FROM order_items WHERE order_id = ?')
      .all(params.order_id) as Array<{ product_id: number; quantity: number; unit_price: number }>;

    if (orderItems.length === 0) {
      throw new AppError('Order contains no line items to bill', 400, 'EMPTY_ORDER');
    }

    return this.createBill({
      order_id: params.order_id,
      shop_id: order.shop_id,
      order_booker_id: order.order_booker_id,
      items: orderItems.map(oi => ({
        product_id: oi.product_id,
        quantity: oi.quantity,
        unit_selling_price: oi.unit_price,
      })),
      discount_amount: params.discount_amount || 0,
      payment_status: params.payment_status,
      paid_amount: params.paid_amount,
      created_by: params.created_by,
    });
  }

  // Get Digital Print-Formatted Bill
  static getBillPrintData(id: number): Record<string, unknown> {
    const bill = this.getBillById(id);
    const shop = db.prepare('SELECT outstanding_balance FROM retail_shops WHERE id = ?').get(bill.shop_id) as {
      outstanding_balance: number;
    };

    return {
      company: {
        name: 'SMART MARKET WHOLESALE',
        address: 'Market Road, Commercial Zone 1',
        phone: '+1-234-567-8900',
      },
      bill,
      customer_running_balance: shop?.outstanding_balance || 0,
    };
  }
}
