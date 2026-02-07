# Popper

Lightweight floating positioning primitives.

## Components

- `PopperRoot`
- `PopperAnchor`
- `PopperContent`
- `PopperArrow`

Supports side/alignment offsets and updates on resize/scroll.

## Minimal Example

```tsx
import { PopperAnchor, PopperContent, PopperRoot } from '@fictjs/ui-primitives'

<PopperRoot>
  <PopperAnchor>
    <button type="button">Open</button>
  </PopperAnchor>
  <PopperContent side="bottom" align="start">Floating content</PopperContent>
</PopperRoot>
```

## Accessibility Notes

- Popper only positions; you still need roles, labels, and dismissal semantics in the floating content.
- Keep anchor/content relationship explicit with `aria-controls` or `aria-describedby` where applicable.
