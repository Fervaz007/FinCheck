import { addDays, format } from 'date-fns';
import { and, desc, eq, isNull } from 'drizzle-orm';

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

import { computeReserveAccrualCents } from '@/services/financial/debtReserves';
import { deriveParentMonthlyPaymentCents } from '@/services/financial/debtHierarchy';
import { parseISODate } from '@/utils/date';

import { computeOccurrences } from './computeOccurrences';
import type { RecurrenceConfig } from './recurrenceTypes';

export function formatOccurrenceDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Always día 15 / último día del mes — deductions follow the quincena, never a debt's own payment day. */
const CUTOFF_CONFIG: RecurrenceConfig = { type: 'SEMIMONTHLY_FIXED', dayA: 15, dayB: 'last' };

/** The most recent quincena cutoff (15th or last day of month) on or before `date`. */
function mostRecentCutoffOnOrBefore(date: Date): Date {
  const y = date.getFullYear();
  const m = date.getMonth();
  const day = date.getDate();
  const lastDay = new Date(y, m + 1, 0).getDate();
  if (day >= lastDay) return new Date(y, m, lastDay);
  if (day >= 15) return new Date(y, m, 15);
  return new Date(y, m, 0); // last day of the previous month
}

/**
 * Runs on app open. Generates every pending recurring-income/expense occurrence
 * between its last processed occurrence (exclusive) and `today` (inclusive), and
 * auto-deducts each recurring debt's per-quincena share for every cutoff passed
 * (as already-confirmed payments, so the global "Disponible" and per-section
 * compliance reflect them with no extra formula — see design.md decision #14).
 * The whole pass commits atomically.
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

      for (const occurrenceDate of occurrences) {
        const occurrenceDateStr = formatOccurrenceDate(occurrenceDate);

        if (rt.kind === 'income') {
          const [inserted] = await tx
            .insert(income)
            .values({
              description: rt.description,
              origin: rt.origin,
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
          const [inserted] = await tx
            .insert(expenses)
            .values({
              description: rt.description,
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

    // Recurring debts auto-deduct a per-quincena share on every cutoff that has
    // passed, as already-confirmed payments. The quincena in progress at creation
    // counts immediately (first run starts from the most recent cutoff on or
    // before the debt's start date); later runs continue strictly after the last
    // processed cutoff, so catch-up never double-counts. The starting reserve
    // ("apartado inicial", stored in reserveAccumulatedCents) is a consumable
    // buffer that offsets the first deductions until used up.
    const recurringDebts = await tx
      .select()
      .from(debts)
      .where(and(eq(debts.isRecurring, true), eq(debts.status, 'activa'), isNull(debts.parentDebtId)));

    for (const debt of recurringDebts) {
      if (debt.periodicity == null) continue;

      const from = debt.reserveLastAccrualDate
        ? addDays(parseISODate(debt.reserveLastAccrualDate), 1)
        : mostRecentCutoffOnOrBefore(parseISODate(debt.startDate));

      const cutoffs = computeOccurrences(CUTOFF_CONFIG, from, from, today);
      if (cutoffs.length === 0) continue;

      const children = await tx.select().from(debts).where(eq(debts.parentDebtId, debt.id));
      const currentTotalCents =
        children.length > 0 ? deriveParentMonthlyPaymentCents(children) : debt.monthlyPaymentCents;
      const perCutoffCents = computeReserveAccrualCents(debt.periodicity, currentTotalCents);

      let buffer = debt.reserveAccumulatedCents;
      for (const cutoff of cutoffs) {
        const deducted = Math.max(0, perCutoffCents - buffer);
        buffer = Math.max(0, buffer - perCutoffCents);
        if (deducted > 0) {
          await tx.insert(debtPayments).values({
            debtId: debt.id,
            amountCents: deducted,
            occurrenceDate: formatOccurrenceDate(cutoff),
            status: 'confirmed',
            confirmedAt: today.toISOString(),
          });
        }
      }

      await tx
        .update(debts)
        .set({
          reserveAccumulatedCents: buffer,
          reserveLastAccrualDate: formatOccurrenceDate(cutoffs[cutoffs.length - 1]),
        })
        .where(eq(debts.id, debt.id));
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
