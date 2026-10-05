import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { listRecurringDebtsResolved } from '@/dao/debtsDao';

export function useDebtReserves() {
  const [debts, setDebts] = useState<Awaited<ReturnType<typeof listRecurringDebtsResolved>>>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setDebts(await listRecurringDebtsResolved());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Reserves change (accrue/reset) from Deudas, a different screen — refetch on focus.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { debts, loading, refresh };
}
