import { computeAdjustedAvailable, isCommitmentComplete, perPeriodAmountCents } from '../commitments';

describe('perPeriodAmountCents', () => {
  it('splits a monthly debt payment across 2 quincenas (BBVA example)', () => {
    expect(
      perPeriodAmountCents({ totalAmountCents: 120_000, periodsToSpread: 2, accumulatedCents: 0 }),
    ).toBe(60_000);
  });

  it('splits a bimonthly bill across 4 quincenas (Luz example)', () => {
    expect(
      perPeriodAmountCents({ totalAmountCents: 100_000, periodsToSpread: 4, accumulatedCents: 0 }),
    ).toBe(25_000);
  });
});

describe('isCommitmentComplete', () => {
  it('is not complete while accumulated is below the total', () => {
    expect(
      isCommitmentComplete({ totalAmountCents: 100_000, periodsToSpread: 4, accumulatedCents: 50_000 }),
    ).toBe(false);
  });

  it('is complete once accumulated reaches the total', () => {
    expect(
      isCommitmentComplete({ totalAmountCents: 100_000, periodsToSpread: 4, accumulatedCents: 100_000 }),
    ).toBe(true);
  });
});

describe('computeAdjustedAvailable', () => {
  it('subtracts BBVA + Luz reserves from this quincena income, from global money not a specific account', () => {
    const result = computeAdjustedAvailable(900_000, [
      { totalAmountCents: 120_000, periodsToSpread: 2, accumulatedCents: 0 }, // BBVA: 60,000
      { totalAmountCents: 100_000, periodsToSpread: 4, accumulatedCents: 50_000 }, // Luz: 25,000
    ]);
    expect(result.reservedCents).toBe(85_000);
    expect(result.adjustedAvailableCents).toBe(815_000);
  });
});
