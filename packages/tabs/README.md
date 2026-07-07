# @fictjs/tabs

Tabs primitives for Fict, modeled after `@radix-ui/react-tabs`. A set of layered sections of content (tab panels) shown one at a time.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/tabs fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as Tabs from '@fictjs/tabs'

export function Example() {
  return (
    <Tabs.Root defaultValue="account">
      <Tabs.List>
        <Tabs.Trigger value="account">Account</Tabs.Trigger>
        <Tabs.Trigger value="password">Password</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="account">Account settings</Tabs.Content>
      <Tabs.Content value="password">Password settings</Tabs.Content>
    </Tabs.Root>
  )
}
```

## Anatomy

- **`Tabs.Root`** (`Root`) — `value` / `defaultValue`, `onValueChange`, `orientation`, `dir`, `activationMode` (`"automatic" | "manual"`).
- **`Tabs.List`** (`List`) — `loop`. Uses roving focus for arrow-key navigation.
- **`Tabs.Trigger`** (`Trigger`) — `value`, `disabled`.
- **`Tabs.Content`** (`Content`) — `value`, `forceMount`.

Parts expose `data-state` (`"active"` / `"inactive"`), `data-orientation`, and `data-disabled`.

## Exports

- **Components:** `Tabs` (`Root`), `TabsList` (`List`), `TabsTrigger` (`Trigger`), `TabsContent` (`Content`), `createTabsScope`.
- **Types:** `TabsProps`, `TabsListProps`, `TabsTriggerProps`, `TabsContentProps`.

## Documentation

The API mirrors Radix, so the upstream [Radix Tabs docs](https://www.radix-ui.com/primitives/docs/components/tabs) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
