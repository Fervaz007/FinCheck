import type { BudgetComplianceRow } from './budget';

export type HealthStatus =
  | 'saludable'
  | 'atencion'
  | 'riesgo'
  | 'critico'
  | 'sin_limite'
  | 'sin_ingreso';
type GroupStatus = Exclude<HealthStatus, 'sin_limite' | 'sin_ingreso'>;

const STATUS_SEVERITY: Record<GroupStatus, number> = {
  saludable: 0,
  atencion: 1,
  riesgo: 2,
  critico: 3,
};

export interface HealthRuleConfig {
  /** Percentage-point margin below a group's allocated % that already counts as "atención" for that group. */
  attentionMarginPct: number;
}

export interface GroupHealthStatus {
  label: string;
  status: GroupStatus;
}

export interface HealthResult {
  status: HealthStatus;
  groupStatuses: GroupHealthStatus[];
}

function statusForRow(row: BudgetComplianceRow, attentionMarginPct: number): GroupStatus {
  if (row.actualPct > row.allocatedPct + attentionMarginPct) return 'critico';
  if (row.actualPct > row.allocatedPct) return 'riesgo';
  if (row.actualPct > row.allocatedPct - attentionMarginPct) return 'atencion';
  return 'saludable';
}

/**
 * Health status is the worst status across every monitored budget-rule group,
 * measured against the fixed monthly income (not the available balance) — so
 * spending or withdrawing cash never changes it. See budget-on-fixed-income
 * design decisions #3/#4. No fixed income → `sin_ingreso`; no monitored
 * groups → `sin_limite`.
 */
export function computeFinancialHealth(
  monitoredRows: BudgetComplianceRow[],
  fixedMonthlyIncomeCents: number,
  config: HealthRuleConfig,
): HealthResult {
  if (fixedMonthlyIncomeCents <= 0) {
    return { status: 'sin_ingreso', groupStatuses: [] };
  }
  if (monitoredRows.length === 0) {
    return { status: 'sin_limite', groupStatuses: [] };
  }

  const groupStatuses = monitoredRows.map((row) => ({
    label: row.label,
    status: statusForRow(row, config.attentionMarginPct),
  }));

  const worst = groupStatuses.reduce<GroupStatus>(
    (acc, g) => (STATUS_SEVERITY[g.status] > STATUS_SEVERITY[acc] ? g.status : acc),
    'saludable',
  );

  return { status: worst, groupStatuses };
}
