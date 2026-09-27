## ADDED Requirements

### Requirement: Navigable monthly history
The system SHALL allow the user to navigate between months and view each month's summary (income, expenses, debt payments, ahorro, disponible).

#### Scenario: Navigate to a previous month
- **WHEN** the user navigates from October 2026 to September 2026
- **THEN** the system SHALL show September 2026's stored summary totals

### Requirement: Monthly summaries snapshot the configuration in effect
Each stored monthly summary SHALL record which budget rule and which debt limit were active for that month, so that later configuration changes do not silently rewrite historical health/compliance results.

#### Scenario: Budget rule changes after a month has closed
- **WHEN** the user changes the active budget rule in October, after September's summary was already computed under the previous rule
- **THEN** viewing September's history SHALL continue to reflect the budget rule that was active in September, not the new one

### Requirement: Idempotent recomputation
The system SHALL recompute a month's summary via upsert whenever underlying data for that month changes, without creating duplicate summary rows.

#### Scenario: Recompute after a backfilled recurring transaction
- **WHEN** reconciliation generates a new expense occurrence dated in September after September's summary already existed
- **THEN** the system SHALL update the existing September summary row in place, not create a second one
