# @fictjs/id

Stable id accessor for Fict, modeled after `@radix-ui/react-id`. Generates a deterministic, unique id for wiring up ARIA attributes (`id`, `aria-labelledby`, `aria-controls`, …).

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/id fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import { useId } from '@fictjs/id'

function Field() {
  const id = useId() // accessor: () => string
  return (
    <>
      <label for={id()}>Name</label>
      <input id={id()} />
    </>
  )
}
```

## API

- **`useId(determinedId?)`** — returns an accessor (`() => string`). Pass an optional `determinedId` (value or accessor) to use a provided id; otherwise a stable `fict-*` id is generated.

## Exports

- **Values:** `useId`.

## Documentation

The API mirrors `@radix-ui/react-id`. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md).

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
