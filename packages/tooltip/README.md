# @fictjs/tooltip

Tooltip primitives for Fict, modeled after `@radix-ui/react-tooltip`. A label that appears on hover or keyboard focus of an element, positioned with collision detection.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/tooltip fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as Tooltip from '@fictjs/tooltip'

export function Example() {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger>Hover me</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content sideOffset={4}>
            Helpful hint
            <Tooltip.Arrow />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
```

## Anatomy

- **`Tooltip.Provider`** (`Provider`) — `delayDuration`, `skipDelayDuration`, `disableHoverableContent`. Wrap your app (or a subtree) once.
- **`Tooltip.Root`** (`Root`) — `open` / `defaultOpen`, `onOpenChange`, `delayDuration`.
- **`Tooltip.Trigger`** (`Trigger`), **`Tooltip.Portal`** (`Portal`), **`Tooltip.Content`** (`Content`, positioning + collision props), **`Tooltip.Arrow`** (`Arrow`).

Parts expose `data-state` and `data-side` for animation.

## Exports

- **Components:** `TooltipProvider` (`Provider`), `Tooltip` (`Root`), `TooltipTrigger` (`Trigger`), `TooltipPortal` (`Portal`), `TooltipContent` (`Content`), `TooltipArrow` (`Arrow`), `createTooltipScope`.
- **Types:** `TooltipProviderProps`, `TooltipProps`, `TooltipTriggerProps`, `TooltipPortalProps`, `TooltipContentProps`, `TooltipArrowProps`.

## Documentation

The API mirrors Radix, so the upstream [Radix Tooltip docs](https://www.radix-ui.com/primitives/docs/components/tooltip) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
