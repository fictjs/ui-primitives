# RovingFocusGroup

Implements roving `tabIndex` behavior for composite widgets.

## Components

- `RovingFocusGroup`
- `RovingFocusItem`

Supports arrow navigation, `Home`, `End`, and optional looping.

## Minimal Example

```tsx
import { RovingFocusGroup, RovingFocusItem } from '@fictjs/ui-primitives'

<RovingFocusGroup orientation="horizontal" loop>
  <RovingFocusItem as="button">Bold</RovingFocusItem>
  <RovingFocusItem as="button">Italic</RovingFocusItem>
  <RovingFocusItem as="button">Underline</RovingFocusItem>
</RovingFocusGroup>
```

## Accessibility Notes

- Use roving focus for composite widgets where one tab stop controls many arrow-key targets.
- Ensure orientation matches expected arrow-key behavior for assistive technology users.
