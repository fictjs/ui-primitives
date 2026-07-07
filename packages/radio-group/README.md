# @fictjs/radio-group

Radio group primitives for Fict, modeled after `@radix-ui/react-radio-group`. A set of checkable buttons where only one can be selected at a time.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/radio-group fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as RadioGroup from '@fictjs/radio-group'

export function Example() {
  return (
    <RadioGroup.Root defaultValue="comfortable" name="spacing">
      <RadioGroup.Item value="default">
        <RadioGroup.Indicator />
      </RadioGroup.Item>
      <RadioGroup.Item value="comfortable">
        <RadioGroup.Indicator />
      </RadioGroup.Item>
    </RadioGroup.Root>
  )
}
```

## Anatomy

- **`RadioGroup.Root`** (`Root`) — `value` / `defaultValue`, `onValueChange`, `disabled`, `required`, `name`, `orientation`, `dir`, `loop`.
- **`RadioGroup.Item`** (`Item`) — `value`, `disabled`. Renders a hidden input for form participation.
- **`RadioGroup.Indicator`** (`Indicator`) — shown when the item is selected; `forceMount` for animations.

Uses roving focus for arrow-key navigation. Parts expose `data-state` (`"checked"` / `"unchecked"`) and `data-disabled`.

## Exports

- **Components:** `RadioGroup` (`Root`), `RadioGroupItem` (`Item`), `RadioGroupIndicator` (`Indicator`), `createRadioGroupScope`.
- **Types:** `RadioGroupProps`, `RadioGroupItemProps`, `RadioGroupIndicatorProps`.

## Documentation

The API mirrors Radix, so the upstream [Radix Radio Group docs](https://www.radix-ui.com/primitives/docs/components/radio-group) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
