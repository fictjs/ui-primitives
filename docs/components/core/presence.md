# Presence

`Presence` conditionally mounts children based on `present`, while supporting force mount.

## Props

- `present`: boolean/accessor, default `true`
- `forceMount`: boolean/accessor, default `false`
- `children`: node or render function receiving `{ present }`

## Minimal Example

```tsx
import { createSignal } from '@fictjs/runtime/advanced'
import { Presence } from '@fictjs/ui-primitives'

const open = createSignal(false)

<Presence present={() => open()}>
  <div data-state={() => (open() ? 'open' : 'closed')}>Conditional panel</div>
</Presence>
```

## Accessibility Notes

- When `present` is false, content is unmounted and removed from the accessibility tree.
- If using `forceMount`, also expose hidden/closed state (`data-state`, `aria-hidden`, etc.) intentionally.
