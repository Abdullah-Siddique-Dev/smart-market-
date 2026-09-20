import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventory.api';
import { Product } from '@/types/entities';

export function useProducts(params?: { page?: number; limit?: number; search?: string; is_active?: number }) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => inventoryApi.getProducts(params),
  });
}

export function useProductSearch(searchQuery: string) {
  return useQuery({
    queryKey: ['products-search', searchQuery],
    queryFn: () => inventoryApi.searchProducts(searchQuery),
    enabled: searchQuery.trim().length > 0,
  });
}

export function useStockAlerts() {
  return useQuery({
    queryKey: ['stock-alerts'],
    queryFn: () => inventoryApi.getStockStatus(),
    refetchInterval: 30000,
  });
}

export function useProductMutations() {
  const queryClient = useQueryClient();

  const createProduct = useMutation({
    mutationFn: (data: Partial<Product>) => inventoryApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
    },
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Product> }) => inventoryApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
    },
  });

  const recordImport = useMutation({
    mutationFn: inventoryApi.recordImport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['imports'] });
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['audit-ledger'] });
    },
  });

  return { createProduct, updateProduct, recordImport };
}

export function useImports(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['imports', params],
    queryFn: () => inventoryApi.getImports(params),
  });
}
