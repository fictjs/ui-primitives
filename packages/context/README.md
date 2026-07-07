# @fictjs/context

Scoped context utilities for Fict, modeled after `@radix-ui/react-context`. Creates typed context providers/consumers and the "scope" mechanism that lets composed components (e.g. an accordion built on a collapsible) nest without their contexts colliding.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/context fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import { createContextScope } from '@fictjs/context'

const [createTabsContext, createTabsScope] = createContextScope('Tabs')

const [TabsProvider, useTabsContext] = createTabsContext<{ value: () => string }>('Tabs')

// Provider supplies the (accessor-based) value; consumers read it with a component name for errors.
```

## API

- **`createContext(rootComponentName, defaultContext?)`** — returns `[Provider, useContext]` for a simple, unscoped context.
- **`createContextScope(scopeName, deps?)`** — returns `[createScopedContext, createScope]`. `createScopedContext` builds scoped `[Provider, useContext]` pairs; `createScope` produces the `__scope*` prop hooks and can compose dependency scopes.

Context values typically hold accessors (`() => T`) so consumers read live, reactive state.

## Exports

- **Values:** `createContext`, `createContextScope`.
- **Types:** `CreateScope`, `Scope`.

## Documentation

The API mirrors `@radix-ui/react-context`. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md#scoped-context).

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
