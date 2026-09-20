import React, { useState, useEffect } from 'react';
import { useShop, useShopMutations } from '@/lib/queries/use-shops';
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
import { Select } from '@/components/ui/select';
import { AmountDisplay } from '@/components/shared/amount-display';
import { Banknote, AlertCircle, Loader2 } from 'lucide-react';

interface PaymentEntryFormProps {
  shopId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const PaymentEntryForm: React.FC<PaymentEntryFormProps> = ({
  shopId,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { data: shop, isLoading } = useShop(shopId || 0);
  const { recordPayment } = useShopMutations();

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shop) {
      setAmount('');
      setNotes('');
      setError(null);
    }
  }, [shop, open]);

  if (!shopId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pAmount = parseFloat(amount);
    if (isNaN(pAmount) || pAmount <= 0) {
      setError('Please enter a valid payment amount greater than 0');
      return;
    }

    try {
      setError(null);
      await recordPayment.mutateAsync({
        shopId,
        data: {
          amount: pAmount,
          payment_method: paymentMethod,
          notes: notes.trim() || undefined,
        },
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record payment');
    }
  };

  const parsedAmount = parseFloat(amount) || 0;
  const currentBal = shop?.outstanding_balance || 0;
  const newBalance = Math.max(0, currentBal - parsedAmount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-emerald-600" />
            <span>Record Customer Khata Payment</span>
          </DialogTitle>
          <DialogDescription>
            Credit payment against outstanding balance for {shop?.shop_name}
          </DialogDescription>
        </DialogHeader>

        {isLoading || !shop ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Loading shop details...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Current Balance Display */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-muted-foreground uppercase">
                  Current Khata Balance
                </div>
                <div className="text-xs font-medium text-foreground">{shop.owner_name}</div>
              </div>
              <AmountDisplay
                amount={currentBal}
                size="lg"
                className="font-black text-amber-600 font-mono"
              />
            </div>

            {/* Payment Input */}
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">
                Payment Amount Received (Rs.) *
              </label>
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-mono text-sm font-bold h-10"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Payment Method</label>
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="text-xs"
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank / Online Transfer</option>
                <option value="CHEQUE">Cheque</option>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Notes / Cheque #</label>
              <Input
                type="text"
                placeholder="e.g. Received by booker Aslam / HBL Txn #9281"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Projected Remaining Balance */}
            {parsedAmount > 0 && (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between text-xs font-semibold">
                <span className="text-emerald-800 dark:text-emerald-300">New Remaining Balance:</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-200">
                  <AmountDisplay amount={newBalance} size="sm" />
                </span>
              </div>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={recordPayment.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={recordPayment.isPending || !amount}
                className="gap-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {recordPayment.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Record Payment</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
