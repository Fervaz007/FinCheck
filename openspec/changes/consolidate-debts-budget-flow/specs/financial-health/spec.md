## ADDED Requirements

### Requirement: Health status is the worst status across all monitored budget-rule groups
The system SHALL compute financial health status (`saludable`/`atencion`/`riesgo`/`critico`/`sin_limite`) from every allocation row marked as monitored (see `budget-rules`) in the active rule — not from debt payments alone. For each monitored row, the system compares its actual spend (see `dashboard`'s per-type compliance) against its allocated amount (the rule's percentage of income). The overall status SHALL be the worst individual status among all monitored rows, plus a negative-available-money check that forces `critico` regardless of any row's individual status.

#### Scenario: One monitored group exceeds its limit
- **WHEN** "Necesidades" (monitored, 50%) is within budget but "Deudas" (monitored, 30%) has exceeded its allocated amount
- **THEN** overall health status is `riesgo` (or `critico` if also past the attention margin), driven by the worse of the two — not masked by "Necesidades" being fine

#### Scenario: All monitored groups healthy
- **WHEN** every monitored row's actual spend is comfortably under its allocated amount and available money is non-negative
- **THEN** overall health status is `saludable`

#### Scenario: Unmonitored groups don't affect status
- **WHEN** "Gastos personales" (not monitored) has wildly exceeded what its percentage would allow, but every monitored row is within budget
- **THEN** overall health status is unaffected by "Gastos personales" — it is not part of the calculation at all

### Requirement: No monitored groups yields an explicit unavailable status, not a false "healthy"
When there is no active rule, or the active rule has no row marked as monitored, the system SHALL show health status as explicitly `sin_limite` rather than defaulting to `saludable` or any computed ratio.

#### Scenario: No monitored rows configured
- **WHEN** the active rule has no row marked as monitored
- **THEN** the health card shows an explicit "sin límite configurado" state instead of a status

### Requirement: Health status does not depend on a savings ratio
The system SHALL NOT factor a savings ratio into health status, since there is no reliable signal for "savings" once categories are removed.

#### Scenario: No savings signal required
- **WHEN** the app computes health status
- **THEN** it does so using only monitored-group compliance and available-money sign, without requiring any savings figure
