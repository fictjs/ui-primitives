# @fictjs/primitive

Low-level polymorphic DOM element components for Fict, modeled after `@radix-ui/react-primitive`. Every other primitive renders through these to get consistent `asChild` and ref-forwarding behavior.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/primitive fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import { Primitive } from '@fictjs/primitive'

// Renders a <button>
export function Button(props) {
  return <Primitive.button {...props} />
}

// `asChild` merges the primitive's behavior onto the child element instead of rendering its own node
export function LinkButton() {
  return (
    <Primitive.button asChild>
      <a href="/home">Home</a>
    </Primitive.button>
  )
}
```

## API

- **`Primitive.<tag>`** — one component per supported element (`a`, `button`, `div`, `form`, `h2`, `h3`, `img`, `input`, `label`, `li`, `nav`, `ol`, `p`, `select`, `span`, `svg`, `ul`). Each accepts the element's props plus `asChild` and a `ref`.
- **`Primitive.Root`** (`Root`) — alias for the full `Primitive` object.
- **`dispatchDiscreteCustomEvent(target, event)`** — dispatch a discrete custom DOM event.

## Exports

- **Components:** `Primitive`, `Root`, `dispatchDiscreteCustomEvent`.
- **Types:** `PrimitivePropsWithRef`.

## Documentation

The API mirrors `@radix-ui/react-primitive`. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
