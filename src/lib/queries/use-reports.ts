import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/reports.api';

export function useProfitReport(params: { period?: string; start_date?: string; end_date?: string }) {
  return useQuery({
    queryKey: ['reports-profit', params],
    queryFn: () => reportsApi.getProfitReport(params),
  });
}

export function useSalesReport(params: { period?: string; start_date?: string; end_date?: string }) {
  return useQuery({
    queryKey: ['reports-sales', params],
    queryFn: () => reportsApi.getSalesReport(params),
  });
}

export function useTopProducts(params?: { period?: string; limit?: number }) {
  return useQuery({
    queryKey: ['reports-top-products', params],
    queryFn: () => reportsApi.getTopProducts(params),
  });
}

export function useBookerLeaderboard() {
  return useQuery({
    queryKey: ['reports-booker-performance'],
    queryFn: () => reportsApi.getBookerPerformance(),
  });
}

export const useBookerPerformanceReport = useBookerLeaderboard;
