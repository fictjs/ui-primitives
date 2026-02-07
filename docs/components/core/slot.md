# Slot

`Slot` provides `asChild` behavior by cloning a single child vnode and merging props.

Merged behavior:

- event handlers are composed (`child` then `slot`)
- `class` / `className` values are concatenated
- `style` objects are shallow-merged
- refs are composed

## Minimal Example

```tsx
import { Slot } from '@fictjs/ui-primitives'

<Slot class="button-like" onClick={() => {}}>
  <a href="/docs">Open docs</a>
</Slot>
```

## Accessibility Notes

- The child keeps its native semantics; verify merged props do not conflict with existing keyboard behavior.
- Keep a single interactive target inside `Slot` to avoid nested-focusable anti-patterns.
