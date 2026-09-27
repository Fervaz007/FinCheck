import { useCallback, useEffect, useState } from 'react';

import {
  createRecurringTransaction,
  deactivateRecurringTransaction,
  listActiveRecurringTransactions,
} from '@/dao/recurringTransactionsDao';
import { db } from '@/db/client';
import type { NewRecurringTransaction } from '@/models';
import { runReconciliation } from '@/services/recurring/reconciliation';

export function useRecurringTransactions() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof listActiveRecurringTransactions>>>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listActiveRecurringTransactions());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    items,
    loading,
    refresh,
    create: async (input: NewRecurringTransaction) => {
      await createRecurringTransaction(input);
      // Materialize immediately if today already matches an occurrence,
      // instead of making the user wait for the next app restart.
      await runReconciliation(db, new Date());
      await refresh();
    },
    deactivate: async (id: number) => {
      await deactivateRecurringTransaction(id);
      await refresh();
    },
  };
}
