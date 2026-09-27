## ADDED Requirements

### Requirement: Category CRUD
The system SHALL allow the user to create, edit, and delete categories. Each category SHALL have a name, an applicable movement type (`income` or `expense`), and an assigned budget group (e.g. `necesidades`, `ocio`, `deudas`, `ahorro`, or a custom group name).

#### Scenario: Create an expense category
- **WHEN** the user creates category "Gasolina" with type `expense` and budget group `necesidades`
- **THEN** the system SHALL persist the category and make it available when registering expenses

#### Scenario: Prevent deleting a category in use
- **WHEN** the user attempts to delete a category that has existing income or expense records
- **THEN** the system SHALL block the deletion and prompt the user to reassign those records to another category first

### Requirement: Category budget-group mapping feeds budget rules
Each category's budget group SHALL be used to attribute its movements to the matching allocation of the active budget rule.

#### Scenario: Expense attributed to budget group
- **WHEN** an expense is registered under a category with budget group `ocio`
- **THEN** the system SHALL count that expense's amount toward the `ocio` allocation of the active budget rule when computing budget compliance
