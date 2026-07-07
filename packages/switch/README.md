# @fictjs/switch

Switch primitives for Fict, modeled after `@radix-ui/react-switch`. A two-state toggle the user can turn on or off, with a hidden native input for forms.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/switch fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as Switch from '@fictjs/switch'

export function Example() {
  return (
    <Switch.Root defaultChecked name="airplane-mode">
      <Switch.Thumb />
    </Switch.Root>
  )
}
```

## Anatomy

- **`Switch.Root`** (`Root`) — `checked` / `defaultChecked`, `onCheckedChange`, `disabled`, `required`, `name`, `value`.
- **`Switch.Thumb`** (`Thumb`) — the moving indicator.

Parts expose `data-state` (`"checked"` / `"unchecked"`) and `data-disabled`.

## Exports

- **Components:** `Switch` (`Root`), `SwitchThumb` (`Thumb`), `createSwitchScope`.
- **Types:** `SwitchProps`, `SwitchThumbProps`.

## Documentation

The API mirrors Radix, so the upstream [Radix Switch docs](https://www.radix-ui.com/primitives/docs/components/switch) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
