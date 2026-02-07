# Collapsible

Expandable/collapsible section primitives.

## Components

- `CollapsibleRoot`
- `CollapsibleTrigger`
- `CollapsibleContent`

## Minimal Example

```tsx
import {
  CollapsibleRoot,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@fictjs/ui-primitives'

<CollapsibleRoot defaultOpen>
  <CollapsibleTrigger>Toggle section</CollapsibleTrigger>
  <CollapsibleContent>Collapsible body</CollapsibleContent>
</CollapsibleRoot>
```

## Accessibility Notes

- Trigger state should be exposed via `aria-expanded` (provided by primitive).
- When using `forceMount`, keep hidden-state signaling consistent (`data-state`, optional `aria-hidden`).
