export interface ChildDebtLike {
  monthlyPaymentCents: number;
  remainingPayments: number | null;
  status: 'activa' | 'pagada' | 'cancelada';
}

export function isChildActive(child: ChildDebtLike): boolean {
  return child.status === 'activa';
}

/**
 * A child's balance is never entered by the user — it's estimated from what
 * they already know (monthly payment, months left), with no interest math.
 * An indefinite child (no countdown, e.g. a subscription) has no finite
 * balance to estimate.
 */
export function deriveChildSaldoPendienteCents(child: ChildDebtLike): number {
  if (child.remainingPayments == null) return 0;
  return child.monthlyPaymentCents * child.remainingPayments;
}

/** A parent's monthly payment is always the sum of its active children — never entered directly. */
export function deriveParentMonthlyPaymentCents(children: ChildDebtLike[]): number {
  return children.filter(isChildActive).reduce((sum, c) => sum + c.monthlyPaymentCents, 0);
}

export function deriveParentSaldoPendienteCents(children: ChildDebtLike[]): number {
  return children
    .filter(isChildActive)
    .reduce((sum, c) => sum + deriveChildSaldoPendienteCents(c), 0);
}
