# ScrollLock

Locks `document.body` scroll while mounted.

- supports nested locks with internal reference counting
- compensates scrollbar width via `padding-right`

## Minimal Example

```tsx
import { ScrollLock } from '@fictjs/ui-primitives'

<div>
  <ScrollLock enabled />
  <div role="dialog" aria-modal="true">Modal body</div>
</div>
```

## Accessibility Notes

- Scroll lock is not a complete modal solution; combine with focus trap and dismissal handling.
- Verify nested overlays unlock scroll only after the final lock is removed.
