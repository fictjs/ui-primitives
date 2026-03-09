# @fictjs/fict-remove-scroll-bar

Body scroll-lock helpers for Fict, based on the `react-remove-scroll-bar` package.

It hides the page scrollbar by locking `document.body`, preserves the removed scrollbar gap, and ships the same helper class names for fixed or full-width elements that would otherwise jump.

The package is DOM-oriented. During SSR or other non-DOM execution it becomes a no-op.

## Installation

```bash
pnpm add @fictjs/fict-remove-scroll-bar fict
```

## Local demo

Inside this package directory you can run the bundled Vite demo:

```bash
pnpm example:dev
pnpm example:build
pnpm example:preview
```

The demo source lives in `example/` and uses the package source directly.

## Usage

```tsx
/** @jsxImportSource fict */

import { render } from 'fict'
import { createSignal } from 'fict/advanced'
import { RemoveScrollBar } from '@fictjs/fict-remove-scroll-bar'

function App() {
  const open = createSignal(false)

  return (
    <>
      <button onClick={() => open(!open())}>Toggle lock</button>
      {() => (open() ? <RemoveScrollBar /> : null)}
    </>
  )
}

render(() => <App />, document.getElementById('app')!)
```

Mounting `<RemoveScrollBar />` applies the lock. Unmounting it removes the lock, and nested mounts are reference-counted.

## Helper class names

To keep fixed or full-width elements aligned when the body scrollbar disappears:

```tsx
/** @jsxImportSource fict */

import {
  RemoveScrollBar,
  fullWidthClassName,
  noScrollbarsClassName,
  zeroRightClassName,
} from '@fictjs/fict-remove-scroll-bar'

function Sheet() {
  return (
    <>
      <RemoveScrollBar />
      <header className={zeroRightClassName}>Fixed action bar</header>
      <main className={fullWidthClassName}>Full-width layout</main>
      <aside className={noScrollbarsClassName}>Nested scroll container</aside>
    </>
  )
}
```

- `zeroRightClassName`: offsets elements that normally use `right: 0`.
- `fullWidthClassName`: offsets `width: 100%` layouts that need the missing scrollbar space back.
- `noScrollbarsClassName`: hides scrollbars on a nested element and applies the same padding-right compensation.

The removed scrollbar width is also exposed through the CSS variable `--removed-body-scroll-bar-size`.

## API

### `RemoveScrollBar`

```ts
interface BodyScroll {
  noRelative?: boolean
  noImportant?: boolean
  gapMode?: 'padding' | 'margin'
}
```

- `noRelative`: skips `position: relative` on the locked `body`.
- `noImportant`: omits `!important` from injected rules.
- `gapMode`: chooses whether the body gap compensation is applied through `margin` or `padding`. Default is `'margin'`.

### `getGapWidth(gapMode?)`

Returns the measured offsets and effective scrollbar gap:

```ts
{
  left: number
  top: number
  right: number
  gap: number
}
```

This is useful when a primitive needs the same compensation value for custom layout logic.

## Fict-specific behavior

- The component follows Fict's mount lifecycle rather than rerendering like React.
- As with the original singleton package, the first mounted instance owns the injected stylesheet.
- Changing `noRelative`, `noImportant`, or `gapMode` after mount does not restyle the existing singleton. Remount the component if you need different options.
- Nested mounts still increment and decrement the body lock counter correctly.

## License

MIT
