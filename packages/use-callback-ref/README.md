# @fictjs/use-callback-ref

Callback-aware ref utilities for Fict UI primitives.

This package combines two related surfaces for Fict libraries:

- Radix-style stable callback wrappers via `useCallbackRef(callback)`
- callback-aware ref objects and ref composition helpers for imperative handles

That lets the package satisfy both the Radix `react-use-callback-ref` contract and the existing ref-facade utilities already used inside this workspace.

## Why a Fict version

Fict already supports object refs (`createRef()`) and callback refs (`ref={node => ...}`), but headless primitives often need a little more:

- react when a ref value changes
- fan a DOM node out to several refs
- expose a transformed handle instead of the raw node
- keep ref utilities reusable outside JSX

Because Fict components execute once, the `use*` helpers are thin, stable wrappers over low-level factories rather than rerender-driven memoization layers.

## Installation

```bash
pnpm add @fictjs/use-callback-ref
```

## API

- `assignRef(ref, value)`
- `createCallbackRef(callback)`
- `useCallbackRef(callback)`
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
  const onOpen = useCallbackRef(() => {
    console.log('opened')
  })

  const localRef = useCallbackRef<HTMLButtonElement>(null, (next, prev) => {
    if (next !== prev) {
      console.log('trigger changed', { next, prev })
    }
  })

  const mergedRef = useMergeRefs([localRef, props.ref])

  onMount(() => {
    localRef.current?.focus()
    onOpen()
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

- `useCallbackRef(callback)` mirrors Radix's stable event handler helper.
- `useCallbackRef(initialValue, callback)` and `createCallbackRef` provide the ref-facade behavior used by lower-level DOM helpers.
- `useMergeRefs` and `useTransformRef` are stable for the full component lifetime because Fict components do not rerun after mount.
- Cleanup still works with Fict runtime refs: when a DOM node unmounts, object refs are nulled and callback refs are called with `null`.
- The helpers are generic and can also manage non-DOM values for imperative handles.

## License

MIT
