# @fictjs/use-is-hydrated

Hydration state accessor for Fict, modeled after `@radix-ui/react-use-is-hydrated`. Reports whether the component has hydrated on the client, so you can defer client-only rendering and avoid SSR mismatches.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/use-is-hydrated fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import { useIsHydrated } from '@fictjs/use-is-hydrated'

function Widget() {
  const isHydrated = useIsHydrated() // accessor: () => boolean
  return <div>{isHydrated() ? 'Interactive' : 'Loading…'}</div>
}
```

## API

- **`useIsHydrated()`** — returns an accessor (`() => boolean`) that is `false` during the initial render and becomes `true` after mount.

## Exports

- **Values:** `useIsHydrated`.

## Documentation

The API mirrors `@radix-ui/react-use-is-hydrated`. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md).

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
