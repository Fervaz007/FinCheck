import { useCallback, useEffect, useState } from 'react';

import { listAccountsWithBalances } from '@/dao/accountsDao';
import { getActiveBudgetRule } from '@/dao/budgetRulesDao';
import { listCategories } from '@/dao/categoriesDao';
import { listConfirmedPaymentsForMonth } from '@/dao/debtPaymentsDao';
import { listExpensesForMonth } from '@/dao/expensesDao';
import { listIncomeForMonth } from '@/dao/incomeDao';
import { upsertMonthlySummary } from '@/dao/monthlySummariesDao';
import { getSettings } from '@/dao/settingsDao';
import { db } from '@/db/client';
import { computeFinancialHealth, type HealthResult } from '@/services/financial/health';
import { projectAccountMovements, sumProjectedMovements } from '@/services/recurring/projection';

import { useAppStore } from './useAppStore';

export interface DashboardSummary {
  incomeTotalCents: number;
  expenseTotalCents: number;
  debtPaymentTotalCents: number;
  savingsTotalCents: number;
  availableCents: number;
  realBalanceCents: number;
  projectedBalanceCents: number;
  health: HealthResult;
}

export function useDashboardSummary() {
  const { activeMonth } = useAppStore();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { year, month } = activeMonth;
      const [incomeRows, expenseRows, categories, settings, accounts, confirmedPayments, activeRule] =
        await Promise.all([
          listIncomeForMonth(year, month),
          listExpensesForMonth(year, month),
          listCategories(),
          getSettings(),
          listAccountsWithBalances(),
          listConfirmedPaymentsForMonth(year, month),
          getActiveBudgetRule(),
        ]);

      const categoryById = new Map(categories.map((c) => [c.id, c]));
      const incomeTotalCents = incomeRows.reduce((sum, r) => sum + r.amountCents, 0);
      const expenseTotalCents = expenseRows.reduce((sum, r) => sum + r.amountCents, 0);
      const debtPaymentTotalCents = confirmedPayments.reduce((sum, r) => sum + r.amountCents, 0);
      const savingsTotalCents = expenseRows
        .filter((r) => r.categoryId != null && categoryById.get(r.categoryId)?.budgetGroup === 'ahorro')
        .reduce((sum, r) => sum + r.amountCents, 0);
      const availableCents = incomeTotalCents - expenseTotalCents - debtPaymentTotalCents;
      const realBalanceCents = accounts.reduce((sum, a) => sum + a.balanceCents, 0);

      const today = new Date();
      const horizon = new Date(year, month, 0); // last day of active month
      const projections = await Promise.all(
        accounts.map((a) => projectAccountMovements(db, a.id, today, horizon)),
      );
      const projectedBalanceCents =
        realBalanceCents + projections.reduce((sum, p) => sum + sumProjectedMovements(p), 0);

      const health = computeFinancialHealth(
        {
          incomeCents: incomeTotalCents,
          debtPaymentsCents: debtPaymentTotalCents,
          savingsCents: savingsTotalCents,
          availableCents,
        },
        { debtLimitPct: settings.debtLimitPct, minSavingsRatioPct: 10, attentionMarginPct: 5 },
      );

      setSummary({
        incomeTotalCents,
        expenseTotalCents,
        debtPaymentTotalCents,
        savingsTotalCents,
        availableCents,
        realBalanceCents,
        projectedBalanceCents,
        health,
      });

      // Snapshot this month's numbers + the configuration that produced them
      // (design.md: history must stay stable if the user later changes rules).
      await upsertMonthlySummary({
        year,
        month,
        incomeTotalCents,
        expenseTotalCents,
        debtPaymentTotalCents,
        savingsTotalCents,
        availableCents,
        budgetRuleIdSnapshot: activeRule?.id ?? null,
        debtLimitPctSnapshot: settings.debtLimitPct,
        healthStatusSnapshot: health.status,
      });
    } finally {
      setLoading(false);
    }
  }, [activeMonth.year, activeMonth.month]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { summary, loading, refresh };
}
