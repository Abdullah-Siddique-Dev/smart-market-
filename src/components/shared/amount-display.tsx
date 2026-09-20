import React from 'react';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils/cn';

interface AmountDisplayProps {
  amount: number | string | undefined | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  colored?: boolean;
  className?: string;
  showSign?: boolean;
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amount,
  size = 'md',
  colored = false,
  className,
  showSign = false,
}) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  const isPositive = num > 0;
  const isNegative = num < 0;

  const sizeClasses = {
    sm: 'text-xs font-medium',
    md: 'text-sm font-semibold',
    lg: 'text-lg font-bold',
    xl: 'text-2xl font-black tracking-tight',
  };

  const colorClass = colored
    ? isPositive
      ? 'text-emerald-600 dark:text-emerald-400'
      : isNegative
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-muted-foreground'
    : 'text-foreground';

  return (
    <span className={cn('tabular-nums font-mono', sizeClasses[size], colorClass, className)}>
      {formatCurrency(num, { showSign })}
    </span>
  );
};
