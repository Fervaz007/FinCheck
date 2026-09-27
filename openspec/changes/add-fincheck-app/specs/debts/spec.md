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
