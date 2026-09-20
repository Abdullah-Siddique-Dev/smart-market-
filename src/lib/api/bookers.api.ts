import { apiClient } from './client';
import { OrderBooker, BookerPerformance } from '@/types/entities';
import { PaginatedResponse, ApiResponse } from '@/types/api';

export const bookersApi = {
  getBookers: async (params?: { page?: number; limit?: number; search?: string }) => {
    const res = await apiClient.get<PaginatedResponse<OrderBooker>>('/bookers', { params });
    return res.data;
  },

  getBookerById: async (id: number) => {
    const res = await apiClient.get<ApiResponse<OrderBooker>>(`/bookers/${id}`);
    return res.data.data;
  },

  createBooker: async (data: Partial<OrderBooker>) => {
    const res = await apiClient.post<ApiResponse<OrderBooker>>('/bookers', data);
    return res.data.data;
  },

  updateBooker: async (id: number, data: Partial<OrderBooker>) => {
    const res = await apiClient.put<ApiResponse<OrderBooker>>(`/bookers/${id}`, data);
    return res.data.data;
  },

  getBookerPerformance: async (id: number) => {
    const res = await apiClient.get<ApiResponse<BookerPerformance>>(`/bookers/${id}/performance`);
    return res.data.data;
  },

  getTodayReconciliation: async (id: number) => {
    const res = await apiClient.get<ApiResponse<{
      reconciliation_date: string;
      is_settled: boolean;
      settlement_record: Record<string, unknown> | null;
      current_metrics: BookerPerformance;
    }>>(`/bookers/${id}/reconciliation`);
    return res.data.data;
  },

  reconcileBooker: async (id: number, data: { total_cash_submitted: number; shortage_amount?: number }) => {
    const res = await apiClient.post<ApiResponse<Record<string, unknown>>>(`/bookers/${id}/reconcile`, data);
    return res.data.data;
  },
};
