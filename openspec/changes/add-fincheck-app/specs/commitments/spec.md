## ADDED Requirements

### Requirement: Register a commitment split across pay periods
The system SHALL allow the user to register a commitment with a name, a total amount, and the number of pay periods (e.g. quincenas) across which to spread it, and SHALL compute the amount to set aside per period as `total_amount / periods_to_spread`.

#### Scenario: Monthly debt split across two quincenas
- **WHEN** the user registers commitment "BBVA" with total $1,200 spread across 2 periods
- **THEN** the system SHALL compute $600 to set aside per period

#### Scenario: Bimonthly bill split across four quincenas
- **WHEN** the user registers commitment "Luz" with total $1,000 spread across 4 periods
- **THEN** the system SHALL compute $250 to set aside per period

### Requirement: A commitment can link to an existing debt or recurring expense instead of duplicating the amount
The system SHALL allow a commitment to optionally link to an existing `debt` (using its `monthly_payment`) or an existing `expense`-kind recurring transaction (using its `amount`), instead of requiring the user to re-enter the same amount. When linked, the commitment's total amount SHALL always be read live from the linked record, so that updating the debt's monthly payment or the recurring transaction's amount is automatically reflected without editing the commitment.

#### Scenario: Commitment linked to an existing debt
- **WHEN** the user creates a commitment linked to debt "BBVA" (monthly payment $1,200) spread across 2 periods
- **THEN** the system SHALL compute $600 per period from the debt's current monthly payment, without asking the user to type $1,200 again

#### Scenario: Linked debt's monthly payment changes
- **WHEN** the linked debt's monthly payment is later edited from $1,200 to $1,500
- **THEN** the commitment's per-period amount SHALL reflect $750 (from $1,500 / 2) the next time it is viewed, without any change to the commitment record itself

### Requirement: Linking to a debt only offers parent-level debts
When a commitment links to a debt, the system SHALL only offer debts with no `parent_debt_id` (parent or ungrouped debts) as link targets, never a child debt. The per-period amount for a debt with children SHALL therefore always be based on that parent's derived monthly payment (the sum of its active children), matching how the parent itself is paid.

#### Scenario: Child debts are not selectable
- **WHEN** the user opens the "vincular a una deuda" picker while creating a commitment, and debt "BBVA" has children "Llantas", "TV", and "Netflix"
- **THEN** the picker SHALL list "BBVA" but SHALL NOT list "Llantas", "TV", or "Netflix"

#### Scenario: Per-period amount reflects the parent's derived total
- **WHEN** a commitment is linked to parent debt "BBVA" (derived monthly payment $700 from its active children) spread across 2 periods
- **THEN** the system SHALL compute $350 per period from BBVA's current derived total, automatically reflecting any child that finishes or is added later

### Requirement: Progress tracking is manual and does not move money
The system SHALL track accumulated progress per commitment as the user manually confirms each period's reserve, and SHALL NOT create any transaction, move money between accounts, or alter any account's real balance as a side effect.

#### Scenario: User confirms a period's reserve
- **WHEN** the user taps "apartar esta quincena" for a commitment with per-period amount $250
- **THEN** the system SHALL add $250 to that commitment's accumulated progress, and SHALL NOT insert any income/expense/debt_payment row or change any account balance

#### Scenario: User resets a completed cycle after paying the real bill
- **WHEN** the user confirms they paid the real bill for a commitment
- **THEN** the system SHALL reset that commitment's accumulated progress to $0, ready for the next cycle

### Requirement: Adjusted available is subtracted from global income, not a specific account
Given a pay period's total income and the active commitments, the system SHALL compute the amount reserved (sum of each commitment's per-period amount) and the adjusted available amount as `period_income - reserved`, applied against the user's overall income for that period rather than any single account's balance.

#### Scenario: Adjusted available reflects multiple active commitments
- **WHEN** the user's quincena income is $9,000 and active commitments reserve $600 (BBVA) and $250 (Luz)
- **THEN** the system SHALL report reserved = $850 and adjusted available = $8,150
