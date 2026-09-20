import React from 'react';
import { useStockAlerts } from '@/lib/queries/use-products';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertTriangle, PackageX, ArrowRight } from 'lucide-react';
import { Product } from '@/types/entities';

interface StockAlertsProps {
  onQuickImport?: (product: Product) => void;
}

export const StockAlerts: React.FC<StockAlertsProps> = ({ onQuickImport }) => {
  const { data: alertProducts = [], isLoading } = useStockAlerts();

  if (isLoading || alertProducts.length === 0) {
    return null;
  }

  const outOfStockCount = alertProducts.filter((p) => p.current_stock <= 0).length;
  const lowStockCount = alertProducts.length - outOfStockCount;

  return (
    <Card className="border-amber-300 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm">
      <CardHeader className="py-2.5 px-4 border-b border-amber-200 dark:border-amber-900/60">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>Inventory Stock Warnings</span>
            <span className="bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 text-[10px] px-1.5 py-0.5 rounded font-mono">
              {alertProducts.length} Items Require Action
            </span>
          </CardTitle>
          <div className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
            {outOfStockCount > 0 && <span className="text-destructive font-bold mr-2">{outOfStockCount} Out of Stock</span>}
            {lowStockCount > 0 && <span>{lowStockCount} Low Stock</span>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {alertProducts.map((p) => {
            const isZero = p.current_stock <= 0;
            return (
              <div
                key={p.id}
                className="flex items-center gap-2.5 p-2 rounded-md bg-white dark:bg-card border border-border/80 shrink-0 text-xs shadow-xs"
              >
                <div
                  className={`h-7 w-7 rounded flex items-center justify-center ${
                    isZero ? 'bg-destructive/10 text-destructive' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                  }`}
                >
                  <PackageX className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-foreground truncate max-w-[140px]">
                    {p.name}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5">
                    <span>{p.sku}</span>
                    <span className={isZero ? 'text-destructive font-bold' : 'text-amber-600 font-semibold'}>
                      Stock: {p.current_stock} / Min: {p.min_stock_alert}
                    </span>
                  </div>
                </div>
                {onQuickImport && (
                  <button
                    type="button"
                    onClick={() => onQuickImport(p)}
                    className="ml-1 text-primary hover:underline text-[11px] font-semibold flex items-center"
                    title="Record Inward Stock"
                  >
                    <span>Import</span>
                    <ArrowRight className="h-3 w-3 ml-0.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
