# @fictjs/visually-hidden

Visually hidden primitive for Fict, modeled after `@radix-ui/react-visually-hidden`. Hides content visually while keeping it available to screen readers.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/visually-hidden fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as VisuallyHidden from '@fictjs/visually-hidden'

export function Example() {
  return (
    <button>
      <svg aria-hidden viewBox="0 0 15 15" />
      <VisuallyHidden.Root>Settings</VisuallyHidden.Root>
    </button>
  )
}
```

## Anatomy

- **`VisuallyHidden.Root`** (`Root`) — renders a `span` with the visually-hidden style. Supports `asChild`.
- **`VISUALLY_HIDDEN_STYLES`** — the raw style object, reusable when you need to apply the same treatment to another element.

## Exports

- **Components:** `VisuallyHidden` (`Root`), `VISUALLY_HIDDEN_STYLES`.
- **Types:** `VisuallyHiddenProps`.

## Documentation

The API mirrors Radix, so the upstream [Radix Visually Hidden docs](https://www.radix-ui.com/primitives/docs/utilities/visually-hidden) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
