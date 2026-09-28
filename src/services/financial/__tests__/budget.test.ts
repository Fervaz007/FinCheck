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
});
