## 1. Project setup

- [x] 1.1 Scaffold Expo + TypeScript project with `expo-router`, strict `tsconfig.json`
- [x] 1.2 Install `expo-sqlite`, `expo-dev-client`, `drizzle-orm`, `drizzle-kit`, `zustand`, `date-fns`, `react-hook-form`, `zod`
- [x] 1.3 Configure `eas.json` for Dev Client builds (no Android Studio required)
- [x] 1.4 Set up folder structure: `app/`, `components/`, `db/`, `models/`, `dao/`, `services/financial/`, `services/recurring/`, `hooks/`, `theme/`, `utils/`
- [x] 1.5 Set up dark/fintech theme tokens (colors, typography) and FinCheck branding config under `theme/` and `app.json` (icon/splash still use placeholder artwork — real branded images not yet designed)
- [x] 1.6 Set up test runner (Jest) for `services/` unit tests

## 2. Database schema (Drizzle)

- [x] 2.1 Define `accounts` table (id, name, type, initial_balance_cents, currency, is_active)
- [x] 2.2 Define `categories` table (id, name, movement_type, budget_group, is_active)
- [x] 2.3 Define `income` table (id, description, category_id, account_id, amount_cents, date, notes, recurring_transaction_id nullable, occurrence_date nullable)
- [x] 2.4 Define `expenses` table (id, description, category_id, account_id, amount_cents, date, notes, recurring_transaction_id nullable, occurrence_date nullable) — "método de pago" is expressed via the linked `account_id` (see design.md decision on the accounts/debts tension), no separate column
- [x] 2.5 Define `debts` table (id, name, debt_type, original_amount_cents, saldo_pendiente_cents, monthly_payment_cents, interest_rate_bps, remaining_payments, start_date, due_date, status, notes)
- [x] 2.6 Define `debt_payments` table (id, debt_id, account_id, amount_cents, occurrence_date, status ['scheduled'|'confirmed'], confirmed_at nullable, recurring_transaction_id nullable, notes)
- [x] 2.7 Define `budget_rules` and `budget_rule_allocations` tables, with an `is_active` flag on `budget_rules`
- [x] 2.8 Define `settings` table (single row): active `debt_limit_pct`, `last_reconciled_at`, currency
- [x] 2.9 Define `recurring_transactions` table (id, kind, description/category/account/debt refs, amount_cents, recurrence_type, recurrence_config JSON, anchor_date, next_occurrence_date cache, is_active, end_date nullable)
- [x] 2.10 Define `recurrence_occurrences` table with `UNIQUE(recurring_transaction_id, occurrence_date)`
- [x] 2.11 Define `simulations` table (snapshot fields, no FKs to debts)
- [x] 2.12 Define `monthly_summaries` table (year, month, totals, `budget_rule_id_snapshot`, `debt_limit_pct_snapshot`, `health_status_snapshot`)
- [x] 2.13 Generate and wire initial Drizzle migration, bootstrap on app start (`drizzle/`, wired via `useMigrations` in `src/app/_layout.tsx`)

## 3. Core financial calculation services (pure, unit-tested first)

- [x] 3.1 `utils/money.ts`: cents ↔ display-currency formatting helpers
- [x] 3.2 `services/financial/budget.ts`: compute allocation compliance against the active budget rule; validate percentages sum to 100%
- [x] 3.3 `services/financial/debtLimit.ts`: compute debt ratio, max allowed debt, available capacity for new debt
- [x] 3.4 `services/financial/health.ts`: compute 🟢/🟡/🟠/🔴 status from configurable thresholds
- [x] 3.5 `services/financial/simulator.ts`: compute before/after comparison for a simulated purchase/debt
- [x] 3.6 Unit tests: budget percentage validation, debt ratio math, health thresholds, simulator before/after deltas (all passing, numbers matched against the specs)

## 4. Recurring transactions engine

