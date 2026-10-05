## ADDED Requirements

### Requirement: Income entries carry an optional, purely descriptive free-text origin
The system SHALL let the user optionally type a short free-text origin (e.g. "Efectivo", "TDD", "Préstamo personal", or anything else) on an income entry, for their own reference. There SHALL be no backing table or fixed catalog constraining this value. This field SHALL NOT be used in any balance, health, or budget calculation.

#### Scenario: Tagging an income entry
- **WHEN** the user registers an income and types "Efectivo" as its origin
- **THEN** the income is saved with that text, shown in the income list, and no calculation anywhere reads it

#### Scenario: Typing an origin not seen before
- **WHEN** the user types an origin that doesn't match any previous entry (e.g. "Reembolso de mi hermano")
- **THEN** the income saves successfully with that exact text — there is no list to pick from and nothing to validate against

#### Scenario: Untagged income still counts fully
- **WHEN** an income entry has no origin text
- **THEN** it is included in the available total exactly like one with an origin

### Requirement: Every income adds fully to the pooled available total
Regardless of its origin text, an income entry's full amount SHALL be added to the pooled available total.

#### Scenario: Income from different origins
- **WHEN** two income entries of $500 are registered, one with origin "Efectivo" and one with origin "Préstamo personal"
- **THEN** the available total increases by $1,000 total, with no distinction by origin

### Requirement: Income can be marked recurring
An income entry SHALL support an optional recurring schedule (see `recurring-transactions`), captured in the same Movimientos income form.

#### Scenario: Recurring income form fields
- **WHEN** the user checks "¿Es recurrente?" while registering income
- **THEN** the form additionally asks for frequency and anchor date
