## ADDED Requirements

### Requirement: The simulation mode is either "a meses" or "a contado"
The simulator SHALL require the user to choose exactly one mode: "a meses" (financed, MSI-style, 1 to N months) or "a contado" (paid in full, no financing).

#### Scenario: Choosing a meses
- **WHEN** the user selects "a meses" and a term of 12 months
- **THEN** the simulation treats the purchase as a new recurring monthly obligation

#### Scenario: Choosing a contado
- **WHEN** the user selects "a contado"
- **THEN** the simulation treats the purchase as a single immediate reduction of available money, not a new recurring obligation

### Requirement: "A meses" validates against the selected type's remaining capacity
When the mode is "a meses," the user SHALL also select a Tipo (one of the active rule's allocation labels). The simulation SHALL compare the new monthly payment against that type's remaining capacity (its rule percentage of income minus what's already committed to that type), not a generic global debt limit.

#### Scenario: Purchase fits within the type's remaining capacity
- **WHEN** the "Deudas" type has $1,000 of remaining capacity and the simulated monthly payment is $600
- **THEN** the simulation shows it fits within that type's limit

#### Scenario: Purchase exceeds the type's remaining capacity
- **WHEN** the "Deudas" type has $200 of remaining capacity and the simulated monthly payment is $600
- **THEN** the simulation flags it as exceeding that type's limit

### Requirement: "A contado" validates against real available money
When the mode is "a contado," the simulation SHALL compare the purchase price against the current pooled available total, with no Tipo selection involved.

#### Scenario: Cash purchase fits available money
- **WHEN** available money is $5,000 and the contado price is $3,000
- **THEN** the simulation shows the purchase is affordable and the resulting available total after the purchase
