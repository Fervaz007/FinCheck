import { and, eq, gte, lte } from 'drizzle-orm';

import { db, type Database } from '@/db/client';
import { debtPayments, debts } from '@/db/schema';
import { formatOccurrenceDate } from '@/services/recurring/reconciliation';
import { parseISODate } from '@/utils/date';

export type DerivedPaymentStatus = 'scheduled' | 'vencido' | 'confirmed';

export function deriveStatus(
  status: 'scheduled' | 'confirmed',
  occurrenceDate: string,
  today: Date,
): DerivedPaymentStatus {
  if (status === 'confirmed') return 'confirmed';
  return parseISODate(occurrenceDate).getTime() < parseISODate(formatOccurrenceDate(today)).getTime()
    ? 'vencido'
    : 'scheduled';
}

export async function listPaymentsForDebt(debtId: number) {
  return db.select().from(debtPayments).where(eq(debtPayments.debtId, debtId));
}

export async function listPendingPayments(today: Date) {
  const rows = await db.select().from(debtPayments).where(eq(debtPayments.status, 'scheduled'));
  return rows.map((row) => ({ ...row, derivedStatus: deriveStatus(row.status, row.occurrenceDate, today) }));
}

export async function listConfirmedPaymentsForMonth(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return db
    .select()
    .from(debtPayments)
    .where(
      and(
        eq(debtPayments.status, 'confirmed'),
        gte(debtPayments.occurrenceDate, start),
        lte(debtPayments.occurrenceDate, end),
      ),
    );
}

/** `database` defaults to the app singleton; overridable so tests can pass an in-memory db. */
export async function confirmPayment(paymentId: number, accountId?: number, database: Database = db) {
  await database.transaction(async (tx) => {
    const [payment] = await tx.select().from(debtPayments).where(eq(debtPayments.id, paymentId));
    if (!payment || payment.status === 'confirmed') return;

    const [debt] = await tx.select().from(debts).where(eq(debts.id, payment.debtId));
    if (!debt) return;

    await tx
      .update(debtPayments)
      .set({
        status: 'confirmed',
        confirmedAt: new Date().toISOString(),
        accountId: accountId ?? payment.accountId,
      })
      .where(eq(debtPayments.id, paymentId));

    const children = await tx.select().from(debts).where(eq(debts.parentDebtId, debt.id));

    if (children.length > 0) {
      // Parent debt: cascade to active children — only decrement the month
      // countdown, never a dollar amount (their balance is derived, not stored).
      // Indefinite children (no countdown) are left untouched.
      let allFinished = true;
      for (const child of children) {
        if (child.status !== 'activa') continue;
        if (child.remainingPayments == null) {
          allFinished = false;
          continue;
        }
        const newRemaining = Math.max(0, child.remainingPayments - 1);
        await tx
          .update(debts)
          .set({
            remainingPayments: newRemaining,
            status: newRemaining === 0 ? 'pagada' : 'activa',
          })
          .where(eq(debts.id, child.id));
        if (newRemaining > 0) allFinished = false;
      }
      if (allFinished) {
        await tx.update(debts).set({ status: 'pagada' }).where(eq(debts.id, debt.id));
      }
    } else {
      // Ungrouped debt: unchanged behavior from before the hierarchy feature.
      const newSaldoPendienteCents = Math.max(0, debt.saldoPendienteCents - payment.amountCents);
      const newRemainingPayments =
        debt.remainingPayments != null ? Math.max(0, debt.remainingPayments - 1) : null;

      await tx
        .update(debts)
        .set({
          saldoPendienteCents: newSaldoPendienteCents,
          remainingPayments: newRemainingPayments,
          status: newSaldoPendienteCents === 0 ? 'pagada' : debt.status,
        })
        .where(eq(debts.id, debt.id));
    }
  });
}
