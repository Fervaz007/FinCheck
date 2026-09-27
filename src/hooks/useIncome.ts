import { useCallback, useEffect, useState } from 'react';

import { createIncome, deleteIncome, listIncomeForMonth, updateIncome } from '@/dao/incomeDao';
import type { Income, NewIncome } from '@/models';

import { useAppStore } from './useAppStore';

export function useIncome() {
  const { activeMonth } = useAppStore();
  const [rows, setRows] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listIncomeForMonth(activeMonth.year, activeMonth.month));
    } finally {
      setLoading(false);
    }
  }, [activeMonth.year, activeMonth.month]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const total = rows.reduce((sum, r) => sum + r.amountCents, 0);

  return {
    income: rows,
    totalCents: total,
    loading,
    refresh,
    create: async (input: NewIncome) => {
      await createIncome(input);
      await refresh();
    },
    update: async (id: number, input: Partial<NewIncome>) => {
      await updateIncome(id, input);
      await refresh();
    },
    remove: async (id: number) => {
      await deleteIncome(id);
      await refresh();
    },
  };
}
