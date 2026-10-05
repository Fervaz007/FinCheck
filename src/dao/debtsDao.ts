import { and, eq, isNull, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { debtPayments, debts } from '@/db/schema';
import type { Debt, NewDebt } from '@/models';
import {
  deriveParentMonthlyPaymentCents,
  deriveParentSaldoPendienteCents,
} from '@/services/financial/debtHierarchy';
import {
  computeReserveAccrualCents,
  debtMonthlyObligationCents,
} from '@/services/financial/debtReserves';

export interface ResolvedDebt extends Debt {
  children: Debt[];
}

export async function listDebts() {
  return db.select().from(debts);
}

export async function listParentDebts() {
  return db.select().from(debts).where(isNull(debts.parentDebtId));
}

export async function listChildDebts(parentId: number) {
  return db.select().from(debts).where(eq(debts.parentDebtId, parentId));
}

/** Top-level debts (no parent) with their children attached, and derived totals applied when children exist. */
export async function listDebtsResolved(): Promise<ResolvedDebt[]> {
  const parents = await listParentDebts();
  return Promise.all(
    parents.map(async (parent) => {
      const children = await listChildDebts(parent.id);
      if (children.length === 0) {
        return { ...parent, children: [] };
      }
      return {
        ...parent,
        monthlyPaymentCents: deriveParentMonthlyPaymentCents(children),
        saldoPendienteCents: deriveParentSaldoPendienteCents(children),
        children,
      };
    }),
  );
}

/**
 * Standing MONTHLY obligation of active RECURRING parent/standalone debts,
 * grouped by `budgetGroupLabel`. This is the per-group "ocupado" the dashboard
 * shows — derived straight from the debts, so it updates the instant one is
 * added (no waiting for materialized payments). Non-recurring and child debts
 * are excluded (one-offs hit Disponible once; children roll into their parent).
 */
export async function sumMonthlyObligationByGroup(): Promise<Record<string, number>> {
  const parents = await db
    .select()
    .from(debts)
    .where(and(isNull(debts.parentDebtId), eq(debts.isRecurring, true), eq(debts.status, 'activa')));

  const byGroup: Record<string, number> = {};
  for (const debt of parents) {
    if (!debt.periodicity) continue;
    const children = await listChildDebts(debt.id);
    const periodTotalCents =
      children.length > 0 ? deriveParentMonthlyPaymentCents(children) : debt.monthlyPaymentCents;
    const monthlyCost = debtMonthlyObligationCents(debt.periodicity, periodTotalCents);
    const label = debt.budgetGroupLabel ?? 'Sin tipo';
    byGroup[label] = (byGroup[label] ?? 0) + monthlyCost;
  }
  return byGroup;
}

/** Standing monthly obligation for one Tipo — used by the simulator's "a meses" capacity check; matches the dashboard occupancy. */
export async function sumActiveMonthlyCommitmentByType(label: string): Promise<number> {
  const byGroup = await sumMonthlyObligationByGroup();
  return byGroup[label] ?? 0;
}

export interface ResolvedReserveDebt extends Debt {
  currentTotalCents: number;
  perCutoffCents: number;
  committedCents: number;
}

/** Parent/standalone recurring debts (never children) with their live period total, per-quincena share, and how much has been deducted/committed so far, for the Apartados screen. */
export async function listRecurringDebtsResolved(): Promise<ResolvedReserveDebt[]> {
  const parents = await db
    .select()
    .from(debts)
    .where(and(isNull(debts.parentDebtId), eq(debts.isRecurring, true), eq(debts.status, 'activa')));

  return Promise.all(
    parents.map(async (debt) => {
      const children = await listChildDebts(debt.id);
      const currentTotalCents =
        children.length > 0 ? deriveParentMonthlyPaymentCents(children) : debt.monthlyPaymentCents;
      const perCutoffCents = debt.periodicity
        ? computeReserveAccrualCents(debt.periodicity, currentTotalCents)
        : 0;
      const [row] = await db
        .select({ total: sql<number>`coalesce(sum(${debtPayments.amountCents}), 0)` })
        .from(debtPayments)
        .where(and(eq(debtPayments.debtId, debt.id), eq(debtPayments.status, 'confirmed')));
      const committedCents = Number(row?.total ?? 0);
      return { ...debt, currentTotalCents, perCutoffCents, committedCents };
    }),
  );
}

export async function getDebt(id: number) {
  const [row] = await db.select().from(debts).where(eq(debts.id, id));
  return row;
}

export async function createDebt(input: NewDebt) {
  const [row] = await db.insert(debts).values(input).returning();
  return row;
}

export interface NewChildDebt {
  parentDebtId: number;
  name: string;
  debtType: string;
  monthlyPaymentCents: number;
  /** null = indefinite (e.g. a subscription charged to the card), no countdown */
  remainingPayments: number | null;
  startDate: string;
}

/**
 * A child debt never asks the user for original amount or outstanding
 * balance — those are auto-filled here purely to satisfy NOT NULL columns;
 * the real numbers everywhere else in the app are always the derived ones.
 */
export async function createChildDebt(input: NewChildDebt) {
  const placeholderSaldo =
    input.remainingPayments != null
      ? input.monthlyPaymentCents * input.remainingPayments
      : input.monthlyPaymentCents;

  const [row] = await db
    .insert(debts)
    .values({
      parentDebtId: input.parentDebtId,
      name: input.name,
      debtType: input.debtType,
      monthlyPaymentCents: input.monthlyPaymentCents,
      remainingPayments: input.remainingPayments,
      originalAmountCents: placeholderSaldo,
      saldoPendienteCents: placeholderSaldo,
      startDate: input.startDate,
      status: 'activa',
    })
    .returning();
  return row;
}

export async function updateDebt(id: number, input: Partial<NewDebt>) {
  const [row] = await db.update(debts).set(input).where(eq(debts.id, id)).returning();
  return row;
}

export async function deleteDebt(id: number) {
  // Delete children first — the FK has no ON DELETE CASCADE, so deleting a
  // parent with active children would otherwise fail the constraint.
  await db.delete(debts).where(eq(debts.parentDebtId, id));
  await db.delete(debts).where(eq(debts.id, id));
}
