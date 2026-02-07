# AlertDialog

Alert dialog wrappers built on top of `Dialog` with modal semantics and `role="alertdialog"` defaults.

## Components

- `AlertDialogRoot`
- `AlertDialogTrigger`
- `AlertDialogPortal`
- `AlertDialogOverlay`
- `AlertDialogContent`
- `AlertDialogTitle`
- `AlertDialogDescription`
- `AlertDialogAction`
- `AlertDialogCancel`

## Minimal Example

```tsx
import {
  AlertDialogRoot,
  AlertDialogTrigger,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@fictjs/ui-primitives'

<AlertDialogRoot>
  <AlertDialogTrigger>Delete</AlertDialogTrigger>
  <AlertDialogOverlay />
  <AlertDialogContent>
    <AlertDialogTitle>Delete item?</AlertDialogTitle>
    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
    <AlertDialogCancel>Cancel</AlertDialogCancel>
    <AlertDialogAction>Confirm</AlertDialogAction>
  </AlertDialogContent>
</AlertDialogRoot>
```

## Accessibility Notes

- Use concise, high-signal titles/descriptions because `alertdialog` is announced with higher urgency.
- Keep both cancel and confirm actions keyboard accessible in logical focus order.
