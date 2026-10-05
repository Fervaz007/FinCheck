export type SimulationMode = 'a_meses' | 'contado';

export interface AMesesSimulationInput {
  incomeCents: number;
  allocatedPct: number;
  currentTypeCommitmentCents: number;
  newMonthlyPaymentCents: number;
}

export interface AMesesSimulationResult {
  allocatedCents: number;
  beforeCommitmentCents: number;
  afterCommitmentCents: number;
  remainingCapacityCents: number;
  exceedsLimit: boolean;
}

/** "A meses": validates the new monthly payment against the selected Tipo's remaining capacity under the active rule. */
export function simulateAMesesPurchase(input: AMesesSimulationInput): AMesesSimulationResult {
  const { incomeCents, allocatedPct, currentTypeCommitmentCents, newMonthlyPaymentCents } = input;
  const allocatedCents = Math.round((incomeCents * allocatedPct) / 100);
  const afterCommitmentCents = currentTypeCommitmentCents + newMonthlyPaymentCents;

  return {
    allocatedCents,
    beforeCommitmentCents: currentTypeCommitmentCents,
    afterCommitmentCents,
    remainingCapacityCents: allocatedCents - afterCommitmentCents,
    exceedsLimit: afterCommitmentCents > allocatedCents,
  };
}

export interface ContadoSimulationInput {
  priceCents: number;
  availableCents: number;
}

export interface ContadoSimulationResult {
  availableAfterCents: number;
  exceedsAvailable: boolean;
}

/** "A contado": validates the purchase price directly against real available money, no Tipo involved. */
export function simulateContadoPurchase(input: ContadoSimulationInput): ContadoSimulationResult {
  const availableAfterCents = input.availableCents - input.priceCents;
  return { availableAfterCents, exceedsAvailable: availableAfterCents < 0 };
}
