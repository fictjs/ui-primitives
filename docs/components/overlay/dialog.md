# Dialog

Compound modal/non-modal dialog primitives.

## Components

- `DialogRoot`
- `DialogTrigger`
- `DialogPortal`
- `DialogOverlay`
- `DialogContent`
- `DialogTitle`
- `DialogDescription`
- `DialogClose`

Supports controlled/uncontrolled state via `open/defaultOpen/onOpenChange`.

## Root API

- `DialogRoot`
- `open?: boolean | () => boolean` controlled state
- `defaultOpen?: boolean` uncontrolled initial state
- `onOpenChange?: (open: boolean) => void`
- `modal?: boolean` default `true`

## Content Behavior

- `DialogContent` defaults to `role="dialog"`
- `forceMount` keeps content mounted while closed (state reflects via `data-state`)
- `portal?: boolean` defaults to `true`; set `false` for inline rendering/testing
- Escape and outside interactions are handled via `DismissableLayer`
- Modal mode enables `ScrollLock` + focus trap semantics

## Accessibility Contract

- Trigger exposes `aria-haspopup="dialog"` and `aria-controls`
- Content wires `aria-labelledby` and `aria-describedby` to `DialogTitle` / `DialogDescription`
- `DialogClose` emits close semantics through `onOpenChange`

## Minimal Example

```tsx
import {
  DialogRoot,
  DialogTrigger,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@fictjs/ui-primitives'

<DialogRoot>
  <DialogTrigger>Open settings</DialogTrigger>
  <DialogOverlay />
  <DialogContent>
    <DialogTitle>Settings</DialogTitle>
    <DialogDescription>Update your preferences.</DialogDescription>
    <DialogClose>Done</DialogClose>
  </DialogContent>
</DialogRoot>
```
