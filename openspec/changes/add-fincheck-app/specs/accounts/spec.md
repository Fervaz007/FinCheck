## ADDED Requirements

### Requirement: Account CRUD
The system SHALL allow the user to create, edit, and deactivate accounts, each with a name, type (`efectivo`, `banco`, `tarjeta_debito`, `tarjeta_credito`, `otro`), and initial balance in cents.

#### Scenario: Create a new account
- **WHEN** the user creates an account with name "BBVA Débito", type `banco`, and initial balance $3,000.00
- **THEN** the system SHALL store `initial_balance_cents = 300000` and list the account as active

#### Scenario: Deactivate an account
- **WHEN** the user deactivates an account that has historical movements
- **THEN** the system SHALL keep the account and its historical movements visible in reports, but SHALL exclude it from account pickers for new movements

### Requirement: Derived account balance
The system SHALL compute an account's current balance as `initial_balance_cents + Σ(income) - Σ(expenses) - Σ(confirmed debt_payments)` for that account, and SHALL NOT store the balance as a directly editable field.

#### Scenario: Balance reflects confirmed movements only
- **WHEN** an account has initial balance $3,000, one income of $4,900, and one `debt_payment` still in `scheduled` status for $1,200
- **THEN** the computed balance SHALL be $7,900 (the scheduled debt payment SHALL NOT be subtracted)

#### Scenario: Balance updates after confirming a debt payment
- **WHEN** the user confirms the previously `scheduled` debt payment of $1,200 on the account above
- **THEN** the computed balance SHALL become $6,700
