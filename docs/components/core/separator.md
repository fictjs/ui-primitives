# Separator

Semantic separator primitive.

## Props

- `orientation`: `horizontal | vertical`
- `decorative`: when true, uses presentation semantics

## Minimal Example

```tsx
import { Separator } from '@fictjs/ui-primitives'

<div>
  <span>Section A</span>
  <Separator orientation="horizontal" />
  <span>Section B</span>
</div>
```

## Accessibility Notes

- Use non-decorative separators for meaningful structure so assistive tech can announce boundaries.
- Set `decorative` for purely visual dividers to avoid extra noise for screen readers.
