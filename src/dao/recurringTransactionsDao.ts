import { and, eq } from 'drizzle-orm';

import { db, type Database } from '@/db/client';
import { recurrenceOccurrences, recurringTransactions } from '@/db/schema';
import type { NewRecurringTransaction } from '@/models';

export async function listActiveRecurringTransactions() {
  return db.select().from(recurringTransactions).where(eq(recurringTransactions.isActive, true));
}

/** Active recurring INCOME streams — the source of the fixed monthly income. */
export async function listActiveRecurringIncome(database: Database = db) {
  return database
    .select()
    .from(recurringTransactions)
    .where(and(eq(recurringTransactions.isActive, true), eq(recurringTransactions.kind, 'income')));
}

export async function createRecurringTransaction(input: NewRecurringTransaction) {
  const [row] = await db.insert(recurringTransactions).values(input).returning();
  return row;
}

export async function deactivateRecurringTransaction(id: number) {
  await db.update(recurringTransactions).set({ isActive: false }).where(eq(recurringTransactions.id, id));
}

export async function listOccurrencesFor(recurringTransactionId: number) {
  return db
    .select()
    .from(recurrenceOccurrences)
    .where(eq(recurrenceOccurrences.recurringTransactionId, recurringTransactionId));
}
