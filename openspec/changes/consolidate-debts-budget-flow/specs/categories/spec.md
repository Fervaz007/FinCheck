## REMOVED Requirements

### Requirement: Categories screen and category tagging
**Reason**: Categories never actually drove any real calculation — budget compliance used hardcoded group names, not the category's `budgetGroup`. The "type" concept a category was meant to provide now lives directly on each debt (Tipo, drawn from the active budget rule's allocations), which is the only place it was ever needed.
**Migration**: No replacement screen. Any existing category data is dropped. Debts now capture their own Tipo directly; income/expense entries no longer have any category tag (expenses have none at all; income keeps only the unrelated, purely descriptive account tag — see `income`).
