# Id Utilities

`useId` and `IdProvider` provide deterministic id generation for aria wiring and SSR-safe composition.

## API

- `useId(id?: string, prefix?: string): string`
- `IdProvider` with `prefix?: string`

## Minimal Example

```tsx
import { IdProvider, useId } from '@fictjs/ui-primitives'

function Field() {
  const id = useId(undefined, 'profile-field')
  return <input id={id} aria-describedby={`${id}-hint`} />
}

<IdProvider prefix="settings">{<Field />}</IdProvider>
```

## Notes

- Prefer explicit `id` on root primitives when you need hard guarantees for SSR/hydration parity.
- `IdProvider` helps keep generated ids deterministic within a subtree.
