# @fictjs/portal

Portal primitive for Fict, modeled after `@radix-ui/react-portal`. Renders its children into a different part of the DOM (by default, the document body).

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/portal fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as Portal from '@fictjs/portal'

export function Example() {
  return (
    <Portal.Root>
      <div class="toast">Rendered at document.body</div>
    </Portal.Root>
  )
}
```

## Anatomy

- **`Portal.Root`** (`Root`) — `container` (a DOM node or accessor) to render into; defaults to `document.body`. Supports `asChild`.

## Exports

- **Components:** `Portal` (`Root`).
- **Types:** `PortalProps`.

## Documentation

The API mirrors Radix, so the upstream [Radix Portal docs](https://www.radix-ui.com/primitives/docs/utilities/portal) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
