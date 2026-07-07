# @fictjs/use-sidecar

Fict-first sidecar utilities for splitting non-visual logic out of UI components without requiring `Suspense`.

This package is a Fict port of the React `use-sidecar` package design. The core idea stays the same:

- keep the visible UI small and eagerly available
- move effects or heavier logic into a lazily loaded sidecar
- connect both sides through a medium instead of direct module coupling

## Installation

```bash
pnpm add @fictjs/use-sidecar @fictjs/runtime
```

## Fict Differences

The public API mirrors the React package closely, but two details are intentionally Fict-specific:

- `useSidecar()` returns Fict accessors: `[car, error]`, where both entries are getter functions.
- `sidecar()` renders through a reactive child binding, so loaded components swap in without `Suspense`.

## API

### `createMedium(defaultValue?, middleware?)`

Creates a shared medium that buffers values until a sidecar assigns a handler.

```ts
import { createMedium } from '@fictjs/use-sidecar'

const focusMedium = createMedium<FocusEvent | null>(null, (event) =>
  event ? ({ ...event } as FocusEvent) : null,
)
```

### `createSidecarMedium(options?)`

Creates a medium specialized for sidecar component exports.

```ts
import { createSidecarMedium } from '@fictjs/use-sidecar'

export const focusSidecar = createSidecarMedium<{ target: HTMLElement }>({
  async: true,
  ssr: false,
})
```

### `exportSidecar(medium, component)`

Registers a Fict component inside a medium and returns a thin exported wrapper.

```tsx
import { exportSidecar } from '@fictjs/use-sidecar'

import { focusSidecar } from './medium'

function FocusEffect(props: { target: HTMLElement }) {
  return <>{() => props.target.focus()}</>
}

export default exportSidecar(focusSidecar, FocusEffect)
```

### `useSidecar(importer, medium?)`

Loads a sidecar module and returns two accessors:

- `car()` gives you the loaded component or `null`
- `error()` gives you the loading error or `null`

```tsx
import { useSidecar } from '@fictjs/use-sidecar'

function Widget(props: { id: string }) {
  const [Car, error] = useSidecar(() => import('./widget-sidecar'))

  return (
    <>
      {() => {
        if (error()) return <span>failed</span>
        const Loaded = Car()
        return Loaded ? <Loaded {...props} /> : null
      }}
      <div>visible ui</div>
    </>
  )
}
```

### `sidecar(importer, errorComponent?)`

Creates a ready-to-render sidecar component wrapper.

```tsx
import { sidecar } from '@fictjs/use-sidecar'

const FocusSidecar = sidecar(() => import('./focus-sidecar'), <span>failed</span>)

function Widget(props: { target: HTMLElement }) {
  return (
    <>
      <FocusSidecar {...props} />
      <div>visible ui</div>
    </>
  )
}
```

If the imported module uses `exportSidecar`, pass the matching medium:

```tsx
import { createSidecarMedium, sidecar } from '@fictjs/use-sidecar'

export const focusSidecar = createSidecarMedium<{ target: HTMLElement }>()
export const FocusSideEffect = sidecar(() => import('./focus-side-effect'))

function Widget(props: { target: HTMLElement }) {
  return <FocusSideEffect sideCar={focusSidecar} {...props} />
}
```

### `renderCar(component, defaults)`

Combines render-prop style sidecars with default output that is available before the sidecar finishes loading.

```tsx
import { renderCar, sidecar } from '@fictjs/use-sidecar'

type Payload = [{ value: number }]

const ValueSidecar = sidecar(() => import('./value-sidecar'))

const ValueRender = renderCar<Payload, { start: number }>(ValueSidecar, (props) => [
  { value: props.start },
])

function Example() {
  return <ValueRender start={0}>{(payload) => <span>{payload.value}</span>}</ValueRender>
}
```

For live updates, render-prop sidecars should emit through a reactive child getter:

```tsx
function ValueSideEffect(props: {
  start: number
  children: (payload: { value: number }) => unknown
}) {
  return <>{() => props.children({ value: props.start * 2 })}</>
}
```

### `setConfig({ onError })`

Overrides the package-level error reporter used by `useSidecar()` and `sidecar()`.

```ts
import { setConfig } from '@fictjs/use-sidecar'

setConfig({
  onError(error) {
    reportToTelemetry(error)
  },
})
```

## SSR Behavior

- On node-like environments, sidecars do not load by default.
- Set `createSidecarMedium({ ssr: true })` when a sidecar should be allowed to load on the server.
- `env.forceCache` is exposed for tests and low-level control, matching the original package.

## Development

```bash
pnpm --filter @fictjs/use-sidecar typecheck
pnpm --filter @fictjs/use-sidecar test
pnpm --filter @fictjs/use-sidecar build
```

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives). See the [monorepo overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md).

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
