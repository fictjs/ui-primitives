# @fictjs/use-callback-ref

Callback-aware ref utilities for Fict UI primitives.

This package ports the React `use-callback-ref` surface to the Fict execution model. It keeps the same core helpers for:

- observing ref value changes
- merging object refs and callback refs
- transforming one ref shape into another
- adapting ref objects to callback refs

## Why a Fict version

Fict already supports object refs (`createRef()`) and callback refs (`ref={node => ...}`), but headless primitives often need a little more:

- react when a ref value changes
- fan a DOM node out to several refs
- expose a transformed handle instead of the raw node
- keep ref utilities reusable outside JSX

Because Fict components execute once, the `use*` helpers are thin, stable wrappers over the low-level factories rather than rerender-driven memoization layers.

## Installation

```bash
pnpm add @fictjs/use-callback-ref
```

## API

- `assignRef(ref, value)`
- `createCallbackRef(callback)`
- `useCallbackRef(initialValue, callback)`
- `mergeRefs(refs)`
- `useMergeRefs(refs, defaultValue?)`
- `transformRef(ref, transformer)`
- `useTransformRef(ref, transformer)`
- `refToCallback(ref)`
- `useRefToCallback(ref)`

## Usage

```tsx
import { onMount } from 'fict'
import { useCallbackRef, useMergeRefs, useTransformRef } from '@fictjs/use-callback-ref'

function Trigger(props: {
  ref?: ((node: HTMLButtonElement | null) => void) | { current: HTMLButtonElement | null }
}) {
  const localRef = useCallbackRef<HTMLButtonElement>(null, (next, prev) => {
    if (next !== prev) {
      console.log('trigger changed', { next, prev })
    }
  })

  const mergedRef = useMergeRefs([localRef, props.ref])

  onMount(() => {
    localRef.current?.focus()
  })

  return <button ref={mergedRef}>Open</button>
}

function TriggerLabel(props: { ref?: { current: string | null } }) {
  const labelRef = useTransformRef<HTMLButtonElement, string>(
    props.ref,
    (node) => node?.textContent ?? null,
  )

  return <button ref={labelRef}>Open</button>
}
```

## Fict-specific notes

- `useCallbackRef` and `createCallbackRef` are both safe outside components.
- `useMergeRefs` and `useTransformRef` are stable for the full component lifetime because Fict components do not rerun after mount.
- Cleanup still works with Fict runtime refs: when a DOM node unmounts, object refs are nulled and callback refs are called with `null`.
- The helpers are generic and can also manage non-DOM values for imperative handles.

## License

MIT
