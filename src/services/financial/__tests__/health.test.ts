import { computeFinancialHealth, type HealthRuleConfig } from '../health';
import type { BudgetComplianceRow } from '../budget';

const config: HealthRuleConfig = { attentionMarginPct: 5 };
const INCOME = 1_000_000; // a positive fixed monthly income for the normal cases

function row(label: string, allocatedPct: number, actualPct: number): BudgetComplianceRow {
  return {
    label,
    allocatedPct,
    allocatedCents: 0,
    actualCents: 0,
    actualPct,
    withinBudget: actualPct <= allocatedPct,
  };
}

describe('computeFinancialHealth', () => {
  it('reports saludable when every monitored group is within its threshold', () => {
    const result = computeFinancialHealth(
      [row('Deudas', 30, 20), row('Necesidades', 50, 40)],
      INCOME,
      config,
    );
    expect(result.status).toBe('saludable');
  });

  it('reports critico when a monitored group exceeds its limit beyond the margin', () => {
    const result = computeFinancialHealth([row('Deudas', 30, 40)], INCOME, config);
    expect(result.status).toBe('critico');
  });

  it('reports atencion when a monitored group is close to its limit', () => {
    const result = computeFinancialHealth([row('Deudas', 30, 26)], INCOME, config);
    expect(result.status).toBe('atencion');
  });

  it('reports sin_limite when there are monitored-less rows but income exists', () => {
    const result = computeFinancialHealth([], INCOME, config);
    expect(result.status).toBe('sin_limite');
  });

  it('reports sin_ingreso when there is no fixed monthly income', () => {
    const result = computeFinancialHealth([row('Deudas', 30, 20)], 0, config);
    expect(result.status).toBe('sin_ingreso');
  });

  it('reports the worst status across several monitored groups, not just the first one', () => {
    const result = computeFinancialHealth(
      [row('Necesidades', 50, 40), row('Deudas', 30, 32)],
      INCOME,
      config,
    );
    expect(result.status).toBe('riesgo');
    expect(result.groupStatuses).toEqual([
      { label: 'Necesidades', status: 'saludable' },
      { label: 'Deudas', status: 'riesgo' },
    ]);
  });

  it('does not depend on the available balance (withdrawing cash cannot worsen health)', () => {
    // Health no longer takes an available-balance argument; a within-budget set
    // stays saludable no matter how low the user's current cash is.
    const result = computeFinancialHealth([row('Necesidades', 50, 40)], INCOME, config);
    expect(result.status).toBe('saludable');
  });
});
