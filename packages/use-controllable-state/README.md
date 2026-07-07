# @fictjs/use-controllable-state

Controlled/uncontrolled state helper for Fict, modeled after `@radix-ui/react-use-controllable-state`. Lets a component support both a controlled prop and internal (uncontrolled) state from a single call.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/use-controllable-state fict
```

## Usage

```tsx
import { useControllableState } from '@fictjs/use-controllable-state'

const [open, setOpen] = useControllableState<boolean>({
  prop: () => props.open, // controlled value (accessor); undefined ⇒ uncontrolled
  defaultProp: () => props.defaultOpen ?? false,
  onChange: props.onOpenChange,
  caller: 'MyComponent',
})

open() // read current value
setOpen(true) // update: no-op in controlled mode (emits onChange), sets internal state otherwise
```

## API

- **`useControllableState({ prop, defaultProp, onChange, caller })`** — returns `[getter, setter]`. `prop`/`defaultProp` may be values or accessors. In development it warns if a component switches between controlled and uncontrolled.
- **`useControllableStateReducer(reducer, params, initialArg, init?)`** — a reducer-driven variant returning `[stateGetter, dispatch]`.

## Exports

- **Values:** `useControllableState`, `useControllableStateReducer`.
- **Types:** `UseControllableStateParams`, `ChangeHandler`, `SetStateFn`, `Dispatch`, `AnyAction`.

## Documentation

The API mirrors `@radix-ui/react-use-controllable-state`. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md#controllable-state).

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
