# @fictjs/floating-ui-dom

Floating UI bindings for Fict DOM.

This package mirrors the core surface of `@floating-ui/react-dom` for Fict applications:

- `useFloating()` creates positioning state, refs, and styles
- middleware helpers like `offset()`, `flip()`, `shift()`, and `arrow()` are re-exported
- the runtime dependency remains `@floating-ui/dom`

## Why a Fict version

Fict components execute once and update through fine-grained signals rather than React rerenders. That changes two important usage patterns:

- dynamic `useFloating()` options should be wrapped in accessors
- returned positioning state is exposed as accessors, while `floatingStyles` stays a live style object

The rest of the mental model stays the same: set a reference element, set a floating element, then apply `floatingStyles`.

## Installation

```bash
pnpm add @fictjs/floating-ui-dom
```

`@fictjs/runtime` is a peer dependency and is typically already present in a Fict app.

## Basic usage

```tsx
import { createSignal } from '@fictjs/runtime/advanced'
import { autoUpdate, flip, offset, shift, useFloating } from '@fictjs/floating-ui-dom'

function Popover() {
  const open = createSignal(false)

  const floating = useFloating<HTMLButtonElement>({
    open,
    whileElementsMounted: autoUpdate,
    middleware: () => [offset(8), flip(), shift()],
  })

  return (
    <>
      <button ref={floating.refs.setReference} onClick={() => open(!open())}>
        Toggle
      </button>

      {() =>
        open() ? (
          <div ref={floating.refs.setFloating} style={floating.floatingStyles}>
            Floating content
          </div>
        ) : null
      }
    </>
  )
}
```

## Reactive options

Wrap changing options in accessors so `useFloating()` can track them:

```tsx
import { createSignal } from '@fictjs/runtime/advanced'
import { offset, useFloating } from '@fictjs/floating-ui-dom'

function Tooltip() {
  const gap = createSignal(8)

  const floating = useFloating({
    placement: () => 'right',
    middleware: () => [offset(gap())],
  })

  return (
    <>
      <button ref={floating.refs.setReference}>Anchor</button>
      <div ref={floating.refs.setFloating} style={floating.floatingStyles}>
        Distance: {() => gap()}
      </div>
    </>
  )
}
```

The following options are reactive when provided as accessors:

- `open`
- `placement`
- `strategy`
- `middleware`
- `platform`
- `transform`
- `elements.reference`
- `elements.floating`

## API

- `useFloating(options)`
- `arrow(options, deps?)`
- `offset(options, deps?)`
- `shift(options, deps?)`
- `limitShift(options, deps?)`
- `flip(options, deps?)`
- `size(options, deps?)`
- `autoPlacement(options, deps?)`
- `hide(options, deps?)`
- `inline(options, deps?)`
- `autoUpdate`
- `computePosition`
- `detectOverflow`
- `getOverflowAncestors`
- `platform`

## useFloating options

- `open`: accessor-friendly boolean used to keep `isPositioned()` in sync with visibility
- `placement`: placement or accessor returning a placement
- `strategy`: positioning strategy or accessor returning one
- `middleware`: middleware array or accessor returning one
- `platform`: custom `@floating-ui/dom` platform or accessor returning one
- `transform`: whether to position with CSS transforms instead of `top` / `left`
- `whileElementsMounted(reference, floating, update)`: mount hook for `autoUpdate`
- `elements.reference`: external element, ref-like object, or accessor returning one
- `elements.floating`: external element, ref-like object, or accessor returning one

## useFloating return value

`useFloating()` returns:

- `x()`, `y()`, `strategy()`, `placement()`, `middlewareData()`, `isPositioned()`
- `floatingStyles`, a live style object that can be passed directly to `style={...}`
- `update()`, for imperative recomputation
- `refs.reference`, `refs.floating`, `refs.setReference`, `refs.setFloating`
- `elements.reference`, `elements.floating`

## Compatibility Notes

- Middleware helpers keep the same names and core option shapes as `@floating-ui/react-dom`.
- Fict does not rerender components after mount, so changing options must happen through accessors.
- `refs.reference` is typed as `Element | VirtualElement` by default, matching upstream flexibility.
- `arrow()` accepts raw DOM elements, ref-like objects, and accessors that resolve to either form.

## Testing Coverage

The package test suite covers the Fict equivalents of the upstream `react-dom` cases, including:

- middleware freshness and update-loop safety
- `whileElementsMounted` mount and cleanup behavior
- unstable callback-ref wrappers
- `isPositioned()` transitions across open and close cycles
- internal refs and external element sources
- transform and layout-based positioning styles
- type-level coverage for generic reference narrowing and middleware typing

## Differences from `@floating-ui/react-dom`

- dynamic configuration is driven by accessors instead of rerendering props
- returned state is accessor-based, except `floatingStyles`, which is kept as a mutable style object for JSX compatibility
- `arrow()` accepts Fict refs and accessors in addition to raw DOM elements

## License

MIT
