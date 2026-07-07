# @fictjs/focus-scope

Focus scope primitive for Fict, modeled after `@radix-ui/react-focus-scope`. Traps and manages keyboard focus within a subtree — the core of accessible modals and overlays.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

> Internal building block. Also re-exported from [`@fictjs/radix-ui/internal`](https://github.com/fictjs/ui-primitives/tree/main/packages/radix-ui).

## Installation

```bash
pnpm add @fictjs/focus-scope fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import { FocusScope } from '@fictjs/focus-scope'

function Modal() {
  return (
    <FocusScope trapped loop onMountAutoFocus={handleMount} onUnmountAutoFocus={handleUnmount}>
      {/* focus is contained here while trapped */}
    </FocusScope>
  )
}
```

## API

- **`FocusScope`** (`Root`) — `trapped` (contain focus), `loop` (wrap Tab at the edges), `onMountAutoFocus`, `onUnmountAutoFocus`. On unmount, focus is restored to the previously focused element.

## Exports

- **Components:** `FocusScope` (`Root`).
- **Types:** `FocusScopeProps`.

## Documentation

The API mirrors `@radix-ui/react-focus-scope`. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md).

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
