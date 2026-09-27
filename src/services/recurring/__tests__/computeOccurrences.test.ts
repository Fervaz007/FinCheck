import { computeOccurrences } from '../computeOccurrences';
import type { RecurrenceConfig } from '../recurrenceTypes';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);
const iso = (dates: Date[]) =>
  dates.map((x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`);

describe('computeOccurrences', () => {
  it('SEMIMONTHLY_FIXED matches the payroll worked example (15 and last day)', () => {
    const config: RecurrenceConfig = { type: 'SEMIMONTHLY_FIXED', dayA: 15, dayB: 'last' };
    const anchor = d(2026, 8, 1);
    const occurrences = computeOccurrences(config, anchor, d(2026, 9, 2), d(2026, 10, 1));
    expect(iso(occurrences)).toEqual(['2026-09-15', '2026-09-30']);
  });

  it('SEMIMONTHLY_FIXED is NOT the same as a rolling 15-day interval', () => {
    const anchor = d(2026, 9, 1);
    const semimonthly = computeOccurrences(
      { type: 'SEMIMONTHLY_FIXED', dayA: 15, dayB: 'last' },
      anchor,
      d(2026, 9, 1),
      d(2026, 10, 31),
    );
    const rollingInterval = computeOccurrences(
      { type: 'DAILY_INTERVAL', intervalDays: 15 },
      anchor,
      d(2026, 9, 2),
      d(2026, 10, 31),
    );
    expect(iso(semimonthly)).toEqual(['2026-09-15', '2026-09-30', '2026-10-15', '2026-10-31']);
    expect(iso(rollingInterval)).toEqual(['2026-09-16', '2026-10-01', '2026-10-16', '2026-10-31']);
    expect(iso(semimonthly)).not.toEqual(iso(rollingInterval));
  });

  it('MONTHLY_DAY clamps day 31 to the last day of a 30-day month', () => {
    const config: RecurrenceConfig = { type: 'MONTHLY_DAY', day: 31 };
    const occurrences = computeOccurrences(config, d(2026, 1, 1), d(2026, 4, 1), d(2026, 4, 30));
    expect(iso(occurrences)).toEqual(['2026-04-30']);
  });

  it('MONTHLY_DAY clamps day 30 to Feb 28 in a non-leap year', () => {
    const config: RecurrenceConfig = { type: 'MONTHLY_DAY', day: 30 };
    const occurrences = computeOccurrences(config, d(2025, 1, 1), d(2025, 2, 1), d(2025, 2, 28));
    expect(iso(occurrences)).toEqual(['2025-02-28']);
  });

  it('MONTHLY_DAY clamps day 30 to Feb 29 in a leap year', () => {
    const config: RecurrenceConfig = { type: 'MONTHLY_DAY', day: 30 };
    const occurrences = computeOccurrences(config, d(2024, 1, 1), d(2024, 2, 1), d(2024, 2, 29));
    expect(iso(occurrences)).toEqual(['2024-02-29']);
  });

  it('WEEKLY generates the configured weekday every week', () => {
    const config: RecurrenceConfig = { type: 'WEEKLY', weekday: 1 }; // Monday
    const occurrences = computeOccurrences(config, d(2026, 9, 1), d(2026, 9, 1), d(2026, 9, 30));
    expect(iso(occurrences)).toEqual(['2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28']);
  });

  it('MONTHLY_INTERVAL fires only every N months', () => {
    const config: RecurrenceConfig = { type: 'MONTHLY_INTERVAL', every: 2, day: 10 };
    const occurrences = computeOccurrences(config, d(2026, 1, 10), d(2026, 1, 1), d(2026, 6, 30));
    expect(iso(occurrences)).toEqual(['2026-01-10', '2026-03-10', '2026-05-10']);
  });

  it('ANNUAL fires once a year on the configured month/day', () => {
    const config: RecurrenceConfig = { type: 'ANNUAL', month: 12, day: 25 };
    const occurrences = computeOccurrences(config, d(2025, 12, 25), d(2025, 1, 1), d(2027, 12, 31));
    expect(iso(occurrences)).toEqual(['2025-12-25', '2026-12-25', '2027-12-25']);
  });

  it('never returns an occurrence before the anchor date', () => {
    const config: RecurrenceConfig = { type: 'MONTHLY_DAY', day: 5 };
    const occurrences = computeOccurrences(config, d(2026, 9, 10), d(2026, 9, 1), d(2026, 10, 31));
    expect(iso(occurrences)).toEqual(['2026-10-05']);
  });
});
