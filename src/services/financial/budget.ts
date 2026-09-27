export interface BudgetAllocation {
  label: string;
  percentage: number;
}

export function validateAllocationsSumTo100(allocations: BudgetAllocation[]): {
  valid: boolean;
  sum: number;
} {
  const sum = allocations.reduce((acc, a) => acc + a.percentage, 0);
  return { valid: sum === 100, sum };
}

export interface BudgetComplianceRow {
  label: string;
  allocatedPct: number;
  allocatedCents: number;
  actualCents: number;
  actualPct: number;
  withinBudget: boolean;
}

export function computeBudgetCompliance(
  allocations: BudgetAllocation[],
  actualByGroup: Record<string, number>,
  incomeCents: number,
): BudgetComplianceRow[] {
  return allocations.map((allocation) => {
    const allocatedCents = Math.round((incomeCents * allocation.percentage) / 100);
    const actualCents = actualByGroup[allocation.label] ?? 0;
    const actualPct = incomeCents === 0 ? 0 : (actualCents / incomeCents) * 100;

    return {
      label: allocation.label,
      allocatedPct: allocation.percentage,
      allocatedCents,
      actualCents,
      actualPct,
      withinBudget: actualCents <= allocatedCents,
    };
  });
}
