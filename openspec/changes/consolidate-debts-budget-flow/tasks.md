## 1. Schema changes

- [x] 1.1 Add `isDebtLimit` boolean (default `false`) to `budgetRuleAllocations`.
- [x] 1.2 Add `budgetGroupLabel` (text, nullable), `periodicity` (`'mensual' | 'bimestral'`, nullable), `isRecurring` (boolean, default `false`), `reserveAccumulatedCents` (integer, default `0`), `reserveLastAccrualDate` (text, nullable) to `debts`.
- [x] 1.3 Drop `categoryId` from `income`, `expenses`, `recurringTransactions`; drop `accountId` from `expenses`, `debtPayments`; drop `settings.debtLimitPct`.
- [x] 1.4 Drop the `categories` and `commitments` tables entirely.
- [x] 1.5 Generate and apply the Drizzle migration; verify the app boots against the migrated local SQLite DB.

## 2. Debt-limit designation (budget-rules)

- [x] 2.1 In `reglas-presupuestarias.tsx`, add a control on each allocation row to mark it as "usar como límite de endeudamiento", enforcing at most one marked row per rule on save.
- [x] 2.2 Update `budgetRulesDao.ts` to persist/read `isDebtLimit` and to expose the active rule's debt-limit row (or `null`) via `getActiveBudgetRule`/a new helper.
- [x] 2.3 Rework `useDebtLimit.ts` (or replace it) to derive the percentage from the active rule's debt-limit row instead of `settings.debtLimitPct`, returning `null` when undefined.
- [x] 2.4 Update `debtLimit.ts` (`computeDebtCapacity`) and `health.ts` (`computeFinancialHealth`) to accept a nullable `debtLimitPct` and produce the explicit "undefined" states described in specs `debt-limit` and `financial-health`.
- [x] 2.5 Remove `savingsRatioPct`/`minSavingsRatioPct` from `financial-health` per design decision #5; update `computeFinancialHealth`'s signature and status logic accordingly.
- [x] 2.6 Redesign the "Reglas existentes" list (in both `reglas-presupuestarias.tsx` and `presupuesto.tsx`) into a clearly differentiated layout instead of the current single-line join.
- [x] 2.7 Remove the "+ Usar 50/30..."/"+ Usar 40/40/20..." preset buttons and the "¿Cuánto separar de este ingreso?" card from `presupuesto.tsx`.

## 3. Deudas: Tipo, Periodicidad, recurrence, reserves (debts + debt-reserves)

