/**
 * Parses a 'YYYY-MM-DD' string as a LOCAL calendar date.
 * `new Date('YYYY-MM-DD')` parses as UTC midnight, which silently shifts to
 * the previous day in any negative-UTC-offset timezone. Never use it for
 * stored occurrence/anchor dates — use this instead.
 */
export function parseISODate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}
