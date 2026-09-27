## ADDED Requirements

### Requirement: Financial health computed from configurable rules
The system SHALL compute a financial health status (🟢 saludable, 🟡 atención, 🟠 riesgo, 🔴 crítico) as a pure function of configurable inputs: percentage of income to debt, percentage to necessities, percentage to savings, available money after expenses, and compliance with the active budget rule. The status SHALL NOT be an arbitrary or hardcoded value.

#### Scenario: Healthy status
- **WHEN** debt ratio, necessities ratio, and savings ratio are all within the configured healthy thresholds, and available money is positive
- **THEN** the system SHALL report 🟢 saludable

#### Scenario: Critical status
- **WHEN** the debt ratio exceeds the configured debt limit and available money after expenses is negative
- **THEN** the system SHALL report 🔴 crítico

### Requirement: Show underlying percentages driving the status
The system SHALL display, alongside the health status, the concrete amounts and percentages used to compute it (e.g. debt $6,000/$30,000 = 20%, necesidades $12,000/$30,000 = 40%, ahorro $4,000/$30,000 = 13.3%).

#### Scenario: Health screen shows the breakdown
- **WHEN** the user views the financial health indicator
- **THEN** the system SHALL show each contributing percentage and its corresponding amount, not only the color/status
