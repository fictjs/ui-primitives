# @fictjs/ui-primitives

Official headless UI primitives for Fict.

This repository provides unstyled, composable primitives focused on accessibility, interaction semantics, and controlled/uncontrolled APIs.

## Install

```bash
pnpm add @fictjs/ui-primitives @fictjs/runtime
# or npm / yarn
```

## Development

```bash
pnpm install --ignore-workspace
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Component Coverage

### Core

- `Primitive`, `PrimitiveElements`
- `Slot`
- `Presence`
- `Portal`, `PortalHost`
- `VisuallyHidden`
- `Separator`
- `AccessibleIcon`

### Interaction Primitives

- `FocusScope`, `FocusTrap`
- `DismissableLayer`
- `RovingFocusGroup`, `RovingFocusItem`
- `ScrollLock`
- `LiveRegionProvider`, `Announce`, `useAnnouncer`
- `PopperRoot`, `PopperAnchor`, `PopperContent`, `PopperArrow`

### Overlay

- `Dialog*`
- `AlertDialog*`
- `Popover*`
- `Tooltip*`
- `HoverCard*`

### Menu / Feedback

- `DropdownMenu*`
- `ContextMenu*`
- `Menubar*`
- `ToastProvider`, `ToastViewport`, `Toast*`, `useToast`

### Disclosure / Navigation

- `Tabs*`
- `Accordion*`
- `Collapsible*`
- `NavigationMenu*`

### Form & Inputs

- `Label`
- `Checkbox`
- `RadioGroup`, `RadioItem`
- `Switch`, `SwitchThumb`
- `Toggle`, `ToggleGroup`, `ToggleGroupItem`
- `Slider`, `RangeSlider`
- `Select*`
- `Combobox*`
- `Form`, `FormField`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`

### Layout / P2

- `ScrollArea*`
- `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle`
- `AspectRatio`
- `Progress`, `Meter`
- `Skeleton`
- `KeyboardModeProvider`, `FocusVisible`, `useKeyboardMode`

## Docs

See `docs/components/*` for component-level notes and API summaries.
