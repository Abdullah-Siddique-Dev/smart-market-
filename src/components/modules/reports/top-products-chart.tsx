import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AmountDisplay } from '@/components/shared/amount-display';
import { Award, Package } from 'lucide-react';

interface TopProductItem {
  id: number;
  sku: string;
  product_name: string;
  unit: string;
  total_units_sold: number;
  total_revenue: number;
  total_profit: number;
}

interface TopProductsChartProps {
  products: TopProductItem[];
  isLoading?: boolean;
}

export const TopProductsChart: React.FC<TopProductsChartProps> = ({ products, isLoading }) => {
  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="py-3 px-4 border-b border-border/60">
        <CardTitle className="text-xs font-bold text-foreground flex items-center gap-2">
          <Award className="h-4 w-4 text-amber-500" />
          <span>Top Revenue & Profit Generators</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
            Loading top items...
          </div>
        ) : products.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No sales recorded in this period.
          </div>
        ) : (
          <div className="divide-y divide-border/40 text-xs">
            {products.slice(0, 5).map((p, idx) => (
              <div key={p.id} className="flex items-center justify-between p-3 hover:bg-muted/30">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-xs font-bold w-5 text-center text-muted-foreground">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground truncate">{p.product_name}</div>
                    <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5">
                      <span className="text-primary font-bold">{p.sku}</span>
                      <span>• {p.total_units_sold} {p.unit} sold</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <AmountDisplay amount={p.total_revenue} size="sm" className="font-bold font-mono" />
                  <div className="text-[10px] text-emerald-600 font-mono font-medium">
                    +Profit: <AmountDisplay amount={p.total_profit} size="sm" className="text-emerald-600 font-bold" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
