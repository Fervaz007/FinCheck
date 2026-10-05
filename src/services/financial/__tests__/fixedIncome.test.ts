import { computeFixedMonthlyIncomeCents, occurrencesPerMonth } from '../fixedIncome';

describe('occurrencesPerMonth', () => {
  it('quincenal (SEMIMONTHLY_FIXED) fires twice a month', () => {
    expect(occurrencesPerMonth({ type: 'SEMIMONTHLY_FIXED', dayA: 15, dayB: 'last' })).toBe(2);
  });

  it('semanal (WEEKLY) uses 52/12', () => {
    expect(occurrencesPerMonth({ type: 'WEEKLY', weekday: 1 })).toBeCloseTo(52 / 12, 10);
  });

  it('mensual día fijo (MONTHLY_DAY) fires once', () => {
    expect(occurrencesPerMonth({ type: 'MONTHLY_DAY', day: 5 })).toBe(1);
  });

  it('mensual último día (MONTHLY_LAST_DAY) fires once', () => {
    expect(occurrencesPerMonth({ type: 'MONTHLY_LAST_DAY' })).toBe(1);
  });

  it('cada N meses (MONTHLY_INTERVAL) is 1/every', () => {
    expect(occurrencesPerMonth({ type: 'MONTHLY_INTERVAL', every: 2, day: 1 })).toBe(0.5);
  });

  it('cada N días (DAILY_INTERVAL) is 30/intervalDays', () => {
    expect(occurrencesPerMonth({ type: 'DAILY_INTERVAL', intervalDays: 15 })).toBe(2);
  });

  it('anual (ANNUAL) is 1/12', () => {
    expect(occurrencesPerMonth({ type: 'ANNUAL', month: 1, day: 1 })).toBeCloseTo(1 / 12, 10);
  });
});

describe('computeFixedMonthlyIncomeCents', () => {
  it('sums recurring income normalized to a month (quincenal + semanal + mensual)', () => {
    const total = computeFixedMonthlyIncomeCents([
      { amountCents: 300_000, recurrenceConfig: { type: 'SEMIMONTHLY_FIXED', dayA: 15, dayB: 'last' } },
      { amountCents: 50_000, recurrenceConfig: { type: 'WEEKLY', weekday: 1 } },
      { amountCents: 200_000, recurrenceConfig: { type: 'MONTHLY_DAY', day: 1 } },
    ]);
    // 600_000 + 50_000×(52/12)=216_666.67 + 200_000 = 1_016_666.67 → round 1_016_667
    expect(total).toBe(1_016_667);
  });

  it('is zero with no recurring income', () => {
    expect(computeFixedMonthlyIncomeCents([])).toBe(0);
  });

  it('depends only on the recurring income list, not on any spending or balance', () => {
    const incomes = [
      { amountCents: 500_000, recurrenceConfig: { type: 'SEMIMONTHLY_FIXED' as const, dayA: 15, dayB: 'last' as const } },
    ];
    // Same input → same result; there is no balance/expense input that could lower it.
    expect(computeFixedMonthlyIncomeCents(incomes)).toBe(1_000_000);
  });
});
