# @fictjs/fict-style-singleton

Style singleton utilities for Fict, based on the design of `react-style-singleton`.

It adds a stylesheet on the first mount, keeps it while sibling instances are mounted, and removes it after the last unmount.

This package is intentionally DOM-only and is not SSR-compatible.

## Installation

```bash
pnpm add @fictjs/fict-style-singleton fict
```

## API

### `styleSingleton()`

Creates a Fict component that injects styles on demand.

```tsx
/** @jsxImportSource fict */

import { render } from 'fict'
import { styleSingleton } from '@fictjs/fict-style-singleton'

const Style = styleSingleton()

function App() {
  return (
    <div>
      <Style styles="body { color: red; }" />
      <span>hello</span>
    </div>
  )
}

render(() => <App />, document.getElementById('app')!)
```

When a parent should drive the stylesheet reactively, pass a getter with `prop(...)` and enable `dynamic`:

```tsx
/** @jsxImportSource fict */

import { prop } from 'fict'
import { createSignal } from 'fict/advanced'
import { styleSingleton } from '@fictjs/fict-style-singleton'

const Style = styleSingleton()

function App() {
  const color = createSignal('red')

  return <Style styles={prop(() => `body { color: ${color()}; }`)} dynamic />
}
```

### `styleHookSingleton()`

Creates a hook-like helper for component-local use.

In Fict, reactive updates require passing a getter when the style string should change over time.

```tsx
/** @jsxImportSource fict */

import { render } from 'fict'
import { createSignal } from 'fict/advanced'
import { styleHookSingleton } from '@fictjs/fict-style-singleton'

const useStyle = styleHookSingleton()

function App() {
  const color = createSignal('red')

  useStyle(() => `body { color: ${color()}; }`, true)

  return <button onClick={() => color('blue')}>toggle</button>
}

render(() => <App />, document.getElementById('app')!)
```

The hook also accepts a reactive `dynamic` flag:

```tsx
useStyle(
  () => `body { color: ${color()}; }`,
  () => isLive(),
)
```

### `stylesheetSingleton()`

Creates the underlying imperative singleton:

```ts
import { stylesheetSingleton } from '@fictjs/fict-style-singleton'

const sheet = stylesheetSingleton()

sheet.add('body { overflow: hidden; }')
sheet.remove()
```

## Behavior

- The first `add(...)` call creates and mounts one `<style>` tag.
- Additional `add(...)` calls only increase the internal reference count.
- The stylesheet is removed only after the matching final `remove()`.
- Separate factories created by `stylesheetSingleton()` or `styleSingleton()` are isolated from each other.

## Fict-specific usage

- Static styles: pass a plain string.
- Reactive styles in `styleHookSingleton()`: pass a getter directly.
- Reactive styles in `styleSingleton()`: pass `prop(() => ...)` so the component prop remains reactive through Fict's props proxy.
- `dynamic` can also be a getter when you want style reapplication to turn on or off reactively.

## Limitations

- `dynamic` is intended for a single mounted instance. Multiple mounted instances with different dynamic styles remain undefined behavior, matching the original singleton model.
- CSP nonces are forwarded through `get-nonce`.
- The package is DOM-only. If `document` is unavailable, injection becomes a no-op.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives). See the [monorepo overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md).

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
