# ContextMenu

Context menu primitives opened from right-click position.

## Components

- `ContextMenuRoot`
- `ContextMenuTrigger`
- `ContextMenuContent`
- `ContextMenuItem`

## Minimal Example

```tsx
import {
  ContextMenuRoot,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from '@fictjs/ui-primitives'

<ContextMenuRoot>
  <ContextMenuTrigger>Right-click here</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Rename</ContextMenuItem>
    <ContextMenuItem>Delete</ContextMenuItem>
  </ContextMenuContent>
</ContextMenuRoot>
```

## Accessibility Notes

- Pair right-click entry with an alternate keyboard path in your product UX.
- Menu items should have clear action labels and predictable close behavior.
