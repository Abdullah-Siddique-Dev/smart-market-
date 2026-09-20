import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auditApi } from '../api/audit.api';

export function useAuditLedger(params?: {
  page?: number;
  limit?: number;
  product_id?: number;
  transaction_type?: string;
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: ['audit-ledger', params],
    queryFn: () => auditApi.getLedger(params),
  });
}

export function useStockReconciliation() {
  return useQuery({
    queryKey: ['stock-reconciliation'],
    queryFn: () => auditApi.getStockReconciliation(),
  });
}

export function useAuditMutations() {
  const queryClient = useQueryClient();

  const recordAdjustment = useMutation({
    mutationFn: auditApi.recordAdjustment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['stock-reconciliation'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return { recordAdjustment };
}
