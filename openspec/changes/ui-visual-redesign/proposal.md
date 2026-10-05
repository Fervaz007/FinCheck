## Why

FinCheck works but looks rough: screens render data as run-on lines of same-size, same-weight text (a debt shows name, balance, periodicity, type, due day all jammed together with no hierarchy), form fields and blocks use flat sharp-cornered rectangles, and the dark theme — which the user likes — feels generic. The user wants a modern, intuitive look: rounded cards, clear spacing and block separation, visual hierarchy (amounts/names prominent; dates/notes small and dimmed), polished forms, and a bit more depth — without changing any behavior, navigation, or the data shown, and keeping the current dark palette as the base.

## What Changes

- Introduce a small, reusable **visual design system** on top of the existing tokens: standardized border radii, spacing rhythm, a richer text-type scale (for hierarchy), a card style (rounded, subtle depth), a form-field style (rounded, comfortable), and a real **Button** component with prominent primary / secondary / destructive variants (today buttons are ad-hoc `Pressable` wrapping a `Card`).
- Add a **list-item / data-row** pattern so grouped records (e.g. each debt) show a dominant primary line (name + amount) and a dimmed secondary line (periodicity, type, due day) in a clear block, instead of one undifferentiated text run.
- Apply the system consistently across every screen, **starting with Deudas as the reference screen**, then Inicio, Movimientos, Apartados, Presupuesto, Reglas Presupuestarias, Simulador, Historial, and Configuración.
- Polish the dark theme for depth: slightly distinct tones between screen background, cards, and nested/elevated blocks, plus subtle borders — **without changing the color identity**.
- Keep everything touch-friendly on small screens (comfortable tap targets, no horizontal overflow).

**Explicitly NOT changing**: functionality, navigation, flows, what data is shown or computed, the color identity, or light/dark behavior. This is presentation only.

## Capabilities

### New Capabilities
- `visual-design-system`: a reusable set of UI primitives and tokens (radii, spacing, text scale, card, field, button, data-row) and the requirement that all screens present information with consistent styling and clear visual hierarchy, dark-mode-first, touch-friendly, with no behavior change.

## Impact

- **Theme/tokens**: `src/theme/tokens.ts` (confirm/extend `Radius`, `Spacing`), `src/theme/colors.ts` (add an elevated/nested tone and ensure border tones give depth, keeping identity).
- **Shared components**: `src/components/Card.tsx` (rounded + depth), `src/components/FormField.tsx` (rounded, spacing), `src/components/ChipSelect.tsx` (polish), `src/components/themed-text.tsx` (extend the type scale for hierarchy), plus new `Button.tsx` and a `DataRow`/`ListItem.tsx` primitive; `ScreenContainer.tsx` spacing rhythm.
- **Screens** (presentation only): `src/app/(drawer)/deudas.tsx` (reference), then `index.tsx`, `movimientos.tsx`, `apartados.tsx`, `presupuesto.tsx`, `reglas-presupuestarias.tsx`, `simulador.tsx`, `historial.tsx`, `configuracion.tsx`.
- **No** DAO/service/hook/schema/navigation changes.
- **Verification**: visual pass in Expo Go at small-screen width; confirm no behavior/data changed.