- [x] 4.1 `services/recurring/recurrenceTypes.ts`: define `RecurrenceType` enum and `RecurrenceConfig` types (`DAILY_INTERVAL`, `WEEKLY`, `MONTHLY_DAY`, `MONTHLY_LAST_DAY`, `SEMIMONTHLY_FIXED`, `MONTHLY_INTERVAL`, `ANNUAL`)
- [x] 4.2 `services/recurring/computeOccurrences.ts`: pure function `(config, anchor, from, to) => Date[]`, with explicit day-of-month clamping
- [x] 4.3 Unit tests: each recurrence type, day-31-in-30-day-month clamp, Feb 28/29 clamp, `SEMIMONTHLY_FIXED` vs `DAILY_INTERVAL(15)` divergence (9/9 passing)
- [x] 4.4 `services/recurring/reconciliation.ts`: derive cursor per recurring transaction from `recurrence_occurrences`, compute pending occurrences, materialize income/expense rows (auto) and debt_payment rows (status `scheduled`) inside one DB transaction
- [x] 4.5 Wire reconciliation to run on app start (splash/loading step, `src/app/_layout.tsx`), before rendering the dashboard
- [x] 4.6 `services/recurring/projection.ts`: read-only projected balance over a horizon, reusing `computeOccurrences`, never persisting
- [x] 4.7 Integration test (sql.js in-memory db): app closed across a month boundary generates exactly the expected occurrences
- [x] 4.8 Integration test: reconciliation run twice back-to-back produces no duplicate rows (UNIQUE constraint respected) — also caught and fixed a real UTC/local date-parsing bug in the process (see `src/utils/date.ts`)

## 5. Data access layer (DAO)

