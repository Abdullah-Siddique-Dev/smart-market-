import React from 'react';
import { useOrder, useOrderMutations } from '@/lib/queries/use-orders';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from './order-status-badge';
import { OrderSourceBadge } from './order-source-badge';
import { AmountDisplay } from '@/components/shared/amount-display';
import { formatDateTime } from '@/lib/utils/date';
import { Package, Truck, XCircle, CheckCircle, FileText } from 'lucide-react';

interface OrderDetailProps {
  orderId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConvertToBill?: (orderId: number) => void;
}

export const OrderDetail: React.FC<OrderDetailProps> = ({
  orderId,
  open,
  onOpenChange,
  onConvertToBill,
}) => {
  const { data: order, isLoading } = useOrder(orderId || 0);
  const { updateStatus, dispatchOrder } = useOrderMutations();

  if (!orderId) return null;

  const handleDispatch = async () => {
    if (order) {
      await dispatchOrder.mutateAsync(order.id);
      onOpenChange(false);
    }
  };

  const handleCancel = async () => {
    if (order) {
      await updateStatus.mutateAsync({ id: order.id, status: 'CANCELLED' });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <span>Order Details</span>
              {order && <span className="font-mono text-sm">#{order.order_number}</span>}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {order && <OrderSourceBadge source={order.order_source} />}
              {order && <OrderStatusBadge status={order.status} />}
            </div>
          </div>
        </DialogHeader>

        {isLoading || !order ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Loading order details...
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Metadata Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-border/80 bg-muted/20 space-y-1">
                <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                  Customer / Retail Shop
                </span>
                <div className="font-bold text-sm text-foreground">{order.shop_name}</div>
                <div className="text-muted-foreground text-[11px]">Date: {formatDateTime(order.order_date)}</div>
              </div>

              <div className="p-3 rounded-lg border border-border/80 bg-muted/20 space-y-1">
                <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                  Attributed Booker
                </span>
                <div className="font-bold text-sm text-foreground">
                  {order.booker_name && order.booker_name !== 'Direct Counter' ? (
                    order.booker_name
                  ) : (
                    <span className="text-muted-foreground font-normal italic">Direct Sale / No Booker</span>
                  )}
                </div>
                <div className="text-muted-foreground text-[11px]">Recorded By: {order.creator_name}</div>
              </div>
            </div>

            {/* Notes if any */}
            {order.notes && (
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 text-muted-foreground text-[11px]">
                <strong>Notes: </strong>
                {order.notes}
              </div>
            )}

            {/* Ordered Items Table */}
            <div className="rounded-lg border border-border/80 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-muted/60 text-[11px] font-semibold text-muted-foreground uppercase border-b border-border/60">
                  <tr>
                    <th className="p-2.5">Product</th>
                    <th className="p-2.5 text-center w-24">Qty</th>
                    <th className="p-2.5 text-right w-28">Unit Price</th>
                    <th className="p-2.5 text-right w-32">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {order.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/20">
                      <td className="p-2.5">
                        <div className="font-semibold text-foreground">{item.product_name}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{item.sku}</div>
                      </td>
                      <td className="p-2.5 text-center font-mono font-medium">{item.quantity}</td>
                      <td className="p-2.5 text-right font-mono">
                        <AmountDisplay amount={item.unit_price} size="sm" />
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold">
                        <AmountDisplay amount={item.line_total} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Amount */}
            <div className="flex justify-between items-center p-3 rounded-lg bg-card border border-border/80">
              <span className="font-bold text-sm text-foreground">Total Order Amount</span>
              <AmountDisplay amount={order.total_amount} size="lg" className="text-primary font-bold" />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <div className="flex items-center gap-2">
            {order?.status === 'PENDING' && (
              <>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleCancel}
                  disabled={updateStatus.isPending}
                  className="gap-1.5 text-xs"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Cancel Order</span>
                </Button>
                {order.order_booker_id && (
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleDispatch}
                    disabled={dispatchOrder.isPending}
                    className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700"
                  >
                    <Truck className="h-3.5 w-3.5" />
                    <span>Mark Dispatched</span>
                  </Button>
                )}
              </>
            )}

            {order?.status !== 'CANCELLED' && onConvertToBill && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (order) {
                    onConvertToBill(order.id);
                    onOpenChange(false);
                  }
                }}
                className="gap-1.5 text-xs"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Convert to Bill</span>
              </Button>
            )}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
