import { roundPercentage } from '@/utils/money';

export interface SimulationInput {
  incomeCents: number;
  currentDebtPaymentsCents: number;
  debtLimitPct: number;
  newMonthlyPaymentCents: number;
  currentAvailableCents: number;
}

export interface SimulationSide {
  debtPaymentsCents: number;
  debtRatioPct: number;
}

export interface SimulationResult {
  before: SimulationSide;
  after: SimulationSide;
  availableAfterCents: number;
  exceedsLimit: boolean;
}

export function simulateNewDebt(input: SimulationInput): SimulationResult {
  const {
    incomeCents,
    currentDebtPaymentsCents,
    debtLimitPct,
    newMonthlyPaymentCents,
    currentAvailableCents,
  } = input;

  const before: SimulationSide = {
    debtPaymentsCents: currentDebtPaymentsCents,
    debtRatioPct: roundPercentage(currentDebtPaymentsCents, incomeCents),
  };

  const afterDebtPaymentsCents = currentDebtPaymentsCents + newMonthlyPaymentCents;
  const after: SimulationSide = {
    debtPaymentsCents: afterDebtPaymentsCents,
    debtRatioPct: roundPercentage(afterDebtPaymentsCents, incomeCents),
  };

  return {
    before,
    after,
    availableAfterCents: currentAvailableCents - newMonthlyPaymentCents,
    exceedsLimit: after.debtRatioPct > debtLimitPct,
  };
}
