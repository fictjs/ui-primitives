# @fictjs/separator

Separator primitive for Fict, modeled after `@radix-ui/react-separator`. A visual or semantic divider between content.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/separator fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as Separator from '@fictjs/separator'

export function Example() {
  return (
    <>
      <span>Docs</span>
      <Separator.Root orientation="vertical" decorative />
      <span>Blog</span>
    </>
  )
}
```

## Anatomy

- **`Separator.Root`** (`Root`) — `orientation="horizontal" | "vertical"` (defaults to `horizontal`), `decorative` (when `true`, hidden from assistive technology). Supports `asChild`.

Exposes `data-orientation`.

## Exports

- **Components:** `Separator` (`Root`).
- **Types:** `SeparatorProps`, `Orientation`.

## Documentation

The API mirrors Radix, so the upstream [Radix Separator docs](https://www.radix-ui.com/primitives/docs/components/separator) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
