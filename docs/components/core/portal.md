# Portal / PortalHost

- `Portal` renders subtree into a target container (default `document.body`)
- `PortalHost` sets a container context for nested portals

## Props

### Portal

- `container`: HTMLElement or accessor
- `disabled`: render inline when true

### PortalHost

- `container`: HTMLElement or accessor

## Minimal Example

```tsx
import { Portal } from '@fictjs/ui-primitives'

<Portal>
  <div role="dialog" aria-modal="true">Portaled content</div>
</Portal>
```

## Accessibility Notes

- Portaling changes DOM position, not semantics; always provide explicit role/aria on the content.
- Ensure focus entry/restore and dismiss behavior are handled by surrounding primitives (e.g. `Dialog`).
