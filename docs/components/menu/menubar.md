# Menubar

Desktop-style menubar primitives with top-level menu activation.

## Components

- `MenubarRoot`
- `MenubarMenu`
- `MenubarTrigger`
- `MenubarContent`
- `MenubarItem`

## Minimal Example

```tsx
import {
  MenubarRoot,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
} from '@fictjs/ui-primitives'

<MenubarRoot>
  <MenubarMenu value="file">
    <MenubarTrigger>File</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>New</MenubarItem>
      <MenubarItem>Open</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</MenubarRoot>
```

## Accessibility Notes

- Top-level triggers should remain in a single horizontal tab stop group (`menubar` semantics).
- Opening one menu should not trap focus permanently; users must escape or choose an item.
