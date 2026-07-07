# @fictjs/focus-guards

Focus guard helpers for Fict, modeled after `@radix-ui/react-focus-guards`. Injects invisible, focusable "guard" elements at the edges of the document so focus can be trapped and wrapped correctly in overlays.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

> Internal building block used by dialogs, popovers, and other focus-trapping layers.

## Installation

```bash
pnpm add @fictjs/focus-guards fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import { FocusGuards, useFocusGuards } from '@fictjs/focus-guards'

// As a component wrapper:
function Overlay(props) {
  return <FocusGuards>{props.children}</FocusGuards>
}

// Or as a hook inside a component that needs guards while mounted:
function OverlayWithHook() {
  useFocusGuards()
  return null
}
```

## API

- **`FocusGuards`** (`Root`) — renders its children and ensures edge focus guards exist while mounted.
- **`useFocusGuards()`** — imperatively add/remove the guards for the lifetime of the calling component.

## Exports

- **Components:** `FocusGuards` (`Root`), `useFocusGuards`.
- **Types:** `FocusGuardsProps`.

## Documentation

The API mirrors `@radix-ui/react-focus-guards`. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md).

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
