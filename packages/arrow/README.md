# @fictjs/arrow

Arrow primitive for Fict, modeled after `@radix-ui/react-arrow`. Renders a small SVG triangle used as the pointer for popovers, tooltips, dropdowns, and other floating surfaces.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

> Internal building block, usually consumed through a component's `Arrow` part (e.g. `Popover.Arrow`). Also re-exported from [`@fictjs/radix-ui/internal`](https://github.com/fictjs/ui-primitives/tree/main/packages/radix-ui).

## Installation

```bash
pnpm add @fictjs/arrow fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as Arrow from '@fictjs/arrow'

export function Example() {
  return <Arrow.Root width={12} height={6} />
}
```

## Anatomy

- **`Arrow.Root`** (`Root`) — `width`, `height`. Renders an `svg`; supports `asChild` to swap in a custom shape.

## Exports

- **Components:** `Arrow` (`Root`).
- **Types:** `ArrowProps`.

## Documentation

The API mirrors `@radix-ui/react-arrow`. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md).

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
