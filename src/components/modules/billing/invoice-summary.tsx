import React from 'react';
import { useCartStore } from '@/stores/cart.store';
import { AmountDisplay } from '@/components/shared/amount-display';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { CreditCard, Trash2, ArrowRight } from 'lucide-react';

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

  return (
    <Card className="flex flex-col justify-between border-border/80 shadow-md bg-card">
      <CardHeader className="pb-3 border-b border-border/60">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Billing Summary</span>
          <span className="text-xs font-normal text-muted-foreground">
            {items.length} item{items.length === 1 ? '' : 's'} ({totalUnits} unit{totalUnits === 1 ? '' : 's'})
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="py-4 space-y-3.5">
        {/* Subtotal */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <AmountDisplay amount={subtotal} size="md" />
        </div>

        {/* Discount Input */}
        <div className="flex justify-between items-center text-sm gap-2">
          <span className="text-muted-foreground shrink-0">Discount</span>
          <div className="flex items-center gap-1.5 w-36">
            <span className="text-xs text-muted-foreground font-mono">Rs.</span>
            <Input
              type="number"
              min="0"
              max={subtotal}
              value={discountAmount}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setDiscount(isNaN(val) ? 0 : val);
              }}
              className="h-8 text-right font-mono text-xs"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="h-px bg-border/60 my-2" />

        {/* Net Total */}
        <div className="flex justify-between items-baseline pt-1">
          <div>
            <div className="text-sm font-bold text-foreground">Net Payable</div>
            <div className="text-[11px] text-muted-foreground">Final Bill Total</div>
          </div>
          <AmountDisplay amount={netTotal} size="xl" className="text-primary" />
        </div>
      </CardContent>

      <CardFooter className="pt-2 flex flex-col gap-2 border-t border-border/60">
        <Button
          type="button"
          onClick={onCheckout}
          disabled={items.length === 0}
          className="w-full h-11 text-base font-bold shadow-lg shadow-primary/20 gap-2"
        >
          <CreditCard className="h-5 w-5" />
          <span>Proceed to Pay (F1)</span>
          <ArrowRight className="h-4 w-4 ml-auto" />
        </Button>

        {items.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetCart}
            className="w-full text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Clear Bill / Reset Cart
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
