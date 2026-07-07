# @fictjs/core-primitive

Internal DOM and event utilities for Fict UI primitives, modeled after `@radix-ui/primitive`. Small, dependency-free helpers used across the primitive packages.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/core-primitive
```

## Usage

```ts
import { composeEventHandlers, getOwnerDocument } from '@fictjs/core-primitive'

// Run the consumer's handler first, then ours (unless the consumer called preventDefault)
const onClick = composeEventHandlers(props.onClick, (event) => {
  console.log('clicked', getOwnerDocument(event.currentTarget))
})
```

## API

- **`canUseDOM`** — `true` when `window`/`document` are available.
- **`composeEventHandlers(theirs, ours, { checkForDefaultPrevented })`** — compose two event handlers; the second is skipped if the event's default was prevented (unless disabled).
- **`getOwnerWindow(node)`** / **`getOwnerDocument(node)`** — resolve the owning window/document for a node (handles iframes).
- **`getActiveElement(node, activeDescendant?)`** — the active element, following `aria-activedescendant` and frames.
- **`isFrame(element)`** — type guard for `HTMLIFrameElement`.

## Exports

- **Values:** `canUseDOM`, `composeEventHandlers`, `getOwnerWindow`, `getOwnerDocument`, `getActiveElement`, `isFrame`.
- **Types:** `ComposeEventHandlersOptions`.

## Documentation

The API mirrors `@radix-ui/primitive`. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md).

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
