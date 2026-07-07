# @fictjs/hover-card

Hover card primitives for Fict, modeled after `@radix-ui/react-hover-card`. Rich content shown when hovering (sighted-only) over a trigger, such as a link preview.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/hover-card fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as HoverCard from '@fictjs/hover-card'

export function Example() {
  return (
    <HoverCard.Root openDelay={200} closeDelay={100}>
      <HoverCard.Trigger href="/@fict">@fict</HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content sideOffset={8}>
          A fine-grained reactive UI framework.
          <HoverCard.Arrow />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  )
}
```

## Anatomy

- **`Root`** — `open` / `defaultOpen`, `onOpenChange`, `openDelay`, `closeDelay`.
- **`Trigger`**, **`Portal`**, **`Content`** (positioning props: `side`, `sideOffset`, `align`, collision options), **`Arrow`**.

Content is intended for non-essential, sighted-user information (it is not keyboard-focusable like a popover).

## Exports

- **Components:** `HoverCard` (`Root`), `HoverCardTrigger` (`Trigger`), `HoverCardPortal` (`Portal`), `HoverCardContent` (`Content`), `HoverCardArrow` (`Arrow`), `createHoverCardScope`.
- **Types:** `HoverCardProps`, `HoverCardTriggerProps`, `HoverCardPortalProps`, `HoverCardContentProps`, `HoverCardArrowProps`, `PointerDownOutsideEvent`, `FocusOutsideEvent`.

## Documentation

The API mirrors Radix, so the upstream [Radix Hover Card docs](https://www.radix-ui.com/primitives/docs/components/hover-card) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
