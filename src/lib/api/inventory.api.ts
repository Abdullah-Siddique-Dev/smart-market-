import { apiClient } from './client';
import { Product, ProductImport } from '@/types/entities';
import { PaginatedResponse, ApiResponse } from '@/types/api';

export const inventoryApi = {
  getProducts: async (params?: { page?: number; limit?: number; search?: string; is_active?: number }) => {
    const res = await apiClient.get<PaginatedResponse<Product>>('/products', { params });
    return res.data;
  },

  getProductById: async (id: number) => {
    const res = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
    return res.data.data;
  },

  searchProducts: async (q: string) => {
    const res = await apiClient.get<ApiResponse<Product[]>>('/products/search', { params: { q } });
    return res.data.data || [];
  },

  getStockStatus: async () => {
    const res = await apiClient.get<ApiResponse<Product[]>>('/products/stock-status');
    return res.data.data || [];
  },

  createProduct: async (data: Partial<Product>) => {
    const res = await apiClient.post<ApiResponse<Product>>('/products', data);
    return res.data.data;
  },

  updateProduct: async (id: number, data: Partial<Product>) => {
    const res = await apiClient.put<ApiResponse<Product>>(`/products/${id}`, data);
    return res.data.data;
  },

  deactivateProduct: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/products/${id}`);
    return res.data;
  },

  // Imports
  getImports: async (params?: { page?: number; limit?: number }) => {
    const res = await apiClient.get<PaginatedResponse<ProductImport>>('/imports', { params });
    return res.data;
  },

  recordImport: async (data: {
    product_id: number;
    quantity: number;
    unit_cost: number;
    supplier_info?: string;
    import_date?: string;
    update_master_cost?: boolean;
  }) => {
    const res = await apiClient.post<ApiResponse<ProductImport>>('/imports', data);
    return res.data.data;
  },
};
