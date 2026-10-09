import { apiClient } from './client';
import { Bill } from '@/types/entities';
import { PaginatedResponse, ApiResponse, CreateBillPayload, BillResponse } from '@/types/api';

export const billingApi = {
  getBills: async (params?: {
    page?: number;
    limit?: number;
    shop_id?: number;
    booker_id?: number;
    start_date?: string;
    end_date?: string;
  }) => {
    const res = await apiClient.get<PaginatedResponse<Bill>>('/bills', { params });
    return res.data;
  },

  getBillById: async (id: number) => {
    const res = await apiClient.get<ApiResponse<Bill>>(`/bills/${id}`);
    return res.data.data;
  },

  createBill: async (payload: CreateBillPayload) => {
    const res = await apiClient.post<BillResponse>('/bills', payload);
    return res.data;
  },

  getBillPrint: async (id: number) => {
    const res = await apiClient.get<ApiResponse<Record<string, unknown>>>(`/bills/${id}/print`);
    return res.data.data;
  },
};
