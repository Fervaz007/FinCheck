## 1. Fixed monthly income helper

- [x] 1.1 Create `src/services/financial/fixedIncome.ts` with a pure `occurrencesPerMonth(config: RecurrenceConfig): number` (SEMIMONTHLY_FIXED→2, WEEKLY→52/12, MONTHLY_DAY/MONTHLY_LAST_DAY→1, MONTHLY_INTERVAL→1/every, DAILY_INTERVAL→30/intervalDays, ANNUAL→1/12) and `computeFixedMonthlyIncomeCents(incomes: {amountCents:number; recurrenceConfig:RecurrenceConfig}[]): number` = round(Σ amountCents × occurrencesPerMonth).
- [x] 1.2 Add a DAO helper to list active recurring INCOME transactions (filter `listActiveRecurringTransactions` to `kind==='income'`, or a dedicated query) for feeding 1.1.
- [x] 1.3 Add unit tests for `occurrencesPerMonth` (each frequency) and `computeFixedMonthlyIncomeCents` (the mixed-frequency example from the spec), mirroring existing service-test style.

## 2. Per-group standing monthly obligation

- [x] 2.1 Add a helper (e.g. in `debtsDao.ts`) that returns, by `budgetGroupLabel`, the sum of monthly cost of active RECURRING parent/standalone debts — monthly cost = `computeReserveAccrualCents(periodicity, periodTotal) × 2` (parent uses live derived children total). Exclude non-recurring debts and children.
- [x] 2.2 Unit-test it: a mensual $3,000 debt contributes $3,000; a bimestral $1,000 debt contributes $500; a parent uses its children sum.

## 3. Rework budget compliance + health onto fixed income

- [x] 3.1 Update `computeBudgetCompliance` (`budget.ts`) so the base is the fixed monthly income and `actualByGroup` carries the standing monthly obligations from 2.1 (occupancy updates immediately). Keep the row shape (`allocatedCents`, `actualCents`, `withinBudget`).
- [x] 3.2 Update `computeFinancialHealth` (`health.ts`): remove the `availableCents` parameter and the negative-balance → crítico override; status = worst monitored group (obligation vs fixed-income limit); keep the no-monitored-rows `sin_limite` path and add/garantee a "no fixed income" unconfigured state (see 3.3).
- [x] 3.3 Define the unconfigured state: when fixed monthly income is 0, health returns the unconfigured status and the dashboard shows "configura tus ingresos fijos" instead of computing $0 limits.
- [x] 3.4 Update `useDashboardSummary.ts` to compute fixed monthly income (1.1/1.2) and per-group standing obligations (2.1), feed them into compliance (3.1) and health (3.2); stop passing `availableCents` to health. Keep `globalAvailableCents` and the monthly breakdown unchanged.

## 4. Dashboard UI

- [x] 4.1 In `index.tsx`, ensure the per-section card reads the new occupancy/limit (ocupado = standing obligation, límite = fixed-income × pct) and renders the unconfigured hint when there is no fixed income.
- [x] 4.2 Confirm the card refreshes on focus (it rides `useDashboardSummary`'s existing `useFocusEffect`); if a stale-data gap remains, fix it so adding a debt from Deudas is reflected on returning to Inicio.
- [x] 4.3 Update the health label/subtitle wording if needed to reflect the fixed-income basis and the unconfigured state.

## 5. Simulator consistency

- [x] 5.1 Update `simulador.tsx` / `simulateAMesesPurchase` to use fixed monthly income (× group pct) as the group capacity, matching the dashboard, instead of the active month's materialized income.
- [x] 5.2 Update `simulator.test.ts` for the new base.

## 6. Initial-setup gate, monthly-income display, income timing

- [x] 6.1 In `deudas.tsx`, extend the debt-creation gate: require an active rule AND at least one active recurring income. When blocked, the alert names the missing piece (regla activa → Reglas Presupuestarias; ingreso recurrente → Movimientos). Use the recurring-income list helper from task 1.2.
- [x] 6.2 In `index.tsx`, add a card showing the fixed monthly income total ("Ingresos mensuales") from `computeFixedMonthlyIncomeCents`; it updates on focus as recurring streams are added. (Per-stream breakdown optional.)
- [x] 6.3 Verify recurring income only hits Disponible on an actual payday: add a test asserting that a quincenal recurring income anchored to a non-cutoff day generates no `income` row (Disponible unchanged) that day, but does generate one when anchored to / reaching a cutoff. No mechanism change expected — just confirm and lock it with a test.

## 7. Tests and verification

- [x] 7.1 Update `budget.test.ts` and `health.test.ts` for the fixed-income base and the removed `availableCents` override (new signatures); add the "withdrawal does not worsen health" and "limit stable across withdrawals" scenarios.
- [x] 7.2 Run `npx tsc --noEmit` and `npx jest`; fix all breakage.
- [ ] 7.3 Manually verify in the app: set up recurring incomes (quincenal nómina, etc.) → budget limits reflect the monthly total and Home shows the monthly-income card; add a debt to "necesidades" → ocupado updates immediately on Inicio; withdraw cash (register an expense) → Disponible drops but health does NOT flip to crítico; try to add a debt with no recurring income → blocked with the right message; with no recurring income → budget/health show the unconfigured hint.
