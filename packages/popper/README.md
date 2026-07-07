# @fictjs/popper

Popper positioning primitives for Fict, modeled after `@radix-ui/react-popper`. Anchors floating content to a reference element with collision detection, powered by [Floating UI](https://floating-ui.com/) via `@fictjs/floating-ui-dom`.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

> Internal building block used by Popover, Tooltip, Hover Card, Select, and the menu family. Also re-exported from [`@fictjs/radix-ui/internal`](https://github.com/fictjs/ui-primitives/tree/main/packages/radix-ui).

## Installation

```bash
pnpm add @fictjs/popper fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as Popper from '@fictjs/popper'

function Example() {
  return (
    <Popper.Root>
      <Popper.Anchor>{/* reference element */}</Popper.Anchor>
      <Popper.Content side="bottom" align="center" sideOffset={8}>
        {/* positioned content */}
        <Popper.Arrow />
      </Popper.Content>
    </Popper.Root>
  )
}
```

## Anatomy

- **`Popper.Root`** (`Root`), **`Popper.Anchor`** (`Anchor`) — the reference element.
- **`Popper.Content`** (`Content`) — `side`, `sideOffset`, `align`, `alignOffset`, `avoidCollisions`, `collisionBoundary`, `collisionPadding`, `sticky`, `hideWhenDetached`. Exposes `--radix-popper-*` CSS variables.
- **`Popper.Arrow`** (`Arrow`) — a positioned arrow.
- **`SIDE_OPTIONS`**, **`ALIGN_OPTIONS`** — the allowed values for `side` / `align`.

## Exports

- **Components:** `Popper` (`Root`), `PopperAnchor` (`Anchor`), `PopperContent` (`Content`), `PopperArrow` (`Arrow`), `createPopperScope`, `SIDE_OPTIONS`, `ALIGN_OPTIONS`.
- **Types:** `PopperProps`, `PopperAnchorProps`, `PopperContentProps`, `PopperArrowProps`.

## Documentation

The API mirrors `@radix-ui/react-popper`. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md).

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
