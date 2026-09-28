export interface Commitment {
  totalAmountCents: number;
  periodsToSpread: number;
  accumulatedCents: number;
}

/** How much to set aside this pay period (e.g. this quincena) for one commitment. */
export function perPeriodAmountCents(commitment: Commitment): number {
  return Math.round(commitment.totalAmountCents / commitment.periodsToSpread);
}

export function isCommitmentComplete(commitment: Commitment): boolean {
  return commitment.accumulatedCents >= commitment.totalAmountCents;
}

export interface AdjustedAvailable {
  reservedCents: number;
  adjustedAvailableCents: number;
}

/**
 * Given this period's income (e.g. this quincena's paycheck) and the active
 * commitments, computes how much is reserved and what's truly left for
 * personal spending — subtracted from global income, not from any specific
 * account balance.
 */
export function computeAdjustedAvailable(
  periodIncomeCents: number,
  commitments: Commitment[],
): AdjustedAvailable {
  const reservedCents = commitments.reduce((sum, c) => sum + perPeriodAmountCents(c), 0);
  return { reservedCents, adjustedAvailableCents: periodIncomeCents - reservedCents };
}
