## Context

The app already has a token foundation: `Spacing` (half→six), `Radius` (small 8, medium 14, large 20, pill), and `Colors` with full light/dark sets (dark: background `#0B0E14`, backgroundElement `#161A23`, backgroundSelected `#1F2430`, border `#262B38`). Shared components exist: `Card` (backgroundElement, radius medium, padding three), `FormField` (bordered input, radius small), `ChipSelect` (pill chips), `ThemedText` (types: default/title/subtitle/small/smallBold/link/linkPrimary/code), `ScreenContainer` (scroll + padding three + gap three). What's missing is hierarchy, a button primitive, a grouped-row pattern, and consistent application — screens hand-roll layouts and buttons (a `Pressable` wrapping a `Card` with centered text), and records print as flat text runs.

This is a presentation-only change: no logic, data, navigation, or color-identity changes.

## Goals / Non-Goals

**Goals:**
- One reusable design system applied consistently across all screens.
- Clear visual hierarchy: primary info (name, amount) dominant; secondary (dates, type, notes) smaller and dimmed.
- Grouped data in blocks with breathing room, not run-on lines.
- Rounded, comfortable cards, fields, and prominent buttons; dark theme polished with depth.
- Touch-friendly on small screens.

**Non-Goals:**
- Any behavior/navigation/data/computation change.
- Changing the color identity or removing light mode.
- A full re-theme or new font system (reuse current fonts/palette).

## Decisions

### 1. Extend tokens, don't reinvent
- **Radius**: cards → `large` (20) for a softer modern look; fields/buttons → `medium` (14); chips/badges → `pill`. Keep the existing scale.
- **Spacing**: keep the scale; standardize card padding at `three` (16), inter-block gap at `three`–`four`, intra-block gap at `one`–`two`.
- **Text scale**: add a few `ThemedText` types for hierarchy without disturbing existing ones — e.g. `heading` (~20/700) for card titles, `amount` (~24/700) for monetary emphasis, `caption` (~12/500, used with `textSecondary`) for dimmed detail. Keep `title`/`subtitle` for the big hero figures (global Disponible).
- **Rationale**: the foundation is sound; the gap is hierarchy + consistency, not new primitives from scratch.

### 2. Depth in dark mode via tone + border, identity unchanged
- Add one elevated tone (e.g. `backgroundElevated` ≈ `#1F2430`/a hair lighter) for nested blocks, so screen-bg < card < nested-card reads as layers; give cards a subtle 1px `border` (existing border tone) rather than heavy shadows (shadows are unreliable across RN/Android).
- Keep every existing hue (primary, income, expense, debt, health colors) exactly as-is.
- **Rationale**: the user likes the palette; depth should come from tonal layering + hairline borders, not new colors.

### 3. New primitives: `Button` and `DataRow`
- **`Button`**: variants `primary` (filled `primary`, light text), `secondary` (subtle `backgroundSelected`), `destructive` (`critical`); rounded (`medium`/pill), min height ~44 for touch, disabled state. Replaces the `Pressable`+`Card` button hack everywhere.
- **`DataRow` / `ListItem`**: a block with a dominant line (title + trailing amount) and an optional dimmed secondary line, plus optional trailing action — the pattern for a debt, a movement, a reserve, a rule. This is the core fix for "todo junto, mismo tamaño."
- **Rationale**: these two cover ~all the repeated layout needs and guarantee consistency.

### 4. Deudas first as the reference implementation
Rebuild Deudas' list items and forms with the new system, settle the patterns there, then replicate. 
- **Rationale**: the user named Deudas as the worst offender and the reference; proving the system on the busiest screen de-risks the rest.

### 5. Presentation parity — same data, same behavior
Each screen's rework must render the exact same fields, actions, and flows; only styling/layout changes. Reviewer check per screen: diff shows markup/style changes, not changed props/handlers/queries.

## Risks / Trade-offs

- **[Risk]** Touching every screen risks accidental behavior/layout regressions. → **Mitigation**: do it screen-by-screen (tasks grouped per screen), Deudas first; keep handlers/data untouched; verify in Expo Go.
- **[Risk]** Extending `ThemedText` types or `Card` could shift spacing app-wide unexpectedly. → **Mitigation**: additive types (don't alter existing ones); when changing `Card`'s radius/border, eyeball each screen after.
- **[Risk]** Shadows/elevation render inconsistently on Android/Expo Go. → **Mitigation**: prefer tonal layering + hairline borders over shadows.
- **[Risk]** "Looks good" is subjective. → **Mitigation**: lock concrete token values in the design system so it's consistent and reviewable, not ad-hoc per screen.

## Open Questions

1. None blocking — palette, fonts, and token scale are all reused; the work is applying hierarchy and the new primitives consistently.
