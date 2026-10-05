## Why

The budget-rule groups and financial-health status are computed against the wrong number. Today the per-section card uses the current month's materialized income and the health "crítico" override uses the pooled available balance — both of which fluctuate with spending and withdrawals. So if the user has $7,000 and withdraws $5,000 to $2,000, the app recomputes against $2,000 and flags "crítico" even though nothing about their actual budget changed. A budget rule like 50/30/20 is meaningful only against a stable base: the user's **fixed monthly income** (nómina, pensión, apoyos — everything received on a fixed/secure schedule). The app already captures those as recurring income movements; it just isn't using them as the budget base. Separately, the per-section card doesn't refresh to reflect debts as they're added, because it reads materialized confirmed payments (which lag) instead of the debts' standing monthly obligations.

## What Changes

- Introduce a computed **fixed monthly income** = the sum of the user's active recurring income movements, each normalized to a monthly figure by its frequency (quincenal ×2, semanal ×52/12, mensual ×1, cada-N-meses ×1/N, anual ×1/12, etc.). One-off (non-recurring) income does NOT count toward it — only fixed/secure recurring income.
- **BREAKING (behavioral)**: budget-rule group limits ("necesidades 50%", etc.) are now a percentage of **fixed monthly income**, not of the current month's materialized income nor of the pooled available balance. The base no longer moves when the user spends or withdraws.
- **BREAKING (behavioral)**: financial-health status is driven purely by each monitored group's standing monthly obligation vs. its fixed-income limit (worst group wins). The "available balance went negative → crítico" override is removed — withdrawing cash no longer makes health crítico.
- The per-section card's "ocupado" becomes each group's **standing monthly obligation** (sum of the monthly cost of recurring debts tagged to that group), so it updates immediately when a debt is added — instead of the lagging materialized-payments figure.
- When no recurring (fixed) income is configured, the budget/health show an explicit "configura tus ingresos fijos" state instead of computing against $0 and flagging everything crítico.
- The pooled "Disponible" (current money on hand) is unchanged and still shown — it is a separate concept from the fixed-income budget base. Both coexist: Disponible = what I have now; fixed monthly income = what I reliably receive, used for budgeting.
- Investigate and fix any refresh gap so the per-section card reflects additions on focus.

## Capabilities

### New Capabilities
- `fixed-income-budget`: compute fixed monthly income from recurring income movements, and base all budget-rule group limits, per-section occupancy, and financial-health status on it (stable, independent of spending/withdrawals), with an explicit unconfigured state.

### Modified Capabilities
<!-- None expressed as deltas here: this change supersedes parts of the financial-health and dashboard behavior defined in the still-open, not-yet-archived `consolidate-debts-budget-flow` change. To avoid deltaing an unarchived base, the new rules are captured as ADDED requirements under the new `fixed-income-budget` capability, and the superseded behavior is described in design.md. -->

## Impact

- **Services**: `src/services/financial/budget.ts` (`computeBudgetCompliance` base + occupancy source), `src/services/financial/health.ts` (`computeFinancialHealth` basis; drop the available-balance override), a new fixed-monthly-income helper (e.g. `src/services/financial/fixedIncome.ts` with `occurrencesPerMonth` + `computeFixedMonthlyIncomeCents`).
- **Hooks/DAO**: `src/hooks/useDashboardSummary.ts` (feed fixed monthly income + per-group standing obligations instead of materialized income/payments), likely a helper to sum active recurring income and to sum recurring-debt monthly obligations by `budgetGroupLabel` (`src/dao/recurringTransactionsDao.ts`, `src/dao/debtsDao.ts`).
- **Screens**: `src/app/(drawer)/index.tsx` (per-section card + health labels now reflect the fixed-income basis and the unconfigured state).
- **Consistency note**: `src/services/financial/simulator.ts`'s "a meses" capacity check uses the active month's income today; it should use the same fixed-income base so the simulator and the dashboard agree.
- **Tests**: new tests for `occurrencesPerMonth`/`computeFixedMonthlyIncomeCents`; update `budget.test.ts` and `health.test.ts` for the new base and the removed override.
- **Relationship**: builds directly on the recurring-income and budget-rule monitoring from the still-open `consolidate-debts-budget-flow` change; that change should be archived around the same time to keep the specs coherent.
