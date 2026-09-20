import React from 'react';
import { useDispatchSlip } from '@/lib/queries/use-dispatch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatDateTime } from '@/lib/utils/date';
import { Truck, Copy, CheckCircle } from 'lucide-react';

interface SlipPreviewProps {
  slipId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SlipPreview: React.FC<SlipPreviewProps> = ({
  slipId,
  open,
  onOpenChange,
}) => {
  const { data: slip, isLoading } = useDispatchSlip(slipId || 0);

  const handleCopy = () => {
    if (!slip) return;
    const text = `DISPATCH GATE PASS: ${slip.slip_number}\nBooker: ${slip.booker_name}\nDate: ${slip.dispatch_date}\nStatus: ${slip.status}`;
    navigator.clipboard.writeText(text);
  };

  if (!slipId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="max-w-xl" className="print:p-0 print:border-none print:shadow-none">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <span>Gate Pass / Dispatch Slip Preview</span>
          </DialogTitle>
        </DialogHeader>

        {isLoading || !slip ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Loading dispatch slip...
          </div>
        ) : (
          <div className="space-y-4 font-sans text-xs">
            <div className="p-4 rounded-xl border border-border/80 bg-background shadow-inner space-y-4">
              {/* Header */}
              <div className="text-center border-b border-border/60 pb-3 space-y-1">
                <h2 className="text-base font-black tracking-tight text-foreground">
                  WAREHOUSE DISPATCH GATE PASS
                </h2>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  Goods Release & Booker Outward Manifest
                </p>
                <div className="flex items-center justify-center gap-2 pt-1 font-mono font-bold text-foreground text-sm">
                  <span>{slip.slip_number}</span>
                  <StatusBadge status={slip.status} />
                </div>
              </div>

              {/* Manifest Info */}
              <div className="grid grid-cols-2 gap-2 text-[11px] py-1">
                <div>
                  <span className="text-muted-foreground">Assigned Booker: </span>
                  <span className="font-bold text-foreground">{slip.booker_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">Date: </span>
                  <span className="font-mono">{formatDateTime(slip.dispatch_date)}</span>
                </div>
              </div>

              {/* Items Manifest */}
              <div className="border-t border-b border-border/60 py-2">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border/40 text-[10px] font-semibold text-muted-foreground uppercase">
                      <th className="py-1">Product</th>
                      <th className="py-1 text-center">Dispatched</th>
                      <th className="py-1 text-center">Sold/Billed</th>
                      <th className="py-1 text-center">Returned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {slip.items?.map((item) => (
                      <tr key={item.id} className="py-1">
                        <td className="py-1.5 pr-2">
                          <div className="font-semibold text-foreground">{item.product_name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {item.sku}
                          </div>
                        </td>
                        <td className="py-1.5 text-center font-mono font-bold text-foreground">
                          {item.dispatched_qty}
                        </td>
                        <td className="py-1.5 text-center font-mono text-emerald-600 font-semibold">
                          {item.billed_qty}
                        </td>
                        <td className="py-1.5 text-center font-mono text-amber-600 font-semibold">
                          {item.returned_qty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures for physical verification */}
              <div className="grid grid-cols-2 gap-8 pt-6 pb-2 text-[10px] text-muted-foreground border-t border-border/40 text-center">
                <div>
                  <div className="border-b border-muted-foreground/40 mb-1 h-6"></div>
                  <span>Warehouse Dispatcher</span>
                </div>
                <div>
                  <div className="border-b border-muted-foreground/40 mb-1 h-6"></div>
                  <span>Receiving Booker Signature</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="print:hidden gap-2 sm:justify-between">
          <Button type="button" variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
            <Copy className="h-3.5 w-3.5" />
            <span>Copy Text</span>
          </Button>

          <Button type="button" size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
