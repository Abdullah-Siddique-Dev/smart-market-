import { db } from '../db/connection.js';
import { ORDER_STATUSES } from '../config/constants.js';

export interface ProfitReport {
  period: string;
  total_sales: number;
  total_profit: number;
  total_discounts: number;
  net_profit: number;
  profit_margin_percent: number;
  orders_completed: number;
  orders_pending: number;
}

export class ReportService {
  private static getDateFilter(period: string, startDate?: string, endDate?: string): {
    whereClauseBills: string;
    whereClauseOrders: string;
    params: string[];
  } {
    if (startDate && endDate) {
      return {
        whereClauseBills: 'WHERE b.bill_date >= ? AND b.bill_date <= ?',
        whereClauseOrders: 'WHERE o.order_date >= ? AND o.order_date <= ?',
        params: [startDate, endDate],
      };
    }

    switch (period.toLowerCase()) {
      case 'today':
        return {
          whereClauseBills: "WHERE date(b.bill_date) = date('now', 'localtime')",
          whereClauseOrders: "WHERE date(o.order_date) = date('now', 'localtime')",
          params: [],
        };
      case '3days':
        return {
          whereClauseBills: "WHERE date(b.bill_date) >= date('now', '-2 days', 'localtime')",
          whereClauseOrders: "WHERE date(o.order_date) >= date('now', '-2 days', 'localtime')",
          params: [],
        };
      case 'week':
        return {
          whereClauseBills: "WHERE date(b.bill_date) >= date('now', '-6 days', 'localtime')",
          whereClauseOrders: "WHERE date(o.order_date) >= date('now', '-6 days', 'localtime')",
          params: [],
        };
      case 'month':
      default:
        return {
          whereClauseBills: "WHERE strftime('%Y-%m', b.bill_date) = strftime('%Y-%m', 'now', 'localtime')",
          whereClauseOrders: "WHERE strftime('%Y-%m', o.order_date) = strftime('%Y-%m', 'now', 'localtime')",
          params: [],
        };
    }
  }

  // Exact COGS Net Profit Calculation
  static getProfitReport(period: string, startDate?: string, endDate?: string): ProfitReport {
    const { whereClauseBills, whereClauseOrders, params } = this.getDateFilter(period, startDate, endDate);

    // Sum of revenue and discounts from bills
    const billsSummary = db
      .prepare(`
        SELECT 
          COALESCE(SUM(subtotal), 0) as total_subtotal,
          COALESCE(SUM(discount_amount), 0) as total_discounts,
          COALESCE(SUM(net_amount), 0) as total_sales
        FROM bills b
        ${whereClauseBills}
      `)
      .get(...params) as { total_subtotal: number; total_discounts: number; total_sales: number };

    // Sum of gross profit across individual line items
    const profitSummary = db
      .prepare(`
        SELECT COALESCE(SUM(bi.line_profit), 0) as total_gross_profit
        FROM bill_items bi
        JOIN bills b ON bi.bill_id = b.id
        ${whereClauseBills}
      `)
      .get(...params) as { total_gross_profit: number };

    // Orders completed vs pending
    const ordersSummary = db
      .prepare(`
        SELECT 
          COALESCE(SUM(CASE WHEN o.status = '${ORDER_STATUSES.BILLED}' THEN 1 ELSE 0 END), 0) as orders_completed,
          COALESCE(SUM(CASE WHEN o.status IN ('${ORDER_STATUSES.PENDING}', '${ORDER_STATUSES.DISPATCHED}') THEN 1 ELSE 0 END), 0) as orders_pending
        FROM orders o
        ${whereClauseOrders}
      `)
      .get(...params) as { orders_completed: number; orders_pending: number };

    const netProfit = Math.max(0, profitSummary.total_gross_profit - billsSummary.total_discounts);
    const profitMargin =
      billsSummary.total_sales > 0 ? (netProfit / billsSummary.total_sales) * 100 : 0;

    return {
      period: period || 'month',
      total_sales: billsSummary.total_sales,
      total_profit: profitSummary.total_gross_profit,
      total_discounts: billsSummary.total_discounts,
      net_profit: netProfit,
      profit_margin_percent: Math.round(profitMargin * 100) / 100,
      orders_completed: ordersSummary.orders_completed,
      orders_pending: ordersSummary.orders_pending,
    };
  }

  // Sales Trends Overview
  static getSalesReport(period: string, startDate?: string, endDate?: string): Record<string, unknown> {
    const { whereClauseBills, params } = this.getDateFilter(period, startDate, endDate);

    const timeline = db
      .prepare(`
        SELECT 
          date(b.bill_date) as date_label,
          COUNT(b.id) as bill_count,
          SUM(b.net_amount) as total_sales,
          SUM(b.paid_amount) as total_cash_collected
        FROM bills b
        ${whereClauseBills}
        GROUP BY date(b.bill_date)
        ORDER BY date_label ASC
      `)
      .all(...params);

    const paymentModes = db
      .prepare(`
        SELECT 
          payment_status,
          COUNT(id) as count,
          SUM(net_amount) as total_amount
        FROM bills b
        ${whereClauseBills}
        GROUP BY payment_status
      `)
      .all(...params);

    return {
      period,
      timeline,
      payment_modes: paymentModes,
    };
  }

  // Top Products by Sales and Profitability
  static getTopProducts(period: string = 'week', limit: number = 10): Array<Record<string, unknown>> {
    const { whereClauseBills, params } = this.getDateFilter(period);

    return db
      .prepare(`
        SELECT 
          p.id,
          p.sku,
          p.name as product_name,
          p.unit,
          SUM(bi.quantity) as total_units_sold,
          SUM(bi.line_total) as total_revenue,
          SUM(bi.line_profit) as total_profit
        FROM bill_items bi
        JOIN bills b ON bi.bill_id = b.id
        JOIN products p ON bi.product_id = p.id
        ${whereClauseBills}
        GROUP BY p.id
        ORDER BY total_revenue DESC
        LIMIT ?
      `)
      .all(...params, limit) as Array<Record<string, unknown>>;
  }

  // Aggregate Booker Performance Across Entire Company
  static getBookerPerformanceSummary(): Array<Record<string, unknown>> {
    return db
      .prepare(`
        SELECT 
          bk.id as booker_id,
          bk.name as booker_name,
          bk.territory,
          COUNT(DISTINCT o.id) as total_orders_assigned,
          COALESCE(SUM(CASE WHEN o.status = '${ORDER_STATUSES.BILLED}' THEN 1 ELSE 0 END), 0) as orders_collected,
          COALESCE(SUM(CASE WHEN o.status IN ('${ORDER_STATUSES.PENDING}', '${ORDER_STATUSES.DISPATCHED}') THEN 1 ELSE 0 END), 0) as orders_pending,
          COALESCE(SUM(b.net_amount), 0) as total_sales,
          COALESCE(SUM(b.paid_amount), 0) as total_cash_collected
        FROM order_bookers bk
        LEFT JOIN orders o ON bk.id = o.order_booker_id
        LEFT JOIN bills b ON bk.id = b.order_booker_id
        WHERE bk.is_active = 1
        GROUP BY bk.id
        ORDER BY total_sales DESC
      `)
      .all() as Array<Record<string, unknown>>;
  }
}
