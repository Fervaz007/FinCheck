## ADDED Requirements

### Requirement: Recurring debt payments are configured from within Deudas
The system SHALL let the user configure a recurring debt payment schedule directly when creating or editing a parent or standalone debt (via its `isRecurring`, `periodicity`, and payment-day fields), without a separate "Recurrentes" screen.

#### Scenario: Marking a debt recurring generates scheduled payments
- **WHEN** a debt is marked recurring with a payment day
- **THEN** the app generates scheduled `debtPayments` occurrences for it on app open, using the same catch-up logic as before

### Requirement: Recurring income is configured from within Movimientos
The system SHALL let the user mark an income entry as recurring directly in the income capture form, choosing a frequency (the existing recurrence types: quincenal fijo MX, semanal, mensual día fijo, mensual último día, cada N días, cada N meses, anual) and an anchor date, without a separate "Recurrentes" screen.

#### Scenario: Registering recurring income
- **WHEN** the user captures an income "Nómina" and marks it recurring with frequency "quincenal fijo MX"
- **THEN** the app schedules future income occurrences using the existing recurrence engine, without a dedicated Recurrentes screen

### Requirement: A recurring transaction does not affect available money until its occurrence date arrives
Registering a recurring income or debt payment SHALL NOT change the pooled available total at the moment of registration. The available total SHALL only change when a scheduled occurrence's date is reached and reconciled.

#### Scenario: Registering today does not change today's balance
- **WHEN** the user registers a recurring income today with a future anchor date
- **THEN** today's available total is unchanged

#### Scenario: Reaching the occurrence date updates the balance
- **WHEN** the scheduled occurrence date arrives and the app is opened
- **THEN** the corresponding income is generated and the available total increases accordingly

### Requirement: The standalone Recurrentes screen is removed
The system SHALL NOT present a dedicated "Recurrentes" screen or drawer entry.

#### Scenario: Drawer no longer lists Recurrentes
- **WHEN** the user opens the app drawer
- **THEN** there is no "Recurrentes" entry
