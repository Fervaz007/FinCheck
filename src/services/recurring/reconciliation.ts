import { addDays, format } from 'date-fns';
import { desc, eq } from 'drizzle-orm';

import type { Database } from '@/db/client';
import {
  debtPayments,
  debts,
  expenses,
  income,
  recurrenceOccurrences,
  recurringTransactions,
  settings,
} from '@/db/schema';

import { deriveParentMonthlyPaymentCents } from '@/services/financial/debtHierarchy';
import { parseISODate } from '@/utils/date';

import { computeOccurrences } from './computeOccurrences';
import type { RecurrenceConfig } from './recurrenceTypes';

export function formatOccurrenceDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Runs on app open. For every active recurring transaction, generates every
 * occurrence that should have happened between its last processed occurrence
 * (exclusive) and `today` (inclusive). The whole pass commits atomically:
 * either every pending occurrence is generated, or none are.
 */
export async function runReconciliation(db: Database, today: Date): Promise<void> {
  await db.transaction(async (tx) => {
    const activeRecurring = await tx
      .select()
      .from(recurringTransactions)
      .where(eq(recurringTransactions.isActive, true));

    for (const rt of activeRecurring) {
      const [lastOccurrence] = await tx
        .select({ occurrenceDate: recurrenceOccurrences.occurrenceDate })
        .from(recurrenceOccurrences)
        .where(eq(recurrenceOccurrences.recurringTransactionId, rt.id))
        .orderBy(desc(recurrenceOccurrences.occurrenceDate))
        .limit(1);

      const anchor = parseISODate(rt.anchorDate);
      const from = lastOccurrence
        ? addDays(parseISODate(lastOccurrence.occurrenceDate), 1)
        : anchor;
      const config = rt.recurrenceConfig as RecurrenceConfig;

      const occurrences = computeOccurrences(config, anchor, from, today);

      // Resolved once per recurring transaction, not per occurrence: a parent
      // debt's monthly obligation is derived from its active children, so the
      // scheduled amount must reflect today's total, not whatever was stored
      // on the recurring transaction when it was first set up.
      let debtPaymentAmountCents = rt.amountCents;
      if (rt.kind === 'debt_payment' && rt.debtId != null) {
        const children = await tx.select().from(debts).where(eq(debts.parentDebtId, rt.debtId));
        if (children.length > 0) {
          debtPaymentAmountCents = deriveParentMonthlyPaymentCents(children);
        }
      }

      for (const occurrenceDate of occurrences) {
        const occurrenceDateStr = formatOccurrenceDate(occurrenceDate);

        if (rt.kind === 'debt_payment') {
          if (rt.debtId == null) continue;
          const [inserted] = await tx
            .insert(debtPayments)
            .values({
              debtId: rt.debtId,
              accountId: rt.accountId,
              amountCents: debtPaymentAmountCents,
              occurrenceDate: occurrenceDateStr,
              status: 'scheduled',
              recurringTransactionId: rt.id,
            })
            .returning({ id: debtPayments.id });

          await tx.insert(recurrenceOccurrences).values({
            recurringTransactionId: rt.id,
            occurrenceDate: occurrenceDateStr,
            generatedEntityType: 'debt_payment',
            generatedEntityId: inserted.id,
          });
        } else if (rt.kind === 'income') {
          if (rt.accountId == null) continue;
          const [inserted] = await tx
            .insert(income)
            .values({
              description: rt.description,
              categoryId: rt.categoryId,
              accountId: rt.accountId,
              amountCents: rt.amountCents,
              date: occurrenceDateStr,
              recurringTransactionId: rt.id,
              occurrenceDate: occurrenceDateStr,
            })
            .returning({ id: income.id });

          await tx.insert(recurrenceOccurrences).values({
            recurringTransactionId: rt.id,
            occurrenceDate: occurrenceDateStr,
            generatedEntityType: 'income',
            generatedEntityId: inserted.id,
          });
        } else {
          if (rt.accountId == null) continue;
          const [inserted] = await tx
            .insert(expenses)
            .values({
              description: rt.description,
              categoryId: rt.categoryId,
              accountId: rt.accountId,
              amountCents: rt.amountCents,
              date: occurrenceDateStr,
              recurringTransactionId: rt.id,
              occurrenceDate: occurrenceDateStr,
            })
            .returning({ id: expenses.id });

          await tx.insert(recurrenceOccurrences).values({
            recurringTransactionId: rt.id,
            occurrenceDate: occurrenceDateStr,
            generatedEntityType: 'expense',
            generatedEntityId: inserted.id,
          });
        }
      }

      if (occurrences.length > 0) {
        const lastGenerated = occurrences[occurrences.length - 1];
        const [nextOccurrence] = computeOccurrences(
          config,
          anchor,
          addDays(lastGenerated, 1),
          addDays(lastGenerated, 366),
        );
        await tx
          .update(recurringTransactions)
          .set({
            nextOccurrenceDate: nextOccurrence ? formatOccurrenceDate(nextOccurrence) : null,
          })
          .where(eq(recurringTransactions.id, rt.id));
      }
    }

    const existingSettings = await tx.select().from(settings).limit(1);
    const lastReconciledAt = today.toISOString();
    if (existingSettings.length > 0) {
      await tx
        .update(settings)
        .set({ lastReconciledAt })
        .where(eq(settings.id, existingSettings[0].id));
    } else {
      await tx.insert(settings).values({ lastReconciledAt });
    }
  });
}
