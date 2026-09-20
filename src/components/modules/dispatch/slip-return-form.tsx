import React, { useState, useEffect } from 'react';
import { useDispatchSlip, useDispatchMutations } from '@/lib/queries/use-dispatch';
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
import { RotateCcw, AlertCircle, Loader2 } from 'lucide-react';

interface SlipReturnFormProps {
  slipId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReconciled?: () => void;
}

interface ReconcileItemRow {
  product_id: number;
  product_name: string;
  sku: string;
  dispatched_qty: number;
  returned_qty: number;
  billed_qty: number;
}

export const SlipReturnForm: React.FC<SlipReturnFormProps> = ({
  slipId,
  open,
  onOpenChange,
  onReconciled,
}) => {
  const { data: slip, isLoading } = useDispatchSlip(slipId || 0);
  const { reconcileSlip } = useDispatchMutations();

  const [items, setItems] = useState<ReconcileItemRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slip && slip.items) {
      setItems(
        slip.items.map((i) => ({
          product_id: i.product_id,
          product_name: i.product_name || 'Product',
          sku: i.sku || '',
          dispatched_qty: i.dispatched_qty,
          returned_qty: i.returned_qty || 0,
          billed_qty: i.billed_qty || i.dispatched_qty - (i.returned_qty || 0),
        }))
      );
    }
  }, [slip]);

  if (!slipId) return null;

  const handleUpdate = (productId: number, field: 'returned_qty' | 'billed_qty', value: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.product_id === productId) {
          const val = Math.max(0, value);
          if (field === 'returned_qty') {
            const newReturned = Math.min(item.dispatched_qty, val);
            return {
              ...item,
              returned_qty: newReturned,
              billed_qty: item.dispatched_qty - newReturned,
            };
          } else {
            const newBilled = Math.min(item.dispatched_qty, val);
            return {
              ...item,
              billed_qty: newBilled,
              returned_qty: item.dispatched_qty - newBilled,
            };
          }
        }
        return item;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await reconcileSlip.mutateAsync({
        id: slipId,
        reconciled_items: items.map((i) => ({
          product_id: i.product_id,
          returned_qty: i.returned_qty,
          billed_qty: i.billed_qty,
        })),
      });

      onOpenChange(false);
      onReconciled?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reconcile dispatch slip');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-amber-600" />
            <span>Reconcile Returned Goods / Field Settlement</span>
          </DialogTitle>
          <DialogDescription>
            Record unsold goods returned to warehouse to restock physical inventory
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Loading manifest...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="rounded-lg border border-border/80 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-muted/60 text-[10px] font-semibold text-muted-foreground uppercase border-b border-border/60">
                  <tr>
                    <th className="p-2.5">Product</th>
                    <th className="p-2.5 text-center w-24">Dispatched</th>
                    <th className="p-2.5 text-center w-28">Sold / Billed</th>
                    <th className="p-2.5 text-center w-28 text-amber-600">Returned to Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {items.map((item) => (
                    <tr key={item.product_id} className="hover:bg-muted/20">
                      <td className="p-2.5">
                        <div className="font-semibold text-foreground">{item.product_name}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{item.sku}</div>
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold">{item.dispatched_qty}</td>
                      <td className="p-2.5 text-center">
                        <Input
                          type="number"
                          min="0"
                          max={item.dispatched_qty}
                          value={item.billed_qty}
                          onChange={(e) =>
                            handleUpdate(
                              item.product_id,
                              'billed_qty',
                              parseInt(e.target.value, 10) || 0
                            )
                          }
                          className="h-7 text-center font-mono text-xs font-semibold"
                        />
                      </td>
                      <td className="p-2.5 text-center">
                        <Input
                          type="number"
                          min="0"
                          max={item.dispatched_qty}
                          value={item.returned_qty}
                          onChange={(e) =>
                            handleUpdate(
                              item.product_id,
                              'returned_qty',
                              parseInt(e.target.value, 10) || 0
                            )
                          }
                          className="h-7 text-center font-mono text-xs font-semibold text-amber-600 border-amber-300"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-xs">
              Any returned quantities will immediately be credited back into warehouse inventory with an audit trail entry.
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={reconcileSlip.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={reconcileSlip.isPending}
                className="gap-2 font-semibold bg-amber-600 hover:bg-amber-700 text-white"
              >
                {reconcileSlip.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Reconciling...</span>
                  </>
                ) : (
                  <span>Submit Settlement</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
