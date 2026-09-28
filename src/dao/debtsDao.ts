import { eq, isNull } from 'drizzle-orm';

import { db } from '@/db/client';
import { debts } from '@/db/schema';
import type { Debt, NewDebt } from '@/models';
import {
  deriveParentMonthlyPaymentCents,
  deriveParentSaldoPendienteCents,
} from '@/services/financial/debtHierarchy';

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
