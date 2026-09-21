import React from 'react';
import { useCartStore } from '@/stores/cart.store';
import { AmountDisplay } from '@/components/shared/amount-display';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { CreditCard, Trash2, ArrowRight, Receipt, Percent } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface InvoiceSummaryProps {
  onCheckout: () => void;
}

export const InvoiceSummary: React.FC<InvoiceSummaryProps> = ({ onCheckout }) => {
  const items = useCartStore((state) => state.items);
  const discountAmount = useCartStore((state) => state.discountAmount);
  const setDiscount = useCartStore((state) => state.setDiscount);
  const resetCart = useCartStore((state) => state.resetCart);
  const subtotal = useCartStore((state) => state.subtotal());
  const netTotal = useCartStore((state) => state.netTotal());

  const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);

  const applyPercentDiscount = (percent: number) => {
    const d = (subtotal * percent) / 100;
    setDiscount(Math.round(d));
  };

  return (
    <Card className="flex flex-col justify-between border-border bg-card shadow-sm rounded-2xl overflow-hidden">
      {/* Summary Header */}
      <CardHeader className="pb-3 border-b border-border/80 bg-muted/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <span>Bill Settlement Summary</span>
          </CardTitle>
          <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {items.length} item{items.length === 1 ? '' : 's'} ({totalUnits} unit{totalUnits === 1 ? '' : 's'})
          </span>
        </div>
      </CardHeader>

      <CardContent className="py-4 space-y-4">
        {/* Subtotal */}
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground font-medium">Subtotal Amount</span>
          <AmountDisplay amount={subtotal} size="md" className="font-semibold" />
        </div>

        {/* Discount Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <Percent className="h-3 w-3 text-muted-foreground" />
              <span>Bill Discount</span>
            </span>
            <div className="flex items-center gap-1 w-32">
              <span className="text-xs text-muted-foreground font-mono">Rs.</span>
              <Input
                type="number"
                min="0"
                max={subtotal}
                value={discountAmount || ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setDiscount(isNaN(val) ? 0 : val);
                }}
                className="h-8 text-right font-mono text-xs font-semibold"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Quick Discount Presets */}
          {subtotal > 0 && (
            <div className="flex items-center justify-end gap-1 text-[10px]">
              <span className="text-muted-foreground mr-1">Quick:</span>
              {[2, 5, 10].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => applyPercentDiscount(p)}
                  className="px-1.5 py-0.5 rounded bg-muted/80 hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground font-mono font-semibold"
                >
                  {p}%
                </button>
              ))}
              <button
                type="button"
                onClick={() => setDiscount(0)}
                className="px-1.5 py-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors font-mono"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Net Payable Highlight Card */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 border border-border/80 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs font-bold text-foreground tracking-tight uppercase">
              Net Payable Total
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Instant physical inventory deduction
            </div>
          </div>
          <div className="text-right">
            <AmountDisplay
              amount={netTotal}
              size="xl"
              className={cn(
                'font-black font-mono tracking-tight',
                items.length > 0 ? 'text-primary' : 'text-muted-foreground'
              )}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2 flex flex-col gap-2.5 border-t border-border/80 bg-muted/10 p-4">
        <Button
          type="button"
          onClick={onCheckout}
          disabled={items.length === 0}
          className={cn(
            'w-full h-12 text-sm font-extrabold rounded-xl transition-all shadow-md gap-2.5',
            items.length > 0
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25 active:scale-[0.99]'
              : 'opacity-50 cursor-not-allowed'
          )}
        >
          <CreditCard className="h-4 w-4" />
          <span className="flex-1 text-left">Charge & Settle Bill</span>
          <ArrowRight className="h-4 w-4" />
        </Button>

        {items.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetCart}
            className="w-full text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 font-medium"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            <span>Clear Current Invoice</span>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
