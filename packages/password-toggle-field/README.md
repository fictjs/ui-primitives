# @fictjs/password-toggle-field

Password toggle field primitives for Fict, modeled after `@radix-ui/react-password-toggle-field`. A password input paired with a button that shows/hides the entered value.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

> Unstable API — exported as `unstable_PasswordToggleField` from [`@fictjs/radix-ui`](https://github.com/fictjs/ui-primitives/tree/main/packages/radix-ui). The surface may change in a minor release.

## Installation

```bash
pnpm add @fictjs/password-toggle-field fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as PasswordToggleField from '@fictjs/password-toggle-field'

export function Example() {
  return (
    <PasswordToggleField.Root>
      <PasswordToggleField.Input />
      <PasswordToggleField.Toggle>
        <PasswordToggleField.Icon visible={<span>🙈</span>} hidden={<span>👁️</span>} />
      </PasswordToggleField.Toggle>
    </PasswordToggleField.Root>
  )
}
```

## Anatomy

- **`Root`** — `visible` / `defaultVisible`, `onVisibilityChange`.
- **`Input`** — the password `input`; type flips between `password` and `text`.
- **`Toggle`** — the show/hide button.
- **`Icon`** — renders different content for the `visible` and `hidden` states; **`Slot`** for custom composition.

## Exports

- **Components:** `PasswordToggleField` (`Root`), `PasswordToggleFieldInput` (`Input`), `PasswordToggleFieldToggle` (`Toggle`), `PasswordToggleFieldSlot` (`Slot`), `PasswordToggleFieldIcon` (`Icon`).
- **Types:** `PasswordToggleFieldProps`, `PasswordToggleFieldInputProps`, `PasswordToggleFieldToggleProps`, `PasswordToggleFieldSlotProps`, `PasswordToggleFieldIconProps`.

## Documentation

The API mirrors `@radix-ui/react-password-toggle-field`. See the [Radix Primitives docs](https://www.radix-ui.com/primitives), the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme), and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md).

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
