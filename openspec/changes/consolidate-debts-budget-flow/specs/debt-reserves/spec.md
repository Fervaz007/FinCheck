## ADDED Requirements

### Requirement: Only non-child recurring debts generate automatic quincena deductions
The system SHALL generate automatic per-quincena deductions only for debts with no `parentDebtId` (parent debts and standalone debts) that have `isRecurring = true`. Child debts SHALL NOT generate their own deductions; they only contribute to their parent's derived amount.

#### Scenario: Child debt excluded
- **WHEN** the user opens the Apartados screen or the reconciliation runs
- **THEN** debts with a `parentDebtId` set never generate their own deductions and are not listed in Apartados

#### Scenario: Non-recurring debt excluded from quincena deductions
- **WHEN** a standalone or parent debt has `isRecurring = false`
- **THEN** it does not generate per-quincena deductions (see `debts` for how non-recurring debts affect available money)

### Requirement: Each recurring debt auto-deducts a per-quincena share from available money
For a recurring parent/standalone debt, the system SHALL split its current period amount (the debt's own amount for a standalone debt, or the live sum of active children for a parent debt) into equal per-quincena shares — 2 shares for `mensual`, 4 shares for `bimestral` — and SHALL deduct one share from the user's available money for each biweekly cutoff (day 15 and last day of month) that has passed. The user SHALL NOT have to confirm anything for this deduction to happen.

#### Scenario: Monthly debt deducts half each quincena
- **WHEN** a standalone debt has `periodicity = 'mensual'` and a period total of $3,000 (so $1,500 per quincena)
- **THEN** each passed biweekly cutoff reduces available money by $1,500, automatically, with no confirmation step

#### Scenario: Bimonthly debt deducts a quarter each quincena
- **WHEN** a standalone debt has `periodicity = 'bimestral'` and a period total of $1,000
- **THEN** each passed biweekly cutoff reduces available money by $250

#### Scenario: Parent debt uses the live children total
- **WHEN** a parent debt's active children currently sum to $900 and `periodicity = 'mensual'`
- **THEN** each quincena deducts $450 (half of the current live sum), not half of any amount stored earlier on the parent

### Requirement: The quincena in progress at creation counts immediately
When a recurring debt is created, the system SHALL immediately deduct for the quincena period the user is already inside — i.e. it counts the most recent cutoff on or before the creation date, not only cutoffs strictly after creation.

#### Scenario: Debt added mid-period deducts the current quincena at once
- **WHEN** the user creates a recurring monthly debt of $3,000 ($1,500/quincena) on October 2, after the September 30 cutoff has passed
- **THEN** available money drops by $1,500 immediately on creation (for the quincena that began at the September 30 cutoff), without waiting for the next cutoff

### Requirement: The starting reserve offsets the first deductions
The starting amount the user enters when creating a recurring debt ("apartado inicial") SHALL represent money they already hold set aside OUTSIDE their available total, and SHALL reduce (offset) the first deductions until it is used up. It is not counted as part of available money.

#### Scenario: Partial offset on the first quincena
- **WHEN** a recurring debt's quincena share is $1,500 and the user entered a starting reserve of $1,000, and one cutoff has passed
- **THEN** available money drops by only $500 (the $1,000 already set aside covers the rest)

#### Scenario: Offset spanning multiple quincenas
- **WHEN** a recurring debt's quincena share is $1,500 and the user entered a starting reserve of $2,000, and one cutoff has passed
- **THEN** available money does not drop for that first cutoff (the $2,000 covers it), and the next cutoff drops by $1,000 (the remaining $500 of the reserve is consumed first)

### Requirement: Deductions catch up on app open
The system SHALL deduct for every biweekly cutoff that has passed since the debt's last processed cutoff (tracked per debt), computed when the app opens — so reopening the app after several weeks applies every missed quincena at once, without duplicating cutoffs already applied.

#### Scenario: Catching up after being away
- **WHEN** the user last opened the app before the 15th and reopens it after the following month's last day
- **THEN** each cutoff in between is deducted exactly once, none skipped and none double-counted

### Requirement: Apartados shows what has been committed so far, with no manual reset
The Apartados screen SHALL show, per recurring parent/standalone debt, its per-quincena share and how much has been deducted/committed so far. There SHALL be no manual "apartar" or "reset" action, and no reset-on-payment-confirmation (payment confirmation no longer exists — see `debts`).

#### Scenario: Apartados reflects automatic deductions
- **WHEN** two quincenas have passed for a $1,500/quincena recurring debt
- **THEN** Apartados shows $3,000 committed for it, updated automatically
