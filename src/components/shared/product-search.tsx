import React, { useState, useEffect, useRef } from 'react';
import { useProductSearch } from '@/lib/queries/use-products';
import { Product } from '@/types/entities';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils/currency';
import { Search, Package, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ProductSearchProps {
  onSelect: (product: Product) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  onSelect,
  placeholder = 'Search product by SKU, name, or scan barcode (F2)...',
  autoFocus = false,
  className,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: products = [], isLoading } = useProductSearch(query);

  useEffect(() => {
    setSelectedIndex(0);
  }, [products]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || products.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < products.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (products[selectedIndex]) {
        handleSelect(products[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (product: Product) => {
    onSelect(product);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className={cn('relative w-full', className)}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="pl-9 pr-4 h-10 text-sm font-medium bg-background border-border/80 shadow-sm focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {isOpen && query.trim().length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 left-0 right-0 mt-1 max-h-80 overflow-y-auto rounded-lg border bg-popover text-popover-foreground shadow-xl animate-in fade-in-50"
        >
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Searching products...</div>
          ) : products.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No matching products found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="divide-y divide-border/40 py-1">
              {products.map((p, idx) => {
                const isSelected = idx === selectedIndex;
                const isOutOfStock = p.current_stock <= 0;
                const isLowStock = p.current_stock > 0 && p.current_stock <= p.min_stock_alert;

                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelect(p)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 cursor-pointer transition-colors text-sm',
                      isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50',
                      isOutOfStock && 'opacity-60'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            {p.sku}
                          </span>
                          <span className="font-semibold truncate">{p.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span>Unit: {p.unit}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right shrink-0">
                      <div>
                        <div className="font-bold text-foreground">
                          {formatCurrency(p.selling_price)}
                        </div>
                        <div className="text-xs flex items-center justify-end gap-1">
                          {isOutOfStock ? (
                            <span className="text-destructive font-medium flex items-center gap-0.5">
                              <AlertCircle className="h-3 w-3" /> 0 left
                            </span>
                          ) : isLowStock ? (
                            <span className="text-amber-500 font-medium">
                              {p.current_stock} left (Low)
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-medium">
                              {p.current_stock} in stock
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
