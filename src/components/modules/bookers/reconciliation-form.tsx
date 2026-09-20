import React, { useState, useEffect } from 'react';
import { useBookerPerformance, useBookerMutations } from '@/lib/queries/use-bookers';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AmountDisplay } from '@/components/shared/amount-display';
import { formatCurrency } from '@/lib/utils/currency';
import { Banknote, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

interface ReconciliationFormProps {
  bookerId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const ReconciliationForm: React.FC<ReconciliationFormProps> = ({
  bookerId,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { data: perf, isLoading } = useBookerPerformance(bookerId || 0);
  const { reconcileBooker } = useBookerMutations();

  const [cashSubmitted, setCashSubmitted] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (perf) {
      setCashSubmitted(String(perf.cash_collected_amount));
    }
  }, [perf, open]);

  if (!bookerId) return null;

  const expectedCash = perf?.cash_collected_amount || 0;
  const submittedNum = parseFloat(cashSubmitted) || 0;
  const shortage = Math.max(0, expectedCash - submittedNum);
  const excess = Math.max(0, submittedNum - expectedCash);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(submittedNum) || submittedNum < 0) {
      setError('Please enter a valid cash amount');
      return;
    }

    try {
      setError(null);
      await reconcileBooker.mutateAsync({
        id: bookerId,
        data: {
          total_cash_submitted: submittedNum,
          shortage_amount: shortage,
        },
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit reconciliation');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-emerald-600" />
            <span>Daily Cash Reconciliation</span>
          </DialogTitle>
          <DialogDescription>
            Verify and settle cash recovery submitted by {perf?.booker?.name}
          </DialogDescription>
        </DialogHeader>

        {isLoading || !perf ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Loading settlement figures...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Expected Summary */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Gross Sales Billed:</span>
                <AmountDisplay amount={perf.total_sales_amount} size="sm" />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Credit Extended (Khata):</span>
                <span className="font-mono text-amber-600 font-semibold">
                  {formatCurrency(perf.credit_issued_amount)}
                </span>
              </div>
              <div className="h-px bg-border/60" />
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-foreground">Expected Cash Collection:</span>
                <AmountDisplay
                  amount={expectedCash}
                  size="md"
                  className="text-emerald-700 dark:text-emerald-300 font-black"
                />
              </div>
            </div>

            {/* Input Cash Submitted */}
            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground">
                Actual Cash Handed Over (Rs.) *
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                value={cashSubmitted}
                onChange={(e) => setCashSubmitted(e.target.value)}
                className="font-mono text-sm font-bold h-10"
                required
              />
            </div>

            {/* Shortage or Perfect Match Alert */}
            {shortage > 0 ? (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive space-y-1">
                <div className="flex justify-between font-bold text-xs">
                  <span>Cash Shortage Detected:</span>
                  <span className="font-mono">{formatCurrency(shortage)}</span>
                </div>
                <p className="text-[10px] opacity-90">
                  This shortage will be permanently logged against the booker&apos;s daily reconciliation record.
                </p>
              </div>
            ) : excess > 0 ? (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-200 flex justify-between font-semibold">
                <span>Surplus Handed Over:</span>
                <span className="font-mono font-bold">{formatCurrency(excess)}</span>
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                <span>Exact match! Zero cash shortage.</span>
              </div>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={reconcileBooker.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={reconcileBooker.isPending}
                className="gap-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {reconcileBooker.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Reconciling...</span>
                  </>
                ) : (
                  <span>Submit End-of-Day Settlement</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
