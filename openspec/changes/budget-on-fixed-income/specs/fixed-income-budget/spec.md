## ADDED Requirements

### Requirement: Fixed monthly income is computed from active recurring income
The system SHALL compute a fixed monthly income as the sum of every active recurring income movement, each normalized to a monthly amount by its frequency: quincenal (SEMIMONTHLY_FIXED) ×2, semanal (WEEKLY) ×(52/12), mensual (MONTHLY_DAY / MONTHLY_LAST_DAY) ×1, cada-N-meses (MONTHLY_INTERVAL) ×(1/N), cada-N-días (DAILY_INTERVAL) ×(30/N), anual (ANNUAL) ×(1/12). One-off (non-recurring) income SHALL NOT be included.

#### Scenario: Mixed-frequency fixed income
- **WHEN** the user has a quincenal nómina of $3,000, a semanal apoyo of $500, and a mensual pensión of $2,000 configured as recurring income
- **THEN** fixed monthly income = $3,000×2 + $500×(52/12) + $2,000×1 = $6,000 + ~$2,167 + $2,000 ≈ $10,167

#### Scenario: One-off income excluded
- **WHEN** the user records a one-time (non-recurring) income of $4,000
- **THEN** it does not change the fixed monthly income

### Requirement: Budget-rule group limits are a percentage of fixed monthly income
The system SHALL compute each monitored budget-rule group's limit as that group's percentage applied to the fixed monthly income — never to the current month's materialized income nor to the pooled available balance. The limit SHALL NOT change when the user spends money or withdraws cash.

#### Scenario: Limit is stable across withdrawals
- **WHEN** fixed monthly income is $7,000, "necesidades" is 50% (limit $3,500), and the user withdraws cash dropping their available balance to $2,000
- **THEN** the "necesidades" limit remains $3,500 — it does not drop to a percentage of $2,000

### Requirement: Per-group occupancy reflects standing monthly obligations and updates immediately
The per-section card's "ocupado" for a group SHALL be the sum of the monthly cost of active recurring debts tagged with that group (a debt's monthly cost = its per-quincena share × 2; parent debts use their live derived children total), and SHALL update as soon as a debt is added or changed — not read from lagging materialized payment records.

#### Scenario: Adding a debt updates its group immediately
- **WHEN** the user adds a recurring monthly debt of $3,000 tagged "necesidades"
- **THEN** the "necesidades" ocupado increases by $3,000 right away, without waiting for a quincena cutoff or a confirmed payment

#### Scenario: Bimonthly debt counts as half per month
- **WHEN** a recurring bimestral debt has a period total of $1,000 tagged "necesidades"
- **THEN** it contributes $500 to the "necesidades" monthly ocupado

### Requirement: Financial-health status is based on fixed income, not the available balance
The system SHALL derive financial-health status solely from each monitored group's standing monthly obligation versus its fixed-income-based limit (worst group determines the overall status). A negative or low available balance SHALL NOT, by itself, make health crítico.

#### Scenario: Withdrawal does not worsen health
- **WHEN** every monitored group is within its fixed-income limit and the user withdraws cash leaving a low available balance
- **THEN** health status stays healthy (not crítico) — the low balance alone does not change it

#### Scenario: Over-committed group drives the status
- **WHEN** "necesidades" obligations exceed the "necesidades" fixed-income limit
- **THEN** overall health reflects that group being over budget, regardless of the available balance

### Requirement: Explicit state when no fixed income is configured
When fixed monthly income is 0 (no active recurring income), the system SHALL show an explicit "configura tus ingresos fijos" state for budget/health rather than computing limits of 0 and flagging every group as over budget.

#### Scenario: No recurring income yet
- **WHEN** the user has recorded only one-off income and no recurring income
- **THEN** the per-section card and health show an unconfigured hint, not a crítico status

### Requirement: Disponible remains a separate figure from the fixed-income budget
The pooled "Disponible" (current money: all income − all expenses − all debt deductions) SHALL continue to be shown and computed as before, independent of the fixed-income budget base.

#### Scenario: Two distinct numbers
- **WHEN** the user views Inicio
- **THEN** "Disponible" reflects current money while the per-section budget reflects fixed monthly income — the two are not conflated

### Requirement: Debt creation requires an active rule and at least one recurring income
The system SHALL block creating a debt unless there is BOTH an active budget rule AND at least one active recurring income. When blocked, it SHALL say which piece is missing and where to add it.

#### Scenario: No recurring income yet
- **WHEN** the user has an active rule but no recurring income and tries to add a debt
- **THEN** creation is blocked with a message pointing them to add a recurring income (Movimientos), and no debt is created

#### Scenario: Both prerequisites present
- **WHEN** the user has an active rule and at least one recurring income
- **THEN** debt creation proceeds normally

### Requirement: Home shows the current fixed monthly income total
Inicio SHALL display the computed fixed monthly income ("ingresos mensuales a día de hoy") — the normalized sum of all active recurring income — so it grows as the user adds recurring streams.

#### Scenario: Monthly income reflects a newly added stream
- **WHEN** the user adds a quincenal recurring income of $3,000
- **THEN** Home's fixed monthly income increases by $6,000 (×2), shown as part of the monthly total

### Requirement: Recurring income adds to Disponible only on an actual payday
Registering a recurring income SHALL contribute to the fixed monthly income figure immediately, but SHALL add to the pooled Disponible only when an actual occurrence (payday) date arrives — not on the day it is registered, unless that day is itself a payday.

#### Scenario: Registering on a non-payday
- **WHEN** today is October 4 (not a quincena cutoff) and the user registers a quincenal recurring income
- **THEN** the fixed monthly income rises immediately, but Disponible does not change today

#### Scenario: Registering on a payday
- **WHEN** today is a quincena cutoff (the 15th or last day) and the user registers a quincenal recurring income anchored to today
- **THEN** that payday materializes and Disponible rises accordingly

### Requirement: The purchase simulator uses the same fixed-income base
The simulator's "a meses" capacity check for a selected group SHALL use the fixed monthly income (× the group's percentage) as the group's capacity, consistent with the dashboard, rather than the active month's materialized income.

#### Scenario: Simulator agrees with the dashboard
- **WHEN** "deudas" is 30% of a $10,000 fixed monthly income (capacity $3,000) and the user simulates a $600/month purchase in "deudas"
- **THEN** the simulator measures it against $3,000, the same limit the dashboard shows for "deudas"
