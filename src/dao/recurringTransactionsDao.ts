import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { recurrenceOccurrences, recurringTransactions } from '@/db/schema';
import type { NewRecurringTransaction } from '@/models';

export async function listActiveRecurringTransactions() {
  return db.select().from(recurringTransactions).where(eq(recurringTransactions.isActive, true));
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
