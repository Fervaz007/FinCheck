export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function formatCents(cents: number, currency = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(fromCents(cents));
}

export function percentage(part: number, whole: number): number {
  if (whole === 0) return 0;
  return (part / whole) * 100;
}

export function roundPercentage(part: number, whole: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(percentage(part, whole) * factor) / factor;
}
