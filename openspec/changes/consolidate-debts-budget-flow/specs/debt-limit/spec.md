## REMOVED Requirements

### Requirement: The debt limit is derived from the active rule's debt-limit allocation
**Reason**: Generalized after further feedback — a single "debt limit" concept, tied to exactly one allocation row, was too narrow. The user wants to monitor several budget-rule groups at once (e.g. both "Necesidades" and "Deudas"), each against its own percentage, not just one designated "debt" row.
**Migration**: See `budget-rules`' "any number of allocation rows can be marked as monitored" requirement, `financial-health`'s multi-group status requirement, and `dashboard`'s per-monitored-type compliance requirement — together they replace this capability.

### Requirement: Undefined debt limit is shown explicitly, never silently defaulted
**Reason**: Superseded by the generalized "no monitored rows" state, which the same three capabilities above now define directly (no monitored rows → no compliance shown, health status `sin_limite`).
**Migration**: None needed beyond what's already specified in `financial-health`.
