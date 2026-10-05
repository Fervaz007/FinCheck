import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { getActiveBudgetRule } from '@/dao/budgetRulesDao';
import { listConfirmedPaymentsForMonth, sumAllConfirmedPaymentsCents } from '@/dao/debtPaymentsDao';
import { sumMonthlyObligationByGroup } from '@/dao/debtsDao';
import { listExpensesForMonth, sumAllExpensesCents } from '@/dao/expensesDao';
import { listIncomeForMonth, sumAllIncomeCents } from '@/dao/incomeDao';
import { upsertMonthlySummary } from '@/dao/monthlySummariesDao';
import { listActiveRecurringIncome } from '@/dao/recurringTransactionsDao';
import { computeBudgetCompliance, type BudgetComplianceRow } from '@/services/financial/budget';
import { computeFixedMonthlyIncomeCents } from '@/services/financial/fixedIncome';
import { computeFinancialHealth, type HealthResult } from '@/services/financial/health';
import type { RecurrenceConfig } from '@/services/recurring/recurrenceTypes';

import { useAppStore } from './useAppStore';

export interface DashboardSummary {
  incomeTotalCents: number;
  expenseTotalCents: number;
  debtPaymentTotalCents: number;
  availableCents: number;
  /** All-time, month-independent: all income − all expenses − all confirmed debt payments. */
  globalAvailableCents: number;
  /** Stable budget base: sum of recurring income normalized to a month. */
  fixedMonthlyIncomeCents: number;
  health: HealthResult;
  compliance: BudgetComplianceRow[];
}

export function useDashboardSummary() {
  const { activeMonth } = useAppStore();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { year, month } = activeMonth;
      const [
        incomeRows,
        expenseRows,
        confirmedPayments,
        activeRule,
        allIncomeCents,
        allExpensesCents,
        allConfirmedPaymentsCents,
        recurringIncome,
        obligationsByGroup,
      ] = await Promise.all([
        listIncomeForMonth(year, month),
        listExpensesForMonth(year, month),
        listConfirmedPaymentsForMonth(year, month),
        getActiveBudgetRule(),
        sumAllIncomeCents(),
        sumAllExpensesCents(),
        sumAllConfirmedPaymentsCents(),
        listActiveRecurringIncome(),
        sumMonthlyObligationByGroup(),
      ]);

      const incomeTotalCents = incomeRows.reduce((sum, r) => sum + r.amountCents, 0);
      const expenseTotalCents = expenseRows.reduce((sum, r) => sum + r.amountCents, 0);
      const debtPaymentTotalCents = confirmedPayments.reduce((sum, r) => sum + r.amountCents, 0);
      const availableCents = incomeTotalCents - expenseTotalCents - debtPaymentTotalCents;
      // Month-independent: the user's true current money across all months.
      const globalAvailableCents = allIncomeCents - allExpensesCents - allConfirmedPaymentsCents;

      // Stable budget base — the fixed monthly income, independent of spending/withdrawals.
      const fixedMonthlyIncomeCents = computeFixedMonthlyIncomeCents(
        recurringIncome.map((r) => ({
          amountCents: r.amountCents,
          recurrenceConfig: r.recurrenceConfig as RecurrenceConfig,
        })),
      );

      const monitoredAllocations = (activeRule?.allocations ?? []).filter((a) => a.isMonitored);
      const compliance = computeBudgetCompliance(
        monitoredAllocations,
        obligationsByGroup,
        fixedMonthlyIncomeCents,
      );

      const health = computeFinancialHealth(compliance, fixedMonthlyIncomeCents, {
        attentionMarginPct: 5,
      });

      setSummary({ incomeTotalCents, expenseTotalCents, debtPaymentTotalCents, availableCents, globalAvailableCents, fixedMonthlyIncomeCents, health, compliance });

      // Snapshot this month's numbers + the configuration that produced them
      // (design.md: history must stay stable if the user later changes rules).
      await upsertMonthlySummary({
        year,
        month,
        incomeTotalCents,
        expenseTotalCents,
        debtPaymentTotalCents,
        savingsTotalCents: 0,
        availableCents,
        budgetRuleIdSnapshot: activeRule?.id ?? null,
        debtLimitPctSnapshot: null,
        healthStatusSnapshot: health.status,
      });
    } finally {
      setLoading(false);
    }
  }, [activeMonth.year, activeMonth.month]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Inicio/Simulador read this summary, but income/expenses/debts/rules all
  // change from other screens the drawer never unmounts — refetch on focus.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { summary, loading, refresh };
}
