# @fictjs/navigation-menu

Navigation menu primitives for Fict, modeled after `@radix-ui/react-navigation-menu`. An accessible site navigation with optional dropdown content and an animated indicator/viewport.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/navigation-menu fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as NavigationMenu from '@fictjs/navigation-menu'

export function Example() {
  return (
    <NavigationMenu.Root>
      <NavigationMenu.List>
        <NavigationMenu.Item>
          <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <NavigationMenu.Link href="/analytics">Analytics</NavigationMenu.Link>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Indicator />
      </NavigationMenu.List>
      <NavigationMenu.Viewport />
    </NavigationMenu.Root>
  )
}
```

## Anatomy

- **`Root`** — `value` / `defaultValue`, `onValueChange`, `delayDuration`, `skipDelayDuration`, `dir`, `orientation`.
- **`Sub`** — a nested navigation menu.
- **`List`**, **`Item`** (`value`), **`Trigger`**, **`Link`** (`active`), **`Content`**.
- **`Indicator`** — highlights the active trigger; **`Viewport`** — renders the active item's content.

## Exports

- **Components:** `NavigationMenu` (`Root`), `NavigationMenuSub` (`Sub`), `NavigationMenuList` (`List`), `NavigationMenuItem` (`Item`), `NavigationMenuTrigger` (`Trigger`), `NavigationMenuLink` (`Link`), `NavigationMenuIndicator` (`Indicator`), `NavigationMenuContent` (`Content`), `NavigationMenuViewport` (`Viewport`), `createNavigationMenuScope`.
- **Types:** the matching `*Props` for every component above.

## Documentation

The API mirrors Radix, so the upstream [Radix Navigation Menu docs](https://www.radix-ui.com/primitives/docs/components/navigation-menu) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
