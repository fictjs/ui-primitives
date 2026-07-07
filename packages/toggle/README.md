# @fictjs/toggle

Toggle primitive for Fict, modeled after `@radix-ui/react-toggle`. A two-state button that can be on or off.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/toggle fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as Toggle from '@fictjs/toggle'

export function Example() {
  return <Toggle.Root aria-label="Toggle italic">I</Toggle.Root>
}
```

## Anatomy

- **`Toggle.Root`** (`Root`) — `pressed` / `defaultPressed`, `onPressedChange`, `disabled`. Supports `asChild`.

Exposes `data-state` (`"on"` / `"off"`) and `data-disabled`.

## Exports

- **Components:** `Toggle` (`Root`).
- **Types:** `ToggleProps`.

## Documentation

The API mirrors Radix, so the upstream [Radix Toggle docs](https://www.radix-ui.com/primitives/docs/components/toggle) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
