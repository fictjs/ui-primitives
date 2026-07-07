# @fictjs/roving-focus

Roving focus primitives for Fict, modeled after `@radix-ui/react-roving-focus`. Implements the roving-tabindex pattern so a group of items is a single tab stop with arrow-key navigation between items.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

> Internal building block used by Tabs, Toolbar, Radio Group, Toggle Group, and the menu family. Also re-exported from [`@fictjs/radix-ui/internal`](https://github.com/fictjs/ui-primitives/tree/main/packages/radix-ui).

## Installation

```bash
pnpm add @fictjs/roving-focus fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import { RovingFocusGroup, RovingFocusGroupItem } from '@fictjs/roving-focus'

function Group() {
  return (
    <RovingFocusGroup orientation="horizontal" loop>
      <RovingFocusGroupItem>One</RovingFocusGroupItem>
      <RovingFocusGroupItem>Two</RovingFocusGroupItem>
    </RovingFocusGroup>
  )
}
```

## API

- **`RovingFocusGroup`** (`Root`) — `orientation`, `dir`, `loop`, `currentTabStopId` / `defaultCurrentTabStopId`, `onCurrentTabStopIdChange`, `onEntryFocus`.
- **`RovingFocusGroupItem`** (`Item`) — `focusable`, `active`, `tabStopId`.
- **`createRovingFocusGroupScope`** — scope factory for composition.

## Exports

- **Components:** `RovingFocusGroup` (`Root`), `RovingFocusGroupItem` (`Item`), `createRovingFocusGroupScope`.
- **Types:** `RovingFocusGroupProps`, `RovingFocusItemProps`.

## Documentation

The API mirrors `@radix-ui/react-roving-focus`. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md).

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
