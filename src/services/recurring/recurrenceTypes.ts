export type RecurrenceType =
  | 'DAILY_INTERVAL'
  | 'WEEKLY'
  | 'MONTHLY_DAY'
  | 'MONTHLY_LAST_DAY'
  | 'SEMIMONTHLY_FIXED'
  | 'MONTHLY_INTERVAL'
  | 'ANNUAL';

export type DailyIntervalConfig = { intervalDays: number };
export type WeeklyConfig = { weekday: number }; // 0=Sunday..6=Saturday
export type MonthlyDayConfig = { day: number }; // 1-31, clamped to last day if out of range
export type MonthlyLastDayConfig = Record<string, never>;
export type SemimonthlyFixedConfig = { dayA: number; dayB: 'last' | number };
export type MonthlyIntervalConfig = { every: number; day: number };
export type AnnualConfig = { month: number; day: number }; // month 1-12

export type RecurrenceConfig =
  | ({ type: 'DAILY_INTERVAL' } & DailyIntervalConfig)
  | ({ type: 'WEEKLY' } & WeeklyConfig)
  | ({ type: 'MONTHLY_DAY' } & MonthlyDayConfig)
  | ({ type: 'MONTHLY_LAST_DAY' } & MonthlyLastDayConfig)
  | ({ type: 'SEMIMONTHLY_FIXED' } & SemimonthlyFixedConfig)
  | ({ type: 'MONTHLY_INTERVAL' } & MonthlyIntervalConfig)
  | ({ type: 'ANNUAL' } & AnnualConfig);
