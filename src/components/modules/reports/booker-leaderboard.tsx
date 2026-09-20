import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AmountDisplay } from '@/components/shared/amount-display';
import { Users, TrendingUp } from 'lucide-react';

interface BookerPerformanceItem {
  booker_id: number;
  booker_name: string;
  territory: string | null;
  total_orders_assigned: number;
  orders_collected: number;
  orders_pending: number;
  total_sales: number;
  total_cash_collected: number;
}

interface BookerLeaderboardProps {
  bookers: BookerPerformanceItem[];
  isLoading?: boolean;
}

export const BookerLeaderboard: React.FC<BookerLeaderboardProps> = ({ bookers, isLoading }) => {
  const sorted = [...bookers].sort((a, b) => b.total_sales - a.total_sales);

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="py-3 px-4 border-b border-border/60">
        <CardTitle className="text-xs font-bold text-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span>Booker Field Sales Leaderboard</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
            Loading bookers...
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No booker activity recorded.
          </div>
        ) : (
          <div className="divide-y divide-border/40 text-xs">
            {sorted.map((b, idx) => (
              <div key={b.booker_id} className="flex items-center justify-between p-3 hover:bg-muted/30">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-xs font-bold w-5 text-center text-muted-foreground">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground truncate">{b.booker_name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {b.territory || 'Direct Territory'} • {b.orders_collected} / {b.total_orders_assigned} Orders
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <AmountDisplay amount={b.total_sales} size="sm" className="font-bold font-mono" />
                  <div className="text-[10px] text-emerald-600 font-mono">
                    Cash: <AmountDisplay amount={b.total_cash_collected} size="sm" className="text-emerald-600" />
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
