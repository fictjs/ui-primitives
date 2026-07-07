# @fictjs/scroll-area

Scroll area primitives for Fict, modeled after `@radix-ui/react-scroll-area`. Custom, cross-browser scrollbars that preserve native scrolling behavior and accessibility.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/scroll-area fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as ScrollArea from '@fictjs/scroll-area'

export function Example() {
  return (
    <ScrollArea.Root type="hover" style={{ width: 240, height: 200 }}>
      <ScrollArea.Viewport>{/* long content */}</ScrollArea.Viewport>
      <ScrollArea.Scrollbar orientation="vertical">
        <ScrollArea.Thumb />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner />
    </ScrollArea.Root>
  )
}
```

## Anatomy

- **`ScrollArea.Root`** (`Root`) — `type` (`"auto" | "always" | "scroll" | "hover"`), `scrollHideDelay`, `dir`.
- **`ScrollArea.Viewport`** (`Viewport`) — the scrolling container (wrap your content here).
- **`ScrollArea.Scrollbar`** (`Scrollbar`) — `orientation="vertical" | "horizontal"`, `forceMount`.
- **`ScrollArea.Thumb`** (`Thumb`), **`ScrollArea.Corner`** (`Corner`).

## Exports

- **Components:** `ScrollArea` (`Root`), `ScrollAreaViewport` (`Viewport`), `ScrollAreaScrollbar` (`Scrollbar`), `ScrollAreaThumb` (`Thumb`), `ScrollAreaCorner` (`Corner`), `createScrollAreaScope`.
- **Types:** `ScrollAreaProps`, `ScrollAreaViewportProps`, `ScrollAreaScrollbarProps`, `ScrollAreaThumbProps`, `ScrollAreaCornerProps`.

## Documentation

The API mirrors Radix, so the upstream [Radix Scroll Area docs](https://www.radix-ui.com/primitives/docs/components/scroll-area) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
