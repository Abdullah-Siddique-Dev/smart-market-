import React, { useState } from 'react';
import { useOrderMutations } from '@/lib/queries/use-orders';
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
import { ShopSelector } from '@/components/shared/shop-selector';
import { BookerSelector } from '@/components/shared/booker-selector';
import { ProductSearch } from '@/components/shared/product-search';
import { AmountDisplay } from '@/components/shared/amount-display';
import { Trash2, Plus, Minus, Package, AlertCircle, Loader2 } from 'lucide-react';

interface OrderItemEntry {
  product: Product;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated?: (orderId: number) => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  open,
  onOpenChange,
  onOrderCreated,
}) => {
  const [shopId, setShopId] = useState<number | null>(null);
  const [bookerId, setBookerId] = useState<number | null>(null);
  const [items, setItems] = useState<OrderItemEntry[]>([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { createOrder } = useOrderMutations();

  const handleAddProduct = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? {
                ...i,
                quantity: i.quantity + 1,
                line_total: (i.quantity + 1) * i.unit_price,
              }
            : i
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unit_price: product.selling_price,
          line_total: product.selling_price,
        },
      ];
    });
  };

  const handleUpdateQty = (productId: number, qty: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId
          ? {
              ...i,
              quantity: Math.max(1, qty),
              line_total: Math.max(1, qty) * i.unit_price,
            }
          : i
      )
    );
  };

  const handleRemove = (productId: number) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const totalAmount = items.reduce((sum, i) => sum + i.line_total, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) {
      setError('Please select a retail shop');
      return;
    }
    if (!bookerId) {
      setError('Please select an order booker');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one product item');
      return;
    }

    try {
      setError(null);
      const res = await createOrder.mutateAsync({
        shop_id: shopId,
        order_booker_id: bookerId,
        notes: notes.trim() || undefined,
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
      });

      setItems([]);
      setNotes('');
      onOpenChange(false);
      if (onOrderCreated && res && (res as any).id) {
        onOrderCreated((res as any).id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create order');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <span>Create Wholesale Pre-Booking Order</span>
          </DialogTitle>
          <DialogDescription>
            Record order placed by booker for shop fulfillment
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Shop & Booker Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Retail Shop *</label>
              <ShopSelector
                value={shopId}
                onChange={(s) => setShopId(s ? s.id : null)}
                allowWalkIn={false}
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Order Booker *</label>
              <BookerSelector
                value={bookerId}
                onChange={(bId) => setBookerId(bId)}
                allowNone={false}
              />
            </div>
          </div>

          {/* Product Search & Line Items */}
          <div className="space-y-2">
            <label className="font-semibold text-muted-foreground">Add Products to Order</label>
            <ProductSearch onSelect={handleAddProduct} placeholder="Search product to add..." />

            <div className="rounded-lg border border-border/80 overflow-hidden max-h-56 overflow-y-auto mt-2">
              <table className="w-full text-left">
                <thead className="bg-muted/60 text-[10px] font-semibold text-muted-foreground uppercase border-b border-border/60 sticky top-0">
                  <tr>
                    <th className="p-2">Item</th>
                    <th className="p-2 text-right w-24">Rate</th>
                    <th className="p-2 text-center w-32">Qty</th>
                    <th className="p-2 text-right w-28">Total</th>
                    <th className="p-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-6 text-muted-foreground">
                        No items added yet. Search above to add items.
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
                        <td className="p-2 text-right font-mono">
                          <AmountDisplay amount={item.unit_price} size="sm" />
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
                            <span className="w-8 text-center font-mono font-bold">
                              {item.quantity}
                            </span>
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
                        <td className="p-2 text-right font-mono font-bold">
                          <AmountDisplay amount={item.line_total} size="sm" />
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

          {/* Notes & Order Total */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Optional order notes / delivery instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex items-baseline gap-2 shrink-0">
              <span className="text-muted-foreground font-semibold">Total:</span>
              <AmountDisplay amount={totalAmount} size="lg" className="text-primary font-bold" />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={createOrder.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createOrder.isPending || items.length === 0}
              className="gap-2 font-semibold"
            >
              {createOrder.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving Order...</span>
                </>
              ) : (
                <span>Save Order</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
