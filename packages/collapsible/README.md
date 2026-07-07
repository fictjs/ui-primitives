# @fictjs/collapsible

Collapsible primitives for Fict, modeled after `@radix-ui/react-collapsible`. An interactive component that expands and collapses a panel of content.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/collapsible fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as Collapsible from '@fictjs/collapsible'

export function Example() {
  return (
    <Collapsible.Root defaultOpen>
      <Collapsible.Trigger>Toggle details</Collapsible.Trigger>
      <Collapsible.Content>Hidden content revealed on open.</Collapsible.Content>
    </Collapsible.Root>
  )
}
```

## Anatomy

- **`Collapsible.Root`** (`Root`) — `open` / `defaultOpen`, `onOpenChange`, `disabled`.
- **`Collapsible.Trigger`** (`Trigger`) — toggles the open state.
- **`Collapsible.Content`** (`Content`) — `forceMount` to keep mounted for animations. Exposes `--radix-collapsible-content-height` / `--radix-collapsible-content-width` CSS variables for enter/exit transitions.

Parts expose `data-state` (`"open"` / `"closed"`) and `data-disabled`.

## Exports

- **Components:** `Collapsible` (`Root`), `CollapsibleTrigger` (`Trigger`), `CollapsibleContent` (`Content`), `createCollapsibleScope`.
- **Types:** `CollapsibleProps`, `CollapsibleTriggerProps`, `CollapsibleContentProps`.

## Documentation

The API mirrors Radix, so the upstream [Radix Collapsible docs](https://www.radix-ui.com/primitives/docs/components/collapsible) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
