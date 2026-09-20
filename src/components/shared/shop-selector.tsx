import React, { useState, useRef, useEffect } from 'react';
import { useShops } from '@/lib/queries/use-shops';
import { RetailShop } from '@/types/entities';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils/currency';
import { Store, ChevronDown, Check, User, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ShopSelectorProps {
  value?: number | null;
  onChange: (shop: RetailShop | null) => void;
  allowWalkIn?: boolean;
  placeholder?: string;
  className?: string;
}

export const ShopSelector: React.FC<ShopSelectorProps> = ({
  value,
  onChange,
  allowWalkIn = true,
  placeholder = 'Select Retail Shop / Walk-in...',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: shopsResponse, isLoading } = useShops({ limit: 100, search: searchTerm });
  const shops = shopsResponse?.data || [];

  const selectedShop = shops.find((s) => s.id === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (shop: RetailShop | null) => {
    onChange(shop);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-primary/40 text-left'
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <Store className="h-4 w-4 text-muted-foreground shrink-0" />
          {selectedShop ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-foreground truncate">{selectedShop.shop_name}</span>
              {selectedShop.owner_name && (
                <span className="text-xs text-muted-foreground">({selectedShop.owner_name})</span>
              )}
              {selectedShop.outstanding_balance > 0 && (
                <span className="text-xs font-mono font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  Khata: {formatCurrency(selectedShop.outstanding_balance)}
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground font-normal">
              {allowWalkIn && value === null ? 'Walk-in Customer (Cash)' : placeholder}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {selectedShop && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(null);
              }}
              className="p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground opacity-60" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-80 overflow-y-auto rounded-lg border bg-popover text-popover-foreground shadow-xl animate-in fade-in-50">
          <div className="p-2 sticky top-0 bg-popover border-b z-10">
            <Input
              type="text"
              placeholder="Filter by shop, owner, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 text-xs"
              autoFocus
            />
          </div>

          <div className="py-1">
            {allowWalkIn && (
              <div
                onClick={() => handleSelect(null)}
                className={cn(
                  'flex items-center justify-between px-3 py-2 cursor-pointer transition-colors text-sm hover:bg-muted/50 border-b border-border/40',
                  value === null && 'bg-accent/40 font-semibold'
                )}
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Walk-in Customer</div>
                    <div className="text-xs text-muted-foreground">Immediate cash settlement, no credit account</div>
                  </div>
                </div>
                {value === null && <Check className="h-4 w-4 text-primary" />}
              </div>
            )}

            {isLoading ? (
              <div className="p-4 text-center text-xs text-muted-foreground">Loading shops...</div>
            ) : shops.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">No shops found</div>
            ) : (
              shops.map((shop) => {
                const isSelected = shop.id === value;
                const isOverLimit = shop.credit_limit > 0 && shop.outstanding_balance >= shop.credit_limit;

                return (
                  <div
                    key={shop.id}
                    onClick={() => handleSelect(shop)}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 cursor-pointer transition-colors text-sm hover:bg-muted/50',
                      isSelected && 'bg-accent/50'
                    )}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground truncate">{shop.shop_name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        {shop.owner_name && <span>{shop.owner_name}</span>}
                        {shop.phone && <span>• {shop.phone}</span>}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-medium">
                        Balance:{' '}
                        <span className={cn(shop.outstanding_balance > 0 ? 'text-amber-600 font-bold' : 'text-muted-foreground')}>
                          {formatCurrency(shop.outstanding_balance)}
                        </span>
                      </div>
                      {isOverLimit && (
                        <div className="text-[11px] text-destructive flex items-center justify-end gap-1 font-semibold">
                          <AlertTriangle className="h-3 w-3" /> Credit Limit Exceeded
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
