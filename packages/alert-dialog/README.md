# @fictjs/alert-dialog

Alert dialog primitives for Fict, modeled after `@radix-ui/react-alert-dialog`. A modal dialog that interrupts the user with important content and expects a response.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/alert-dialog fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as AlertDialog from '@fictjs/alert-dialog'

export function Example() {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger>Delete account</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay />
        <AlertDialog.Content>
          <AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
          <AlertDialog.Description>This action cannot be undone.</AlertDialog.Description>
          <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
          <AlertDialog.Action>Yes, delete</AlertDialog.Action>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
```

## Anatomy

- **`AlertDialog.Root`** (`Root`) — `open` / `defaultOpen`, `onOpenChange`.
- **`AlertDialog.Trigger`** (`Trigger`), **`AlertDialog.Portal`** (`Portal`), **`AlertDialog.Overlay`** (`Overlay`), **`AlertDialog.Content`** (`Content`).
- **`AlertDialog.Title`** (`Title`), **`AlertDialog.Description`** (`Description`) — labels the dialog for assistive technology.
- **`AlertDialog.Action`** (`Action`), **`AlertDialog.Cancel`** (`Cancel`) — focus is moved to `Cancel` by default.

Focus is trapped while open and returns to the trigger on close. Parts expose `data-state` (`"open"` / `"closed"`) for animation.

## Exports

- **Components:** `AlertDialog` (`Root`), `AlertDialogTrigger` (`Trigger`), `AlertDialogPortal` (`Portal`), `AlertDialogOverlay` (`Overlay`), `AlertDialogContent` (`Content`), `AlertDialogAction` (`Action`), `AlertDialogCancel` (`Cancel`), `AlertDialogTitle` (`Title`), `AlertDialogDescription` (`Description`), `createAlertDialogScope`.
- **Types:** `AlertDialogProps`, `AlertDialogTriggerProps`, `AlertDialogPortalProps`, `AlertDialogOverlayProps`, `AlertDialogContentProps`, `AlertDialogActionProps`, `AlertDialogCancelProps`, `AlertDialogTitleProps`, `AlertDialogDescriptionProps`.

## Documentation

The API mirrors Radix, so the upstream [Radix Alert Dialog docs](https://www.radix-ui.com/primitives/docs/components/alert-dialog) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
