# DismissableLayer

Provides common dismissal semantics used by overlays.

## Events

- `onEscapeKeyDown`
- `onInteractOutside`
- `onPointerDownOutside`
- `onFocusOutside`
- `onDismiss`

Only the top-most mounted layer responds.

## Minimal Example

```tsx
import { DismissableLayer } from '@fictjs/ui-primitives'

<DismissableLayer onDismiss={() => console.log('dismissed')}>
  <div role="dialog">Layer content</div>
</DismissableLayer>
```

## Accessibility Notes

- Dismiss paths should include explicit close controls in addition to outside/Escape behavior.
- Only the top-most layer responds; stack layered popups intentionally.
