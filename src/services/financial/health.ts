import { roundPercentage } from '@/utils/money';

export type HealthStatus = 'saludable' | 'atencion' | 'riesgo' | 'critico';

export interface HealthRuleConfig {
  /** Configured max % of income destined to debt (from the debt-limit capability). */
  debtLimitPct: number;
  /** Minimum % of income that should go to savings to be considered healthy. */
  minSavingsRatioPct: number;
  /** Percentage-point margin below the debt limit that already counts as "atención". */
  attentionMarginPct: number;
}

export interface HealthMetrics {
  incomeCents: number;
  debtPaymentsCents: number;
  savingsCents: number;
  availableCents: number;
}

export interface HealthResult {
  status: HealthStatus;
  debtRatioPct: number;
  savingsRatioPct: number;
}

export function computeFinancialHealth(
  metrics: HealthMetrics,
  config: HealthRuleConfig,
): HealthResult {
  const debtRatioPct = roundPercentage(metrics.debtPaymentsCents, metrics.incomeCents);
  const savingsRatioPct = roundPercentage(metrics.savingsCents, metrics.incomeCents);

  let status: HealthStatus;
  if (metrics.availableCents < 0 || debtRatioPct > config.debtLimitPct + config.attentionMarginPct) {
    status = 'critico';
  } else if (debtRatioPct > config.debtLimitPct) {
    status = 'riesgo';
  } else if (
    debtRatioPct > config.debtLimitPct - config.attentionMarginPct ||
    savingsRatioPct < config.minSavingsRatioPct
  ) {
    status = 'atencion';
  } else {
    status = 'saludable';
  }

  return { status, debtRatioPct, savingsRatioPct };
}
