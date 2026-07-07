# @fictjs/context-menu

Context menu primitives for Fict, modeled after `@radix-ui/react-context-menu`. A menu triggered by right-click (or long-press), with support for items, checkboxes, radio groups, and nested submenus.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/context-menu fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as ContextMenu from '@fictjs/context-menu'

export function Example() {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>Right click me</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content>
          <ContextMenu.Item>Back</ContextMenu.Item>
          <ContextMenu.Separator />
          <ContextMenu.CheckboxItem checked>
            <ContextMenu.ItemIndicator>✓</ContextMenu.ItemIndicator>
            Show bookmarks
          </ContextMenu.CheckboxItem>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger>More tools</ContextMenu.SubTrigger>
            <ContextMenu.Portal>
              <ContextMenu.SubContent>
                <ContextMenu.Item>Developer tools</ContextMenu.Item>
              </ContextMenu.SubContent>
            </ContextMenu.Portal>
          </ContextMenu.Sub>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}
```

## Anatomy

- **`Root`**, **`Trigger`**, **`Portal`**, **`Content`** — the menu surface, positioned at the pointer.
- **`Item`**, **`Group`**, **`Label`**, **`Separator`**, **`Arrow`** — menu structure.
- **`CheckboxItem`** + **`ItemIndicator`** — toggleable item.
- **`RadioGroup`** + **`RadioItem`** + **`ItemIndicator`** — single-selection group.
- **`Sub`**, **`SubTrigger`**, **`SubContent`** — nested submenus.

Built on `@fictjs/menu`. Supports full keyboard navigation, typeahead, and collision-aware positioning; parts expose `data-state` and `data-highlighted`.

## Exports

- **Components:** `ContextMenu` (`Root`), `ContextMenuTrigger` (`Trigger`), `ContextMenuPortal` (`Portal`), `ContextMenuContent` (`Content`), `ContextMenuGroup` (`Group`), `ContextMenuLabel` (`Label`), `ContextMenuItem` (`Item`), `ContextMenuCheckboxItem` (`CheckboxItem`), `ContextMenuRadioGroup` (`RadioGroup`), `ContextMenuRadioItem` (`RadioItem`), `ContextMenuItemIndicator` (`ItemIndicator`), `ContextMenuSeparator` (`Separator`), `ContextMenuArrow` (`Arrow`), `ContextMenuSub` (`Sub`), `ContextMenuSubTrigger` (`SubTrigger`), `ContextMenuSubContent` (`SubContent`), `createContextMenuScope`.
- **Types:** the matching `*Props` for every component above.

## Documentation

The API mirrors Radix, so the upstream [Radix Context Menu docs](https://www.radix-ui.com/primitives/docs/components/context-menu) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
