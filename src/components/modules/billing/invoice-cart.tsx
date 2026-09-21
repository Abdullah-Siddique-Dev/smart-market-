import React from 'react';
import { useCartStore } from '@/stores/cart.store';
import { useProducts } from '@/lib/queries/use-products';
import { ProductLineItem } from './product-line-item';
import { ShopSelector } from '@/components/shared/shop-selector';
import { BookerSelector } from '@/components/shared/booker-selector';
import { formatCurrency } from '@/lib/utils/currency';
import { ShoppingCart, Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export const InvoiceCart: React.FC = () => {
  const items = useCartStore((state) => state.items);
  const selectedShopId = useCartStore((state) => state.selectedShopId);
  const selectedBookerId = useCartStore((state) => state.selectedBookerId);
  const setShop = useCartStore((state) => state.setShop);
  const setBooker = useCartStore((state) => state.setBooker);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const updatePrice = useCartStore((state) => state.updatePrice);
  const removeItem = useCartStore((state) => state.removeItem);

  // Fetch quick catalog items for empty state click-to-add
  const { data: productsData } = useProducts({ limit: 8, is_active: 1 });
  const catalogItems = productsData?.data || [];

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Top Customer & Booker Bar */}
      <div className="p-4 border-b border-border bg-muted/15 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <span>Customer / Retail Shop</span>
            <span className="text-[10px] text-muted-foreground font-normal">(Khata Account)</span>
          </label>
          <ShopSelector
            value={selectedShopId}
            onChange={(shop) => setShop(shop ? shop.id : null)}
            allowWalkIn={true}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <span>Order Booker / Sales Rep</span>
            <span className="text-[10px] text-muted-foreground font-normal">(Commission Track)</span>
          </label>
          <BookerSelector
            value={selectedBookerId}
            onChange={(bookerId) => setBooker(bookerId)}
            allowNone={true}
          />
        </div>
      </div>

      {/* Cart Items or Quick Add Catalogue */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {items.length === 0 ? (
          <div className="p-6 flex flex-col items-center justify-center min-h-[380px] text-center">
            {/* Header banner */}
            <div className="max-w-md space-y-2 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-sm">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <h3 className="font-extrabold text-foreground text-base tracking-tight">
                Invoice Cart is Empty
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Search catalog by SKU or product name, or click any popular item below to start billing.
              </p>
            </div>

            {/* Quick-Pick Catalog Grid */}
            {catalogItems.length > 0 && (
              <div className="w-full max-w-2xl text-left border-t border-border/60 pt-5">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span>Quick-Add Popular Wholesale Products</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">Click to add 1 unit</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {catalogItems.map((product) => {
                    const isOutOfStock = product.current_stock <= 0;
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addItem(product, 1)}
                        disabled={isOutOfStock}
                        className={cn(
                          'p-3 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-sm text-left transition-all group flex flex-col justify-between h-24 relative overflow-hidden',
                          isOutOfStock && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1 rounded">
                              {product.sku}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              Stock: {product.current_stock}
                            </span>
                          </div>
                          <div className="font-semibold text-xs text-foreground truncate mt-1 group-hover:text-primary transition-colors">
                            {product.name}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/40">
                          <span className="font-bold text-xs text-foreground font-mono">
                            {formatCurrency(product.selling_price)}
                          </span>
                          <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="h-3 w-3" />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-muted/90 backdrop-blur-md text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border z-10">
              <tr>
                <th className="py-3 px-3.5 text-center w-12">#</th>
                <th className="py-3 px-3.5">Product & SKU</th>
                <th className="py-3 px-3.5 text-right w-32">Rate (Rs.)</th>
                <th className="py-3 px-3.5 text-center w-36">Quantity</th>
                <th className="py-3 px-3.5 text-right w-36">Total (Rs.)</th>
                <th className="py-3 px-3.5 text-center w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
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
