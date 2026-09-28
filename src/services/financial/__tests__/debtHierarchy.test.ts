import {
  deriveChildSaldoPendienteCents,
  deriveParentMonthlyPaymentCents,
  deriveParentSaldoPendienteCents,
} from '../debtHierarchy';

const llantas = { monthlyPaymentCents: 30_000, remainingPayments: 12, status: 'activa' as const };
const tv = { monthlyPaymentCents: 20_000, remainingPayments: 3, status: 'activa' as const };
const netflix = { monthlyPaymentCents: 20_000, remainingPayments: null, status: 'activa' as const };

describe('deriveChildSaldoPendienteCents', () => {
  it('estimates a countdown child as monthly payment x remaining months (BBVA/Llantas example)', () => {
    expect(deriveChildSaldoPendienteCents(llantas)).toBe(360_000);
  });

  it('has no balance for an indefinite child (Netflix example)', () => {
    expect(deriveChildSaldoPendienteCents(netflix)).toBe(0);
  });
});

describe('deriveParentMonthlyPaymentCents', () => {
  it('sums only active children (BBVA = Llantas $300 + TV $200 + Netflix $200 = $700)', () => {
    expect(deriveParentMonthlyPaymentCents([llantas, tv, netflix])).toBe(70_000);
  });

  it('excludes a finished (pagada) child from the total', () => {
    const finishedTv = { ...tv, status: 'pagada' as const };
    expect(deriveParentMonthlyPaymentCents([llantas, finishedTv, netflix])).toBe(50_000);
  });
});

describe('deriveParentSaldoPendienteCents', () => {
  it('sums estimated balances of countdown children only, ignoring indefinite ones', () => {
    // Llantas 300*12=3600 + TV 200*3=600 + Netflix 0 = 4200
    expect(deriveParentSaldoPendienteCents([llantas, tv, netflix])).toBe(420_000);
  });
});
