# @fictjs/menubar

Menubar primitives for Fict, modeled after `@radix-ui/react-menubar`. A horizontal set of menus (as in desktop applications), each with items, checkboxes, radio groups, and submenus.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/menubar fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as Menubar from '@fictjs/menubar'

export function Example() {
  return (
    <Menubar.Root>
      <Menubar.Menu>
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content>
            <Menubar.Item>New</Menubar.Item>
            <Menubar.Separator />
            <Menubar.Sub>
              <Menubar.SubTrigger>Share</Menubar.SubTrigger>
              <Menubar.Portal>
                <Menubar.SubContent>
                  <Menubar.Item>Email link</Menubar.Item>
                </Menubar.SubContent>
              </Menubar.Portal>
            </Menubar.Sub>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>
    </Menubar.Root>
  )
}
```

## Anatomy

- **`Root`** — `value` / `defaultValue`, `onValueChange`, `dir`, `loop`.
- **`Menu`** — one per top-level menu; **`Trigger`**, **`Portal`**, **`Content`**, **`Arrow`**.
- **`Item`**, **`Group`**, **`Label`**, **`Separator`**.
- **`CheckboxItem`** / **`RadioGroup`** + **`RadioItem`** / **`ItemIndicator`**.
- **`Sub`**, **`SubTrigger`**, **`SubContent`**.

Built on `@fictjs/menu` with roving focus between top-level triggers.

## Exports

- **Components:** `Menubar` (`Root`), `MenubarMenu` (`Menu`), `MenubarTrigger` (`Trigger`), `MenubarPortal` (`Portal`), `MenubarContent` (`Content`), `MenubarGroup` (`Group`), `MenubarLabel` (`Label`), `MenubarItem` (`Item`), `MenubarCheckboxItem` (`CheckboxItem`), `MenubarRadioGroup` (`RadioGroup`), `MenubarRadioItem` (`RadioItem`), `MenubarItemIndicator` (`ItemIndicator`), `MenubarSeparator` (`Separator`), `MenubarArrow` (`Arrow`), `MenubarSub` (`Sub`), `MenubarSubTrigger` (`SubTrigger`), `MenubarSubContent` (`SubContent`), `createMenubarScope`.
- **Types:** the matching `*Props` for every component above.

## Documentation

The API mirrors Radix, so the upstream [Radix Menubar docs](https://www.radix-ui.com/primitives/docs/components/menubar) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
