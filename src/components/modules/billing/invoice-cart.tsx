import React from 'react';
import { useCartStore } from '@/stores/cart.store';
import { ProductLineItem } from './product-line-item';
import { ShopSelector } from '@/components/shared/shop-selector';
import { BookerSelector } from '@/components/shared/booker-selector';
import { ShoppingCart } from 'lucide-react';

export const InvoiceCart: React.FC = () => {
  const items = useCartStore((state) => state.items);
  const selectedShopId = useCartStore((state) => state.selectedShopId);
  const selectedBookerId = useCartStore((state) => state.selectedBookerId);
  const setShop = useCartStore((state) => state.setShop);
  const setBooker = useCartStore((state) => state.setBooker);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const updatePrice = useCartStore((state) => state.updatePrice);
  const removeItem = useCartStore((state) => state.removeItem);

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border/80 shadow-sm overflow-hidden">
      {/* Top Customer & Booker Bar */}
      <div className="p-3.5 border-b border-border/60 bg-muted/20 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">
            Customer / Retail Shop
          </label>
          <ShopSelector
            value={selectedShopId}
            onChange={(shop) => setShop(shop ? shop.id : null)}
            allowWalkIn={true}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">
            Sales Representative / Booker
          </label>
          <BookerSelector
            value={selectedBookerId}
            onChange={(bookerId) => setBooker(bookerId)}
            allowNone={true}
          />
        </div>
      </div>

      {/* Cart Items Table */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-3">
              <ShoppingCart className="h-6 w-6 opacity-60" />
            </div>
            <h3 className="font-semibold text-foreground text-sm">Invoice Cart is Empty</h3>
            <p className="text-xs max-w-sm mt-1">
              Search and add products using the search bar above or scan a product barcode with your scanner.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/60 z-10">
              <tr>
                <th className="py-2.5 px-3 text-center w-10">#</th>
                <th className="py-2.5 px-3">Product / SKU</th>
                <th className="py-2.5 px-3 text-right w-32">Rate (Rs.)</th>
                <th className="py-2.5 px-3 text-center w-36">Quantity</th>
                <th className="py-2.5 px-3 text-right w-32">Total (Rs.)</th>
                <th className="py-2.5 px-3 text-center w-12">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {items.map((item, index) => (
                <ProductLineItem
                  key={item.product.id}
                  item={item}
                  index={index}
                  onUpdateQuantity={updateQuantity}
                  onUpdatePrice={updatePrice}
                  onRemove={removeItem}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
