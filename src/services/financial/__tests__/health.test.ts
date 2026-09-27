import { computeFinancialHealth, type HealthRuleConfig } from '../health';

const config: HealthRuleConfig = {
  debtLimitPct: 30,
  minSavingsRatioPct: 10,
  attentionMarginPct: 5,
};

describe('computeFinancialHealth', () => {
  it('reports saludable when within all configured thresholds', () => {
    const result = computeFinancialHealth(
      {
        incomeCents: 3_000_000,
        debtPaymentsCents: 600_000, // 20%
        savingsCents: 400_000, // 13.3%
        availableCents: 900_000,
      },
      config,
    );
    expect(result.status).toBe('saludable');
    expect(result.debtRatioPct).toBe(20);
  });

  it('reports critico when debt ratio exceeds the limit and available money is negative', () => {
    const result = computeFinancialHealth(
      {
        incomeCents: 3_000_000,
        debtPaymentsCents: 1_200_000, // 40%
        savingsCents: 0,
        availableCents: -50_000,
      },
      config,
    );
    expect(result.status).toBe('critico');
  });

  it('reports atencion when debt ratio is close to the limit', () => {
    const result = computeFinancialHealth(
      {
        incomeCents: 3_000_000,
        debtPaymentsCents: 780_000, // 26%
        savingsCents: 400_000,
        availableCents: 500_000,
      },
      config,
    );
    expect(result.status).toBe('atencion');
  });
});
