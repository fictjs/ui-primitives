# DropdownMenu

Compound dropdown menu built on Popover + roving focus.

## Components

- `DropdownMenuRoot`
- `DropdownMenuTrigger`
- `DropdownMenuContent`
- `DropdownMenuItem`
- `DropdownMenuCheckboxItem`
- `DropdownMenuRadioGroup`
- `DropdownMenuRadioItem`
- `DropdownMenuLabel`
- `DropdownMenuSeparator`

## Root API

- `open?: boolean | () => boolean`
- `defaultOpen?: boolean`
- `onOpenChange?: (open: boolean) => void`

## Item Semantics

- `DropdownMenuItem` defaults to `role="menuitem"` and closes menu unless `keepOpen`
- `DropdownMenuCheckboxItem` defaults `keepOpen=true` and exposes `data-checked`
- `DropdownMenuRadioGroup` + `DropdownMenuRadioItem` provide single-select semantics (`role="menuitemradio"`)

## Content Behavior

- `DropdownMenuContent` renders as `role="menu"` with vertical roving focus
- Supports `portal?: boolean` through inherited popover content props
