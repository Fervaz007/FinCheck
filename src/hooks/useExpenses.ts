import { useCallback, useEffect, useState } from 'react';

import { createExpense, deleteExpense, listExpensesForMonth, updateExpense } from '@/dao/expensesDao';
import type { Expense, NewExpense } from '@/models';

import { useAppStore } from './useAppStore';

export function useExpenses(categoryId?: number) {
  const { activeMonth } = useAppStore();
  const [rows, setRows] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listExpensesForMonth(activeMonth.year, activeMonth.month, categoryId));
    } finally {
      setLoading(false);
    }
  }, [activeMonth.year, activeMonth.month, categoryId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const total = rows.reduce((sum, r) => sum + r.amountCents, 0);

  return {
    expenses: rows,
    totalCents: total,
    loading,
    refresh,
    create: async (input: NewExpense) => {
      await createExpense(input);
      await refresh();
    },
    update: async (id: number, input: Partial<NewExpense>) => {
      await updateExpense(id, input);
      await refresh();
    },
    remove: async (id: number) => {
      await deleteExpense(id);
      await refresh();
    },
  };
}
