import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dispatchApi } from '../api/dispatch.api';

export function useDispatchSlips(params?: { page?: number; limit?: number; booker_id?: number; status?: string }) {
  return useQuery({
    queryKey: ['dispatch-slips', params],
    queryFn: () => dispatchApi.getSlips(params),
  });
}

export function useDispatchSlip(id: number) {
  return useQuery({
    queryKey: ['dispatch-slip', id],
    queryFn: () => dispatchApi.getSlipById(id),
    enabled: id > 0,
  });
}

export function useDispatchMutations() {
  const queryClient = useQueryClient();

  const generateSlip = useMutation({
    mutationFn: dispatchApi.generateSlip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatch-slips'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const reconcileSlip = useMutation({
    mutationFn: ({
      id,
      reconciled_items,
    }: {
      id: number;
      reconciled_items: Array<{ product_id: number; returned_qty: number; billed_qty: number }>;
    }) => dispatchApi.reconcileSlip(id, { reconciled_items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatch-slips'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['audit-ledger'] });
    },
  });

  return { generateSlip, reconcileSlip };
}
