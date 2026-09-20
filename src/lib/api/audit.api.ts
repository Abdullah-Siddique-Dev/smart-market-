import { apiClient } from './client';
import { InventoryLedgerEntry } from '@/types/entities';
import { PaginatedResponse, ApiResponse } from '@/types/api';

export const auditApi = {
  getLedger: async (params?: {
    page?: number;
    limit?: number;
    product_id?: number;
    transaction_type?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    const res = await apiClient.get<PaginatedResponse<InventoryLedgerEntry>>('/audit/inventory-ledger', { params });
    return res.data;
  },

  getStockReconciliation: async () => {
    const res = await apiClient.get<ApiResponse<{
      summary: { total_products: number; balanced_count: number; discrepancy_count: number };
      rows: Array<{
        product_id: number;
        sku: string;
        product_name: string;
        unit: string;
        system_stock: number;
        ledger_calculated_stock: number;
        variance: number;
        status: 'BALANCED' | 'DISCREPANCY';
      }>;
    }>>('/audit/stock-reconciliation');
    return res.data.data;
  },

  recordAdjustment: async (data: { product_id: number; adjustment_qty: number; reason: string }) => {
    const res = await apiClient.post<ApiResponse<InventoryLedgerEntry>>('/audit/stock-adjustment', data);
    return res.data.data;
  },

  exportCsvUrl: () => `${apiClient.defaults.baseURL}/audit/export`,
};
