import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const upper = (status || '').toUpperCase();

  let variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' = 'secondary';
  let label = status;

  switch (upper) {
    // Orders
    case 'PENDING':
      variant = 'warning';
      label = 'Pending';
      break;
    case 'DISPATCHED':
      variant = 'default';
      label = 'Dispatched';
      break;
    case 'DELIVERED':
    case 'COMPLETED':
    case 'PAID':
      variant = 'success';
      label = upper === 'PAID' ? 'Paid' : upper === 'COMPLETED' ? 'Completed' : 'Delivered';
      break;
    case 'CANCELLED':
    case 'VOID':
      variant = 'destructive';
      label = 'Cancelled';
      break;

    // Payment / Billing
    case 'CASH':
      variant = 'success';
      label = 'Cash';
      break;
    case 'CREDIT':
      variant = 'warning';
      label = 'Credit / Khata';
      break;
    case 'PARTIAL':
      variant = 'secondary';
      label = 'Partial';
      break;

    // Dispatch slips
    case 'GENERATED':
      variant = 'default';
      label = 'Generated';
      break;
    case 'RETURN_PROCESSED':
      variant = 'success';
      label = 'Returned / Settled';
      break;

    // Inventory
    case 'IN_STOCK':
      variant = 'success';
      label = 'In Stock';
      break;
    case 'LOW_STOCK':
      variant = 'warning';
      label = 'Low Stock';
      break;
    case 'OUT_OF_STOCK':
      variant = 'destructive';
      label = 'Out of Stock';
      break;

    default:
      variant = 'secondary';
      label = status;
  }

  return (
    <Badge variant={variant} className={cn('capitalize text-[11px] font-semibold tracking-wide', className)}>
      {label}
    </Badge>
  );
};
