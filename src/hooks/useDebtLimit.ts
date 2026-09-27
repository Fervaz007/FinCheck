import { useCallback, useEffect, useState } from 'react';

import { getSettings, updateDebtLimitPct } from '@/dao/settingsDao';

export function useDebtLimit() {
  const [debtLimitPct, setDebtLimitPct] = useState(30);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const settings = await getSettings();
      setDebtLimitPct(settings.debtLimitPct);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    debtLimitPct,
    loading,
    setDebtLimitPct: async (pct: number) => {
      await updateDebtLimitPct(pct);
      await refresh();
    },
  };
}
