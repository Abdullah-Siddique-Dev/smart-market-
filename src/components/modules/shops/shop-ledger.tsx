import React from 'react';
import { useShopLedger } from '@/lib/queries/use-shops';
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
import { StatusBadge } from '@/components/shared/status-badge';
import { formatDateTime } from '@/lib/utils/date';
import { BookOpen, Printer, Download } from 'lucide-react';

interface ShopLedgerProps {
  shopId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecordPayment?: (shopId: number) => void;
}

export const ShopLedger: React.FC<ShopLedgerProps> = ({
  shopId,
  open,
  onOpenChange,
  onRecordPayment,
}) => {
  const { data: ledgerData, isLoading } = useShopLedger(shopId || 0);

  if (!shopId) return null;

  const shop = ledgerData?.shop;
  const bills = ledgerData?.bills || [];
  const payments = ledgerData?.payments || [];

  // Combine and sort events chronologically
  type LedgerRow = {
    date: string;
    type: 'BILL' | 'PAYMENT';
    ref: string;
    description: string;
    debit: number; // Bill amount added to Khata
    credit: number; // Payment deducted from Khata
  };

  const rows: LedgerRow[] = [];

  bills.forEach((b) => {
    const unpaidPart = b.net_amount - b.paid_amount;
    if (unpaidPart > 0 || b.payment_status === 'CREDIT' || b.payment_status === 'PARTIAL') {
      rows.push({
        date: b.bill_date,
        type: 'BILL',
        ref: b.bill_number,
        description: `Invoice ${b.bill_number} (Paid: Rs. ${b.paid_amount.toFixed(2)})`,
        debit: unpaidPart,
        credit: 0,
      });
    }
  });

  payments.forEach((p) => {
    rows.push({
      date: p.payment_date,
      type: 'PAYMENT',
      ref: `PAY-${p.id}`,
      description: `Cash Payment (${p.payment_method})${p.notes ? ` - ${p.notes}` : ''}`,
      debit: 0,
      credit: p.amount,
    });
  });

  rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Compute running balance
  let running = 0;
  const rowsWithBalance = rows.map((r) => {
    running += r.debit - r.credit;
    return { ...r, runningBalance: running };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span>Khata Ledger Account</span>
            </DialogTitle>
            {shop && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Current Balance:</span>
                <AmountDisplay
                  amount={shop.outstanding_balance}
                  size="md"
                  className="font-bold text-amber-600 font-mono"
                />
              </div>
            )}
          </div>
          <DialogDescription>
            {shop?.shop_name} ({shop?.owner_name}) • {shop?.phone || 'No phone'} • {shop?.address || 'No address'}
          </DialogDescription>
        </DialogHeader>

        {isLoading || !shop ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Loading ledger account...
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Ledger Transactions Table */}
            <div className="rounded-lg border border-border/80 overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/60 text-[10px] font-semibold text-muted-foreground uppercase border-b border-border/60 sticky top-0">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Reference / Narration</th>
                    <th className="p-2.5 text-right w-28 text-amber-600">Debit (Invoice)</th>
                    <th className="p-2.5 text-right w-28 text-emerald-600">Credit (Paid)</th>
                    <th className="p-2.5 text-right w-32">Khata Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono">
                  {rowsWithBalance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-6 text-muted-foreground font-sans">
                        No transactions found in this shop&apos;s ledger.
                      </td>
                    </tr>
                  ) : (
                    rowsWithBalance.map((r, idx) => (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="p-2.5 text-muted-foreground text-[11px]">
                          {formatDateTime(r.date)}
                        </td>
                        <td className="p-2.5 font-sans font-medium text-foreground">
                          {r.description}
                        </td>
                        <td className="p-2.5 text-right text-amber-600 font-semibold">
                          {r.debit > 0 ? r.debit.toFixed(2) : '-'}
                        </td>
                        <td className="p-2.5 text-right text-emerald-600 font-semibold">
                          {r.credit > 0 ? r.credit.toFixed(2) : '-'}
                        </td>
                        <td className="p-2.5 text-right font-bold text-foreground">
                          {r.runningBalance.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Credit Limit Alert if exceeded */}
            {shop.credit_limit > 0 && shop.outstanding_balance >= shop.credit_limit && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
                Warning: Customer has exceeded their authorized credit limit of Rs. {shop.credit_limit.toFixed(2)}.
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Ledger</span>
          </Button>

          <div className="flex items-center gap-2">
            {onRecordPayment && (
              <Button
                type="button"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-semibold"
                onClick={() => {
                  onOpenChange(false);
                  onRecordPayment(shopId);
                }}
              >
                <span>Receive Cash</span>
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
