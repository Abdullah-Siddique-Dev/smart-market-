import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookersApi } from '../api/bookers.api';
import { OrderBooker } from '@/types/entities';

export function useBookers(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['bookers', params],
    queryFn: () => bookersApi.getBookers(params),
  });
}

export function useBooker(id: number) {
  return useQuery({
    queryKey: ['booker', id],
    queryFn: () => bookersApi.getBookerById(id),
    enabled: id > 0,
  });
}

export function useBookerPerformance(id: number) {
  return useQuery({
    queryKey: ['booker-performance', id],
    queryFn: () => bookersApi.getBookerPerformance(id),
    enabled: id > 0,
  });
}

export function useTodayReconciliation(id: number) {
  return useQuery({
    queryKey: ['booker-reconciliation', id],
    queryFn: () => bookersApi.getTodayReconciliation(id),
    enabled: id > 0,
  });
}

export function useBookerMutations() {
  const queryClient = useQueryClient();

  const createBooker = useMutation({
    mutationFn: (data: Partial<OrderBooker>) => bookersApi.createBooker(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookers'] });
    },
  });

  const updateBooker = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<OrderBooker> }) => bookersApi.updateBooker(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookers'] });
    },
  });

  const reconcileBooker = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { total_cash_submitted: number; shortage_amount?: number } }) =>
      bookersApi.reconcileBooker(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['booker-reconciliation', vars.id] });
      queryClient.invalidateQueries({ queryKey: ['booker-performance', vars.id] });
    },
  });

  return { createBooker, updateBooker, reconcileBooker };
}
