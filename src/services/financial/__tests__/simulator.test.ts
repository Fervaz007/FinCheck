import { simulateNewDebt } from '../simulator';

describe('simulateNewDebt', () => {
  const base = {
    incomeCents: 3_000_000,
    currentDebtPaymentsCents: 600_000,
    debtLimitPct: 30,
    currentAvailableCents: 900_000,
  };

  it('matches the Kia K4 purchase-simulator spec example (exceeds limit)', () => {
    const result = simulateNewDebt({ ...base, newMonthlyPaymentCents: 950_000 });
    expect(result.before.debtRatioPct).toBe(20);
    expect(result.after.debtPaymentsCents).toBe(1_550_000);
    expect(result.after.debtRatioPct).toBe(51.7);
    expect(result.exceedsLimit).toBe(true);
  });

  it('flags a smaller monthly payment as within the limit', () => {
    const result = simulateNewDebt({ ...base, newMonthlyPaymentCents: 250_000 });
    expect(result.after.debtRatioPct).toBe(28.3);
    expect(result.exceedsLimit).toBe(false);
  });

  it('flags a larger monthly payment as exceeding the limit', () => {
    const result = simulateNewDebt({ ...base, newMonthlyPaymentCents: 500_000 });
    expect(result.after.debtRatioPct).toBe(36.7);
    expect(result.exceedsLimit).toBe(true);
  });
});
