# @fictjs/direction

Direction (LTR/RTL) context for Fict, modeled after `@radix-ui/react-direction`. Lets primitives read the reading direction so keyboard navigation and layout adapt correctly.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/direction fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import { DirectionProvider, useDirection } from '@fictjs/direction'

function App() {
  return (
    <DirectionProvider dir="rtl">
      <Toolbar />
    </DirectionProvider>
  )
}

function Toolbar() {
  const dir = useDirection() // accessor: () => 'ltr' | 'rtl'
  return <div dir={dir()} />
}
```

## API

- **`DirectionProvider`** — `dir="ltr" | "rtl"`. Provides the ambient direction to descendants.
- **`useDirection(dir?)`** — returns an accessor for the resolved direction (explicit `dir` → context → `'ltr'`).
- **`DirectionContext`** — the underlying context.

## Exports

- **Values:** `DirectionProvider`, `useDirection`, `DirectionContext`.
- **Types:** `Direction`.

## Documentation

The API mirrors Radix, so the upstream [Radix Direction Provider docs](https://www.radix-ui.com/primitives/docs/utilities/direction-provider) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md).

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
