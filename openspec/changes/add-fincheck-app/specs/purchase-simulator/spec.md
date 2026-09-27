## ADDED Requirements

### Requirement: General purchase/debt simulator
The system SHALL allow the user to simulate any new purchase or debt (not limited to a product category) by entering name, price, down payment, financed amount, monthly payment, term in months, and an optional interest rate.

#### Scenario: Simulate a non-vehicle purchase
- **WHEN** the user simulates buying a laptop with price $25,000, down payment $5,000, monthly payment $1,800, term 12 months
- **THEN** the system SHALL accept and compute the simulation the same way as any other simulated debt

### Requirement: Before/after comparison
The system SHALL compute and display "situación actual" versus "con nueva compra": total debt, debt-to-income percentage, and disponible, showing the difference in amounts and percentages.

#### Scenario: Comparing before and after
- **WHEN** current income is $30,000, current debt payments total $6,000 (20%), and the user simulates adding a $9,500 monthly payment
- **THEN** the system SHALL show "después de comprar": debt payments $15,500, debt ratio 51.7%

### Requirement: Flag when simulated debt exceeds the configured limit
The system SHALL compare the post-simulation debt-to-income ratio against the configured debt limit and flag when it is exceeded.

#### Scenario: Simulated debt exceeds the limit
- **WHEN** the post-simulation debt ratio (51.7%) exceeds the configured debt limit (30%)
- **THEN** the system SHALL display a warning indicating the new debt exceeds the established limit

#### Scenario: Simulated debt stays within the limit
- **WHEN** the post-simulation debt ratio (28.3%) is within the configured debt limit (30%)
- **THEN** the system SHALL indicate the simulated debt is within the limit
