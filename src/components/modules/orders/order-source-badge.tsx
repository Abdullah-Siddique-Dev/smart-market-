import React from 'react';
import { OrderSource } from '@/types/enums';
import { MessageSquare, UserCheck, PhoneCall, Store } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface OrderSourceBadgeProps {
  source?: OrderSource | string;
  className?: string;
  showIcon?: boolean;
}

export const OrderSourceBadge: React.FC<OrderSourceBadgeProps> = ({
  source = 'MANUAL_WHATSAPP',
  className,
  showIcon = true,
}) => {
  switch (source) {
    case 'MANUAL_WHATSAPP':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase',
            'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
            className
          )}
          title="Received via WhatsApp message or voice note"
        >
          {showIcon && <MessageSquare className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />}
          <span>WhatsApp</span>
        </span>
      );

    case 'MANUAL_IN_PERSON':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase',
            'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20',
            className
          )}
          title="Reported verbally in person by field booker"
        >
          {showIcon && <UserCheck className="h-3 w-3 shrink-0 text-blue-600 dark:text-blue-400" />}
          <span>Booker Visit</span>
        </span>
      );

    case 'DIRECT_PHONE':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase',
            'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20',
            className
          )}
          title="Order placed directly by shopkeeper over phone call"
        >
          {showIcon && <PhoneCall className="h-3 w-3 shrink-0 text-indigo-600 dark:text-indigo-400" />}
          <span>Phone Call</span>
        </span>
      );

    case 'DIRECT_WALKIN':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase',
            'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20',
            className
          )}
          title="Direct walk-in shopkeeper at wholesale counter"
        >
          {showIcon && <Store className="h-3 w-3 shrink-0 text-purple-600 dark:text-purple-400" />}
          <span>Walk-In</span>
        </span>
      );

    default:
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
            'bg-muted text-muted-foreground border border-border',
            className
          )}
        >
          <span>{source}</span>
        </span>
      );
  }
};
