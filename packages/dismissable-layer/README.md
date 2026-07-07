# @fictjs/dismissable-layer

Dismissable layer primitives for Fict, modeled after `@radix-ui/react-dismissable-layer`. A layer that responds to outside interactions — pointer-down outside, focus outside, and the Escape key — used by popovers, dropdowns, tooltips, and dialogs.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

> Internal building block. Also re-exported from [`@fictjs/radix-ui/internal`](https://github.com/fictjs/ui-primitives/tree/main/packages/radix-ui).

## Installation

```bash
pnpm add @fictjs/dismissable-layer fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import { DismissableLayer } from '@fictjs/dismissable-layer'

function Layer() {
  return (
    <DismissableLayer
      onEscapeKeyDown={close}
      onPointerDownOutside={close}
      onFocusOutside={close}
      onInteractOutside={maybeClose}
    >
      {/* floating content */}
    </DismissableLayer>
  )
}
```

## API

- **`DismissableLayer`** (`Root`) — `disableOutsidePointerEvents`, `onEscapeKeyDown`, `onPointerDownOutside`, `onFocusOutside`, `onInteractOutside`, `onDismiss`. Manages a stack so only the top-most layer reacts.
- **`DismissableLayerBranch`** (`Branch`) — marks a subtree as part of the layer, so interactions within it are not treated as "outside".

## Exports

- **Components:** `DismissableLayer` (`Root`), `DismissableLayerBranch` (`Branch`).
- **Types:** `DismissableLayerProps`.

## Documentation

The API mirrors `@radix-ui/react-dismissable-layer`. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md).

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
