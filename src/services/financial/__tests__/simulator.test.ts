import { simulateAMesesPurchase, simulateContadoPurchase } from '../simulator';

describe('simulateAMesesPurchase', () => {
  // incomeCents is now fed the fixed monthly income (same base as the dashboard),
  // not the active month's materialized income.
  const base = {
    incomeCents: 3_000_000,
    allocatedPct: 30,
    currentTypeCommitmentCents: 600_000,
  };

  it('flags a purchase that exceeds the type capacity', () => {
    const result = simulateAMesesPurchase({ ...base, newMonthlyPaymentCents: 950_000 });
    expect(result.allocatedCents).toBe(900_000);
    expect(result.afterCommitmentCents).toBe(1_550_000);
    expect(result.exceedsLimit).toBe(true);
    expect(result.remainingCapacityCents).toBe(-650_000);
  });

  it('flags a smaller monthly payment as within capacity', () => {
    const result = simulateAMesesPurchase({ ...base, newMonthlyPaymentCents: 250_000 });
    expect(result.afterCommitmentCents).toBe(850_000);
    expect(result.exceedsLimit).toBe(false);
    expect(result.remainingCapacityCents).toBe(50_000);
  });
});

describe('simulateContadoPurchase', () => {
  it('flags a purchase that fits available money', () => {
    const result = simulateContadoPurchase({ priceCents: 300_000, availableCents: 900_000 });
    expect(result.availableAfterCents).toBe(600_000);
    expect(result.exceedsAvailable).toBe(false);
  });

  it('flags a purchase that exceeds available money', () => {
    const result = simulateContadoPurchase({ priceCents: 1_000_000, availableCents: 900_000 });
    expect(result.availableAfterCents).toBe(-100_000);
    expect(result.exceedsAvailable).toBe(true);
  });
});
