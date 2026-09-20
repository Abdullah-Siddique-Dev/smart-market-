import React from 'react';
import { cn } from '@/lib/utils/cn';

export type PeriodType = 'today' | 'yesterday' | 'week' | 'month' | 'custom' | 'all';

interface PeriodTabsProps {
  value: PeriodType;
  onChange: (period: PeriodType) => void;
  className?: string;
  showAll?: boolean;
}

export const PeriodTabs: React.FC<PeriodTabsProps> = ({
  value,
  onChange,
  className,
  showAll = false,
}) => {
  const tabs: { id: PeriodType; label: string }[] = [
    ...(showAll ? [{ id: 'all' as PeriodType, label: 'All Time' }] : []),
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
            value === tab.id
              ? 'bg-background text-foreground shadow-sm font-semibold'
              : 'hover:text-foreground'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
