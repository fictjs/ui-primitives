# @fictjs/accordion

Accordion primitives for Fict, modeled after `@radix-ui/react-accordion`. A vertically stacked set of interactive headings that each reveal an associated section of content.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/accordion fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as Accordion from '@fictjs/accordion'

export function Example() {
  return (
    <Accordion.Root type="single" collapsible defaultValue="item-1">
      <Accordion.Item value="item-1">
        <Accordion.Header>
          <Accordion.Trigger>Is it accessible?</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content>Yes. It follows the WAI-ARIA design pattern.</Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  )
}
```

## Anatomy

- **`Accordion.Root`** (`Root`) — `type="single" | "multiple"`, `value` / `defaultValue`, `onValueChange`, `collapsible`, `disabled`, `orientation`, `dir`.
- **`Accordion.Item`** (`Item`) — `value`, `disabled`.
- **`Accordion.Header`** (`Header`)
- **`Accordion.Trigger`** (`Trigger`)
- **`Accordion.Content`** (`Content`)

Every part renders a single DOM node and exposes `data-state` (`"open"` / `"closed"`), `data-disabled`, and `data-orientation` for styling. Reactive props accept either a value or an accessor (`() => value`).

## Exports

- **Components:** `Accordion` (`Root`), `AccordionItem` (`Item`), `AccordionHeader` (`Header`), `AccordionTrigger` (`Trigger`), `AccordionContent` (`Content`), `createAccordionScope`.
- **Types:** `AccordionSingleProps`, `AccordionMultipleProps`, `AccordionItemProps`, `AccordionHeaderProps`, `AccordionTriggerProps`, `AccordionContentProps`.

## Documentation

The API mirrors Radix, so the upstream [Radix Accordion docs](https://www.radix-ui.com/primitives/docs/components/accordion) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
