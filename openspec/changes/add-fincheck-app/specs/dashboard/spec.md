## ADDED Requirements

### Requirement: Monthly summary on the main dashboard
The system SHALL show, as the app's main screen, a summary of the current month: total income, total expenses, disponible (income minus expenses and confirmed debt payments), ahorro, and total confirmed debt payments.

#### Scenario: Dashboard shows the month at a glance
- **WHEN** the user opens FinCheck
- **THEN** the dashboard SHALL show income $30,000, egresos $21,000, disponible $9,000, ahorro $4,000, and deudas $6,000 for the current month

### Requirement: Financial health indicator on the dashboard
The dashboard SHALL display the current financial health status and its underlying percentages.

#### Scenario: Health indicator visible on open
- **WHEN** the user opens the dashboard
- **THEN** the system SHALL show the health status icon (🟢/🟡/🟠/🔴) alongside debt/necesidades/ahorro percentages

### Requirement: Pending debt payments surfaced prominently
The dashboard SHALL prominently surface any `scheduled` or derived-`vencido` debt payments requiring user confirmation.

#### Scenario: Overdue unconfirmed payment shown on dashboard
- **WHEN** a debt payment is `vencido` (scheduled, past due date, unconfirmed)
- **THEN** the dashboard SHALL display it as a pending action, not silently omit it

### Requirement: Drawer navigation with a hamburger menu
The system SHALL provide navigation via a top navbar with a hamburger menu that opens a side drawer listing every top-level section (Inicio, Movimientos, Deudas, Presupuesto, Simulador, Cuentas, Categorías, Reglas presupuestarias, Historial mensual, Configuración), each with a distinct icon. This replaces an earlier bottom-tab-bar design, which crowded five-plus sections into a cramped row of labels with no icons.

#### Scenario: Navigate via the drawer
- **WHEN** the user taps the hamburger icon in the navbar and selects "Deudas"
- **THEN** the system SHALL open the side drawer showing all sections with icons, and navigate to the debts management screen on selection
