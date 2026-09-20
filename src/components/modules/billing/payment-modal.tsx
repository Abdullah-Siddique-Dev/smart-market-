import React, { useState, useEffect } from 'react';
import { useCartStore } from '@/stores/cart.store';
import { useBillMutations } from '@/lib/queries/use-bills';
import { useShops } from '@/lib/queries/use-shops';
import { useBookers } from '@/lib/queries/use-bookers';
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
import { PaymentStatus } from '@/types/enums';
import { formatCurrency } from '@/lib/utils/currency';
import { CreditCard, Banknote, AlertCircle, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBillCreated: (billId: number) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  onOpenChange,
  onBillCreated,
}) => {
  const items = useCartStore((state) => state.items);
  const selectedShopId = useCartStore((state) => state.selectedShopId);
  const selectedBookerId = useCartStore((state) => state.selectedBookerId);
  const discountAmount = useCartStore((state) => state.discountAmount);
  const netTotal = useCartStore((state) => state.netTotal());
  const resetCart = useCartStore((state) => state.resetCart);

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PAID');
  const [tenderedAmount, setTenderedAmount] = useState<number>(0);
  const [partialPaidAmount, setPartialPaidAmount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const { data: shopsData } = useShops({ limit: 100 });
  const { data: bookersData } = useBookers({ limit: 100 });
  const shops = shopsData?.data || [];
  const bookers = bookersData?.data || [];

  const { createBill } = useBillMutations();

  useEffect(() => {
    if (open) {
      setPaymentStatus('PAID');
      setTenderedAmount(netTotal);
      setPartialPaidAmount(Math.round(netTotal / 2));
      setError(null);
    }
  }, [open, netTotal]);

  const selectedShop = shops.find((s) => s.id === selectedShopId);
  const selectedBooker = bookers.find((b) => b.id === selectedBookerId);

  // Fallbacks if user didn't pick a specific shop/booker in POS
  const effectiveShopId = selectedShopId || (shops.length > 0 ? shops[0].id : 1);
  const effectiveBookerId = selectedBookerId || (bookers.length > 0 ? bookers[0].id : 1);

  const actualPaidAmount =
    paymentStatus === 'PAID'
      ? netTotal
      : paymentStatus === 'CREDIT'
      ? 0
      : Math.min(netTotal, partialPaidAmount);

  const balanceToKhata = Math.max(0, netTotal - actualPaidAmount);
  const changeDue = Math.max(0, tenderedAmount - netTotal);

  const handleSubmit = async () => {
    if (items.length === 0) {
      setError('Invoice cart is empty');
      return;
    }

    if (shops.length === 0) {
      setError('No retail shop available in database. Please register a shop first.');
      return;
    }

    if (bookers.length === 0) {
      setError('No order booker available in database. Please register a booker first.');
      return;
    }

    try {
      setError(null);
      const res = await createBill.mutateAsync({
        shop_id: effectiveShopId,
        order_booker_id: effectiveBookerId,
        discount_amount: discountAmount,
        payment_status: paymentStatus,
        paid_amount: actualPaidAmount,
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          unit_selling_price: i.unit_selling_price,
        })),
      });

      if (res && res.bill) {
        resetCart();
        onOpenChange(false);
        onBillCreated(res.bill.id);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || 'Failed to complete transaction'
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <span>Bill Settlement & Payment</span>
          </DialogTitle>
          <DialogDescription>
            Select payment terms and confirm invoice creation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Grand Total Display */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/80 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Net Payable Total
              </span>
              <div className="text-xs text-muted-foreground mt-0.5">
                {items.length} items to be deducted from inventory
              </div>
            </div>
            <AmountDisplay amount={netTotal} size="xl" className="text-primary font-black" />
          </div>

          {/* Customer & Booker Info Preview */}
          <div className="text-xs space-y-1 bg-background p-3 rounded-lg border border-border/60">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shop / Customer:</span>
              <span className="font-semibold text-foreground">
                {selectedShop ? selectedShop.shop_name : 'Default Walk-in Shop'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Attributed Booker:</span>
              <span className="font-semibold text-foreground">
                {selectedBooker ? selectedBooker.name : 'Default Direct Booker'}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Settlement Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentStatus('PAID')}
                className={cn(
                  'flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-semibold transition-all',
                  paymentStatus === 'PAID'
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-border/80 hover:bg-muted/50 text-foreground'
                )}
              >
                <Banknote className="h-4 w-4 mb-1" />
                <span>Full Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentStatus('CREDIT')}
                className={cn(
                  'flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-semibold transition-all',
                  paymentStatus === 'CREDIT'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-600 shadow-sm'
                    : 'border-border/80 hover:bg-muted/50 text-foreground'
                )}
              >
                <CreditCard className="h-4 w-4 mb-1" />
                <span>100% Credit</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentStatus('PARTIAL')}
                className={cn(
                  'flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-semibold transition-all',
                  paymentStatus === 'PARTIAL'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 shadow-sm'
                    : 'border-border/80 hover:bg-muted/50 text-foreground'
                )}
              >
                <CheckCircle className="h-4 w-4 mb-1" />
                <span>Partial Pay</span>
              </button>
            </div>
          </div>

          {/* Mode-specific Fields */}
          {paymentStatus === 'PAID' && (
            <div className="space-y-3 p-3 rounded-lg bg-muted/20 border border-border/60">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">
                  Cash Tendered by Customer (Rs.)
                </label>
                <Input
                  type="number"
                  min={netTotal}
                  value={tenderedAmount}
                  onChange={(e) => setTenderedAmount(parseFloat(e.target.value) || 0)}
                  className="font-mono text-sm font-bold"
                />
              </div>

              {changeDue > 0 && (
                <div className="flex justify-between items-center text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded">
                  <span>Change Due to Customer:</span>
                  <span className="font-mono text-sm">{formatCurrency(changeDue)}</span>
                </div>
              )}
            </div>
          )}

          {paymentStatus === 'PARTIAL' && (
            <div className="space-y-3 p-3 rounded-lg bg-muted/20 border border-border/60">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">
                  Cash Paid Now (Rs.)
                </label>
                <Input
                  type="number"
                  min="0"
                  max={netTotal}
                  value={partialPaidAmount}
                  onChange={(e) => setPartialPaidAmount(parseFloat(e.target.value) || 0)}
                  className="font-mono text-sm font-bold"
                />
              </div>

              <div className="flex justify-between items-center text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 p-2 rounded">
                <span>Remaining to Khata Balance:</span>
                <span className="font-mono text-sm">{formatCurrency(balanceToKhata)}</span>
              </div>
            </div>
          )}

          {paymentStatus === 'CREDIT' && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs">
              Full amount of <strong>{formatCurrency(netTotal)}</strong> will be charged to the
              customer&apos;s Khata ledger.
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createBill.isPending}
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={createBill.isPending || items.length === 0}
            className="font-bold gap-2"
          >
            {createBill.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Confirm & Generate Bill</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
