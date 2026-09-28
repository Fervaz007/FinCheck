import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { commitments, debts, recurringTransactions } from '@/db/schema';
import { deriveParentMonthlyPaymentCents } from '@/services/financial/debtHierarchy';

export interface NewCommitment {
  name: string;
  periodsToSpread: number;
  totalAmountCents?: number | null;
  linkedDebtId?: number | null;
  linkedRecurringTransactionId?: number | null;
}

export interface ResolvedCommitment {
  id: number;
  name: string;
  totalAmountCents: number;
  periodsToSpread: number;
  accumulatedCents: number;
  linkedDebtId: number | null;
  linkedRecurringTransactionId: number | null;
  linkedLabel: string | null;
}

async function resolveTotalAmountCents(commitment: {
  totalAmountCents: number | null;
  linkedDebtId: number | null;
  linkedRecurringTransactionId: number | null;
}): Promise<{ amountCents: number; linkedLabel: string | null }> {
  if (commitment.linkedDebtId != null) {
    const [debt] = await db.select().from(debts).where(eq(debts.id, commitment.linkedDebtId));
    if (!debt) return { amountCents: 0, linkedLabel: null };

    const children = await db.select().from(debts).where(eq(debts.parentDebtId, debt.id));
    const amountCents =
      children.length > 0 ? deriveParentMonthlyPaymentCents(children) : debt.monthlyPaymentCents;

    return { amountCents, linkedLabel: `Deuda: ${debt.name}` };
  }
  if (commitment.linkedRecurringTransactionId != null) {
    const [rt] = await db
      .select()
      .from(recurringTransactions)
      .where(eq(recurringTransactions.id, commitment.linkedRecurringTransactionId));
    return {
      amountCents: rt?.amountCents ?? 0,
      linkedLabel: rt ? `Recurrente: ${rt.description}` : null,
    };
  }
  return { amountCents: commitment.totalAmountCents ?? 0, linkedLabel: null };
}

export async function listActiveCommitmentsResolved(): Promise<ResolvedCommitment[]> {
  const rows = await db.select().from(commitments).where(eq(commitments.isActive, true));
  return Promise.all(
    rows.map(async (row) => {
      const { amountCents, linkedLabel } = await resolveTotalAmountCents(row);
      return {
        id: row.id,
        name: row.name,
        totalAmountCents: amountCents,
        periodsToSpread: row.periodsToSpread,
        accumulatedCents: row.accumulatedCents,
        linkedDebtId: row.linkedDebtId,
        linkedRecurringTransactionId: row.linkedRecurringTransactionId,
        linkedLabel,
      };
    }),
  );
}

export async function createCommitment(input: NewCommitment) {
  const [row] = await db.insert(commitments).values(input).returning();
  return row;
}

export async function deactivateCommitment(id: number) {
  await db.update(commitments).set({ isActive: false }).where(eq(commitments.id, id));
}

/** Marks this period's reserve as set aside — adds one period's worth to the accumulated progress. */
export async function markPeriodReserved(id: number) {
  const [row] = await db.select().from(commitments).where(eq(commitments.id, id));
  if (!row) return;

  const { amountCents } = await resolveTotalAmountCents(row);
  const perPeriod = Math.round(amountCents / row.periodsToSpread);
  await db
    .update(commitments)
    .set({ accumulatedCents: row.accumulatedCents + perPeriod })
    .where(eq(commitments.id, id));
}

/** Resets progress to 0 — call once the real bill/payment has actually been paid. */
export async function resetCommitmentCycle(id: number) {
  await db.update(commitments).set({ accumulatedCents: 0 }).where(eq(commitments.id, id));
}
