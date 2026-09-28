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

- [x] 8.1 Income entry form (manual, one-time entries)
- [x] 8.2 Expense entry form (manual, one-time entries, with payment account)
- [x] 8.3 Movimientos list, filterable by month (via active-month store) and tab (ingresos/egresos), empty state, delete-with-confirm
- [x] 8.4 Recurring income/expense creation screen (`recurrentes.tsx`) — friendly frequency picker (quincenal, semanal, mensual, cada N días/meses, anual) mapped to the recurrence engine's `RecurrenceConfig`; creating one immediately runs reconciliation so today's occurrence (if due) materializes without waiting for the next app restart. Also caught and fixed a real type bug in `recurrenceTypes.ts` (`MONTHLY_LAST_DAY`'s config type was unconstructible) while building this.

## 9. Screens: Deudas

- [x] 9.1 Debt create form, now including `remainingPayments` and an optional automatic monthly payment (día de pago + cuenta → creates a linked `debt_payment` recurring transaction). Confirming a payment now also decrements `remainingPayments` and auto-marks the debt `pagada` at $0. (create-only; no edit-existing-debt form yet)
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

## 15. Compromisos (apartado por quincena)

- [x] 15.1 `services/financial/commitments.ts`: pure functions — per-period amount, completion check, adjusted-available (global income minus reserves, not tied to any account)
- [x] 15.2 Unit tests matching the BBVA ($1,200/2 quincenas) and Luz ($1,000/4 quincenas) examples
- [x] 15.3 `commitments` table + migration; `dao/commitmentsDao.ts` (CRUD, mark-period-reserved, reset-cycle)
- [x] 15.4 `hooks/useCommitments.ts`
- [x] 15.5 `compromisos.tsx` screen: create commitment, per-commitment progress + "apartar esta quincena" / "ya pagué, reiniciar" actions, and a period-income input showing reserved vs. adjusted-available
- [x] 15.6 Added `commitments` capability spec
- [x] 15.7 `presupuesto.tsx`: added a separate "¿Cuánto separar de este ingreso?" card — splits one payment across the active **budget rule's percentages** (different concept from Compromisos, which splits **known fixed obligations** across pay periods); `services/financial/budget.ts` gained `computeAllocationForAmount` for this
- [ ] 15.8 Not yet wired into the main Dashboard's "disponible" figure — Compromisos currently lives as its own screen with its own income-input field, rather than automatically adjusting the Dashboard summary
- [x] 15.9 Commitments can link to an existing debt (`linked_debt_id`, reads `monthly_payment`) or an existing expense-kind recurring transaction (`linked_recurring_transaction_id`, reads `amount`), instead of requiring the user to re-enter the same amount twice. Resolved live via `dao/commitmentsDao.ts`'s `listActiveCommitmentsResolved`. Also found and fixed a real bug in the drizzle-kit-generated migration `0002_bored_mongoose.sql` (its `INSERT...SELECT` referenced the new linked-id columns on the old table, which didn't have them yet — verified the fix by replaying all 3 migrations against an in-memory sql.js db)

## 16. Deudas jerárquicas (padre/hija)

- [x] 16.1 `debts.parent_debt_id` (auto-referencia nullable) + migración; verificado replayando 0000→0003 contra sql.js
- [x] 16.2 `services/financial/debtHierarchy.ts`: funciones puras — monto mensual derivado del padre (Σ hijas activas), saldo estimado de una hija (`pago_mensual × meses_restantes`, o 0 si es indefinida), saldo derivado del padre
- [x] 16.3 Unit tests con el ejemplo BBVA (Llantas $300×12, TV $200×3, Netflix indefinida → mensual derivado $700, saldo derivado $4,200) — 5/5 pasando
- [x] 16.4 `dao/debtsDao.ts`: `listParentDebts`, `listChildDebts`, `listDebtsResolved` (aplica lo derivado solo si tiene hijas; si no, se comporta igual que hoy), `createChildDebt` (autocompleta `original_amount`/`saldo_pendiente` — nunca se le piden al usuario)
- [x] 16.5 `dao/debtPaymentsDao.ts` `confirmPayment`: si la deuda pagada tiene hijas, cascada — a cada hija activa con countdown se le resta 1 a `remaining_payments` (nunca un monto en dólares) y se marca `pagada` en 0; hijas indefinidas no se tocan; si todas las hijas terminan (ninguna indefinida sigue activa) el padre también se marca `pagada`; deudas sin hijas siguen exactamente igual que antes
- [x] 16.6 `services/recurring/reconciliation.ts`: al generar la ocurrencia programada de un `debt_payment`, si la deuda tiene hijas, calcular el monto derivado en ese momento (no usar el `amount_cents` fijo guardado en la recurrencia) — para que la mensualidad generada baje sola cuando una hija termine
- [x] 16.7 `dao/commitmentsDao.ts`: resolver el monto vinculado a una deuda usando el total derivado si tiene hijas
- [x] 16.8 `compromisos.tsx`: el selector "vincular a una deuda" solo lista deudas sin padre — resuelto automáticamente sin tocar ese archivo, ya que `useDebts()` ahora usa `listDebtsResolved()` (solo padres/deudas sueltas; las hijas viven anidadas en `.children`)
- [x] 16.9 `deudas.tsx`: hijas anidadas bajo su padre (badge de countdown o "indefinida", ✅ cuando una hija termina), acción "+ Agregar hija" con mini-formulario (nombre, pago mensual, ¿se termina? / meses restantes), sin botón de confirmar pago en las hijas; el padre muestra "Saldo estimado"/"Mensualidad (suma de hijas)" cuando tiene hijas, y elimina en cascada sus hijas al eliminarse
- [x] 16.10 Verificación: `tsc --noEmit` limpio, 35/35 tests pasando (incluye 3 nuevos de integración para la cascada de `confirmPayment` con hijas mixtas countdown/indefinida, usando sql.js en memoria — `confirmPayment` ahora acepta un `Database` inyectable, igual que `reconciliation.ts`, para permitir esto sin tocar el singleton real), `expo export --platform android` compila sin errores
