## ADDED Requirements

### Requirement: Register and manage a debt
The system SHALL allow the user to register a debt with name, debt type, original amount, current outstanding balance (`saldo_pendiente`), monthly payment, interest rate, remaining number of payments, start date, due date, status, and optional notes.

#### Scenario: Register a new debt
- **WHEN** the user registers debt "Kia K4" with original amount $276,600, monthly payment $9,500, term 36 months
- **THEN** the system SHALL store `saldo_pendiente = 276600` cents-equivalent and `remaining_payments = 36`

### Requirement: Debt payment lifecycle is never auto-confirmed
A debt payment SHALL exist in one of two persisted states, `scheduled` or `confirmed`; an "overdue" (`vencido`) state SHALL be derived at read time, never persisted, as `status = 'scheduled' AND occurrence_date < today`. Reaching a due date SHALL NOT, by itself, mark a payment as paid.

#### Scenario: Due date reached without confirmation
- **WHEN** a debt payment's `occurrence_date` (5-sep) has passed and today is 1-oct, and the payment has not been confirmed
- **THEN** the system SHALL display it as `vencido` (derived), and SHALL NOT have subtracted its amount from the account balance or from `saldo_pendiente`

#### Scenario: User confirms a scheduled payment
- **WHEN** the user confirms a `scheduled` debt payment of $1,200
- **THEN** the system SHALL set its status to `confirmed`, SHALL reduce the debt's `saldo_pendiente` by the corresponding principal portion, and SHALL make the account balance reflect the subtraction

### Requirement: Optional automatic monthly payment schedule
When registering a debt, the system SHALL allow the user to optionally configure a payment day and a funding account; if provided, the system SHALL create a linked `debt_payment` recurring transaction (`MONTHLY_DAY`) so the monthly obligation is generated automatically by reconciliation instead of requiring manual entry every month.

#### Scenario: Debt registered with automatic payment
- **WHEN** the user registers "Préstamo personal" with monthly payment $500, payment day 15, and funding account "Efectivo"
- **THEN** the system SHALL create a recurring transaction of kind `debt_payment` tied to that debt, so a `scheduled` payment is generated automatically each month on day 15

#### Scenario: Debt registered without automatic payment
- **WHEN** the user registers a debt without a payment day or funding account
- **THEN** the system SHALL still store the debt, and the user SHALL be able to track it manually without automatic scheduling

### Requirement: Remaining payments and payoff decrease as payments are confirmed
Confirming a debt payment SHALL decrement `remaining_payments` (if set) by one, and SHALL mark the debt as `pagada` once `saldo_pendiente` reaches zero.

#### Scenario: Confirming the last payment closes the debt
- **WHEN** a debt has `remaining_payments = 1` and `saldo_pendiente` equal to the payment amount, and the user confirms that payment
- **THEN** the system SHALL set `remaining_payments = 0`, `saldo_pendiente = 0`, and `status = 'pagada'`

### Requirement: Distinguish actual expense from monthly obligation
The system SHALL treat a debt's configured `monthly_payment` (the obligation) as distinct from any individual `debt_payments` row (the actual recorded payment), and SHALL only count `confirmed` payments toward monthly cash-flow totals.

#### Scenario: Unconfirmed payment does not count as cash flow
- **WHEN** computing the month's total egresos and a debt payment for that month remains `scheduled`
- **THEN** the system SHALL exclude that payment's amount from the month's egresos total until it is `confirmed`

### Requirement: A debt can group child debts under one parent
The system SHALL allow a debt to reference another debt as its parent (`parent_debt_id`), one level deep only (a child SHALL NOT itself have children). A parent debt's `monthly_payment` SHALL be derived as the sum of its active children's `monthly_payment`, rather than manually entered. A debt with no children SHALL behave exactly as an ungrouped debt, using its own stored `monthly_payment`/`saldo_pendiente`.

#### Scenario: Parent's monthly payment is the sum of active children
- **WHEN** debt "BBVA" has active children "Llantas" ($300/month), "TV" ($200/month), and "Netflix" ($200/month)
- **THEN** the system SHALL derive BBVA's monthly payment as $700, not a manually stored number

#### Scenario: A finished child stops contributing automatically
- **WHEN** child "TV" reaches `remaining_payments = 0` and its status becomes `pagada`
- **THEN** the parent's derived monthly payment SHALL drop by TV's amount on the next computation, with no manual edit required

### Requirement: Child debts may be indefinite (no payment countdown)
A child debt MAY have `remaining_payments = NULL`, meaning it recurs indefinitely (e.g. a subscription charged to the same card) and remains active until the user manually deactivates it. Indefinite children SHALL still contribute to the parent's derived monthly payment, but SHALL NOT contribute to the parent's derived `saldo_pendiente` (which has no meaning for a perpetual charge).

#### Scenario: Indefinite child keeps recurring
- **WHEN** child "Netflix" has `remaining_payments = NULL`
- **THEN** it SHALL keep contributing to the parent's monthly total every cycle until the user deactivates it, and confirming the parent's payment SHALL NOT change it

### Requirement: A child debt's outstanding balance is estimated, not entered
For a child debt with a payment countdown, the system SHALL derive its `saldo_pendiente` as `monthly_payment × remaining_payments` (a no-interest estimate) instead of requiring the user to enter or track an exact original amount or outstanding balance. Child debt forms SHALL NOT ask the user for `original_amount`/`saldo_pendiente`.

#### Scenario: Estimated balance from payment and remaining months
- **WHEN** child "Llantas" has `monthly_payment = $300` and `remaining_payments = 12`
- **THEN** the system SHALL derive its `saldo_pendiente` as $3,600, without the user ever entering that figure

### Requirement: Only the parent debt has a payment schedule and lifecycle
Child debts SHALL NOT have their own `due_date`, their own `debt_payment`-kind recurring transaction, or their own `debt_payments` rows — only the parent debt does. Confirming the parent's scheduled payment SHALL cascade to its active children: a child with a payment countdown SHALL have `remaining_payments` decremented by one (and no dollar amount subtracted from it, since its balance is derived from the countdown); a child marked `pagada` (countdown reaching zero) SHALL stop being included in future computations; an indefinite child SHALL be left unchanged.

#### Scenario: Confirming the parent's payment decrements children's countdowns only
- **WHEN** the user confirms BBVA's (parent) scheduled payment for this cycle
- **THEN** each active child with a countdown SHALL have `remaining_payments` reduced by one, any child reaching zero SHALL become `pagada`, and no child's `saldo_pendiente` SHALL be directly decremented by a dollar amount (it is derived, not stored)

#### Scenario: Children never generate their own scheduled payments
- **WHEN** reconciliation runs
- **THEN** it SHALL only ever generate `scheduled` debt payments for parent-level debts (or ungrouped debts), never for a debt that has a `parent_debt_id`
