## 1. Audit

- [x] 1.1 Walk every active screen (Inicio, Movimientos, Deudas, Apartados, Presupuesto, Reglas Presupuestarias, Simulador, Historial, Configuración) and note the specific hierarchy/spacing/roundness problems in each, to confirm scope before editing. (Confirmed: every screen uses flat run-on `ThemedText` lines for grouped data, and fakes buttons via `Pressable` wrapping a `Card`; Deudas is the worst offender as described.)

## 2. Design system (tokens + primitives)

- [x] 2.1 In `src/theme/tokens.ts`, confirm/standardize the radii and spacing the system will use (cards `large`, fields/buttons `medium`, chips `pill`; card padding `three`, inter-block gap `three`–`four`). (Tokens already had the right scale — applied via components, not changed here.)
- [x] 2.2 In `src/theme/colors.ts`, add an elevated/nested dark tone (e.g. `backgroundElevated`) and verify border tones give depth — keeping every existing hue unchanged; mirror for light mode.
- [x] 2.3 Extend `themed-text.tsx` with additive hierarchy types (`heading`, `amount`, `caption`) without altering existing types.
- [x] 2.4 Update `Card.tsx` for the new radius + subtle border/depth. (Radius.large, 1px border, new `elevated` prop for nested blocks.)
- [x] 2.5 Update `FormField.tsx` for rounded corners (medium), comfortable padding, and consistent field spacing.
- [x] 2.6 Polish `ChipSelect.tsx` to match (spacing, selected state, min touch height).
- [x] 2.7 Create `Button.tsx` with `primary` / `secondary` / `destructive` variants, rounded, ~44px min touch height, disabled state.
- [x] 2.8 Create a `DataRow`/`ListItem.tsx` primitive: dominant title + trailing amount (+ optional amountLabel), optional dimmed secondary line, optional trailing action, optional nested children content.
- [x] 2.9 Sanity-check `ScreenContainer.tsx` spacing rhythm against the new system. (Bumped inter-block gap from `three` to `four`.)

## 3. Deudas (reference screen)

- [x] 3.1 Rebuild each debt as a `DataRow`-based card: name + amount dominant; periodicity/type/due-day/remaining as a dimmed secondary block; children and "agregar hija" clearly nested.
- [x] 3.2 Restyle the new-debt and new-child forms with the field/button system; prominent primary button.
- [x] 3.3 Replace the ad-hoc "+ Nueva"/delete/action controls with the Button primitive and consistent iconography/placement. (Primary CTAs and the header toggle now use `Button`; the small inline ✕ delete icon stays a compact icon-only `Pressable` — converting a 1-character icon into a full 48px-tall button would hurt density/hierarchy more than help.)
- [x] 3.4 Verify Deudas behaves identically (same fields, same create/delete/child flows) — only presentation changed. (Diffed against the pre-change file: every handler, validation, and DAO call is byte-identical; only JSX/styling changed.)

## 4. Apply to remaining screens (presentation only, same data/behavior each)

- [x] 4.1 Inicio (`index.tsx`): hero Disponible, monthly breakdown, per-section, próximos pagos, health — as cohesive cards with hierarchy. (Section headers → caption; hero figures already used title/subtitle.)
- [x] 4.2 Movimientos (`movimientos.tsx`): income/expense forms and lists with the field/button/data-row system. (Tab toggle and submit now use `Button`; each movement row uses `DataRow`.)
- [x] 4.3 Apartados (`apartados.tsx`): each reserve as a data-row (name + committed/per-quincena with hierarchy).
- [x] 4.4 Presupuesto (`presupuesto.tsx`): rule list/activation with clear blocks. (heading/caption hierarchy applied.)
- [x] 4.5 Reglas Presupuestarias (`reglas-presupuestarias.tsx`): rule editor rows, monitored checkbox, allocation list, edit/delete actions. (Allocation rows now nested `elevated` cards; Editar/Eliminar now `Button` secondary/destructive.)
- [x] 4.6 Simulador (`simulador.tsx`): form + result cards with hierarchy.
- [x] 4.7 Historial (`historial.tsx`): monthly summary rows as readable blocks.
- [x] 4.8 Configuración (`configuracion.tsx`): info + "Zona de peligro" reset using the Button destructive variant.

## 5. Verification

- [x] 5.1 `npx tsc --noEmit` clean; run `npx jest` to confirm no logic tests broke (styling shouldn't affect them). (tsc clean; jest 11 suites / 59 tests passing — unchanged from before this change, confirming no screen/component edit touched tested logic, since only `src/theme/*`, `src/components/*`, and `src/app/(drawer)/*` screen files were touched.)
- [ ] 5.2 Visual pass in Expo Go at small-screen width: rounded/consistent cards, clear hierarchy, comfortable forms, no horizontal overflow, good tap targets, dark-mode depth with the same hues. (Requires a running app on a device/simulator — not possible in this environment.)
- [x] 5.3 Confirm per screen that data shown and all actions/flows are unchanged from before the restyle. (Every screen was rewritten by preserving each original handler, validation, DAO/hook call, and prop verbatim — only JSX structure/styling changed. No DAO/hook/service/schema file was touched; tsc's clean pass over every screen's existing prop/handler types confirms no signature drift.)
