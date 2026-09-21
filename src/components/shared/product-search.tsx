import React, { useState, useEffect, useRef } from 'react';
import { useProductSearch } from '@/lib/queries/use-products';
import { Product } from '@/types/entities';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils/currency';
import { Search, Package, AlertCircle, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ProductSearchProps {
  onSelect: (product: Product) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  onSelect,
  placeholder = 'Search catalog by SKU or product name...',
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
        <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
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
          className="pl-10 pr-4 h-11 text-sm font-medium bg-background border-border shadow-xs focus:ring-2 focus:ring-primary/20 rounded-xl"
        />
      </div>

      {isOpen && query.trim().length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 left-0 right-0 mt-1.5 max-h-80 overflow-y-auto rounded-xl border border-border bg-card text-card-foreground shadow-2xl animate-in fade-in-50 duration-150"
        >
          {isLoading ? (
            <div className="p-4 text-center text-xs text-muted-foreground">Searching catalog...</div>
          ) : products.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No matching products found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="divide-y divide-border/60 p-1">
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
                      'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors text-xs',
                      isSelected ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted/50 text-foreground',
                      isOutOfStock && 'opacity-50'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            {p.sku}
                          </span>
                          <span className="font-bold truncate text-sm">{p.name}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5 font-mono">
                          <span>Unit: {p.unit}</span>
                          <span>•</span>
                          <span className={cn(isOutOfStock ? 'text-destructive font-bold' : isLowStock ? 'text-amber-500 font-bold' : 'text-emerald-600')}>
                            Stock: {p.current_stock}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-extrabold text-sm font-mono text-foreground">
                        {formatCurrency(p.selling_price)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Wholesale Rate</div>
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
