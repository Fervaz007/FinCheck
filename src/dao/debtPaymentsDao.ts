import { and, eq, gte, lte } from 'drizzle-orm';

import { db } from '@/db/client';
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

export async function confirmPayment(paymentId: number, accountId?: number) {
  await db.transaction(async (tx) => {
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

    await tx
      .update(debts)
      .set({ saldoPendienteCents: Math.max(0, debt.saldoPendienteCents - payment.amountCents) })
      .where(eq(debts.id, debt.id));
  });
}
