import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

interface StockBadgeProps {
  currentStock: number;
  minStockAlert: number;
  className?: string;
}

export const StockBadge: React.FC<StockBadgeProps> = ({
  currentStock,
  minStockAlert,
  className,
}) => {
  if (currentStock <= 0) {
    return (
      <Badge variant="destructive" className={cn('text-[11px] font-semibold', className)}>
        Out of Stock (0)
      </Badge>
    );
  }

  if (currentStock <= minStockAlert) {
    return (
      <Badge variant="warning" className={cn('text-[11px] font-semibold', className)}>
        Low Stock ({currentStock})
      </Badge>
    );
  }

  return (
    <Badge variant="success" className={cn('text-[11px] font-semibold', className)}>
      {currentStock} in stock
    </Badge>
  );
};
