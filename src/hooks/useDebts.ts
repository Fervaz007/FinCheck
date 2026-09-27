import { useCallback, useEffect, useState } from 'react';

import { confirmPayment, deriveStatus, listPaymentsForDebt } from '@/dao/debtPaymentsDao';
import { createDebt, deleteDebt, listDebts, updateDebt } from '@/dao/debtsDao';
import type { Debt, NewDebt } from '@/models';

export interface DebtWithPayments extends Debt {
  payments: Awaited<ReturnType<typeof listPaymentsForDebt>>;
}

export function useDebts() {
  const [debts, setDebts] = useState<DebtWithPayments[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listDebts();
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
    create: async (input: NewDebt) => {
      await createDebt(input);
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
