# @fictjs/toolbar

Toolbar primitives for Fict, modeled after `@radix-ui/react-toolbar`. A container for grouping a set of controls (buttons, toggle groups, links) with roving-focus keyboard navigation.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/toolbar fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as Toolbar from '@fictjs/toolbar'

export function Example() {
  return (
    <Toolbar.Root orientation="horizontal">
      <Toolbar.ToggleGroup type="multiple">
        <Toolbar.ToggleItem value="bold">B</Toolbar.ToggleItem>
        <Toolbar.ToggleItem value="italic">I</Toolbar.ToggleItem>
      </Toolbar.ToggleGroup>
      <Toolbar.Separator />
      <Toolbar.Link href="/help">Help</Toolbar.Link>
      <Toolbar.Button>Share</Toolbar.Button>
    </Toolbar.Root>
  )
}
```

## Anatomy

- **`Toolbar.Root`** (`Root`) — `orientation`, `dir`, `loop`.
- **`Toolbar.Button`** (`Button`), **`Toolbar.Link`** (`Link`), **`Toolbar.Separator`** (`Separator`).
- **`Toolbar.ToggleGroup`** (`ToggleGroup`) + **`Toolbar.ToggleItem`** (`ToggleItem`) — a toggle group embedded in the toolbar.

## Exports

- **Components:** `Toolbar` (`Root`), `ToolbarSeparator` (`Separator`), `ToolbarButton` (`Button`), `ToolbarLink` (`Link`), `ToolbarToggleGroup` (`ToggleGroup`), `ToolbarToggleItem` (`ToggleItem`), `createToolbarScope`.
- **Types:** `ToolbarProps`, `ToolbarSeparatorProps`, `ToolbarButtonProps`, `ToolbarLinkProps`, `ToolbarToggleGroupSingleProps`, `ToolbarToggleGroupMultipleProps`, `ToolbarToggleItemProps`.

## Documentation

The API mirrors Radix, so the upstream [Radix Toolbar docs](https://www.radix-ui.com/primitives/docs/components/toolbar) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
