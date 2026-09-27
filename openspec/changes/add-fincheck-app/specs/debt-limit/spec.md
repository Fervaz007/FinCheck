## ADDED Requirements

### Requirement: Independent debt-to-income limit configuration
The system SHALL allow the user to configure a maximum percentage of income destined to debt payments, independently of the active budget rule's `deudas` allocation (if any).

#### Scenario: Configure a debt limit independent of the budget rule
- **WHEN** the user sets the debt limit to 30% while the active budget rule has no `deudas` allocation at all (e.g. a pure 50/30/20 rule)
- **THEN** the system SHALL still enforce and report against the configured 30% debt limit

### Requirement: Compute current debt-to-income ratio and available capacity
Given monthly income and confirmed monthly debt obligations, the system SHALL compute the current debt-to-income percentage, the maximum allowed debt amount under the configured limit, and the remaining capacity available for new debt.

#### Scenario: Compute available capacity
- **WHEN** monthly income is $30,000, current confirmed monthly debt payments total $6,000, and the debt limit is 30%
- **THEN** the system SHALL report current debt ratio 20%, maximum allowed debt $9,000, and available capacity for new debt $3,000
