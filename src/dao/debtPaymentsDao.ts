import { and, eq, gte, lte, sql } from 'drizzle-orm';

import { db, type Database } from '@/db/client';
import { debtPayments } from '@/db/schema';

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

/** All-time total of confirmed debt payments, across every month — feeds the global "Disponible". */
export async function sumAllConfirmedPaymentsCents(database: Database = db): Promise<number> {
  const [row] = await database
    .select({ total: sql<number>`coalesce(sum(${debtPayments.amountCents}), 0)` })
    .from(debtPayments)
    .where(eq(debtPayments.status, 'confirmed'));
  return Number(row?.total ?? 0);
}

/** Sum of confirmed payments for one debt — how much it has deducted/committed so far. */
export async function sumConfirmedPaymentsForDebtCents(
  debtId: number,
  database: Database = db,
): Promise<number> {
  const [row] = await database
    .select({ total: sql<number>`coalesce(sum(${debtPayments.amountCents}), 0)` })
    .from(debtPayments)
    .where(and(eq(debtPayments.debtId, debtId), eq(debtPayments.status, 'confirmed')));
  return Number(row?.total ?? 0);
}

/**
 * Writes a single already-confirmed payment. Used for the automatic per-quincena
 * deductions and for one-time non-recurring debts — there is no manual
 * confirmation step anymore (deductions happen automatically).
 */
export async function insertConfirmedPayment(
  input: { debtId: number; amountCents: number; occurrenceDate: string },
  database: Database = db,
) {
  await database.insert(debtPayments).values({
    debtId: input.debtId,
    amountCents: input.amountCents,
    occurrenceDate: input.occurrenceDate,
    status: 'confirmed',
    confirmedAt: new Date().toISOString(),
  });
}
