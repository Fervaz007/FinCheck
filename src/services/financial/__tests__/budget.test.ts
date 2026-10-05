import { computeAllocationForAmount, computeBudgetCompliance, validateAllocationsSumTo100 } from '../budget';

describe('validateAllocationsSumTo100', () => {
  it('accepts a rule summing to 100%', () => {
    expect(
      validateAllocationsSumTo100([
        { label: 'necesidades', percentage: 45 },
        { label: 'deudas', percentage: 25 },
        { label: 'ahorro', percentage: 20 },
        { label: 'ocio', percentage: 10 },
      ]).valid,
    ).toBe(true);
  });

  it('rejects a rule summing to 95%', () => {
    const result = validateAllocationsSumTo100([
      { label: 'necesidades', percentage: 50 },
      { label: 'ahorro', percentage: 45 },
    ]);
    expect(result.valid).toBe(false);
    expect(result.sum).toBe(95);
  });
});

describe('computeAllocationForAmount', () => {
  it('splits a single paycheck across the rule (45/25/20/10 on $9,800)', () => {
    const rows = computeAllocationForAmount(
      [
        { label: 'necesidades', percentage: 45 },
        { label: 'deudas', percentage: 25 },
        { label: 'ahorro', percentage: 20 },
        { label: 'ocio', percentage: 10 },
      ],
      980_000,
    );
    expect(rows).toEqual([
      { label: 'necesidades', percentage: 45, amountCents: 441_000 },
      { label: 'deudas', percentage: 25, amountCents: 245_000 },
      { label: 'ahorro', percentage: 20, amountCents: 196_000 },
      { label: 'ocio', percentage: 10, amountCents: 98_000 },
    ]);
  });
});

describe('computeBudgetCompliance', () => {
  it('flags a group that exceeds its allocation', () => {
    const rows = computeBudgetCompliance(
      [{ label: 'ocio', percentage: 30 }],
      { ocio: 1_000_000 },
      3_000_000,
    );
    expect(rows[0].allocatedCents).toBe(900_000);
    expect(rows[0].withinBudget).toBe(false);
  });

  it('bases the limit on the fixed-income base, independent of actual spending', () => {
    // Same base (fixed monthly income) → same limit, regardless of how much is
    // actually committed. The base does not shrink when money is spent/withdrawn.
    const base = 700_000;
    const low = computeBudgetCompliance([{ label: 'necesidades', percentage: 50 }], { necesidades: 0 }, base);
    const high = computeBudgetCompliance(
      [{ label: 'necesidades', percentage: 50 }],
      { necesidades: 500_000 },
      base,
    );
    expect(low[0].allocatedCents).toBe(350_000);
    expect(high[0].allocatedCents).toBe(350_000);
    expect(low[0].withinBudget).toBe(true);
    expect(high[0].withinBudget).toBe(false);
  });
});
