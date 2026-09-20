export function formatCurrency(
  amount: number | string | undefined | null,
  options?: { showSign?: boolean; currency?: string }
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(num)) return 'Rs. 0.00';

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(num));

  const prefix = options?.currency ?? 'Rs. ';
  const sign = num < 0 ? '-' : options?.showSign && num > 0 ? '+' : '';

  return `${sign}${prefix}${formatted}`;
}

export function formatNumber(value: number | string | undefined | null): string {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('en-US').format(num);
}
