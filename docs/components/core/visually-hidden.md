# VisuallyHidden

Renders accessible text for assistive tech while keeping it visually hidden.

Supports `as` to change element tag.

## Minimal Example

```tsx
import { VisuallyHidden } from '@fictjs/ui-primitives'

<button type="button">
  <svg aria-hidden="true" />
  <VisuallyHidden>Search</VisuallyHidden>
</button>
```

## Accessibility Notes

- Use for supplemental text, not large hidden content blocks.
- Pair with visible affordances so sighted keyboard users still understand the control.
