# CommandPalette

Dialog-based command palette for searchable action lists.

## Components

- `CommandPaletteRoot`
- `CommandPaletteTrigger`
- `CommandPaletteContent`
- `CommandPaletteInput`
- `CommandPaletteList`
- `CommandPaletteItem`
- `CommandPaletteEmpty`
- `CommandPaletteGroup`
- `CommandPaletteSeparator`
- `CommandPaletteClose`

## Key APIs

- `CommandPaletteRoot`: controlled/uncontrolled `open`, `value`, and `query` state
- `CommandPaletteInput`: drives filtering query and supports keyboard entry into list
- `CommandPaletteItem`: supports `as/asChild`, `keywords`, `keepOpen`, and selection callbacks
- `CommandPaletteEmpty`: renders only when no items match current query

## Minimal Example

```tsx
import {
  CommandPaletteRoot,
  CommandPaletteTrigger,
  CommandPaletteContent,
  CommandPaletteInput,
  CommandPaletteList,
  CommandPaletteItem,
  CommandPaletteEmpty,
} from '@fictjs/ui-primitives'

<CommandPaletteRoot>
  <CommandPaletteTrigger>Open Command Menu</CommandPaletteTrigger>
  <CommandPaletteContent>
    <CommandPaletteInput placeholder="Type a command" />
    <CommandPaletteList>
      <CommandPaletteItem value="profile">Profile</CommandPaletteItem>
      <CommandPaletteItem value="settings">Settings</CommandPaletteItem>
      <CommandPaletteEmpty>No results</CommandPaletteEmpty>
    </CommandPaletteList>
  </CommandPaletteContent>
</CommandPaletteRoot>
```

## Accessibility Notes

- Built on dialog semantics, so focus and dismissal behavior follows overlay contracts.
- Keep command labels concise and unique for predictable keyboard filtering.
