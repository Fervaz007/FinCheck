import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import {
  activateBudgetRule,
  createBudgetRule,
  deleteBudgetRule,
  listBudgetRules,
  updateBudgetRule,
} from '@/dao/budgetRulesDao';
import type { BudgetAllocation } from '@/services/financial/budget';

export function useBudgetRules() {
  const [rules, setRules] = useState<Awaited<ReturnType<typeof listBudgetRules>>>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRules(await listBudgetRules());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // The drawer keeps every screen mounted, so a plain mount-effect fetch goes
  // stale the moment the active rule changes from a different screen.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return {
    rules,
    activeRule: rules.find((r) => r.isActive) ?? null,
    loading,
    refresh,
    create: async (name: string, allocations: BudgetAllocation[], isCustom = true) => {
      await createBudgetRule(name, allocations, isCustom);
      await refresh();
    },
    update: async (id: number, name: string, allocations: BudgetAllocation[]) => {
      await updateBudgetRule(id, name, allocations);
      await refresh();
    },
    remove: async (id: number) => {
      await deleteBudgetRule(id);
      await refresh();
    },
    activate: async (id: number) => {
      await activateBudgetRule(id);
      await refresh();
    },
  };
}
