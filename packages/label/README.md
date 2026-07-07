# @fictjs/label

Label primitive for Fict, modeled after `@radix-ui/react-label`. An accessible label that associates with a control and prevents text selection on double-click.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/label fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as Label from '@fictjs/label'

export function Example() {
  return <Label.Root for="email">Email</Label.Root>
}
```

## Anatomy

- **`Label.Root`** (`Root`) — renders a `label`. Supports `asChild`. Pointer-down on the label does not select its text.

## Exports

- **Components:** `Label` (`Root`).
- **Types:** `LabelProps`.

## Documentation

The API mirrors Radix, so the upstream [Radix Label docs](https://www.radix-ui.com/primitives/docs/components/label) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
