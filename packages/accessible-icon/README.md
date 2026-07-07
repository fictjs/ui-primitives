# @fictjs/accessible-icon

Accessible icon primitive for Fict, modeled after `@radix-ui/react-accessible-icon`. Makes a decorative icon accessible by adding a visually hidden label and hiding the icon from assistive technology.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/accessible-icon fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as AccessibleIcon from '@fictjs/accessible-icon'

export function Example() {
  return (
    <button>
      <AccessibleIcon.Root label="Close">
        <svg viewBox="0 0 15 15" aria-hidden />
      </AccessibleIcon.Root>
    </button>
  )
}
```

## Anatomy

- **`AccessibleIcon.Root`** (`Root`) — `label` (required). Renders the child icon with `aria-hidden` and appends a `@fictjs/visually-hidden` label for screen readers.

## Exports

- **Components:** `AccessibleIcon` (`Root`).
- **Types:** `AccessibleIconProps`.

## Documentation

The API mirrors Radix, so the upstream [Radix Accessible Icon docs](https://www.radix-ui.com/primitives/docs/utilities/accessible-icon) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
