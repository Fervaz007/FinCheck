export type DebtPeriodicity = 'mensual' | 'bimestral';

const CUTOFFS_PER_PERIODICITY: Record<DebtPeriodicity, number> = {
  mensual: 2,
  bimestral: 4,
};

/** How much a single biweekly cutoff adds to a recurring debt's reserve. */
export function computeReserveAccrualCents(
  periodicity: DebtPeriodicity,
  currentTotalCents: number,
): number {
  return Math.round(currentTotalCents / CUTOFFS_PER_PERIODICITY[periodicity]);
}

export function cutoffsForPeriodicity(periodicity: DebtPeriodicity): number {
  return CUTOFFS_PER_PERIODICITY[periodicity];
}

/**
 * A recurring debt's standing MONTHLY cost = per-quincena share × 2 quincenas.
 * So a `mensual` period total counts in full per month, while a `bimestral`
 * period total counts as half per month. Used for per-group budget occupancy.
 */
export function debtMonthlyObligationCents(
  periodicity: DebtPeriodicity,
  periodTotalCents: number,
): number {
  return computeReserveAccrualCents(periodicity, periodTotalCents) * 2;
}