- [x] 5.1 `dao/accountsDao.ts`: CRUD + derived balance query
- [x] 5.2 `dao/categoriesDao.ts`: CRUD + in-use check before delete
- [x] 5.3 `dao/incomeDao.ts` / `dao/expensesDao.ts`: CRUD + month/category filters
- [x] 5.4 `dao/debtsDao.ts` / `dao/debtPaymentsDao.ts`: CRUD, confirm-payment transaction (update status, reduce `saldo_pendiente`; account balance is derived so no separate mutation needed)
- [x] 5.5 `dao/budgetRulesDao.ts`: CRUD rules/allocations, activate-rule transaction
- [x] 5.6 `dao/settingsDao.ts`: get/update debt limit and other singleton settings
- [x] 5.7 `dao/recurringTransactionsDao.ts` (covers occurrence-history lookups too; a separate `recurrenceOccurrencesDao.ts` wasn't needed)
- [x] 5.8 `dao/simulationsDao.ts`
- [x] 5.9 `dao/monthlySummariesDao.ts`: upsert-by-month, snapshot fields

## 6. Hooks bridging DAO + services to UI

- [x] 6.1 `hooks/useAccounts.ts`, `useCategories.ts`
- [x] 6.2 `hooks/useIncome.ts`, `useExpenses.ts` (month-scoped)
- [x] 6.3 `hooks/useDebts.ts` (list, confirm payment action)
- [x] 6.4 `hooks/useBudgetRules.ts`, `useDebtLimit.ts`
- [x] 6.5 `hooks/useDashboardSummary.ts` (real + projected balance, health status)
- [x] 6.6 `hooks/useMonthlyHistory.ts` (month navigation)
- [x] 6.7 Zustand store for cross-screen state (`hooks/useAppStore.ts`): active month, active budget rule id

## 7. Screens: Accounts & Categories

- [x] 7.1 Accounts list/create/edit screen with balance display (`mas/cuentas.tsx`) — edit is create-only for now, no per-account edit form yet
- [x] 7.2 Categories list/create/edit screen with budget-group picker and delete-blocked-when-in-use UX (`mas/categorias.tsx`)

## 8. Screens: Movimientos (Income & Expenses)

- [x] 8.1 Income entry form (manual) — recurrence toggle NOT built yet; recurring income/expenses can only be seeded via `recurringTransactionsDao` today, not from this form
- [x] 8.2 Expense entry form (manual, with payment account) — same recurrence-toggle gap as 8.1
- [x] 8.3 Movimientos list, filterable by month (via active-month store) and tab (ingresos/egresos), empty state, delete-with-confirm

## 9. Screens: Deudas

- [x] 9.1 Debt create/edit form (create-only; no edit-existing-debt form yet)
- [x] 9.2 Debt detail: payment list, "Confirmar pago" action — confirms against `accounts[0]` rather than letting the user pick the account; vencido/scheduled shown, no separate "confirmed" history view yet
- [x] 9.3 Delete-debt confirmation dialog (native `Alert.alert`)

## 10. Screens: Presupuesto (Budget rules & Debt limit)

- [x] 10.1 Budget rule picker (50/30/20, 40/40/20 presets, activate any rule) + custom rule editor with live 100%-sum validation (`mas/reglas-presupuestarias.tsx`)
- [x] 10.2 Debt limit configuration screen, independent of budget rule
- [x] 10.3 Budget compliance view (allocated vs actual per group) — category-to-group actuals are approximated (necesidades = egresos − ahorro, ocio not separately broken out yet)

## 11. Dashboard

- [x] 11.1 Monthly summary cards (income/egresos/disponible/ahorro/deudas)
- [x] 11.2 Financial health indicator with percentage breakdown
- [x] 11.3 Pending/vencido debt payments section (actionable, links to Deudas)
- [x] 11.4 Saldo real vs. saldo proyectado view
- [x] 11.5 Navigation shell: top navbar with hamburger → side drawer (expo-router `(drawer)` group, `@react-navigation/drawer`), one icon per section (`@expo/vector-icons`/Ionicons) — replaced the original bottom-tab-bar design after on-device testing showed 5+ tabs crowding into unreadable labels
- [x] 11.6 All sections (Inicio, Movimientos, Deudas, Presupuesto, Simulador, Cuentas, Categorías, Reglas presupuestarias, Historial, Configuración) are flat top-level drawer entries — the earlier nested "Más" hub screen was removed since the drawer itself now serves that purpose

## 12. Simulador

- [x] 12.1 Simulator input form (name, price, down payment, monthly payment, term) — optional interest-rate field not exposed in the form yet (schema supports it)
- [x] 12.2 Before/after comparison screen with debt-limit warning
- [x] 12.3 Save/name a simulation for later reference (`simulations` table) — save-only; no "list saved simulations" view yet

## 13. Historial mensual

- [x] 13.1 Month navigation UI (prev/next, on the Dashboard)
- [x] 13.2 Monthly summary view reading from `monthly_summaries` snapshot (`mas/historial.tsx`)
- [x] 13.3 Snapshot recompute (upsert) wired into `useDashboardSummary`'s refresh — recomputes on every dashboard load, not on every individual mutation

## 14. QA pass

- [x] 14.1 Verified via `npx expo export --platform android`: the whole app (all screens, hooks, DAOs, DB wiring) bundles successfully through Metro with 0 errors — strongest available check without a physical device/emulator in this environment
- [ ] 14.2 Manual test: close and simulate app reopening after a multi-week gap — covered at the unit/integration level (services/recurring tests), NOT yet exercised manually in the running app
- [x] 14.3 Budget rule 100%-validation verified both by unit test (`budget.test.ts`) and live in the `reglas-presupuestarias` form (blocks save + shows running sum)
- [x] 14.4 Simulator debt-limit warning verified by unit test (`simulator.test.ts`); UI path wired but not manually exercised on-device
- [ ] 14.5 Empty/loading states exist on list screens; delete-confirmation dialogs exist for categories/expenses/income/debts — no on-device pass done (no Android device/emulator available in this environment)
