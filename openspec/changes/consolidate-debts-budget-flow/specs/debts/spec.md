## ADDED Requirements

### Requirement: Debt creation requires an active budget rule, but not any specific monitored row
The system SHALL block creating any debt (parent or standalone) unless there is an active budget rule — needed to populate the Tipo options. When blocked, the system SHALL show a message directing the user to Reglas Presupuestarias. Registering a debt SHALL NOT require any allocation row to be marked as monitored — that flag only affects compliance/health display (see `budget-rules`, `financial-health`), not whether a debt can be created.

#### Scenario: No active rule
- **WHEN** the user tries to create a debt and no budget rule is active
- **THEN** the app shows an explanatory alert and does not create the debt

#### Scenario: Active rule with no monitored rows still allows debt creation
- **WHEN** the active rule exists but has no allocation row marked as monitored
- **THEN** the user can still create debts and pick a Tipo from that rule's labels — only compliance/health display is affected, not debt creation

### Requirement: Parent and standalone debts capture Tipo, Periodicidad, recurrence, day, and starting reserve
A parent or standalone debt SHALL be created with: a name, a Tipo (one of the active rule's current allocation labels, stored as a text snapshot), a Periodicidad (`mensual` or `bimestral`), an `isRecurring` flag, a payment day, and a starting reserve amount (see `debt-reserves`). A standalone debt additionally captures its total payment amount and remaining payments (months); a parent debt does not capture an amount — it is always derived from its active children.

#### Scenario: Creating a parent debt
- **WHEN** the user creates a parent debt named "BBVA" with Tipo "Deudas", Periodicidad "mensual", marks it recurring, sets payment day 5, and leaves the starting reserve at $0
- **THEN** the debt is created with no monthly amount captured directly, ready to accept child debts

#### Scenario: Creating a standalone debt
- **WHEN** the user creates a standalone debt named "Luz" with Tipo "Necesidades", Periodicidad "bimestral", a total amount, and remaining payments
- **THEN** the debt is created and behaves independently, never expecting children

### Requirement: Child debts remain unchanged and inherit no independent scheduling
A child debt SHALL only capture a name, a monthly payment amount, and remaining months (or "indefinite"). It SHALL NOT capture Tipo, Periodicidad, recurrence, or a payment day — those concepts apply only to its parent.

#### Scenario: Adding a child debt
- **WHEN** the user adds a child debt "Llantas" under "BBVA" with a monthly payment and remaining months
- **THEN** the child is created without any Tipo, Periodicidad, or payment-day fields, and the parent's derived totals include it

### Requirement: No account is ever selected for a debt
The system SHALL NOT ask for or store any account reference when creating a debt or at any point in its lifecycle. Debt deductions SHALL only affect the pooled available total, never any individual account's balance.

#### Scenario: Creating a recurring debt asks nothing about accounts
- **WHEN** the user marks a debt as recurring and sets its payment day
- **THEN** no account selector is shown, and no account is required to save the debt

### Requirement: Debt deductions are automatic — there is no manual payment confirmation
The system SHALL NOT require (or offer) a manual "confirmar pago" step for a debt's money to move. Recurring debts deduct automatically per quincena (see `debt-reserves`); there is no scheduled-then-confirmed payment flow.

#### Scenario: No confirm button
- **WHEN** the user views a recurring debt or the dashboard
- **THEN** there is no "Confirmar pago" action — deductions have already happened automatically for each passed quincena

### Requirement: The payment day is used only as an upcoming-payment reminder
A recurring debt's payment day SHALL drive only an informational "próximo pago" reminder on Inicio (which debt, which day, how much is coming); it SHALL NOT drive the deduction timing (deductions follow the quincena cutoffs, not the payment day).

#### Scenario: Reminder shows the next payment day
- **WHEN** a recurring debt has payment day 23
- **THEN** Inicio shows it as an upcoming reminder for day 23, while its money is still deducted on the quincena cutoffs (15th / last day), not on the 23rd

### Requirement: A non-recurring debt deducts its full amount once
A debt saved as NOT recurring SHALL deduct its full total from available money a single time (offset by any starting reserve entered), rather than per quincena — it represents a one-time obligation already incurred.

#### Scenario: One-time debt reduces available money once
- **WHEN** the user saves a non-recurring debt of $5,000 with no starting reserve
- **THEN** available money drops by $5,000 once, and does not keep dropping over subsequent quincenas

### Requirement: A debt's padre/normal kind is persisted, not just chosen at creation
The system SHALL persist whether a debt was created as a parent (can accept children) or a standalone/normal debt (cannot) — this is not derivable from whether it currently has children. The "+ Agregar hija" action SHALL only be offered for debts persisted as parent-kind, never for standalone/normal debts, regardless of how many children a parent currently has (including zero).

#### Scenario: Normal debt never offers to add children
- **WHEN** a debt was created as "normal"
- **THEN** it never shows a "+ Agregar hija" option, even after being saved and reopened

#### Scenario: Parent debt offers to add children even with zero so far
- **WHEN** a debt was created as "padre" and has no children yet
- **THEN** it still shows "+ Agregar hija", since its parent-kind is persisted independently of its current child count

### Requirement: Parent debt totals are always derived from active children
A parent debt's monthly payment and outstanding balance SHALL always be computed from its currently active children (never entered directly), consistent with existing derivation logic.

#### Scenario: Parent totals update as children change
- **WHEN** a new child is added to or removed from an active parent debt
- **THEN** the parent's displayed monthly payment and balance immediately reflect the current set of active children
