# @fictjs/ui-primitives

Official headless UI primitives for Fict.

This repository provides unstyled, composable primitives focused on accessibility, interaction semantics, and controlled/uncontrolled APIs.

## Who This Is For

- Teams building design systems on top of `@fictjs/runtime`
- App developers who want accessible primitives without pre-baked styles
- Contributors working on interaction, focus, overlay, and form behaviors

## Package Highlights

- Headless component primitives with composable parts
- Controlled + uncontrolled state APIs across core components
- Consistent `asChild` support across `Trigger` / `Close` / `Item` parts
- Deterministic id strategy via `id` injection and `useId` / `IdProvider`
- Built-in accessibility semantics (`role`, `aria-*`, keyboard interactions)
- Shared behavior utilities via `@fictjs/hooks` (event listeners, timers, lifecycle cleanup)
- Strong behavior tests (Vitest + JSDOM)
- Executable demo app + screenshot baseline workflow

## Installation

```bash
pnpm add @fictjs/ui-primitives @fictjs/runtime @fictjs/hooks
# or npm / yarn
```

Node version: `>=18`

Peer dependencies:

- `@fictjs/hooks@^0.3.0`
- `@fictjs/runtime@^0.10.0`

## Quick Start

```tsx
import { render } from '@fictjs/runtime'
import {
  DialogRoot,
  DialogTrigger,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@fictjs/ui-primitives'

const app = document.querySelector('#app')
if (!(app instanceof HTMLElement)) throw new Error('Missing #app')

render(
  () => (
    <DialogRoot>
      <DialogTrigger>Open dialog</DialogTrigger>
      <DialogOverlay />
      <DialogContent>
        <DialogTitle>Settings</DialogTitle>
        <DialogDescription>Update your preferences.</DialogDescription>
        <DialogClose>Close</DialogClose>
      </DialogContent>
    </DialogRoot>
  ),
  app,
)
```

## API Surface

All exports are available from the root entry:

```ts
import { DialogRoot, TabsRoot, ToastProvider } from '@fictjs/ui-primitives'
```

Export groups:

- Core: `Primitive`, `Slot`, `Presence`, `Portal`, `VisuallyHidden`, etc.
- Core id primitives: `IdProvider`, `useId`
- Interaction: `FocusScope`, `DismissableLayer`, `RovingFocusGroup`, `Popper`, etc.
- Overlay: `Dialog*`, `AlertDialog*`, `Popover*`, `Tooltip*`, `HoverCard*`, `CommandPalette*`
- Menu: `DropdownMenu*`, `ContextMenu*`, `Menubar*` (including submenu parts)
- Feedback: `ToastProvider`, `ToastViewport`, `Toast*`, `useToast`
- Disclosure: `Tabs*`, `Accordion*`, `Collapsible*`, `NavigationMenu*`
- Form: `Label`, `Checkbox`, `RadioGroup`, `Switch`, `Toggle`, `Slider`, `RangeSlider`, `Calendar`, `DatePicker`, `Select`, `Combobox`, `Form*`
- Layout: `ScrollArea*`, `Resizable*`, `AspectRatio`, `Progress`, `Skeleton`, `FocusVisible`

For detailed symbol-by-symbol reference, see `docs/api-reference.md`.

## Design Contracts

- Controlled/uncontrolled parity: `open/defaultOpen/onOpenChange` and `value/defaultValue/onValueChange`
- `asChild` parity: `Trigger`, `Close`, and `Item` parts support Slot composition
- Stable id wiring: prefer explicit `id` for deterministic SSR, otherwise use built-in id generation
- Interceptable outside interactions: overlay content parts expose escape and outside interaction hooks

## Documentation Map

- `docs/README.md`: documentation index
- `docs/components/*`: per-component behavior, minimal examples, and a11y notes
- `docs/api-reference.md`: full export index
- `docs/architecture.md`: design and implementation structure
- `docs/testing.md`: testing strategy and expectations
- `docs/accessibility.md`: accessibility review checklist
- `docs/examples.md`: copyable composition snippets
- `examples/README.md`: executable demo app + screenshot workflow
- `docs/release.md`: release and publish checklist

## Demo App

Run local demo app:

```bash
pnpm examples:dev
```

Open `http://127.0.0.1:4173`.

Build and preview:

```bash
pnpm examples:build
pnpm examples:preview
```

## Screenshot Baselines

Install browser binary once:

```bash
pnpm examples:screenshots:install
```

Regenerate baseline screenshots:

```bash
pnpm examples:screenshots
```

Outputs: `examples/screenshots/baseline`

## Development

Install dependencies:

```bash
pnpm install --ignore-workspace
```

Common commands:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:coverage`
- `pnpm build`
- `pnpm clean`

## Contribution Workflow

1. Create a focused branch.
2. Make small, reviewable commits.
3. Keep docs and tests updated with behavior changes.
4. Run quality gates before opening a PR.

Detailed guide: `CONTRIBUTING.md`

## Release Workflow

Use the checklist in `docs/release.md` before publishing.

## License

MIT, see `LICENSE`.
