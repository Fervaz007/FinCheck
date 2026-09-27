## ADDED Requirements

### Requirement: Configurable budget rule with allocations
The system SHALL allow the user to select a predefined budget rule (e.g. 50/30/20, 40/40/20) or create a custom rule, each composed of named allocations (e.g. `necesidades`, `deudas`, `ahorro`, `ocio`) with a percentage each.

#### Scenario: Create a custom budget rule
- **WHEN** the user creates a rule with allocations `necesidades=45%`, `deudas=25%`, `ahorro=20%`, `ocio=10%`
- **THEN** the system SHALL persist the rule with its four allocations

### Requirement: Allocation percentages must sum to 100%
The system SHALL validate, on create and on edit, that the sum of a budget rule's allocation percentages equals exactly 100%, and SHALL reject saving otherwise.

#### Scenario: Reject an invalid rule
- **WHEN** the user attempts to save a rule with allocations summing to 95%
- **THEN** the system SHALL block the save and show the current sum versus the required 100%

### Requirement: Exactly one active budget rule
The system SHALL allow only one budget rule to be active at a time; activating a rule SHALL deactivate the previously active one.

#### Scenario: Switch active rule
- **WHEN** the user activates the 40/40/20 rule while 50/30/20 was active
- **THEN** the system SHALL mark 40/40/20 as active and 50/30/20 as inactive, and subsequent dashboard/health calculations SHALL use 40/40/20
