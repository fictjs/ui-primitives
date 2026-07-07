# @fictjs/slot

Slot utilities for Fict, modeled after `@radix-ui/react-slot`. Powers the `asChild` pattern by merging a component's props and behavior onto its child element instead of rendering an extra DOM node.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/slot fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import { Slot } from '@fictjs/slot'

// A polymorphic Button: renders a <button> normally, or merges its props
// onto the child element when `asChild` is set.
function Button(props) {
  const Comp = props.asChild ? Slot : 'button'
  return <Comp {...props} />
}

// Renders an <a> that receives Button's merged props (class, onClick, ref, …).
function Home() {
  return (
    <Button asChild>
      <a href="/home">Home</a>
    </Button>
  )
}
```

## API

- **`Slot`** — clones its single child, merging incoming props (event handlers are composed, refs are combined).
- **`Slottable`** — marks which child a slot should merge onto when there are multiple children.
- **`createSlot(name)`** / **`createSlottable(name)`** — create named slot/slottable components (used internally for good display names).
- **`Root`** — alias for `Slot`.

## Exports

- **Components:** `Slot`, `Slottable`, `Root`, `createSlot`, `createSlottable`.
- **Types:** `SlotProps`.

## Documentation

The API mirrors Radix, so the upstream [Radix Slot docs](https://www.radix-ui.com/primitives/docs/utilities/slot) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
