# @fictjs/radix-ui

Aggregate entry point for **Fict UI primitives**, modeled after the upstream [`radix-ui`](https://www.radix-ui.com/primitives) umbrella package. It re-exports every primitive as a namespace so you can depend on a single package instead of dozens.

Part of the [`ui-primitives`](https://github.com/fictjs/ui-primitives) monorepo — a port of Radix Primitives to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/radix-ui fict
```

`@fictjs/runtime` (`>= 0.26.0`) is a peer dependency and comes with `fict`.

## Entry points

| Import                      | Contents                                                         |
| --------------------------- | ---------------------------------------------------------------- |
| `@fictjs/radix-ui`          | Public primitive namespaces (`Accordion`, `Dialog`, `Select`, …) |
| `@fictjs/radix-ui/internal` | Lower-level building blocks, utilities, and hooks                |

## Usage

```tsx
/** @jsxImportSource fict */
import { Dialog } from '@fictjs/radix-ui'

export function Example() {
  return (
    <Dialog.Root>
      <Dialog.Trigger>Open</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content>
          <Dialog.Title>Title</Dialog.Title>
          <Dialog.Description>Description</Dialog.Description>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

Primitives are **unstyled**. Style each state through the `data-*` attributes they expose (`data-state`, `data-disabled`, `data-orientation`, …), just like Radix. Use the `asChild` prop to merge a primitive's behavior onto your own element.

JSX is enabled with the `/** @jsxImportSource fict */` pragma or via `@fictjs/vite-plugin`.

## Available namespaces

`AccessibleIcon`, `Accordion`, `AlertDialog`, `AspectRatio`, `Avatar`, `Checkbox`, `Collapsible`, `ContextMenu`, `Dialog`, `Direction`, `DropdownMenu`, `Form`, `HoverCard`, `Label`, `Menubar`, `NavigationMenu`, `unstable_OneTimePasswordField`, `unstable_PasswordToggleField`, `Popover`, `Portal`, `Progress`, `RadioGroup`, `ScrollArea`, `Select`, `Separator`, `Slider`, `Slot`, `Switch`, `Tabs`, `Toast`, `Toggle`, `ToggleGroup`, `Toolbar`, `Tooltip`, `VisuallyHidden`.

## Internal building blocks

`@fictjs/radix-ui/internal` exposes the shared layers used to build the primitives:

- **Components/utilities:** `Primitive` (with `Primitive.Root` and `Primitive.dispatchDiscreteCustomEvent`), `Arrow`, `Collection`, `Context`, `DismissableLayer`, `FocusGuards`, `FocusScope`, `Menu`, `Popper`, `Presence`, `RovingFocus`.
- **Hooks/helpers:** `composeRefs`, `useComposedRefs`, `useCallbackRef`, `useControllableState`, `useControllableStateReducer`, `useEffectEvent`, `useEscapeKeydown`, `useIsHydrated`, `useLayoutEffect`, `useSize`, `composeEventHandlers`.
- **Types:** `PrimitivePropsWithRef`.

This entry ships a Fict export-metadata sidecar (`internal.fict.meta.json`) so the Fict compiler understands the reactive shape of the exported hooks.

## Documentation

- Monorepo overview and package catalog: [`README.md`](https://github.com/fictjs/ui-primitives#readme)
- Architecture & the Fict reactivity model: [`docs/ARCHITECTURE.md`](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md)

## License

MIT © Fict contributors. Radix Primitives are © [WorkOS](https://workos.com).
