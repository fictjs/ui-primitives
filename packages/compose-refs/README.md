# @fictjs/compose-refs

Ref composition helpers for Fict, modeled after `@radix-ui/react-compose-refs`. Combine several refs (callback refs or ref objects) into a single ref callback.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/compose-refs
```

## Usage

```tsx
import { composeRefs } from '@fictjs/compose-refs'

function Field(props) {
  const localRef = { current: null }
  // Assign the combined callback to an element's ref; every provided ref receives the node.
  const setRef = composeRefs(localRef, props.ref)
  return <input ref={setRef} />
}
```

## API

- **`composeRefs(...refs)`** — returns a callback that assigns the node to every provided ref.
- **`useComposedRefs(...refs)`** — the same, intended for use inside components.

Both accept callback refs and `{ current }` ref objects, and safely ignore `null`/`undefined`.

## Exports

- **Values:** `composeRefs`, `useComposedRefs`.
- **Types:** `PossibleRef`.

## Documentation

The API mirrors `@radix-ui/react-compose-refs`. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md).

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
