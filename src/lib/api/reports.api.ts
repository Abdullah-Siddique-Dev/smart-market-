import { apiClient } from './client';
import { ProfitReport } from '@/types/entities';
import { ApiResponse } from '@/types/api';

export const reportsApi = {
  getProfitReport: async (params: { period?: string; start_date?: string; end_date?: string }) => {
    const res = await apiClient.get<ProfitReport>('/reports/profit', { params });
    return res.data;
  },

  getSalesReport: async (params: { period?: string; start_date?: string; end_date?: string }) => {
    const res = await apiClient.get<ApiResponse<{
      period: string;
      timeline: Array<{ date_label: string; bill_count: number; total_sales: number; total_cash_collected: number }>;
      payment_modes: Array<{ payment_status: string; count: number; total_amount: number }>;
    }>>('/reports/sales', { params });
    return res.data.data;
  },

  getTopProducts: async (params?: { period?: string; limit?: number }) => {
    const res = await apiClient.get<ApiResponse<Array<{
      id: number;
      sku: string;
      product_name: string;
      unit: string;
      total_units_sold: number;
      total_revenue: number;
      total_profit: number;
    }>>>('/reports/top-products', { params });
    return res.data.data || [];
  },

  getBookerPerformance: async () => {
    const res = await apiClient.get<ApiResponse<Array<{
      booker_id: number;
      booker_name: string;
      territory: string | null;
      total_orders_assigned: number;
      orders_collected: number;
      orders_pending: number;
      total_sales: number;
      total_cash_collected: number;
    }>>>('/reports/booker-performance');
    return res.data.data || [];
  },
};
