# NavigationMenu

Application/navigation menu primitives.

## Components

- `NavigationMenuRoot`
- `NavigationMenuList`
- `NavigationMenuItem`
- `NavigationMenuTrigger`
- `NavigationMenuContent`
- `NavigationMenuLink`
- `NavigationMenuIndicator`
- `NavigationMenuViewport`

## Minimal Example

```tsx
import {
  NavigationMenuRoot,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from '@fictjs/ui-primitives'

<NavigationMenuRoot>
  <NavigationMenuList>
    <NavigationMenuItem value="docs">
      <NavigationMenuTrigger>Docs</NavigationMenuTrigger>
      <NavigationMenuContent>
        <NavigationMenuLink href="/guide">Guide</NavigationMenuLink>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenuRoot>
```

## Accessibility Notes

- Triggers should expose open/closed state and remain keyboard reachable.
- Content should contain real link targets, not only generic containers.
