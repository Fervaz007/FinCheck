## Context

This builds on the still-open `consolidate-debts-budget-flow` change, which established: budget rules with per-row `isMonitored` flags, recurring income movements, recurring debts that auto-deduct per quincena, and a per-section compliance card + financial-health status on Inicio.

Current computation (in `useDashboardSummary.ts` + `budget.ts`/`health.ts`):
- `computeBudgetCompliance(monitoredAllocations, actualByGroup, incomeCents)` with `incomeCents = incomeTotalCents` (the active month's materialized income rows) and `actualByGroup` = this month's CONFIRMED debt payments grouped by `budgetGroupLabel`.
- `computeFinancialHealth(complianceRows, availableCents, { attentionMarginPct })` — per-group status from occupied vs allocated, worst wins, plus `availableCents < 0 → crítico`.

Two problems the user hit:
1. The per-section card doesn't move as debts are added, because `actualByGroup` reads materialized confirmed payments — which lag (and, with auto-deduct dating to the quincena cutoff, may land in a different month than the one being viewed).
2. The base is unstable: `incomeTotalCents` is only what's been received so far this month, and the `availableCents` override means withdrawing cash (dropping the balance) flips health to crítico — even though the user's actual budget didn't change.

## Goals / Non-Goals

**Goals:**
- Budget-rule group limits and health status computed against a **stable fixed monthly income**, independent of spending/withdrawals and of how far into the month we are.
- The per-section "ocupado" reflects standing monthly obligations, updating the instant a debt is added.
- Reuse the recurring-income movements the user already configures as the source of fixed income — no new manual entry screen.
- Keep "Disponible" (current money) as a separate, still-shown concept.

**Non-Goals:**
- Changing how Disponible itself is computed (unchanged).
- Counting one-off/variable income toward the budget base (only fixed/recurring counts).
- Re-introducing manual payment confirmation (deductions stay automatic).

## Decisions

### 1. Fixed monthly income = sum of active recurring income, normalized per frequency
A new pure helper computes `occurrencesPerMonth(recurrenceConfig)`:
- `SEMIMONTHLY_FIXED` → 2
- `WEEKLY` → 52/12 (≈ 4.333)
- `MONTHLY_DAY` / `MONTHLY_LAST_DAY` → 1
- `MONTHLY_INTERVAL` {every} → 1/every
- `DAILY_INTERVAL` {intervalDays} → 30/intervalDays
- `ANNUAL` → 1/12

`computeFixedMonthlyIncomeCents(recurringIncomes)` = `round(Σ amountCents × occurrencesPerMonth(config))` over active `kind='income'` recurring transactions. This is the single budget base.
- **Rationale**: the user explicitly frames the base as "lo que recibo al mes fijo/seguro," and already enters each stream as a recurring income with its real cadence (nómina quincenal, apoyo semanal, etc.). Summing them normalized to a month is the faithful, no-extra-input representation.
- **Alternative considered**: a dedicated "fixed monthly income" number the user types. Rejected — it duplicates data already captured as recurring income and would drift out of sync.

### 2. Per-group "ocupado" = standing monthly obligation, not materialized payments
Occupied for a group = Σ monthly cost of active recurring debts tagged with that group's label, where a debt's monthly cost = `perQuincena × 2` (so `mensual` total counts as its full monthly total, `bimestral` total counts as half per month). Parent debts use their live derived children sum. Non-recurring (one-time) debts are excluded from the monthly budget occupancy (they hit Disponible once, they are not a recurring monthly load).
- **Rationale**: this is what makes the card update "conforme lo que voy agregando" — it's derived from the debts themselves, not from payment rows that materialize later. It also matches the mental model "this group costs me $X per month."
- **Alternative considered**: keep occupied = this-month confirmed payments. Rejected — it lags, lands in the wrong month under quincena-dated auto-deductions, and shows ~0 right after adding a debt (the exact bug reported).

### 3. Health status drops the available-balance override
`computeFinancialHealth` takes the monitored compliance rows (now built on fixed income + standing obligations) and returns the worst group status; it no longer takes `availableCents` and no longer forces crítico on a negative balance.
- **Rationale**: the user's core complaint — withdrawing cash must not make health crítico. Health is about "are my committed monthly obligations within my fixed-income budget," a balance-independent question.
- **Trade-off**: a genuinely overdrawn balance no longer shows as crítico in the health card. That's acceptable: Disponible already shows the actual (possibly negative) number directly; conflating "low cash right now" with "over budget" was the bug.

### 4. Unconfigured state when there is no fixed income
If fixed monthly income is 0 (no active recurring income), budget limits would all be 0 and everything would read as over budget. Instead, health returns a distinct `sin_ingreso` (or reuse `sin_limite`) state and the per-section card shows a "configura tus ingresos fijos (recurrentes)" hint, rather than flagging crítico.
- **Rationale**: avoids a misleading crítico before the user has set up their income; mirrors the existing `sin_limite` unconfigured-rule handling.

### 5. Simulator uses the same base
`simulateAMesesPurchase` currently derives the group's capacity from the active month's income. Switch it to the fixed monthly income so the simulator's "cabe en Deudas" verdict matches the dashboard's limits.
- **Rationale**: one base everywhere prevents contradictory numbers between screens.

### 6. Debt creation requires both an active rule AND at least one recurring income
Since budget/health now need a non-zero fixed monthly income to mean anything, debt creation is gated on BOTH: an active budget rule (for Tipo options) and at least one active recurring income (for a non-zero base). If either is missing, block creation with a message pointing to the missing piece (Reglas Presupuestarias / Movimientos → ingreso recurrente).
- **Rationale**: the user asked for this explicitly ("antes de ingresar deudas me debe pedir regla activa y al menos un ingreso recurrente, para comenzar a hacer cálculos"). Without fixed income every group limit is 0 and everything reads over budget — gating avoids that meaningless state.
- This extends (does not replace) the consolidate-change rule "debt creation requires an active rule."

### 7. Home shows the fixed monthly income total ("ingresos mensuales a día de hoy")
Inicio gains a card showing the computed fixed monthly income (the normalized sum from decision #1), so the user sees their monthly income grow as they add recurring income streams (quincenal ×2, semanal ×52/12, etc.).
- **Rationale**: the user wants to see "mis ingresos mensuales a día de hoy" — the same number that drives the budget — made visible, with each recurring stream rolled into the monthly figure.
- Keep it simple: show the total; a per-stream breakdown is optional.

### 8. Recurring income only hits Disponible on an actual payday — confirm, don't change
The user's expectation ("si hoy no es día de quincena, no me lo sume al disponible; si lo fuera, sí") is ALREADY the behavior: recurring income materializes an `income` row (which feeds Disponible) only on its occurrence dates via reconciliation; registering a stream whose next payday is in the future adds nothing today. If today happens to be a payday, reconciliation generates it and Disponible rises — correct.
- **Decision**: verify this holds (add a test/scenario); do not change the mechanism. The recurring income still contributes to the fixed MONTHLY income figure immediately (that's the planning number), but to Disponible only when actually received.

## Risks / Trade-offs

- **[Risk]** `occurrencesPerMonth` uses approximations (weekly 52/12, daily 30/N). → **Mitigation**: acceptable — fixed income is a planning figure, not an accrual ledger; small rounding doesn't change budget decisions. Document the constants.
- **[Risk]** This change revises financial-health/dashboard behavior defined in the not-yet-archived `consolidate-debts-budget-flow`, so the two changes' specs overlap until archived. → **Mitigation**: captured as a self-contained new `fixed-income-budget` capability (ADDED requirements) rather than a delta against an unarchived base; archive `consolidate-debts-budget-flow` first, then this, and reconcile the financial-health/dashboard wording at that point.
- **[Risk]** Excluding non-recurring debts from monthly occupancy could hide a big one-time obligation from the budget view. → **Mitigation**: acceptable — one-time debts already reduce Disponible directly; the per-month budget is about recurring structure. Revisit if the user wants one-offs amortized.

## Open Questions

1. ~~Base = fixed income alone vs + savings~~ — RESOLVED: fixed income alone. The user confirmed current money ("Disponible") stays separate from fixed recurring income; the budget base is fixed income only.
2. ~~Weekly factor 52/12 vs ×4~~ — RESOLVED: the user deferred to the standard ("lo que sea, las reglas de México"); using 52/12 (≈4.333) for accuracy.
