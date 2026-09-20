import React from 'react';
import { useBookerPerformance } from '@/lib/queries/use-bookers';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AmountDisplay } from '@/components/shared/amount-display';
import { TrendingUp, ShoppingBag, Banknote, CreditCard, Award } from 'lucide-react';

interface PerformanceMatrixProps {
  bookerId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PerformanceMatrix: React.FC<PerformanceMatrixProps> = ({
  bookerId,
  open,
  onOpenChange,
}) => {
  const { data: perf, isLoading } = useBookerPerformance(bookerId || 0);

  if (!bookerId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span>Booker Performance Scorecard</span>
          </DialogTitle>
          <DialogDescription>
            {perf?.booker?.name} {perf?.booker?.territory && `• ${perf.booker.territory}`}
          </DialogDescription>
        </DialogHeader>

        {isLoading || !perf ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Loading performance data...
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Gross Sales */}
              <div className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-1">
                <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                  <ShoppingBag className="h-3.5 w-3.5 text-primary" /> Gross Sales Generated
                </span>
                <AmountDisplay amount={perf.total_sales_amount} size="lg" className="font-bold text-foreground" />
                <div className="text-[10px] text-muted-foreground">
                  {perf.orders_collected} delivered / {perf.orders_assigned} total orders
                </div>
              </div>

              {/* Commission */}
              <div className="p-3 rounded-xl border border-border/80 bg-primary/5 space-y-1">
                <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Award className="h-3.5 w-3.5 text-primary" /> Estimated Commission
                </span>
                <AmountDisplay amount={perf.estimated_commission} size="lg" className="font-bold text-primary" />
                <div className="text-[10px] text-muted-foreground">
                  Commission Rate: {perf.booker.commission_rate}%
                </div>
              </div>

              {/* Cash Recovered */}
              <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-1">
                <span className="text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 font-medium">
                  <Banknote className="h-3.5 w-3.5 text-emerald-600" /> Cash Recovered
                </span>
                <AmountDisplay amount={perf.cash_collected_amount} size="lg" className="font-bold text-emerald-700 dark:text-emerald-300" />
                <div className="text-[10px] text-muted-foreground">Cash collected & submitted</div>
              </div>

              {/* Credit Incurred */}
              <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20 space-y-1">
                <span className="text-amber-800 dark:text-amber-300 flex items-center gap-1.5 font-medium">
                  <CreditCard className="h-3.5 w-3.5 text-amber-600" /> Credit Issued
                </span>
                <AmountDisplay amount={perf.credit_issued_amount} size="lg" className="font-bold text-amber-700 dark:text-amber-300" />
                <div className="text-[10px] text-muted-foreground">Added to customer Khatas</div>
              </div>
            </div>

            {/* Orders summary bar */}
            <div className="p-3 rounded-lg border border-border/60 bg-card space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span>Order Delivery Pipeline</span>
                <span>
                  {perf.orders_collected} / {perf.orders_assigned} Orders Completed
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      perf.orders_assigned > 0
                        ? (perf.orders_collected / perf.orders_assigned) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Pending Fulfillment: {perf.orders_pending}</span>
                <span>
                  Completion Rate:{' '}
                  {perf.orders_assigned > 0
                    ? Math.round((perf.orders_collected / perf.orders_assigned) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
