# @fictjs/select

Select primitives for Fict, modeled after `@radix-ui/react-select`. A fully-featured, accessible select with typeahead, keyboard navigation, and collision-aware positioning.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/select fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as Select from '@fictjs/select'

export function Example() {
  return (
    <Select.Root defaultValue="apple">
      <Select.Trigger>
        <Select.Value placeholder="Pick a fruit" />
        <Select.Icon />
      </Select.Trigger>
      <Select.Portal>
        <Select.Content>
          <Select.ScrollUpButton />
          <Select.Viewport>
            <Select.Group>
              <Select.Label>Fruits</Select.Label>
              <Select.Item value="apple">
                <Select.ItemText>Apple</Select.ItemText>
                <Select.ItemIndicator>✓</Select.ItemIndicator>
              </Select.Item>
            </Select.Group>
          </Select.Viewport>
          <Select.ScrollDownButton />
          <Select.Arrow />
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}
```

## Anatomy

- **`Root`** — `value` / `defaultValue`, `onValueChange`, `open` / `defaultOpen`, `onOpenChange`, `dir`, `name`, `disabled`, `required`.
- **`Trigger`**, **`Value`** (`placeholder`), **`Icon`**.
- **`Portal`**, **`Content`** (`position="item-aligned" | "popper"` + positioning props), **`Viewport`**.
- **`Group`**, **`Label`**, **`Item`** (`value`, `disabled`, `textValue`), **`ItemText`**, **`ItemIndicator`**.
- **`ScrollUpButton`**, **`ScrollDownButton`**, **`Separator`**, **`Arrow`**.

## Exports

- **Components:** `Select` (`Root`), `SelectTrigger` (`Trigger`), `SelectValue` (`Value`), `SelectIcon` (`Icon`), `SelectPortal` (`Portal`), `SelectContent` (`Content`), `SelectViewport` (`Viewport`), `SelectGroup` (`Group`), `SelectLabel` (`Label`), `SelectItem` (`Item`), `SelectItemText` (`ItemText`), `SelectItemIndicator` (`ItemIndicator`), `SelectScrollUpButton` (`ScrollUpButton`), `SelectScrollDownButton` (`ScrollDownButton`), `SelectSeparator` (`Separator`), `SelectArrow` (`Arrow`), `createSelectScope`.
- **Types:** the matching `*Props` for every component above.

## Documentation

The API mirrors Radix, so the upstream [Radix Select docs](https://www.radix-ui.com/primitives/docs/components/select) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
