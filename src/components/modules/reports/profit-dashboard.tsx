import React, { useState } from 'react';
import {
  useProfitReport,
  useSalesReport,
  useTopProducts,
  useBookerPerformanceReport,
} from '@/lib/queries/use-reports';
import { PeriodTabs, PeriodType } from '@/components/shared/period-tabs';
import { KpiCards } from './kpi-cards';
import { SalesProfitChart } from './sales-profit-chart';
import { TopProductsChart } from './top-products-chart';
import { BookerLeaderboard } from './booker-leaderboard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar, RefreshCw, BarChart3 } from 'lucide-react';

export const ProfitDashboard: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const queryParams = {
    period: period !== 'custom' ? period : undefined,
    start_date: period === 'custom' && startDate ? startDate : undefined,
    end_date: period === 'custom' && endDate ? endDate : undefined,
  };

  const {
    data: profitData,
    isLoading: isProfitLoading,
    refetch: refetchProfit,
  } = useProfitReport(queryParams);

  const {
    data: salesData,
    isLoading: isSalesLoading,
    refetch: refetchSales,
  } = useSalesReport(queryParams);

  const {
    data: topProducts = [],
    isLoading: isTopLoading,
    refetch: refetchTop,
  } = useTopProducts(queryParams);

  const {
    data: bookerData = [],
    isLoading: isBookerLoading,
    refetch: refetchBookers,
  } = useBookerPerformanceReport();

  const handleRefresh = () => {
    refetchProfit();
    refetchSales();
    refetchTop();
    refetchBookers();
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span>Executive Profit & Sales Analytics [F7]</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            True landed-cost margin calculations, real-time revenue, and wholesale profitability
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="h-9 gap-1.5 text-xs text-muted-foreground"
            title="Refresh Metrics"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>

          <PeriodTabs value={period} onChange={(p) => setPeriod(p)} />
        </div>
      </div>

      {/* Custom Date Inputs if 'custom' selected */}
      {period === 'custom' && (
        <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border/80 shadow-xs text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-semibold">Start:</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 w-36 font-mono text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-semibold">End:</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 w-36 font-mono text-xs"
            />
          </div>
        </div>
      )}

      {/* Primary KPI Metrics */}
      <KpiCards data={profitData} isLoading={isProfitLoading} />

      {/* Visual Chart */}
      <SalesProfitChart timeline={salesData?.timeline || []} isLoading={isSalesLoading} />

      {/* Bottom Grid: Top Products & Booker Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopProductsChart products={topProducts} isLoading={isTopLoading} />
        <BookerLeaderboard bookers={bookerData} isLoading={isBookerLoading} />
      </div>
    </div>
  );
};
