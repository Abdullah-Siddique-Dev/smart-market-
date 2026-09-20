import React from 'react';
import { CartItem } from '@/stores/cart.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AmountDisplay } from '@/components/shared/amount-display';
import { Trash2, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ProductLineItemProps {
  item: CartItem;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onUpdatePrice: (productId: number, price: number) => void;
  onRemove: (productId: number) => void;
  index: number;
}

export const ProductLineItem: React.FC<ProductLineItemProps> = ({
  item,
  onUpdateQuantity,
  onUpdatePrice,
  onRemove,
  index,
}) => {
  const { product, quantity, unit_selling_price, line_total } = item;
  const isMaxStock = quantity >= product.current_stock;

  return (
    <tr className="border-b border-border hover:bg-muted/40 transition-colors text-xs font-sans">
      {/* Index */}
      <td className="py-3 px-3.5 font-mono text-xs text-muted-foreground w-12 text-center">
        {index + 1}
      </td>

      {/* Product Details */}
      <td className="py-3 px-3.5 min-w-[220px]">
        <div className="font-bold text-foreground text-sm leading-tight">{product.name}</div>
        <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-1 font-mono">
          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">
            {product.sku}
          </span>
          <span>• Unit: {product.unit}</span>
          <span className={cn(isMaxStock ? 'text-destructive font-semibold' : 'text-emerald-600 font-medium')}>
            • Stock: {product.current_stock}
          </span>
        </div>
      </td>

      {/* Unit Selling Price */}
      <td className="py-3 px-3.5 w-32">
        <div className="relative flex items-center">
          <Input
            type="number"
            min="0"
            step="0.5"
            value={unit_selling_price}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) onUpdatePrice(product.id, val);
            }}
            className="h-8 text-right font-mono text-xs pr-2 font-bold bg-background border-border"
          />
        </div>
      </td>

      {/* Quantity Adjustment Stepper */}
      <td className="py-3 px-3.5 w-36">
        <div className="flex items-center justify-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg shrink-0 border-border bg-background hover:bg-muted"
            disabled={quantity <= 1}
            onClick={() => onUpdateQuantity(product.id, quantity - 1)}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <Input
            type="number"
            min="1"
            max={product.current_stock}
            value={quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val)) onUpdateQuantity(product.id, val);
            }}
            className="h-8 w-14 text-center font-mono text-xs font-black bg-background border-border"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg shrink-0 border-border bg-background hover:bg-muted"
            disabled={quantity >= product.current_stock}
            onClick={() => onUpdateQuantity(product.id, quantity + 1)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>

      {/* Line Total */}
      <td className="py-3 px-3.5 text-right font-mono font-black text-foreground text-sm w-36">
        <AmountDisplay amount={line_total} size="md" />
      </td>

      {/* Actions */}
      <td className="py-3 px-3.5 w-12 text-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          onClick={() => onRemove(product.id)}
          title="Remove line"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
};
