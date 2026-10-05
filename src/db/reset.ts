import { isNull, isNotNull } from 'drizzle-orm';

import { db, type Database } from '@/db/client';
import {
  budgetRuleAllocations,
  budgetRules,
  debtPayments,
  debts,
  expenses,
  income,
  monthlySummaries,
  recurrenceOccurrences,
  recurringTransactions,
  settings,
  simulations,
} from '@/db/schema';

/**
 * Wipes every user table back to first-launch empty state. Irreversible.
 * Deletes referencing rows before referenced ones so it holds even if the
 * SQLite connection has foreign-key enforcement enabled.
 */
export async function resetAllData(database: Database = db): Promise<void> {
  await database.transaction(async (tx) => {
    await tx.delete(debtPayments);
    await tx.delete(recurrenceOccurrences);
    await tx.delete(income);
    await tx.delete(expenses);
    await tx.delete(recurringTransactions);
    // debts self-references via parentDebtId; delete children before parents so
    // this holds even if the connection enforces foreign keys.
    await tx.delete(debts).where(isNotNull(debts.parentDebtId));
    await tx.delete(debts).where(isNull(debts.parentDebtId));
    await tx.delete(budgetRuleAllocations);
    await tx.delete(budgetRules);
    await tx.delete(simulations);
    await tx.delete(monthlySummaries);
    await tx.delete(settings);
  });
}
