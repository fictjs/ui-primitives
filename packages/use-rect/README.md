# @fictjs/use-rect

Element rect observation hook for Fict, modeled after `@radix-ui/react-use-rect`. Returns a reactive accessor for an element's bounding rectangle, updating as it changes.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

Built on [`@fictjs/rect`](https://github.com/fictjs/ui-primitives/tree/main/packages/rect).

## Installation

```bash
pnpm add @fictjs/use-rect fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import { useRect } from '@fictjs/use-rect'

function Measured() {
  let el: HTMLDivElement | null = null
  const rect = useRect(() => el) // accessor: () => DOMRect | undefined
  return <div ref={(node) => (el = node)}>{rect()?.width}px</div>
}
```

## API

- **`useRect(target)`** — `target` may be an accessor (`() => Element | null`) or a `{ current }` ref object. Returns an accessor (`() => DOMRect | undefined`) that tracks the element's rect.

## Exports

- **Values:** `useRect`.
- **Types:** `RectTarget`.

## Documentation

The API mirrors `@radix-ui/react-use-rect`. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md).

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
