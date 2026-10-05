## ADDED Requirements

### Requirement: Expense entries carry no account and no category
The system SHALL NOT ask for or store an account or a category when registering an expense. An expense SHALL only have a description, amount, date, and optional notes.

#### Scenario: Registering an expense
- **WHEN** the user registers an expense "Comida" for $200
- **THEN** no account selector and no category selector are shown, and the expense saves successfully with just description, amount, and date

### Requirement: Every expense subtracts fully from the pooled available total
An expense's full amount SHALL be subtracted from the pooled available total, regardless of the absence of any account or category tag.

#### Scenario: Expense reduces available total
- **WHEN** an expense of $200 is registered
- **THEN** the pooled available total decreases by $200
