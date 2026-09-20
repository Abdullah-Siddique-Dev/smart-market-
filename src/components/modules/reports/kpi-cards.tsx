import React from 'react';
import { ProfitReport } from '@/types/entities';
import { Card, CardContent } from '@/components/ui/card';
import { AmountDisplay } from '@/components/shared/amount-display';
import { TrendingUp, DollarSign, Percent, Tag, ShoppingCart } from 'lucide-react';

interface KpiCardsProps {
  data?: ProfitReport;
  isLoading?: boolean;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ data, isLoading }) => {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted/40 animate-pulse border border-border/60" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Gross Revenue',
      value: data.total_sales,
      isAmount: true,
      subtitle: `${data.orders_completed} bills settled`,
      icon: DollarSign,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Net Profit (COGS)',
      value: data.net_profit,
      isAmount: true,
      subtitle: 'Realized wholesale profit',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      title: 'Profit Margin',
      value: `${data.profit_margin_percent.toFixed(1)}%`,
      isAmount: false,
      subtitle: 'Based on actual landed cost',
      icon: Percent,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
    },
    {
      title: 'Discounts Granted',
      value: data.total_discounts,
      isAmount: true,
      subtitle: 'POS concessions given',
      icon: Tag,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
    },
    {
      title: 'Order Pipeline',
      value: `${data.orders_completed} / ${data.orders_completed + data.orders_pending}`,
      isAmount: false,
      subtitle: `${data.orders_pending} pending dispatch`,
      icon: ShoppingCart,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950/40',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card key={idx} className="border-border/80 shadow-xs">
            <CardContent className="p-3.5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {card.title}
                </span>
                <div className="text-xl font-black tracking-tight text-foreground font-mono">
                  {card.isAmount ? (
                    <AmountDisplay amount={card.value as number} size="lg" />
                  ) : (
                    card.value
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground">{card.subtitle}</div>
              </div>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${card.bg} ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
