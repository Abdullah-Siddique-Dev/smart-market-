import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shopsApi } from '../api/shops.api';
import { RetailShop } from '@/types/entities';

export function useShops(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['shops', params],
    queryFn: () => shopsApi.getShops(params),
  });
}

export function useShop(id: number) {
  return useQuery({
    queryKey: ['shop', id],
    queryFn: () => shopsApi.getShopById(id),
    enabled: id > 0,
  });
}

export function useShopLedger(id: number) {
  return useQuery({
    queryKey: ['shop-ledger', id],
    queryFn: () => shopsApi.getShopLedger(id),
    enabled: id > 0,
  });
}

export function useShopMutations() {
  const queryClient = useQueryClient();

  const createShop = useMutation({
    mutationFn: (data: Partial<RetailShop>) => shopsApi.createShop(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
    },
  });

  const updateShop = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<RetailShop> }) => shopsApi.updateShop(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
    },
  });

  const recordPayment = useMutation({
    mutationFn: ({ shopId, data }: { shopId: number; data: { amount: number; payment_method?: string; notes?: string } }) =>
      shopsApi.recordPayment(shopId, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      queryClient.invalidateQueries({ queryKey: ['shop-ledger', vars.shopId] });
    },
  });

  return { createShop, updateShop, recordPayment };
}
