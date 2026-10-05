## ADDED Requirements

### Requirement: Inicio shows budget compliance only for monitored types
The dashboard SHALL show, for each allocation label (Tipo) in the active budget rule marked as monitored (see `budget-rules`), the amount currently occupied by debts of that type versus that type's limit (the rule's percentage applied to total income for the period). Types not marked as monitored SHALL NOT appear in this card at all.

#### Scenario: A monitored type with debts assigned
- **WHEN** "Deudas" is monitored at 40% and $2,000 of debt payments are tagged with that type this month
- **THEN** Inicio shows "Deudas: $2,000 ocupado / [40% of income] límite"

#### Scenario: A monitored type with nothing assigned
- **WHEN** a monitored type has no debts tagged with it
- **THEN** Inicio shows that type's full limit as unused/available

#### Scenario: An unmonitored type is hidden
- **WHEN** "Gastos personales" is not marked as monitored
- **THEN** it does not appear in the per-section compliance card at all, regardless of how much is tagged to it

### Requirement: Inicio shows a global, month-independent available total as its primary figure
The dashboard SHALL show, as its most prominent figure (above the month navigator), a global available total that is NOT filtered by the active month: the sum of all income, minus all expenses, minus all confirmed debt payments, across all dates. This figure SHALL NOT subtract reserve accruals ("Apartados") — reserved money is still money the user holds. It SHALL NOT show a per-account "saldo real" or an account-ledger-based "saldo proyectado," since accounts no longer exist.

#### Scenario: Money entered in a previous month still shows
- **WHEN** the user entered income in September and the active month rolls over to October with no October income yet
- **THEN** the global available total still reflects the September money (minus any expenses/confirmed debt payments since), rather than dropping to zero

#### Scenario: Global total ignores the selected month
- **WHEN** the user navigates the month selector to any month
- **THEN** the global available figure above the navigator does not change — only the per-month breakdown below it changes

#### Scenario: Reserves do not reduce the global total
- **WHEN** a recurring debt has accrued $500 in its Apartado
- **THEN** the global available total is unchanged by that accrual (the $500 is still counted as money the user has)

### Requirement: The per-month breakdown is clearly labeled as monthly, distinct from the global total
The dashboard SHALL keep the per-month breakdown (income, expenses, confirmed debt payments for the selected month) below the month navigator, and SHALL label its net figure as a monthly balance (e.g. "Balance del mes") — never a second thing also called "Disponible," to avoid conflating the monthly net flow with the global available total.

#### Scenario: No two conflicting "Disponible" figures
- **WHEN** the user views Inicio
- **THEN** there is exactly one figure labeled "Disponible" (the global one), and the monthly card's net row uses a distinct monthly label

### Requirement: Inicio shows upcoming payment reminders (informational only) and the simulator shortcut
Inicio SHALL show a "próximos pagos" card listing each recurring debt's next payment day and amount as an informational reminder only — with NO "confirmar pago" action, since deductions are automatic. The "Simular una nueva compra" shortcut SHALL remain.

#### Scenario: Upcoming payments shown as reminders
- **WHEN** recurring debts exist with upcoming payment days
- **THEN** Inicio lists each one's next payment day and amount as a heads-up, with no button to confirm (the money is deducted automatically on the quincena cutoffs)

#### Scenario: Global available already reflects automatic deductions
- **WHEN** a recurring debt's quincena has passed
- **THEN** the global "Disponible" already shows the money reduced, without any user action on the reminder
