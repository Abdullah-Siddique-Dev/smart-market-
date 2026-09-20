import React, { useState } from 'react';
import { useDispatchMutations } from '@/lib/queries/use-dispatch';
import { useOrders } from '@/lib/queries/use-orders';
import { BookerSelector } from '@/components/shared/booker-selector';
import { ProductSearch } from '@/components/shared/product-search';
import { Product } from '@/types/entities';
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
import { Truck, Plus, Minus, Trash2, AlertCircle, Loader2 } from 'lucide-react';

interface SlipGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSlipCreated?: (slipId: number) => void;
}

export const SlipGenerator: React.FC<SlipGeneratorProps> = ({
  open,
  onOpenChange,
  onSlipCreated,
}) => {
  const [bookerId, setBookerId] = useState<number | null>(null);
  const [items, setItems] = useState<Array<{ product: Product; quantity: number }>>([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { generateSlip } = useDispatchMutations();

  // Load pending orders for this booker if selected
  const { data: pendingOrdersData } = useOrders({
    booker_id: bookerId || undefined,
    status: 'PENDING',
    limit: 50,
  });
  const pendingOrders = pendingOrdersData?.data || [];

  const handleLoadBookerOrders = () => {
    if (pendingOrders.length === 0) return;
    const aggregated: Record<number, { product: Product; quantity: number }> = {};

    pendingOrders.forEach((order) => {
      order.items?.forEach((i) => {
        if (!aggregated[i.product_id]) {
          aggregated[i.product_id] = {
            product: {
              id: i.product_id,
              sku: i.sku || '',
              name: i.product_name || 'Item',
              unit: 'BOX',
              selling_price: i.unit_price,
              current_stock: 999,
              min_stock_alert: 5,
              is_active: 1,
              created_at: '',
              updated_at: '',
            },
            quantity: 0,
          };
        }
        aggregated[i.product_id].quantity += i.quantity;
      });
    });

    setItems(Object.values(aggregated));
  };

  const handleAddProduct = (product: Product) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id);
      if (idx > -1) {
        return prev.map((item, i) =>
          i === idx ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQty = (productId: number, qty: number) => {
    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity: Math.max(1, qty) } : i))
    );
  };

  const handleRemove = (productId: number) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookerId) {
      setError('Please select an order booker');
      return;
    }
    if (items.length === 0) {
      setError('Please add products or load pending orders');
      return;
    }

    try {
      setError(null);
      const res = await generateSlip.mutateAsync({
        order_booker_id: bookerId,
        order_ids: pendingOrders.map((o) => o.id),
        items: items.map((i) => ({
          product_id: i.product.id,
          dispatched_qty: i.quantity,
        })),
        notes: notes.trim() || undefined,
      });

      setItems([]);
      setNotes('');
      onOpenChange(false);
      if (onSlipCreated && res && res.id) {
        onSlipCreated(res.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate dispatch slip');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <span>Generate Dispatch Gate Pass</span>
          </DialogTitle>
          <DialogDescription>
            Allocate outward goods to booker for daily field distribution
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Booker Picker */}
          <div className="space-y-1">
            <label className="font-semibold text-muted-foreground">Order Booker *</label>
            <BookerSelector
              value={bookerId}
              onChange={(id) => setBookerId(id)}
              allowNone={false}
            />
          </div>

          {bookerId && pendingOrders.length > 0 && (
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between">
              <div>
                <span className="font-semibold text-blue-700 dark:text-blue-300">
                  {pendingOrders.length} Pending Orders
                </span>{' '}
                found for this booker.
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLoadBookerOrders}
                className="h-7 text-xs bg-white dark:bg-card"
              >
                Auto-fill All Order Items
              </Button>
            </div>
          )}

          {/* Add Additional Products */}
          <div className="space-y-2">
            <label className="font-semibold text-muted-foreground">Manifest Outward Items</label>
            <ProductSearch onSelect={handleAddProduct} placeholder="Search product to add..." />

            <div className="rounded-lg border border-border/80 overflow-hidden max-h-56 overflow-y-auto mt-2">
              <table className="w-full text-left">
                <thead className="bg-muted/60 text-[10px] font-semibold text-muted-foreground uppercase border-b border-border/60 sticky top-0">
                  <tr>
                    <th className="p-2">Product</th>
                    <th className="p-2 text-center w-36">Dispatched Qty</th>
                    <th className="p-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center p-6 text-muted-foreground">
                        No items added to dispatch manifest.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.product.id} className="hover:bg-muted/30">
                        <td className="p-2">
                          <div className="font-semibold text-foreground">{item.product.name}</div>
                          <div className="text-[10px] font-mono text-muted-foreground">
                            {item.product.sku}
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              disabled={item.quantity <= 1}
                              onClick={() => handleUpdateQty(item.product.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateQty(item.product.id, parseInt(e.target.value, 10) || 1)
                              }
                              className="w-14 h-6 text-center font-mono text-xs font-bold"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleUpdateQty(item.product.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemove(item.product.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-1">
            <Input
              type="text"
              placeholder="Gate Pass Notes / Vehicle No / Driver..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={generateSlip.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={generateSlip.isPending || items.length === 0}
              className="gap-2 font-semibold"
            >
              {generateSlip.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Generating Slip...</span>
                </>
              ) : (
                <span>Generate Gate Pass</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
