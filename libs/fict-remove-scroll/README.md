# @fictjs/fict-remove-scroll

Scroll isolation for Fict, based on `react-remove-scroll`.

It keeps scroll inside a lock boundary, can remove the body scrollbar without layout jump, supports nested scrollable areas, and keeps the sidecar split between a light UI wrapper and DOM side effects.

## Installation

```bash
pnpm add @fictjs/fict-remove-scroll fict
```

## Basic usage

```tsx
/** @jsxImportSource fict */

import { render } from 'fict'
import { createSignal } from 'fict/advanced'
import { RemoveScroll } from '@fictjs/fict-remove-scroll'

function App() {
  const open = createSignal(false)

  return (
    <>
      <button onClick={() => open(!open())}>Toggle lock</button>
      {() =>
        open() ? (
          <RemoveScroll>
            <div style={{ maxHeight: '200px', overflow: 'auto' }}>Only this region scrolls</div>
          </RemoveScroll>
        ) : null
      }
    </>
  )
}

render(() => <App />, document.getElementById('app')!)
```

## API

`RemoveScroll` accepts the same core surface as the React package:

- `children`
- `enabled`
- `allowPinchZoom`
- `noRelative`
- `noIsolation`
- `inert`
- `forwardProps`
- `className`
- `removeScrollBar`
- `shards`
- `as`
- `gapMode`
- `ref`

### Important behavior

- `enabled` defaults to `true`.
- `removeScrollBar` defaults to `true`.
- `inert` defaults to `false`.
- when multiple locks are mounted, only the last active one traps outer wheel/touch scroll
- `shards` lets you whitelist extra DOM islands, including portaled content

## `forwardProps`

By default the component wraps `children` in a host element:

```tsx
<RemoveScroll className="scroll-shell">
  <div>content</div>
</RemoveScroll>
```

Set `forwardProps` to inject the lock props into a single child element instead:

```tsx
<RemoveScroll forwardProps>
  <div className="scroll-shell">content</div>
</RemoveScroll>
```

As in the upstream package, the forwarded child must be a single Fict element node.

## Fixed element helpers

`RemoveScroll.classNames` mirrors `react-remove-scroll` and re-exports the helper selectors from `@fictjs/fict-remove-scroll-bar`:

```tsx
/** @jsxImportSource fict */

import { RemoveScroll } from '@fictjs/fict-remove-scroll'

function Sheet() {
  return (
    <RemoveScroll>
      <header className={RemoveScroll.classNames.zeroRight}>Fixed action bar</header>
      <main className={RemoveScroll.classNames.fullWidth}>Full-width content</main>
    </RemoveScroll>
  )
}
```

## UI / sidecar split

Like the React package, the Fict version ships a light UI entry and a sidecar entry for manual code-splitting:

```tsx
/** @jsxImportSource fict */

import { sidecar } from '@fictjs/use-sidecar'
import { RemoveScroll } from '@fictjs/fict-remove-scroll/UI'

const removeScrollSidecar = sidecar(() => import('@fictjs/fict-remove-scroll/sidecar'))

function DialogBody() {
  return (
    <RemoveScroll sideCar={removeScrollSidecar}>
      <div>Scrollable dialog content</div>
    </RemoveScroll>
  )
}
```

## Fict-specific notes

- Fict components mount once, so the implementation uses stable closures plus mutable refs instead of React state for capture callbacks.
- To drive `enabled`, `inert`, `removeScrollBar`, or `shards` reactively across component boundaries, pass normal reactive JSX expressions or explicit `prop(() => ...)` getters where needed.
- DOM event capture is emitted using Fict's runtime-friendly `oncapture:*` form internally, so the package works without relying on React-specific event semantics.

## Testing coverage

The package test suite covers:

- wrapper rendering and `forwardProps`
- `enabled` toggling
- body scrollbar locking and helper class names
- inert mode pointer blocking
- nested locks
- shard whitelisting
- UI + async sidecar loading

## License

MIT
