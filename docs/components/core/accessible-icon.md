# AccessibleIcon

Wraps an icon with a hidden text label.

## Props

- `label`: required accessible text
- `children`: icon node

## Minimal Example

```tsx
import { AccessibleIcon } from '@fictjs/ui-primitives'

<AccessibleIcon label="Close dialog">
  <svg width="16" height="16" aria-hidden="true"><path d="M2 2 L14 14 M14 2 L2 14" /></svg>
</AccessibleIcon>
```

## Accessibility Notes

- `label` is required and should describe the icon action, not visual shape.
- Keep the nested icon decorative (`aria-hidden="true"`) so only one accessible name is announced.
