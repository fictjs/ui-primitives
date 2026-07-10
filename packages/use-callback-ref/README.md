# @fictjs/use-callback-ref

Ref utilities and stable callback helpers for Fict. A toolkit for creating, merging, and transforming refs, plus a stable callback wrapper — combining ideas from `@radix-ui/react-use-callback-ref` and `use-callback-ref`.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/use-callback-ref fict
```

## Usage

```ts
import { prop } from 'fict'
import { useCallbackRef, mergeRefs } from '@fictjs/use-callback-ref'

// A stable function identity that always calls the latest callback:
const stable = useCallbackRef<(value: string) => void>(prop(() => props.onChange))

// Merge several refs into one:
const ref = mergeRefs([localRef, props.ref])
```

## API

- **`useCallbackRef(callback)`** — a stable function whose identity never changes. A direct callback is retained as provided; when a parent can replace it, pass a Fict signal, computed value, or `prop(() => callback)` so each invocation reads the current callback.
- **`createCallbackRef(cb)`** / **`assignRef(ref, value)`** — low-level callback-ref creation and assignment.
- **`mergeRefs(refs)`** / **`useMergeRefs(refs)`** — combine multiple refs into one.
- **`transformRef(ref, transform)`** / **`useTransformRef(...)`** — derive a ref whose value is a transform of another.
- **`refToCallback(ref)`** / **`useRefToCallback(ref)`** — adapt a ref object to a callback ref.

## Exports

- **Values:** `useCallbackRef`, `createCallbackRef`, `assignRef`, `mergeRefs`, `useMergeRefs`, `transformRef`, `useTransformRef`, `refToCallback`, `useRefToCallback`.
- **Types:** `Ref`, `RefObject`, `RefCallback`, `RefLifecycleCallback`, `MaybeRef`.

## Documentation

See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md).

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
