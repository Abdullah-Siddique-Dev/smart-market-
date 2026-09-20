import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '../api/billing.api';
import { CreateBillPayload } from '@/types/api';

export function useBills(params?: {
  page?: number;
  limit?: number;
  shop_id?: number;
  booker_id?: number;
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: ['bills', params],
    queryFn: () => billingApi.getBills(params),
  });
}

export function useBill(id: number) {
  return useQuery({
    queryKey: ['bill', id],
    queryFn: () => billingApi.getBillById(id),
    enabled: id > 0,
  });
}

export function useBillMutations() {
  const queryClient = useQueryClient();

  const createBill = useMutation({
    mutationFn: (payload: CreateBillPayload) => billingApi.createBill(payload),
    onSuccess: () => {
      // Invalidate all related state: bills, products (stock updated), orders (status updated), ledger, shops
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      queryClient.invalidateQueries({ queryKey: ['audit-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  return { createBill };
}
