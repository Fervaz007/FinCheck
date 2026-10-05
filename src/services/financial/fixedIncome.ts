import type { RecurrenceConfig } from '@/services/recurring/recurrenceTypes';

/**
 * How many times a recurrence fires in a month, used to normalize each
 * recurring income stream to a monthly figure. Weekly/daily use calendar
 * approximations (a month ≈ 52/12 weeks ≈ 30 days) — this is a planning
 * figure, not an accrual ledger, so the approximation is fine.
 */
export function occurrencesPerMonth(config: RecurrenceConfig): number {
  switch (config.type) {
    case 'SEMIMONTHLY_FIXED':
      return 2;
    case 'WEEKLY':
      return 52 / 12;
    case 'MONTHLY_DAY':
    case 'MONTHLY_LAST_DAY':
      return 1;
    case 'MONTHLY_INTERVAL':
      return 1 / config.every;
    case 'DAILY_INTERVAL':
      return 30 / config.intervalDays;
    case 'ANNUAL':
      return 1 / 12;
  }
}

export interface RecurringIncomeLike {
  amountCents: number;
  recurrenceConfig: RecurrenceConfig;
}

/** Stable monthly income from fixed/secure recurring streams — the base for budget limits and health. */
export function computeFixedMonthlyIncomeCents(incomes: RecurringIncomeLike[]): number {
  const total = incomes.reduce(
    (sum, i) => sum + i.amountCents * occurrencesPerMonth(i.recurrenceConfig),
    0,
  );
  return Math.round(total);
}
