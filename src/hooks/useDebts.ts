import { addDays } from 'date-fns';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { insertConfirmedPayment } from '@/dao/debtPaymentsDao';
import {
  createChildDebt,
  createDebt,
  deleteDebt,
  listDebtsResolved,
  updateDebt,
  type NewChildDebt,
  type ResolvedDebt,
} from '@/dao/debtsDao';
import { db } from '@/db/client';
import type { NewDebt } from '@/models';
import { computeOccurrences } from '@/services/recurring/computeOccurrences';
import { formatOccurrenceDate, runReconciliation } from '@/services/recurring/reconciliation';

export function useDebts() {
  const [debts, setDebts] = useState<ResolvedDebt[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setDebts(await listDebtsResolved());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // The drawer never unmounts Deudas/Inicio, and debts change from other screens;
  // refetch on focus so each screen stays current.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const today = new Date();

  return {
    debts,
    loading,
    refresh,
    create: async (input: NewDebt) => {
      const debt = await createDebt(input);
      if (input.isRecurring) {
        // Reconciliation generates the per-quincena auto-confirmed deductions,
        // counting the current period immediately.
        await runReconciliation(db, new Date());
      } else {
        // Non-recurring: deduct the full total once, offset by any apartado inicial.
        const deducted = Math.max(0, debt.monthlyPaymentCents - (debt.reserveAccumulatedCents ?? 0));
        if (deducted > 0) {
          await insertConfirmedPayment({
            debtId: debt.id,
            amountCents: deducted,
            occurrenceDate: debt.startDate,
          });
        }
      }
      await refresh();
    },
    createChild: async (input: NewChildDebt) => {
      await createChildDebt(input);
      await refresh();
    },
    update: async (id: number, input: Partial<NewDebt>) => {
      await updateDebt(id, input);
      await refresh();
    },
    remove: async (id: number) => {
      await deleteDebt(id);
      await refresh();
    },
    // Informational upcoming-payment reminders — the money is deducted
    // automatically on the quincena cutoffs, so there is nothing to confirm.
    upcomingReminders: debts
      .filter((d) => d.isRecurring && d.dueDate)
      .map((d) => {
        const day = Number(d.dueDate);
        const [next] = computeOccurrences(
          { type: 'MONTHLY_DAY', day },
          today,
          addDays(today, 1),
          addDays(today, 400),
        );
        return {
          id: d.id,
          debtName: d.name,
          day,
          nextDate: next ? formatOccurrenceDate(next) : null,
          amountCents: d.monthlyPaymentCents,
        };
      })
      .filter((r): r is { id: number; debtName: string; day: number; nextDate: string; amountCents: number } =>
        r.nextDate != null,
      ),
  };
}
