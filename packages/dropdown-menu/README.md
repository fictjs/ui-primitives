# @fictjs/dropdown-menu

Dropdown menu primitives for Fict, modeled after `@radix-ui/react-dropdown-menu`. A menu displayed when a button is triggered, with items, checkboxes, radio groups, and nested submenus.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/dropdown-menu fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as DropdownMenu from '@fictjs/dropdown-menu'

export function Example() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>Options</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content sideOffset={4}>
          <DropdownMenu.Item>New tab</DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.RadioGroup value="light">
            <DropdownMenu.RadioItem value="light">
              <DropdownMenu.ItemIndicator>•</DropdownMenu.ItemIndicator>
              Light
            </DropdownMenu.RadioItem>
          </DropdownMenu.RadioGroup>
          <DropdownMenu.Arrow />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
```

## Anatomy

- **`Root`** — `open` / `defaultOpen`, `onOpenChange`, `dir`, `modal`.
- **`Trigger`**, **`Portal`**, **`Content`** (`side`, `sideOffset`, `align`, `alignOffset`, collision props), **`Arrow`**.
- **`Item`**, **`Group`**, **`Label`**, **`Separator`**.
- **`CheckboxItem`** / **`RadioGroup`** + **`RadioItem`** / **`ItemIndicator`**.
- **`Sub`**, **`SubTrigger`**, **`SubContent`** — nested submenus.

Built on `@fictjs/menu` and `@fictjs/popper`, with full keyboard navigation, typeahead, and collision-aware positioning.

## Exports

- **Components:** `DropdownMenu` (`Root`), `DropdownMenuTrigger` (`Trigger`), `DropdownMenuPortal` (`Portal`), `DropdownMenuContent` (`Content`), `DropdownMenuGroup` (`Group`), `DropdownMenuLabel` (`Label`), `DropdownMenuItem` (`Item`), `DropdownMenuCheckboxItem` (`CheckboxItem`), `DropdownMenuRadioGroup` (`RadioGroup`), `DropdownMenuRadioItem` (`RadioItem`), `DropdownMenuItemIndicator` (`ItemIndicator`), `DropdownMenuSeparator` (`Separator`), `DropdownMenuArrow` (`Arrow`), `DropdownMenuSub` (`Sub`), `DropdownMenuSubTrigger` (`SubTrigger`), `DropdownMenuSubContent` (`SubContent`), `createDropdownMenuScope`.
- **Types:** the matching `*Props` for every component above.

## Documentation

The API mirrors Radix, so the upstream [Radix Dropdown Menu docs](https://www.radix-ui.com/primitives/docs/components/dropdown-menu) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
