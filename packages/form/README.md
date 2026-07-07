# @fictjs/form

Form primitives for Fict, modeled after `@radix-ui/react-form`. Accessible form fields with built-in client-side validation and message wiring.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/form fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as Form from '@fictjs/form'

export function Example() {
  return (
    <Form.Root>
      <Form.Field name="email">
        <Form.Label>Email</Form.Label>
        <Form.Control type="email" required />
        <Form.Message match="valueMissing">Please enter your email.</Form.Message>
        <Form.Message match="typeMismatch">Please provide a valid email.</Form.Message>
      </Form.Field>
      <Form.Submit>Submit</Form.Submit>
    </Form.Root>
  )
}
```

## Anatomy

- **`Form.Root`** (`Root`) — `onClearServerErrors`.
- **`Form.Field`** (`Field`) — `name`, `serverInvalid`; wires label, control, and messages together.
- **`Form.Label`** (`Label`), **`Form.Control`** (`Control`).
- **`Form.Message`** (`Message`) — `match` a built-in validity key (e.g. `valueMissing`, `typeMismatch`) or a custom validation function.
- **`Form.ValidityState`** (`ValidityState`) — render-prop access to the field's `ValidityState`.
- **`Form.Submit`** (`Submit`).

## Exports

- **Components:** `Form` (`Root`), `FormField` (`Field`), `FormLabel` (`Label`), `FormControl` (`Control`), `FormMessage` (`Message`), `FormValidityState` (`ValidityState`), `FormSubmit` (`Submit`), `createFormScope`.
- **Types:** `FormProps`, `FormFieldProps`, `FormLabelProps`, `FormControlProps`, `FormMessageProps`, `FormValidityStateProps`, `FormSubmitProps`.

## Documentation

The API mirrors Radix, so the upstream [Radix Form docs](https://www.radix-ui.com/primitives/docs/components/form) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
