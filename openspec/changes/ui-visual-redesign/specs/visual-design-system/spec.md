## ADDED Requirements

### Requirement: A reusable design system defines the shared visual tokens and primitives
The system SHALL define, in one place, the shared visual language — border radii, spacing rhythm, a text-type scale with hierarchy levels, and card/field/button/data-row primitives — and all screens SHALL use it rather than hand-rolled styles, so the look is consistent across the app.

#### Scenario: Screens use shared primitives
- **WHEN** any screen renders a card, a form field, a button, or a data record
- **THEN** it uses the shared design-system primitive/tokens, not one-off inline styling

#### Scenario: Buttons use the Button primitive
- **WHEN** a screen renders a primary action
- **THEN** it uses the shared Button component (primary/secondary/destructive variant), not a Pressable wrapping a Card

### Requirement: Information is presented with clear visual hierarchy
Records and blocks SHALL present primary information (e.g. a name and its amount) as visually dominant (larger and/or bolder) and secondary information (dates, type, notes, periodicity) as smaller and color-attenuated, rather than all text at the same size and weight.

#### Scenario: A debt row has hierarchy
- **WHEN** a debt is listed
- **THEN** its name and amount are visually dominant while its periodicity, type, and due day are smaller and dimmed, grouped in a readable block

#### Scenario: No undifferentiated text runs
- **WHEN** a record has several fields
- **THEN** they are grouped into a labeled/spaced block, not concatenated into one same-size line

### Requirement: Cards and fields are rounded with comfortable spacing and depth
Cards SHALL use rounded corners and clear separation (spacing between blocks), with subtle depth in dark mode via tonal layering (screen background vs card vs nested block) and hairline borders rather than heavy shadows. Form fields SHALL be rounded with comfortable padding and spacing between fields.

#### Scenario: Rounded, separated blocks
- **WHEN** a screen shows multiple blocks
- **THEN** each is a rounded card with visible spacing between it and the next, and a subtle tonal/border distinction from the screen background

#### Scenario: Comfortable forms
- **WHEN** a form is shown
- **THEN** fields have rounded corners, clear labels, and comfortable vertical spacing between them, with the primary button visually prominent

### Requirement: The dark palette identity is preserved, only polished
The redesign SHALL keep the existing color identity (the current dark-mode hues for primary, income, expense, debt, and health states) and light/dark behavior; it MAY only add tonal/border depth, not change the hues.

#### Scenario: Same colors, more polish
- **WHEN** comparing before/after in dark mode
- **THEN** the hues are the same, with added depth (layered tones, hairline borders), not a different color scheme

### Requirement: Layout is touch-friendly on small screens
Interactive elements SHALL have comfortable tap targets and screens SHALL lay out without horizontal overflow at phone width.

#### Scenario: Phone-width usability
- **WHEN** the app is viewed at a small phone width
- **THEN** content fits without horizontal scrolling and buttons/rows are large enough to tap comfortably

### Requirement: The redesign changes presentation only, never behavior
Applying the design system to a screen SHALL NOT change its functionality, navigation, the data it shows, or any computation — only how it is presented.

#### Scenario: Behavior unchanged after restyle
- **WHEN** a screen has been restyled
- **THEN** it shows the same fields and performs the same actions/flows as before, with only markup/styling changed
