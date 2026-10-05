## REMOVED Requirements

### Requirement: Account balances are manually declared, never computed
**Reason**: Implemented and tested, then found to be dead weight — the user never actually uses a declared balance to track money; they track it by logging income, not by typing a number into an account. With nothing reading it, the declared balance served no purpose.
**Migration**: No replacement. There is no declared-balance concept at all.

### Requirement: Declared balances are editable after creation
**Reason**: Moot once the declared-balance concept itself is removed (see above).
**Migration**: None — there is nothing to edit.

### Requirement: Accounts remain a reference list, still selectable as an income tag
**Reason**: A fixed, table-backed catalog of account names added a screen and a table for something the user would rather just type. See `income`'s free-text `origin` field, which keeps the same descriptive benefit without the catalog.
**Migration**: Use income's free-text `origin` field instead of picking from an accounts list — type "Efectivo", "TDD", "Préstamo personal", or anything else directly.
