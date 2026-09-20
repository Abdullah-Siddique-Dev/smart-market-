import { apiClient } from './client';
import { Order } from '@/types/entities';
import { PaginatedResponse, ApiResponse, BillResponse } from '@/types/api';

export const ordersApi = {
  getOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    booker_id?: number;
    shop_id?: number;
    start_date?: string;
    end_date?: string;
  }) => {
    const res = await apiClient.get<PaginatedResponse<Order>>('/orders', { params });
    return res.data;
  },

  getOrderById: async (id: number) => {
    const res = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`);
    return res.data.data;
  },

  createOrder: async (data: {
    shop_id: number;
    order_booker_id?: number;
    order_source?: string;
    order_date?: string;
    notes?: string;
    items: Array<{ product_id: number; quantity: number; unit_price: number }>;
  }) => {
    const res = await apiClient.post<ApiResponse<Order>>('/orders', data);
    return res.data.data;
  },

  updateOrderStatus: async (id: number, status: string) => {
    const res = await apiClient.put<ApiResponse<Order>>(`/orders/${id}/status`, { status });
    return res.data.data;
  },

  dispatchOrder: async (id: number) => {
    const res = await apiClient.post<ApiResponse<unknown>>(`/orders/${id}/dispatch`);
    return res.data.data;
  },

  billOrder: async (id: number, data: { discount_amount?: number; payment_status: string; paid_amount: number }) => {
    const res = await apiClient.post<BillResponse>(`/orders/${id}/bill`, data);
    return res.data;
  },
};
