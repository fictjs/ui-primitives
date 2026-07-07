# @fictjs/one-time-password-field

One-time password (OTP) field primitives for Fict, modeled after `@radix-ui/react-one-time-password-field`. A group of single-character inputs for entering verification codes, with paste, auto-advance, and keyboard support.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

> Unstable API — exported as `unstable_OneTimePasswordField` from [`@fictjs/radix-ui`](https://github.com/fictjs/ui-primitives/tree/main/packages/radix-ui). The surface may change in a minor release.

## Installation

```bash
pnpm add @fictjs/one-time-password-field fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as OneTimePasswordField from '@fictjs/one-time-password-field'

export function Example() {
  return (
    <OneTimePasswordField.Root>
      <OneTimePasswordField.Input index={0} />
      <OneTimePasswordField.Input index={1} />
      <OneTimePasswordField.Input index={2} />
      <OneTimePasswordField.Input index={3} />
      <OneTimePasswordField.HiddenInput />
    </OneTimePasswordField.Root>
  )
}
```

## Anatomy

- **`Root`** — `value` / `defaultValue`, `onValueChange`, `autoSubmit`, `disabled`, `type`, `validationType` (`InputValidationType`), `dir`, `orientation`.
- **`Input`** — a single-character input (`index`).
- **`HiddenInput`** — a hidden input that carries the full concatenated value for form submission.

## Exports

- **Components:** `OneTimePasswordField` (`Root`), `OneTimePasswordFieldInput` (`Input`), `OneTimePasswordFieldHiddenInput` (`HiddenInput`), `createOneTimePasswordFieldScope`.
- **Types:** `OneTimePasswordFieldProps`, `OneTimePasswordFieldInputProps`, `OneTimePasswordFieldHiddenInputProps`, `InputValidationType`.

## Documentation

The API mirrors `@radix-ui/react-one-time-password-field`. See the [Radix Primitives docs](https://www.radix-ui.com/primitives), the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme), and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md).

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