- [x] 3.1 Add the "¿Padre o Normal?" selector to `NewDebtForm` in `deudas.tsx` (checkbox or tabs), gating which fields are shown.
- [x] 3.2 Add Tipo (select sourced from the active rule's current allocation labels), Periodicidad (`mensual`/`bimestral` only), "¿Es recurrente?" checkbox, and "Apartado inicial" fields to both the parent and standalone debt forms.
- [x] 3.3 Remove the "Cuenta de la que se paga" field, `hasAutoPayment` logic, and its validation from `NewDebtForm`; remove the old auto-payment creation path in `useDebts.ts`'s `create`.
- [x] 3.4 Enforce the hard validation: block debt creation (with an explanatory `Alert`) when there is no active rule or the active rule has no debt-limit row (spec `debts` — "Debt creation requires an active budget rule...").
- [x] 3.5 Update `debtsDao.createDebt`/`createChildDebt` to persist `budgetGroupLabel`, `periodicity`, `isRecurring`, and seed `reserveAccumulatedCents` from the starting-reserve input; confirm child debts never receive these fields (spec `debts` — child debt requirement).
- [x] 3.6 Update `recurringTransactions` creation for a recurring debt so it no longer requires/stores an `accountId`; confirm `reconciliation.ts`'s existing live re-derivation of a parent's amount (lines ~58-64) still applies unchanged.
- [x] 3.7 Implement `computeReserveAccrualCents(periodicity, currentTotalCents)` in a new module (e.g. `src/services/financial/debtReserves.ts`) per design decision #2.
- [x] 3.8 Implement the reserve-accrual catch-up step (walking `SEMIMONTHLY_FIXED` cutoffs between `reserveLastAccrualDate` and today via `computeOccurrences`, using the live parent-derived total where applicable) and wire it into the app-open reconciliation flow alongside `runReconciliation`.
- [x] 3.9 Update `confirmPayment` (remove its `accountId` parameter entirely) so confirming a payment also resets `reserveAccumulatedCents` to `0` and clears `reserveLastAccrualDate` for that debt, in the same transaction.
- [x] 3.10 Update `deudas.tsx`'s "Confirmar pago" button to call the new no-account `confirmPayment` signature.

## 4. New "Apartados" screen

- [x] 4.1 Create `src/app/(drawer)/apartados.tsx` listing only parent/standalone debts where `isRecurring = true`, showing periodicity, per-cutoff share, and accumulated reserve vs. the current total due.
- [x] 4.2 Add a DAO/hook (e.g. `useDebtReserves`) to fetch recurring debts with their live derived totals and reserve state for this screen.
- [x] 4.3 Add "Apartados" to the drawer (`_layout.tsx`) and remove "Compromisos" and "Recurrentes" entries.

## 5. Remove Recurrentes screen; move recurring income into Movimientos

- [x] 5.1 Delete `src/app/(drawer)/recurrentes.tsx`.
- [x] 5.2 In `movimientos.tsx`'s income form, add "¿Es recurrente?" plus the frequency/anchor-date controls (reusing the same options/components `recurrentes.tsx` used), wired to `createRecurringTransaction` with `kind: 'income'`.
- [x] 5.3 Verify `reconciliation.ts`'s existing income-occurrence generation continues to work unchanged from this new entry point.
- [x] 5.4 Confirm/document the decision from design Open Question 2: no recurring-expense path is added to Movimientos in this change (periodic expenses are modeled as "deuda normal" instead).

## 6. Remove Compromisos

- [x] 6.1 Delete `src/app/(drawer)/compromisos.tsx`, `src/hooks/useCommitments.ts`, `src/dao/commitmentsDao.ts`, `src/services/financial/commitments.ts`, and `src/services/financial/__tests__/commitments.test.ts`.
- [x] 6.2 Search the codebase for any remaining `commitments`/`useCommitments` references and remove them.

## 7. Remove Categorías

- [x] 7.1 Delete `src/app/(drawer)/categorias.tsx`, `src/hooks/useCategories.ts`, `src/dao/categoriesDao.ts`.
- [x] 7.2 Remove the category selector from `movimientos.tsx`'s income and expense forms, and from the (now-removed) recurring form.
- [x] 7.3 Update `useDashboardSummary.ts` to stop computing `savingsTotalCents` from `categoryById`/`budgetGroup`; remove `savingsTotalCents` from `DashboardSummary` per design decision #5 (or replace with a documented alternative if the user resolves Open Question 3 differently before implementation).
- [x] 7.4 Search the codebase for any remaining `categoryId`/`categories`/`useCategories` references and remove them.

## 8. Simplify Cuentas and Movimientos accounts

- [x] 8.1 Rework `accountsDao.ts`: remove `getAccountBalanceCents` and `listAccountsWithBalances`'s computed-balance behavior; expose accounts with their manually-declared `initialBalanceCents` directly, and add an update path for editing that balance at any time.
- [x] 8.2 Update `cuentas.tsx` to allow editing an existing account's declared balance (not just setting it at creation).
- [x] 8.3 Remove the account selector and its "required" validation from `movimientos.tsx`'s expense form; keep it (optional, informational) on the income form.
- [x] 8.4 Update `expensesDao.ts`/`incomeDao.ts` to match the schema changes from task 1.3 (drop `accountId` handling for expenses; keep it as an optional, non-computed field for income).
- [x] 8.5 Update `debtPaymentsDao.ts` to remove `accountId` handling entirely (matches task 3.9).

## 9. Dashboard and Presupuesto rework

- [x] 9.1 Rework `computeBudgetCompliance` (`budget.ts`) to group actual amounts by each debt's live `budgetGroupLabel` matched against the active rule's current allocation labels, instead of the hardcoded `necesidades/deudas/ahorro/ocio` mapping.
- [x] 9.2 Move the per-type compliance card from `presupuesto.tsx` into `index.tsx` (Inicio), per spec `dashboard`.
- [x] 9.3 Remove `realBalanceCents`/`projectedBalanceCents` computation from `useDashboardSummary.ts`; remove `src/services/recurring/projection.ts` if nothing else uses it; update the Inicio "SALDO" card to show only the pooled `availableCents` figure.
- [x] 9.4 Update `monthlySummariesDao`/`upsertMonthlySummary` calls if their shape depended on removed fields (`debtLimitPctSnapshot` sourcing, `savingsTotalCents`).

## 10. Simulador

- [x] 10.1 Add the "a meses" / "a contado" mode toggle and the Tipo selector (shown only in "a meses" mode) to `simulador.tsx`.
- [x] 10.2 Update `simulateNewDebt` (`simulator.ts`) to branch: "a meses" computes remaining capacity for the selected Tipo (rule percentage of income minus current commitments tagged with that Tipo); "a contado" compares the price directly against `availableCents`.
- [x] 10.3 Update the result UI in `simulador.tsx` to reflect whichever mode was used.

## 11. Tests and cleanup

- [x] 11.1 Update `src/services/financial/__tests__/debtLimit.test.ts`, `health.test.ts`, `budget.test.ts` for the new nullable debt-limit and dropped savings-ratio signatures.
- [x] 11.2 Update `src/services/financial/__tests__/debtHierarchy.test.ts` if child-debt derivation helpers changed shape. (No change needed — derivation helpers unchanged.)
- [x] 11.3 Add tests for `computeReserveAccrualCents` and the reserve catch-up accrual logic (mirroring the style of `src/services/recurring/__tests__/computeOccurrences.test.ts`).
- [x] 11.4 Update `src/dao/__tests__/debtPaymentsDao.integration.test.ts` for the no-`accountId` `confirmPayment` signature and the reserve-reset side effect.
- [x] 11.5 Update `src/test-utils/sqliteTestDb.ts` if it seeds `categories`/`commitments` or old schema columns.
- [x] 11.6 Run the full test suite and fix any remaining breakage from removed tables/columns. (9 suites / 37 tests passing.)
- [ ] 11.7 Manually walk the golden path in the running app: create a rule and mark at least one row monitored → create a parent debt with $0 fields and a hija → confirm Apartados accrues and resets on payment confirmation → register a recurring income in Movimientos → verify Inicio's per-type compliance and pooled available total.

## 12. Fix stale data on screen refocus (found during manual testing)

- [x] 12.1 Add `useFocusEffect` (from `expo-router`/`@react-navigation/native`) to `useBudgetRules` so it refetches whenever its screen regains focus — this is the hook that caused Deudas to keep blocking debt creation after activating a rule from another screen.
- [x] 12.2 Audit every other hook used across more than one drawer screen (`useDebts`, `useDashboardSummary`, `useDebtLimit`, `useDebtReserves`, `useExpenses`/income-related hooks, and any surviving after task 13) for the same staleness risk; add the same `useFocusEffect` refetch wherever a screen's data can be changed from a different screen and then revisited without a full app reload. (`useDebtLimit` is currently unused by any screen — nothing to fix there; `useExpenses`/`useIncome` are only ever used together within `movimientos.tsx` itself, not across screens, so left as-is. Fixed: `useDebts`, `useDashboardSummary`, `useDebtReserves`.)
- [ ] 12.3 Manually verify the specific repro: create/activate a budget rule from Reglas Presupuestarias, navigate back to Deudas without reloading the app, and confirm it now reflects the active rule immediately.

## 13. Remove Cuentas/accounts entirely; income origin becomes free text

- [x] 13.1 Drop the `accounts` table from `src/db/schema.ts`; change `income.accountId` (FK) into a free-text nullable `origin` column; regenerate/apply the Drizzle migration.
- [x] 13.2 Delete `src/app/(drawer)/cuentas.tsx`, `src/dao/accountsDao.ts`, `src/hooks/useAccounts.ts`.
- [x] 13.3 Remove the "Cuentas" entry from `src/app/(drawer)/_layout.tsx`.
- [x] 13.4 In `movimientos.tsx`'s income form, replace the account `ChipSelect`/picklist with a plain free-text `FormField` for "origin" (optional), wired to the new `income.origin` column.
- [x] 13.5 Update `incomeDao.ts` (and any other reference to `income.accountId`, e.g. in `reconciliation.ts`'s income-generation branch) to read/write `origin` instead of `accountId`. (`incomeDao.ts` itself is generic over `NewIncome`/`Partial<NewIncome>`, so no code change was needed there beyond the schema type change; `reconciliation.ts` and `recurringTransactions.accountId` → `origin` were updated.)
- [x] 13.6 Search the codebase for any remaining `accounts`/`accountsDao`/`useAccounts`/`accountId` references (outside of what's intentionally already removed in section 8) and remove them. (Zero matches remain, confirmed via grep.)
- [x] 13.7 Update `src/test-utils/sqliteTestDb.ts` and any DAO/integration tests that seed or reference the `accounts` table or `income.accountId`; run the full test suite and fix any remaining breakage. (9 suites / 37 tests passing.)

## 14. Generalize debt-limit into multi-group monitoring; add rule edit/delete

- [x] 14.1 Rename `budgetRuleAllocations.isDebtLimit` to `isMonitored` in `src/db/schema.ts`; drop the "at most one per rule" constraint entirely (any number, including zero, can be `true`); regenerate/apply the Drizzle migration. (Split into two migrations — `0007_drop_is_debt_limit.sql` then `0008_add_is_monitored.sql` — to avoid drizzle-kit's interactive rename-vs-drop+add TTY prompt, same technique as the earlier `origin` migration.)
- [x] 14.2 In `reglas-presupuestarias.tsx`, change the per-row checkbox label to "Monitorear este grupo" and remove the exclusivity logic (`setDebtLimitRow`'s "uncheck all others" behavior) so multiple rows can be checked independently; update the existing-rules list's "(límite de endeudamiento)" annotation to "(monitoreado)".
- [x] 14.3 Add `updateBudgetRule(id, name, allocations)` and `deleteBudgetRule(id)` to `budgetRulesDao.ts` (update replaces all allocation rows with the same 100%-sum + validation as create; delete is rejected — with a clear message — if the rule is currently active). Wire both into `useBudgetRules.ts`.
- [x] 14.4 Add edit and delete UI to `reglas-presupuestarias.tsx`'s existing-rules list (e.g. tapping an inactive rule still activates it; add an explicit "Editar" affordance that loads the rule into the creation form for editing instead of creating a new one, and a delete action per rule).
- [x] 14.5 In `deudas.tsx`, remove the `hasDebtLimitRow`/`canCreateDebts` gate entirely — debt creation only requires `Boolean(activeRule)` (for Tipo options), never any monitored row. Update the blocking alert copy accordingly.
- [x] 14.6 Rework `computeFinancialHealth` (`health.ts`) to take the list of monitored `BudgetComplianceRow`s (filtered from `computeBudgetCompliance`'s output) plus `availableCents`, and return the worst individual row's status across all monitored rows (`sin_limite` when there are none), per design.md decision #8.
- [x] 14.7 Update `useDashboardSummary.ts` to filter the `compliance` array passed to the Inicio card down to only allocations where `isMonitored` is true (unmonitored types must not appear in the "POR SECCIÓN" card at all), and to build the new `computeFinancialHealth` input from that filtered list.
- [x] 14.8 Delete `src/services/financial/debtLimit.ts`, `src/hooks/useDebtLimit.ts`, and `src/services/financial/__tests__/debtLimit.test.ts` — confirmed dead code, superseded by the generalized monitoring (see design.md decision #8).
- [x] 14.9 Update `src/services/financial/__tests__/health.test.ts` for the new `computeFinancialHealth` signature (list of monitored compliance rows instead of a single debt ratio/limit pair); add scenarios for "one of several monitored groups exceeds its limit" and "unmonitored group ignored."
- [x] 14.10 Search the codebase for any remaining `isDebtLimit`/`debtLimitPct`/"límite de endeudamiento" references and update/remove them. (Zero `isDebtLimit` matches remain. `debtLimitPctSnapshot` on `monthlySummaries` is a separately-named historical snapshot column, out of scope for this rename — left as-is, now always stored as `null`; `historial.tsx` still displays it, a pre-existing cosmetic artifact not touched per staying in scope.)
- [x] 14.11 Run the full test suite and `npx tsc --noEmit`; fix any remaining breakage. (`npx tsc --noEmit` clean; `npx jest` → 8 suites / 38 tests passing, one test's own expected value was wrong — fixed the test, not the implementation.)
- [ ] 14.12 Manually verify: mark two of three groups (e.g. "Necesidades" and "Deudas") as monitored, leave the third unmonitored; confirm Inicio's per-section card shows only the two monitored groups, and that exceeding either one changes the overall health status — not just when "Deudas" is exceeded. Also verify editing and deleting a rule works, and that deleting the active rule is blocked with a clear message.

## 15. Fix two bugs found during manual testing (persisted padre/normal kind; reserve seeding off-by-one)

- [x] 15.1 Add `isParent` (boolean, default `false`) to `debts` in `src/db/schema.ts`; regenerate/apply the Drizzle migration. (`drizzle/0009_lively_patch.sql`, plain ADD COLUMN — no TTY prompt needed this time.)
- [x] 15.2 In `deudas.tsx`'s debt-creation submit handler, persist `isParent: values.kind === 'padre'` on the created debt.
- [x] 15.3 In `deudas.tsx`'s render, gate the "+ Agregar hija" button (and the child-add form toggle) on `debt.isParent`, not on `hasChildren`. Keep the existing `hasChildren`-based display logic ("Saldo estimado" vs. "Saldo pendiente", etc.) unchanged — only the add-child affordance's visibility condition changes.
- [x] 15.4 In `deudas.tsx`'s debt-creation submit handler (and/or `debtsDao.createDebt`), seed `reserveLastAccrualDate` to the debt's `startDate` (creation date) instead of leaving it unset/`null`, per design.md decision #11.
- [x] 15.5 Add a test (in `src/services/financial/__tests__/debtReserves.test.ts` or the reconciliation integration test) covering: creating a recurring debt with a non-zero starting reserve on a date that is itself a `SEMIMONTHLY_FIXED` cutoff day does not accrue an extra cutoff immediately — the reserve equals exactly the seeded starting amount right after creation. (Added to `reconciliation.integration.test.ts`, matching its existing style; also fixed `src/test-utils/sqliteTestDb.ts`'s hand-rolled DDL, which was missing the new `is_parent` column and still had the pre-14 `is_debt_limit` column name instead of `is_monitored` — both were blocking any test that touches `debts`/`budget_rule_allocations`.)
- [x] 15.6 Run the full test suite and `npx tsc --noEmit`; fix any remaining breakage. (`npx tsc --noEmit` clean; `npx jest` → 8 suites / 39 tests passing.)
- [ ] 15.7 Manually verify both fixes in the running app: a "normal" debt never shows "+ Agregar hija"; creating a recurring debt today (whatever today's date is) with a starting reserve does not silently bump past that seeded amount in Apartados.

## 16. Global (month-independent) "Disponible" on Inicio

- [x] 16.1 Add all-time sum helpers (independent of month) for income, expenses, and confirmed debt payments — e.g. `sumAllIncomeCents()`/`sumAllExpensesCents()` in their DAOs and `sumAllConfirmedPaymentsCents()` in `debtPaymentsDao.ts` (or list-all + reduce, matching existing DAO style). (Added as `coalesce(sum(...))` aggregates with an injectable `database = db` param, mirroring `confirmPayment`, so they're testable.)
- [x] 16.2 In `useDashboardSummary.ts`, compute `globalAvailableCents = allIncome − allExpenses − allConfirmedDebtPayments`, NOT filtered by `activeMonth`; add it to `DashboardSummary`. Do not subtract reserve accruals. Keep the existing per-month `availableCents` for the monthly card.
- [x] 16.3 In `index.tsx`, add a prominent "Disponible" card showing `globalAvailableCents` ABOVE the month navigator (directly under the FinCheck title). Relabel the per-month card's "Disponible" row to "Balance del mes".
- [x] 16.4 Confirm the global figure updates on focus (it rides the existing `useFocusEffect` refetch) and does not change when the month navigator moves. (Confirmed by inspection: the three all-time sums take no year/month argument, so the value is identical across `activeMonth` changes; it's computed inside the same `refresh()` that the existing mount + focus effects call.)
- [x] 16.5 Add a test for the all-time available calculation (income − expenses − confirmed payments across multiple months), mirroring existing service/dao test style. (`src/dao/__tests__/globalAvailable.integration.test.ts` — multi-month income/expenses, scheduled payment excluded.)
- [x] 16.6 Run `npx tsc --noEmit` and `npx jest`; fix any breakage. (tsc clean; jest 10 suites / 42 tests passing.)
- [ ] 16.7 Manually verify: with data only in a prior month, Inicio's global "Disponible" is non-zero regardless of the selected month.

## 17. Full data reset in Configuración

- [x] 17.1 Add a reset routine (e.g. `src/db/reset.ts` exporting `resetAllData(db)`) that deletes all rows from every user table in FK-safe order (debtPayments, recurrenceOccurrences, income, expenses, recurringTransactions, debts, budgetRuleAllocations, budgetRules, simulations, monthlySummaries, settings), inside a transaction.
- [x] 17.2 Wire it into `configuracion.tsx` as a destructive "Borrar todos los datos" action gated behind an explicit confirm `Alert` (clear, irreversible wording); also clear relevant in-memory store state (reset `useAppStore`'s active month to current / active-rule id to null) after the wipe, and show a success confirmation.
- [ ] 17.3 Verify post-reset behavior reads as first-launch: no active rule, Deudas blocks creation with its "falta regla" message, Apartados/Movimientos/Historial empty, global Disponible $0 (screens pick this up via the existing focus-refetch when revisited).
- [x] 17.4 Add a test that seeds several tables, calls `resetAllData`, and asserts every table is empty afterward. (`src/db/__tests__/reset.integration.test.ts`; also required adding the `simulations` + `monthly_summaries` tables to the test DDL in `sqliteTestDb.ts`, which were missing.)
- [x] 17.5 Run `npx tsc --noEmit` and `npx jest`; fix any breakage. (tsc clean; jest 10 suites / 42 tests. Caught and fixed one bug: the test DDL for `monthly_summaries` used `computed_at`, but the schema's `computedAt` field maps to column `created_at`.)
- [ ] 17.6 Manually verify: tapping reset and cancelling keeps data; confirming wipes everything and the app looks freshly installed.

## 18. Auto-deduct recurring debts per quincena (replace scheduled/confirm model)

- [x] 18.1 In `reconciliation.ts`, replace the recurring-debt handling: instead of generating scheduled `debtPayments` on the payment-day (via a `debt_payment` recurringTransaction) AND a separate reserve-accrual block, generate **auto-confirmed** `debtPayments` (status `confirmed`) on each `SEMIMONTHLY_FIXED` cutoff for every active recurring parent/standalone debt, iterating debts directly. Amount per cutoff = `perQuincena` (`round(periodTotal / 2)` mensual, `/ 4` bimestral), where `periodTotal` = standalone's `monthlyPaymentCents` or the live `deriveParentMonthlyPaymentCents(children)` for parents.
- [x] 18.2 Make the current period count immediately: generation starts from the most recent cutoff on or before the debt's `startDate` (so a debt created mid-period deducts the current quincena at creation). Track processed cutoffs per debt via `reserveLastAccrualDate` for idempotent catch-up on app open. (New `mostRecentCutoffOnOrBefore` helper; first run anchors there, later runs continue strictly after `reserveLastAccrualDate`.)
- [x] 18.3 Treat the starting reserve (`reserveAccumulatedCents` seed = apartado inicial) as a consumable offset buffer: for each cutoff, `deducted = max(0, perQuincena − buffer)`, then `buffer -= min(buffer, perQuincena)`; only write a confirmed `debtPayments` row when `deducted > 0`. Persist the shrinking buffer.
- [x] 18.4 Stop creating `debt_payment` recurringTransactions in `useDebts.create` (recurring debts are now driven directly from the debt in reconciliation); keep creating recurring INCOME transactions unchanged. Ensure `useDebts.create` still triggers a reconciliation run so the current-period deduction materializes immediately. (Also dropped the now-unused `reserveLastAccrualDate` seed from `deudas.tsx` so the current cutoff is counted.)
- [x] 18.5 Remove the manual confirmation path: delete `confirmPayment` and its reserve-reset logic from `debtPaymentsDao.ts`, remove `confirmPayment` from `useDebts`, and remove the "Confirmar pago" button + the scheduled-payments list from `deudas.tsx`. (Also removed now-dead `deriveStatus`/`listPendingPayments`/`listPaymentsForDebt`.)
- [x] 18.6 Change Inicio's "Pagos de deuda pendientes" card into an informational "Próximos pagos" reminder: for each recurring debt, compute its next payment-day occurrence (from `dueDate`) on the fly and show debt name + day + periodic amount, with NO confirm link. (Exposed as `upcomingReminders` from `useDebts`.)
- [x] 18.7 Non-recurring debts: deduct the full `monthlyPaymentCents` (total) once at creation, offset by apartado inicial — generate a single confirmed `debtPayments` row (dated creation day) for `max(0, total − apartado)`. (In `useDebts.create` via new `insertConfirmedPayment`.)
- [x] 18.8 Update `apartados.tsx` / `useDebtReserves` to show, per recurring debt, its per-quincena share and how much has been committed/deducted so far (derive from the generated confirmed payments or the committed computation); remove any "reset"/"apartar" affordance and reset-on-confirm wording. (`listRecurringDebtsResolved` now returns `committedCents` = sum of confirmed payments.)
- [x] 18.9 Update/replace affected tests: `debtPaymentsDao.integration.test.ts` (no more `confirmPayment`), `reconciliation.integration.test.ts` (recurring debt now generates auto-confirmed quincena payments; current period counts; apartado offset; parent uses live children total), and the reserve test. Add a test asserting a monthly debt created mid-period produces one confirmed per-quincena deduction immediately and another after the next cutoff, and that apartado inicial offsets correctly.
- [x] 18.10 Run `npx tsc --noEmit` and `npx jest`; fix all breakage.
- [ ] 18.11 Manually verify in the app: add despensa (monthly, total 3000, apartado 0) today → global Disponible drops 1500 and "necesidades" shows occupied; with apartado 1000 → drops only 500; nómina recurring only adds on its future payday; reminder shows próximos pagos with no confirm button.
