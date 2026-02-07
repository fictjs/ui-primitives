# FocusScope / FocusTrap

`FocusScope` manages keyboard focus within a subtree.

## Features

- optional focus trapping with Tab cycling
- optional auto focus on mount
- optional focus restore on unmount

`FocusTrap` is `FocusScope` with `trapped=true`.

## Minimal Example

```tsx
import { FocusScope } from '@fictjs/ui-primitives'

<FocusScope trapped loop autoFocus restoreFocus>
  <button type="button">First</button>
  <button type="button">Second</button>
</FocusScope>
```

## Accessibility Notes

- Use focus trapping only for modal contexts.
- Keep at least one tabbable control inside the scope for predictable keyboard flow.
