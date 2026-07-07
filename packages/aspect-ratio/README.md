# @fictjs/aspect-ratio

Aspect-ratio primitive for Fict, modeled after `@radix-ui/react-aspect-ratio`. Constrains content to a desired ratio.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/aspect-ratio fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as AspectRatio from '@fictjs/aspect-ratio'

export function Example() {
  return (
    <AspectRatio.Root ratio={16 / 9}>
      <img src="/cover.jpg" alt="Cover" style={{ width: '100%', height: '100%' }} />
    </AspectRatio.Root>
  )
}
```

## Anatomy

- **`AspectRatio.Root`** (`Root`) — `ratio` (defaults to `1`). Supports `asChild`. Renders a single `div` that maintains the given width-to-height ratio.

## Exports

- **Components:** `AspectRatio` (`Root`).
- **Types:** `AspectRatioProps`.

## Documentation

The API mirrors Radix, so the upstream [Radix Aspect Ratio docs](https://www.radix-ui.com/primitives/docs/components/aspect-ratio) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
