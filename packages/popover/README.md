# @fictjs/popover

Popover primitives for Fict, modeled after `@radix-ui/react-popover`. Rich, focusable content displayed in a portal and anchored to a trigger.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/popover fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as Popover from '@fictjs/popover'

export function Example() {
  return (
    <Popover.Root>
      <Popover.Trigger>Open</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={8}>
          Popover content
          <Popover.Close>Close</Popover.Close>
          <Popover.Arrow />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
```

## Anatomy

- **`Root`** — `open` / `defaultOpen`, `onOpenChange`, `modal`.
- **`Anchor`** (optional) — position the content relative to a different element than the trigger.
- **`Trigger`**, **`Portal`**, **`Content`** (positioning + collision props), **`Close`**, **`Arrow`**.

Built on `@fictjs/popper` and `@fictjs/dismissable-layer`; focus is managed and the layer dismisses on outside pointer/escape.

## Exports

- **Components:** `Popover` (`Root`), `PopoverAnchor` (`Anchor`), `PopoverTrigger` (`Trigger`), `PopoverPortal` (`Portal`), `PopoverContent` (`Content`), `PopoverClose` (`Close`), `PopoverArrow` (`Arrow`), `createPopoverScope`.
- **Types:** `PopoverProps`, `PopoverAnchorProps`, `PopoverTriggerProps`, `PopoverPortalProps`, `PopoverContentProps`, `PopoverCloseProps`, `PopoverArrowProps`.

## Documentation

The API mirrors Radix, so the upstream [Radix Popover docs](https://www.radix-ui.com/primitives/docs/components/popover) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
