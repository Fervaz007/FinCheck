import { useCallback, useEffect, useState } from 'react';

import { activateBudgetRule, createBudgetRule, listBudgetRules } from '@/dao/budgetRulesDao';
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

  return {
    rules,
    activeRule: rules.find((r) => r.isActive) ?? null,
    loading,
    refresh,
    create: async (name: string, allocations: BudgetAllocation[], isCustom = true) => {
      await createBudgetRule(name, allocations, isCustom);
      await refresh();
    },
    activate: async (id: number) => {
      await activateBudgetRule(id);
      await refresh();
    },
  };
}
