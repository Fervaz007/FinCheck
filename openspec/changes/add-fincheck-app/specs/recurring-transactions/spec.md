## ADDED Requirements

### Requirement: Define a recurring transaction
The system SHALL allow the user to define a recurring transaction of kind `income`, `expense`, or `debt_payment`, with a `recurrence_type`, a `recurrence_config`, and an `anchor_date`. Supported recurrence types SHALL include: `DAILY_INTERVAL` (every N days), `WEEKLY` (specific weekday), `MONTHLY_DAY` (specific day of month), `MONTHLY_LAST_DAY`, `SEMIMONTHLY_FIXED` (two fixed calendar anchors per month, e.g. day 15 and last day), `MONTHLY_INTERVAL` (every N months), and `ANNUAL`.

#### Scenario: Semimonthly payroll is not a rolling interval
- **WHEN** the user configures a recurring income as "quincenal" (semimonthly payroll)
- **THEN** the system SHALL use `SEMIMONTHLY_FIXED` with anchors day 15 and last-day-of-month, and SHALL NOT use a rolling `DAILY_INTERVAL` of 15 days

### Requirement: Day-of-month clamping
When a `MONTHLY_DAY`, `SEMIMONTHLY_FIXED`, or `MONTHLY_INTERVAL` recurrence's configured day does not exist in a given month, the system SHALL clamp the occurrence to the last day of that month.

#### Scenario: Day 31 in a 30-day month
- **WHEN** a recurrence is configured for day 31 and the current month has only 30 days
- **THEN** the system SHALL generate the occurrence on the last day of that month

#### Scenario: Day 30 in February
- **WHEN** a recurrence is configured for day 30 and the month is February with 28 or 29 days
- **THEN** the system SHALL generate the occurrence on February 28 (or 29 in a leap year)

### Requirement: Reconciliation on app open is idempotent and transactional
On app open, the system SHALL, for each active recurring transaction, compute all occurrences between its last processed occurrence date (exclusive) and today (inclusive), and materialize them. The entire reconciliation pass across all recurring transactions SHALL run inside a single database transaction, committing all generated movements together or none at all.

#### Scenario: App reopened after weeks of being closed
- **WHEN** the app was last opened on 1-sep and is reopened on 1-oct, with a semimonthly income recurrence anchored before 1-sep
- **THEN** the system SHALL generate the 15-sep and 30-sep occurrences in a single transactional reconciliation pass, updating account balances accordingly

### Requirement: Reconciliation prevents duplicate generation
The system SHALL prevent duplicate generation of the same occurrence, using a uniqueness guarantee on `(recurring_transaction_id, occurrence_date)`.

#### Scenario: Reopening the app twice the same day does not duplicate movements
- **WHEN** the app is closed and reopened multiple times on the same day after reconciliation already ran
- **THEN** the system SHALL NOT generate a second occurrence for any `(recurring_transaction_id, occurrence_date)` pair already processed

#### Scenario: Crash mid-reconciliation leaves no partial state
- **WHEN** the app is terminated after generating some but not all pending occurrences in a reconciliation pass
- **THEN** on the next app open, the system SHALL find no partially-applied state and SHALL resume generating from the same unprocessed cursor

### Requirement: Debt-payment recurrences generate scheduled entries only
When a `debt_payment` recurring transaction's occurrence date arrives, reconciliation SHALL create a `debt_payments` row with status `scheduled`, and SHALL NOT reduce the associated account balance or the debt's `saldo_pendiente`.

#### Scenario: Reconciliation crosses a debt due date
- **WHEN** reconciliation processes a `debt_payment` recurrence whose due date has passed
- **THEN** the system SHALL create a `scheduled` `debt_payments` row for that occurrence and SHALL leave account and debt balances unchanged until the user confirms it

### Requirement: Read-only future balance projection
The system SHALL provide a projection of an account's future balance over a given horizon, computed from the same recurrence engine but without writing any data. Projected balance SHALL be presented separately from the account's real (persisted) balance.

#### Scenario: View projected balance without affecting real balance
- **WHEN** the user views the dashboard's "saldo proyectado" for the rest of the month
- **THEN** the system SHALL compute it by summing projected future occurrences in memory, and SHALL NOT insert any rows or alter the account's real balance
