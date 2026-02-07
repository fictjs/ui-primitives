# HoverCard

Interactive hover content with separate open/close delays.

## Components

- `HoverCardRoot`
- `HoverCardTrigger`
- `HoverCardContent`

## Minimal Example

```tsx
import { HoverCardRoot, HoverCardTrigger, HoverCardContent } from '@fictjs/ui-primitives'

<HoverCardRoot openDelay={100} closeDelay={150}>
  <HoverCardTrigger>@fictjs</HoverCardTrigger>
  <HoverCardContent side="bottom">Project profile preview</HoverCardContent>
</HoverCardRoot>
```

## Accessibility Notes

- Hover-only disclosure is insufficient; this primitive also opens on focus for keyboard users.
- Keep hover card content supplemental and non-blocking for primary task flow.
