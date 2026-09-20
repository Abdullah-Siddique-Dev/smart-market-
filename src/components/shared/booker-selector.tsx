import React from 'react';
import { useBookers } from '@/lib/queries/use-bookers';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils/cn';

interface BookerSelectorProps {
  value?: number | null;
  onChange: (bookerId: number | null) => void;
  placeholder?: string;
  allowNone?: boolean;
  noneLabel?: string;
  className?: string;
  disabled?: boolean;
}

export const BookerSelector: React.FC<BookerSelectorProps> = ({
  value,
  onChange,
  placeholder = 'Select Order Booker...',
  allowNone = true,
  noneLabel = 'Direct Sale / No Booker',
  className,
  disabled = false,
}) => {
  const { data: bookersResponse, isLoading } = useBookers({ limit: 100 });
  const bookers = bookersResponse?.data || [];

  return (
    <Select
      value={value ? String(value) : ''}
      onChange={(e) => {
        const val = e.target.value;
        onChange(val ? Number(val) : null);
      }}
      disabled={disabled || isLoading}
      className={cn('text-sm h-10', className)}
    >
      {allowNone ? (
        <option value="">{noneLabel}</option>
      ) : (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {bookers.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name} {b.territory ? `(${b.territory})` : ''} [Commission: {b.commission_rate}%]
        </option>
      ))}
    </Select>
  );
};
