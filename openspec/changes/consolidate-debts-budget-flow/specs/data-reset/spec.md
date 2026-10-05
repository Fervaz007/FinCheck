## ADDED Requirements

### Requirement: Configuración offers a full data reset
The system SHALL provide, in the Configuración screen, an action that erases all user data and returns the app to its first-launch empty state: all debts, debt payments, reserves, income, expenses, recurring transactions, simulations, monthly-history summaries, budget rules and their allocations, and settings.

#### Scenario: Full reset clears everything
- **WHEN** the user confirms the reset
- **THEN** every table of user data is emptied, and afterward the app behaves exactly as a fresh install (no active rule, no debts, no movements, a global available total of $0)

#### Scenario: Budget rules are included in the reset
- **WHEN** the user performs a reset
- **THEN** their saved budget rules are also removed (not preserved), consistent with "start over from scratch"

### Requirement: The reset requires explicit confirmation to prevent accidental loss
The system SHALL NOT erase data on a single tap. It SHALL require an explicit, clearly-worded destructive confirmation (e.g. a confirm dialog naming that the action is irreversible) before performing the reset.

#### Scenario: Accidental tap does not destroy data
- **WHEN** the user taps the reset action but dismisses/cancels the confirmation
- **THEN** no data is deleted

#### Scenario: Confirmed reset proceeds
- **WHEN** the user taps the reset action and explicitly confirms the destructive dialog
- **THEN** the data is erased and the user is shown that the reset completed
