import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AmountDisplay } from '@/components/shared/amount-display';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatDateTime } from '@/lib/utils/date';
import { CheckCircle2, Copy } from 'lucide-react';
import { useBill } from '@/lib/queries/use-bills';

interface BillPrintPreviewProps {
  billId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BillPrintPreview: React.FC<BillPrintPreviewProps> = ({
  billId,
  open,
  onOpenChange,
}) => {
  const { data: bill, isLoading } = useBill(billId || 0);

  const handleCopySummary = () => {
    if (!bill) return;
    const text = `INVOICE: ${bill.bill_number}\nShop: ${bill.shop_name}\nDate: ${bill.bill_date}\nNet Total: Rs. ${bill.net_amount}\nStatus: ${bill.payment_status}`;
    navigator.clipboard.writeText(text);
  };

  if (!billId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="max-w-xl" className="print:p-0 print:border-none print:shadow-none">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>Digital Invoice Preview</span>
          </DialogTitle>
        </DialogHeader>

        {isLoading || !bill ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Loading bill details...
          </div>
        ) : (
          <div className="space-y-4 font-sans text-xs">
            {/* Thermal / Digital Slip Container */}
            <div className="p-4 rounded-xl border border-border/80 bg-background shadow-inner space-y-4">
              {/* Header */}
              <div className="text-center border-b border-border/60 pb-3 space-y-1">
                <h2 className="text-lg font-black tracking-tight text-foreground">
                  SMART MARKET WHOLESALE
                </h2>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Main Market Wholesale Center • Distribution Slip
                </p>
                <div className="flex items-center justify-center gap-2 pt-1 font-mono font-bold text-foreground text-sm">
                  <span>{bill.bill_number}</span>
                  <StatusBadge status={bill.payment_status} />
                </div>
              </div>

              {/* Invoice Metadata */}
              <div className="grid grid-cols-2 gap-2 text-[11px] py-1">
                <div>
                  <span className="text-muted-foreground">Customer: </span>
                  <span className="font-bold text-foreground">{bill.shop_name}</span>
                  {bill.shop_phone && (
                    <div className="text-muted-foreground">Tel: {bill.shop_phone}</div>
                  )}
                  {bill.shop_address && (
                    <div className="text-muted-foreground">{bill.shop_address}</div>
                  )}
                </div>
                <div className="text-right">
                  <div>
                    <span className="text-muted-foreground">Date: </span>
                    <span className="font-mono">{formatDateTime(bill.bill_date)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Booker: </span>
                    <span className="font-medium">{bill.booker_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Billed By: </span>
                    <span>{bill.creator_name}</span>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border-t border-b border-border/60 py-2">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border/40 text-[10px] font-semibold text-muted-foreground uppercase">
                      <th className="py-1">Item</th>
                      <th className="py-1 text-center">Qty</th>
                      <th className="py-1 text-right">Rate</th>
                      <th className="py-1 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {bill.items?.map((item) => (
                      <tr key={item.id} className="py-1">
                        <td className="py-1.5 pr-2">
                          <div className="font-semibold text-foreground">{item.product_name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {item.sku}
                          </div>
                        </td>
                        <td className="py-1.5 text-center font-mono">{item.quantity}</td>
                        <td className="py-1.5 text-right font-mono">
                          {item.unit_selling_price.toFixed(2)}
                        </td>
                        <td className="py-1.5 text-right font-mono font-bold">
                          {item.line_total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Calculation Totals */}
              <div className="space-y-1.5 pt-1 text-right">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">{bill.subtotal.toFixed(2)}</span>
                </div>
                {bill.discount_amount > 0 && (
                  <div className="flex justify-between text-[11px] text-emerald-600">
                    <span>Discount</span>
                    <span className="font-mono">-{bill.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black border-t border-border/60 pt-1 text-foreground">
                  <span>Net Amount</span>
                  <AmountDisplay amount={bill.net_amount} size="md" />
                </div>
                <div className="flex justify-between text-[11px] font-semibold">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-mono text-emerald-600">{bill.paid_amount.toFixed(2)}</span>
                </div>
                {bill.net_amount - bill.paid_amount > 0 && (
                  <div className="flex justify-between text-[11px] font-bold text-amber-600">
                    <span>Added to Shop Khata</span>
                    <span className="font-mono">
                      {(bill.net_amount - bill.paid_amount).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer Note */}
              <div className="text-center pt-2 text-[10px] text-muted-foreground border-t border-border/40">
                Thank you for your business! • Goods once sold are subject to return policy.
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="print:hidden mt-2 flex items-center justify-between sm:justify-between w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopySummary}
            className="gap-1.5"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Copy Invoice Details</span>
          </Button>

          <Button type="button" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
