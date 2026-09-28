import { useCallback, useEffect, useState } from 'react';

import { confirmPayment, deriveStatus, listPaymentsForDebt } from '@/dao/debtPaymentsDao';
import {
  createChildDebt,
  createDebt,
  deleteDebt,
  listDebtsResolved,
  updateDebt,
  type NewChildDebt,
  type ResolvedDebt,
} from '@/dao/debtsDao';
import { createRecurringTransaction } from '@/dao/recurringTransactionsDao';
import { db } from '@/db/client';
import type { NewDebt } from '@/models';
import { runReconciliation } from '@/services/recurring/reconciliation';

export interface DebtWithPayments extends ResolvedDebt {
  payments: Awaited<ReturnType<typeof listPaymentsForDebt>>;
}

export function useDebts() {
  const [debts, setDebts] = useState<DebtWithPayments[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listDebtsResolved();
      const withPayments = await Promise.all(
        rows.map(async (debt) => ({ ...debt, payments: await listPaymentsForDebt(debt.id) })),
      );
      setDebts(withPayments);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const today = new Date();

  return {
    debts,
    loading,
    refresh,
    create: async (input: NewDebt, autoPayment?: { paymentDay: number; accountId: number }) => {
      const debt = await createDebt(input);
      if (autoPayment) {
        await createRecurringTransaction({
          kind: 'debt_payment',
          description: `Pago ${debt.name}`,
          debtId: debt.id,
          accountId: autoPayment.accountId,
          amountCents: debt.monthlyPaymentCents,
          recurrenceType: 'MONTHLY_DAY',
          recurrenceConfig: { type: 'MONTHLY_DAY', day: autoPayment.paymentDay },
          anchorDate: debt.startDate,
        });
        // Materialize this month's payment right away if the day already passed.
        await runReconciliation(db, new Date());
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
    confirmPayment: async (paymentId: number, accountId?: number) => {
      await confirmPayment(paymentId, accountId);
      await refresh();
    },
    pendingPayments: debts.flatMap((debt) =>
      debt.payments
        .filter((p) => p.status === 'scheduled')
        .map((p) => ({
          ...p,
          debtName: debt.name,
          derivedStatus: deriveStatus(p.status, p.occurrenceDate, today),
        })),
    ),
  };
}
