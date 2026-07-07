# @fictjs/toggle-group

Toggle group primitives for Fict, modeled after `@radix-ui/react-toggle-group`. A set of toggle buttons that can be single- or multiple-selection.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/toggle-group fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as ToggleGroup from '@fictjs/toggle-group'

export function Example() {
  return (
    <ToggleGroup.Root type="single" defaultValue="center">
      <ToggleGroup.Item value="left">Left</ToggleGroup.Item>
      <ToggleGroup.Item value="center">Center</ToggleGroup.Item>
      <ToggleGroup.Item value="right">Right</ToggleGroup.Item>
    </ToggleGroup.Root>
  )
}
```

## Anatomy

- **`ToggleGroup.Root`** (`Root`) — `type="single" | "multiple"`, `value` / `defaultValue`, `onValueChange`, `disabled`, `rovingFocus`, `orientation`, `dir`, `loop`.
- **`ToggleGroup.Item`** (`Item`) — `value`, `disabled`.

Uses roving focus for arrow-key navigation; items expose `data-state` (`"on"` / `"off"`).

## Exports

- **Components:** `ToggleGroup` (`Root`), `ToggleGroupItem` (`Item`), `createToggleGroupScope`.
- **Types:** `ToggleGroupSingleProps`, `ToggleGroupMultipleProps`, `ToggleGroupItemProps`.

## Documentation

The API mirrors Radix, so the upstream [Radix Toggle Group docs](https://www.radix-ui.com/primitives/docs/components/toggle-group) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
