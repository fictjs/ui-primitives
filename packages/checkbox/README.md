# @fictjs/checkbox

Checkbox primitives for Fict, modeled after `@radix-ui/react-checkbox`. A control that can be checked, unchecked, or indeterminate, with a hidden native input for form participation.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/checkbox fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as Checkbox from '@fictjs/checkbox'

export function Example() {
  return (
    <Checkbox.Root defaultChecked name="terms">
      <Checkbox.Indicator>✓</Checkbox.Indicator>
    </Checkbox.Root>
  )
}
```

## Anatomy

- **`Checkbox.Root`** (`Root`) — `checked` / `defaultChecked` (`boolean | "indeterminate"`), `onCheckedChange`, `disabled`, `required`, `name`, `value`. Renders a `button` and, when inside a form, a synchronized hidden input.
- **`Checkbox.Indicator`** (`Indicator`) — rendered only when checked or indeterminate; `forceMount` keeps it mounted for animations.

Advanced composition is available via `Checkbox.Provider` and `Checkbox.Trigger` (also exported as `unstable_*`). Parts expose `data-state` (`"checked"` / `"unchecked"` / `"indeterminate"`) and `data-disabled`.

## Exports

- **Components:** `Checkbox` (`Root`), `CheckboxIndicator` (`Indicator`), `CheckboxProvider` (`Provider`), `CheckboxTrigger` (`Trigger`), `CheckboxBubbleInput` (`BubbleInput`), `createCheckboxScope`, plus `unstable_Provider` / `unstable_Trigger` / `unstable_BubbleInput` aliases.
- **Types:** `CheckboxProps`, `CheckboxProviderProps`, `CheckboxTriggerProps`, `CheckboxIndicatorProps`, `CheckboxBubbleInputProps`, `CheckedState`.

## Documentation

The API mirrors Radix, so the upstream [Radix Checkbox docs](https://www.radix-ui.com/primitives/docs/components/checkbox) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
