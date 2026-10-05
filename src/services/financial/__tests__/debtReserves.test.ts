import { computeReserveAccrualCents, debtMonthlyObligationCents } from '../debtReserves';
import { deriveParentMonthlyPaymentCents } from '../debtHierarchy';

describe('computeReserveAccrualCents', () => {
  it('splits a monthly debt into 2 quincenas', () => {
    expect(computeReserveAccrualCents('mensual', 100_000)).toBe(50_000);
  });

  it('splits a bimonthly debt into 4 quincenas', () => {
    expect(computeReserveAccrualCents('bimestral', 120_000)).toBe(30_000);
  });

  it('rounds to the nearest cent', () => {
    expect(computeReserveAccrualCents('mensual', 100_001)).toBe(50_001);
  });
});

describe('debtMonthlyObligationCents', () => {
  it('counts a mensual period total in full per month', () => {
    expect(debtMonthlyObligationCents('mensual', 300_000)).toBe(300_000);
  });

  it('counts a bimestral period total as half per month', () => {
    expect(debtMonthlyObligationCents('bimestral', 100_000)).toBe(50_000);
  });

  it('uses the live children sum for a parent debt', () => {
    const children = [
      { monthlyPaymentCents: 120_000, remainingPayments: 6, status: 'activa' as const },
      { monthlyPaymentCents: 80_000, remainingPayments: null, status: 'activa' as const },
    ];
    const periodTotal = deriveParentMonthlyPaymentCents(children);
    expect(periodTotal).toBe(200_000);
    expect(debtMonthlyObligationCents('mensual', periodTotal)).toBe(200_000);
  });
});
