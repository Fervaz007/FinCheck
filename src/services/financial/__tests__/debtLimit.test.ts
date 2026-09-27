import { computeDebtCapacity } from '../debtLimit';

describe('computeDebtCapacity', () => {
  it('matches the debt-limit spec example', () => {
    const result = computeDebtCapacity({
      incomeCents: 3_000_000,
      currentDebtPaymentsCents: 600_000,
      debtLimitPct: 30,
    });

    expect(result.currentRatioPct).toBe(20);
    expect(result.maxAllowedDebtCents).toBe(900_000);
    expect(result.availableCapacityCents).toBe(300_000);
  });
});
