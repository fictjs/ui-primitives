# @fictjs/use-size

Element size observation hook for Fict, modeled after `@radix-ui/react-use-size`. Returns a reactive accessor for an element's size, backed by `ResizeObserver`.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/use-size fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import { useSize } from '@fictjs/use-size'

function Measured() {
  let el: HTMLDivElement | null = null
  const size = useSize(() => el) // accessor: () => { width, height } | undefined
  return (
    <div ref={(node) => (el = node)}>
      {size()?.width}×{size()?.height}
    </div>
  )
}
```

## API

- **`useSize(target)`** — `target` may be an accessor (`() => HTMLElement | null`) or a `{ current }` ref object. Returns an accessor (`() => { width: number; height: number } | undefined`) that updates via `ResizeObserver` (border-box).

## Exports

- **Values:** `useSize`.
- **Types:** `ElementTarget`.

## Documentation

The API mirrors `@radix-ui/react-use-size`. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md).

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
