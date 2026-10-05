## ADDED Requirements

### Requirement: Rules are created only through the dedicated creation flow
The system SHALL only allow creating a new budget rule through the Reglas Presupuestarias screen's creation form. No other screen SHALL offer a shortcut to create a preset rule.

#### Scenario: Presupuesto no longer creates rules
- **WHEN** the user is on the Presupuesto screen
- **THEN** there is no control that creates a new rule — only activation of existing rules

### Requirement: Allocations must sum to 100%
A budget rule's allocation percentages SHALL sum to exactly 100% before it can be saved, as already enforced.

#### Scenario: Rejecting an incomplete rule
- **WHEN** the user tries to save a rule whose allocations sum to 90%
- **THEN** the system rejects the save and shows the current sum

### Requirement: Any number of allocation rows can be marked as monitored
Each budget rule allocation row SHALL support being marked as "monitorear este grupo." A rule MAY have zero, some, or all of its rows marked this way — there is no limit of one. Monitored rows are the ones whose occupied-vs-limit compliance is shown on Inicio (see `dashboard`) and factored into overall financial health status (see `financial-health`). Unmonitored rows are still valid Tipo options for tagging debts, but are not tracked for limit compliance.

#### Scenario: Marking multiple rows as monitored
- **WHEN** the user marks both "Necesidades" (50%) and "Deudas" (30%) as monitored, leaving "Gastos personales" (20%) unmarked
- **THEN** both "Necesidades" and "Deudas" are tracked for compliance and health status; "Gastos personales" is not

#### Scenario: A rule may have no monitored rows
- **WHEN** the user saves a rule without marking any row as monitored
- **THEN** the rule saves successfully and can still be used to register debts (Tipo options come from all rows regardless); no compliance or health status is shown until at least one row is monitored

### Requirement: Existing rules are shown in a clearly differentiated list
The system SHALL present existing rules (in both Reglas Presupuestarias and anywhere else they're listed) in a layout that visually separates each rule and its allocations, rather than a single run-on line of text.

#### Scenario: Viewing multiple rules
- **WHEN** the user has 3 saved rules
- **THEN** each rule is presented as a distinct, readable item showing its name, active state, and allocations

### Requirement: Existing rules can be edited
The system SHALL let the user edit an existing rule's name, allocation labels, percentages, and monitored flags, subject to the same 100%-sum validation as creation.

#### Scenario: Editing an existing rule
- **WHEN** the user edits a saved rule to mark "Deudas" as monitored and saves
- **THEN** the rule updates in place (same id), and any screen reading the active rule reflects the change immediately (no need to recreate or reactivate it)

### Requirement: Existing rules can be deleted
The system SHALL let the user delete a rule that is not currently active. Deleting the active rule SHALL first require deactivating or activating a different rule.

#### Scenario: Deleting an inactive rule
- **WHEN** the user deletes a rule that is not the active one
- **THEN** the rule and its allocations are removed; debts previously tagged with its labels keep their text snapshot (see design.md decision #6) and are unaffected

#### Scenario: Deleting the active rule is blocked
- **WHEN** the user tries to delete the currently active rule
- **THEN** the system explains they must activate a different rule first (or explicitly deactivate), rather than silently leaving the app with no active rule mid-deletion
