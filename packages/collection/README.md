# @fictjs/collection

Collection primitives for Fict, modeled after `@radix-ui/react-collection`. Tracks an ordered set of DOM items so a parent can implement keyboard navigation and other index-aware behavior.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

> Internal building block used by primitives such as Accordion, Tabs, and the menu family.

## Installation

```bash
pnpm add @fictjs/collection fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import { createCollection } from '@fictjs/collection'

const [Collection, useCollection, createCollectionScope] = createCollection('Accordion')

// <Collection.Provider> wraps the tree, <Collection.Slot> wraps the container,
// <Collection.ItemSlot> wraps each item. useCollection() returns a getter for the ordered items.
```

## API

- **`createCollection(name)`** — returns `[Collection, useCollection, createCollectionScope]`.
  - `Collection.Provider`, `Collection.Slot`, `Collection.ItemSlot` — wrap the tree, container, and items.
  - `useCollection(scope)` — returns a getter for the ordered item list (each with a `ref` and item data).
- **`unstable_createCollection`** — a newer collection implementation exported under an `unstable_` prefix.

## Exports

- **Values:** `createCollection`, `unstable_createCollection`.
- **Types:** `CollectionProps`, `unstable_CollectionProps`.

## Documentation

The API mirrors `@radix-ui/react-collection`. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md).

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
