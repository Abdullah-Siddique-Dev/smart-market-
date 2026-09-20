import { apiClient } from './client';
import { RetailShop } from '@/types/entities';
import { PaginatedResponse, ApiResponse } from '@/types/api';

export const shopsApi = {
  getShops: async (params?: { page?: number; limit?: number; search?: string }) => {
    const res = await apiClient.get<PaginatedResponse<RetailShop>>('/shops', { params });
    return res.data;
  },

  getShopById: async (id: number) => {
    const res = await apiClient.get<ApiResponse<RetailShop>>(`/shops/${id}`);
    return res.data.data;
  },

  createShop: async (data: Partial<RetailShop>) => {
    const res = await apiClient.post<ApiResponse<RetailShop>>('/shops', data);
    return res.data.data;
  },

  updateShop: async (id: number, data: Partial<RetailShop>) => {
    const res = await apiClient.put<ApiResponse<RetailShop>>(`/shops/${id}`, data);
    return res.data.data;
  },

  getShopLedger: async (id: number) => {
    const res = await apiClient.get<ApiResponse<{
      shop: RetailShop;
      bills: Array<{ id: number; bill_number: string; bill_date: string; net_amount: number; paid_amount: number; payment_status: string }>;
      payments: Array<{ id: number; amount: number; payment_date: string; payment_method: string; notes: string | null; receiver_name: string }>;
    }>>(`/shops/${id}/ledger`);
    return res.data.data;
  },

  recordPayment: async (shopId: number, data: { amount: number; payment_method?: string; notes?: string }) => {
    const res = await apiClient.post<ApiResponse<{ payment_id: number; new_balance: number }>>(`/shops/${shopId}/payment`, data);
    return res.data.data;
  },
};
