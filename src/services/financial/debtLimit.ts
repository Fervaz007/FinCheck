import { roundPercentage } from '@/utils/money';

export interface DebtCapacityInput {
  incomeCents: number;
  currentDebtPaymentsCents: number;
  debtLimitPct: number;
}

export interface DebtCapacityResult {
  currentRatioPct: number;
  maxAllowedDebtCents: number;
  availableCapacityCents: number;
}

export function computeDebtCapacity(input: DebtCapacityInput): DebtCapacityResult {
  const { incomeCents, currentDebtPaymentsCents, debtLimitPct } = input;
  const maxAllowedDebtCents = Math.round((incomeCents * debtLimitPct) / 100);
  const availableCapacityCents = Math.max(0, maxAllowedDebtCents - currentDebtPaymentsCents);

  return {
    currentRatioPct: roundPercentage(currentDebtPaymentsCents, incomeCents),
    maxAllowedDebtCents,
    availableCapacityCents,
  };
}
