import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/utils/currency';

interface TimelineItem {
  date_label: string;
  bill_count: number;
  total_sales: number;
  total_cash_collected: number;
}

interface SalesProfitChartProps {
  timeline: TimelineItem[];
  isLoading?: boolean;
}

export const SalesProfitChart: React.FC<SalesProfitChartProps> = ({ timeline, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="h-72 flex items-center justify-center border-border/80">
        <div className="text-xs text-muted-foreground animate-pulse">Loading trend charts...</div>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="py-3 px-4 border-b border-border/60">
        <CardTitle className="text-xs font-bold text-foreground">
          Daily Sales & Cash Collection Trend
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-6">
        {timeline.length === 0 ? (
          <div className="h-60 flex items-center justify-center text-xs text-muted-foreground">
            No sales activity recorded for selected date range.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date_label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `Rs.${v}`} />
                <Tooltip
                  formatter={(val: number) => [formatCurrency(val), '']}
                  labelStyle={{ fontSize: 12, fontWeight: 'bold' }}
                  contentStyle={{
                    backgroundColor: 'rgba(23, 23, 23, 0.95)',
                    borderRadius: '8px',
                    border: '1px solid #333',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar
                  dataKey="total_sales"
                  name="Total Invoiced (Rs.)"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="total_cash_collected"
                  name="Cash Collected (Rs.)"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
