import { apiClient } from './client';
import { DispatchSlip } from '@/types/entities';
import { PaginatedResponse, ApiResponse } from '@/types/api';

export const dispatchApi = {
  getSlips: async (params?: { page?: number; limit?: number; booker_id?: number; status?: string }) => {
    const res = await apiClient.get<PaginatedResponse<DispatchSlip>>('/dispatch-slips', { params });
    return res.data;
  },

  getSlipById: async (id: number) => {
    const res = await apiClient.get<ApiResponse<DispatchSlip>>(`/dispatch-slips/${id}`);
    return res.data.data;
  },

  generateSlip: async (data: {
    order_booker_id: number;
    order_ids?: number[];
    items?: Array<{ product_id: number; dispatched_qty: number }>;
    notes?: string;
  }) => {
    const res = await apiClient.post<ApiResponse<DispatchSlip>>('/dispatch-slips', data);
    return res.data.data;
  },

  reconcileSlip: async (
    id: number,
    data: {
      reconciled_items: Array<{ product_id: number; returned_qty: number; billed_qty: number }>;
    }
  ) => {
    const res = await apiClient.put<ApiResponse<DispatchSlip>>(`/dispatch-slips/${id}/reconcile`, data);
    return res.data.data;
  },
};
