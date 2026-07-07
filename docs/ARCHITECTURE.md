# Architecture

This document explains how `ui-primitives` is organized, how the port adapts Radix Primitives to the Fict runtime, and how the build/test/release pipeline fits together. If you are consuming the packages, the root [`README.md`](../README.md) is enough — this is for contributors and the curious.

## Table of contents

- [Overview](#overview)
- [The monorepo](#the-monorepo)
- [Package layers](#package-layers)
- [The Fict reactivity model](#the-fict-reactivity-model)
  - [Accessors and `MaybeAccessor`](#accessors-and-maybeaccessor)
  - [Reactive prop forwarding](#reactive-prop-forwarding)
  - [Scoped context](#scoped-context)
  - [Controllable state](#controllable-state)
  - [The `Primitive` element factory](#the-primitive-element-factory)
- [The aggregate package](#the-aggregate-package)
- [Radix Themes layer](#radix-themes-layer)
- [Build pipeline](#build-pipeline)
- [Fict export metadata](#fict-export-metadata)
- [Testing strategy](#testing-strategy)
- [CI/CD](#cicd)
- [Mapping to upstream Radix](#mapping-to-upstream-radix)

## Overview

`ui-primitives` ports [Radix Primitives](https://www.radix-ui.com/primitives) and [Radix Themes](https://www.radix-ui.com/themes) from React to **Fict**, a fine-grained reactive UI framework (`fict` / `@fictjs/runtime`). The public API deliberately mirrors Radix — same component/sub-component names, props, and `data-*` state attributes — so Radix documentation and mental models transfer. The internals are rewritten to use Fict's signal-based reactivity instead of React's hooks and virtual DOM diffing.

## The monorepo

- **Workspaces** — pnpm workspaces defined in [`pnpm-workspace.yaml`](../pnpm-workspace.yaml) cover `apps/*`, `libs/*`, and `packages/*`.
- **Dependency catalog** — third-party versions are declared once under `catalog:` with `catalogMode: strict`, so every package pins the exact same version of shared tooling (`typescript`, `vitest`, `tsup`, `eslint`, …) and Fict (`@fictjs/runtime`, `@fictjs/vite-plugin`, `fict`).
- **Task graph** — [Turborepo](../turbo.json) orchestrates tasks with dependency awareness:
  - `build` depends on `^build` (upstream packages build first) and outputs `dist/**`.
  - `test` and `typecheck` depend on `^build`.
  - `lint` depends on `build`, `^build`, and `^lint`.
  - `dev`/`test:watch` are persistent, non-cached tasks.
- **Shared TypeScript config** — [`tsconfig.base.json`](../tsconfig.base.json) enables strict mode, `NodeNext` resolution, `verbatimModuleSyntax`, `exactOptionalPropertyTypes`, and `noUncheckedIndexedAccess`.

```
apps/         → demo app (playground) — not published
libs/         → larger libraries (themes, floating-ui, scroll/style helpers)
packages/     → primitives, utilities, hooks (the @fictjs/* surface)
scripts/      → Fict metadata emit/verify tooling
others/       → read-only upstream Radix checkout (reference only)
```

## Package layers

Packages form a dependency stack from low-level DOM helpers up to full components:

1. **Runtime bindings & DOM helpers** — `@fictjs/core-primitive` (event/DOM utilities), `@fictjs/primitive` (polymorphic element components), `@fictjs/slot`, `@fictjs/compose-refs`.
2. **Hooks** — `@fictjs/use-*` packages (`use-controllable-state`, `use-size`, `use-layout-effect`, `use-escape-keydown`, …) and `@fictjs/id`, `@fictjs/direction`.
3. **Behavioral utilities** — `@fictjs/context` (scoped context), `@fictjs/collection`, `@fictjs/presence`, `@fictjs/roving-focus`, `@fictjs/focus-scope`, `@fictjs/focus-guards`, `@fictjs/dismissable-layer`, `@fictjs/popper` (built on `@fictjs/floating-ui-dom`), `@fictjs/portal`.
4. **Components** — user-facing primitives (`@fictjs/accordion`, `@fictjs/dialog`, `@fictjs/select`, …) composed from the layers above.
5. **Aggregate** — `@fictjs/radix-ui` re-exports every component namespace plus an `/internal` entry for the shared utilities.
6. **Styled layer** — `@fictjs/radix-ui-themes` builds a themed design system on top of `@fictjs/radix-ui`.

Each package is intentionally small and single-purpose, which keeps the dependency graph explicit and bundles tree-shakeable.

## The Fict reactivity model

This is where the port differs most from React. Fict is signals-based (conceptually similar to SolidJS): components run once to set up a reactive graph, and updates flow through fine-grained subscriptions rather than re-rendering.

### Accessors and `MaybeAccessor`

Reactive values are represented as **accessor functions** — call them to read the current value and to subscribe. Reactive props accept either a static value or an accessor:

```ts
type MaybeAccessor<T> = T | (() => T)
```

Each package includes a `readValue` helper that unwraps a `MaybeAccessor`. It detects "readable" functions either by arity (zero-arg functions) or by well-known Fict markers so that signals, computed/memos, and prop getters are all resolved:

```ts
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')
```

Hooks return accessors rather than plain values. For example `@fictjs/id`:

```ts
function useId(determinedId?: MaybeAccessor<string | undefined>): () => string
```

You call `useId()` once and then read the id via the returned getter.

### Reactive prop forwarding

Instead of spreading props (`{...props}`, which would snapshot values), components forward props reactively using `mergeProps()` and `prop(() => …)` from `@fictjs/runtime`:

```tsx
const primitiveProps = mergeProps(
  prop(() => props as Record<string, unknown>),
  {
    'data-orientation': prop(orientation), // reactive computed attribute
    onKeyDown: disabled() ? undefined : handleKeyDown,
  },
)

return <Primitive.div {...primitiveProps} />
```

`prop(fn)` wraps a getter so the merged prop stays live; later object entries override earlier ones (mirroring spread precedence) while remaining reactive.

### Scoped context

Radix uses "scoped context" so that composed components (e.g. Accordion is built on Collapsible) can nest without their contexts colliding. The port reimplements this in `@fictjs/context`:

```ts
const [createAccordionContext, createAccordionScope] = createContextScope(ACCORDION_NAME, [
  createCollectionScope,
  createCollapsibleScope,
])
```

Context values themselves hold accessors (`() => T`) so consumers read live state. Simpler cases use plain `createContext`/`useContext` (see `@fictjs/direction`).

### Controllable state

`@fictjs/use-controllable-state` provides the controlled/uncontrolled pattern. `prop` and `defaultProp` are accessors; the hook returns a `[getter, setter]` pair and, in development, warns if a component switches between controlled and uncontrolled:

```ts
const [value, setValue] = useControllableState<string>({
  prop: valueProp, // () => props.value
  defaultProp: defaultValue, // () => props.defaultValue ?? ''
  caller: ACCORDION_NAME,
  onChange: props.onValueChange,
})
```

A reducer variant, `useControllableStateReducer`, supports reducer-driven state with the same controlled/uncontrolled semantics.

### The `Primitive` element factory

`@fictjs/primitive` exposes polymorphic element components (`Primitive.div`, `Primitive.button`, …) that:

- support the Radix `asChild` prop by delegating to `@fictjs/slot`,
- forward refs via a `ref` prop,
- and build output through `createElement` + `mergeProps` so everything stays reactive.

It also re-exports `dispatchDiscreteCustomEvent` for primitives that emit discrete DOM events.

## The aggregate package

[`@fictjs/radix-ui`](../packages/radix-ui) is the umbrella entry point with two exports:

- **`@fictjs/radix-ui`** ([`src/index.ts`](../packages/radix-ui/src/index.ts)) — every component as a namespace (`export * as Accordion from '@fictjs/accordion'`, …). Unstable components are prefixed (`unstable_OneTimePasswordField`, `unstable_PasswordToggleField`).
- **`@fictjs/radix-ui/internal`** ([`src/internal.ts`](../packages/radix-ui/src/internal.ts)) — lower-level building blocks and hooks (`Primitive`, `Collection`, `DismissableLayer`, `FocusScope`, `Popper`, `Presence`, `RovingFocus`, `useControllableState`, `useSize`, `composeEventHandlers`, …).

The `internal` entry carries a `fict` export-metadata sidecar (see below).

## Radix Themes layer

[`@fictjs/radix-ui-themes`](../libs/radix-ui-themes) ports `@radix-ui/themes`. It keeps Radix Themes' **CSS-first** distribution model — shipping compiled JS components plus generated CSS entrypoints (`styles.css`, `components.css`, `utilities.css`, `tokens.css`, `layout.css`, …) — while swapping the underlying primitives from `radix-ui` to `@fictjs/radix-ui`. `@radix-ui/colors` and `classnames` remain runtime dependencies. PostCSS plugins in the package handle breakpoint and whitespace transforms during the CSS build.

## Build pipeline

Every publishable package builds with [tsup](https://tsup.egoist.dev/) using a near-identical config:

```ts
export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index.ts'], // or ['src/index.ts', 'src/internal.ts'] for the aggregate
  format: ['esm', 'cjs'],
  platform: 'neutral',
  sourcemap: true,
  target: 'es2022',
  treeshake: true,
})
```

Output goes to `dist/` as `index.js` (ESM), `index.cjs` (CJS), and `index.d.ts` (types), matching the `main`/`module`/`types`/`exports` fields in each `package.json`. Packages that ship Fict metadata append a metadata emit step to their `build` script.

## Fict export metadata

Certain Fict hooks return reactive containers whose internal shape the Fict compiler (`@fictjs/vite-plugin`) must know about to wire up reactivity correctly — for instance which returned values are signals vs. memos, or which positions in a returned array/object are reactive.

That information is described in a `*.fict.meta.json` sidecar and a `fict` field in `package.json`. Rather than maintaining these by hand, they are generated and validated by [`scripts/fict-metadata.mjs`](../scripts/fict-metadata.mjs), which holds the canonical config for each metadata package (e.g. `@fictjs/direction`, `@fictjs/id`, `@fictjs/use-controllable-state`, `@fictjs/use-is-hydrated`, `@fictjs/use-size`, `@fictjs/floating-ui-dom`, `@fictjs/use-sidecar`, and the `@fictjs/radix-ui/internal` entry).

The metadata vocabulary includes:

- `directAccessor: 'signal' | 'memo'` — the hook returns a single accessor of that kind.
- `arrayProps: { 0: 'memo', 1: 'signal' }` — positions in a returned tuple/array.
- `objectProps: { x: 'signal', … }` — keys in a returned object.

Commands:

```bash
node scripts/fict-metadata.mjs emit [packageDir|packageName]   # write metadata files
node scripts/fict-metadata.mjs verify [--pack]                 # verify (optionally against packed tarball)
node scripts/fict-metadata.mjs list                            # list metadata packages
pnpm metadata:verify                                           # verify --pack (part of `pnpm verify`)
pnpm metadata:e2e                                              # standalone end-to-end verifier
```

`emit` runs automatically after `tsup` in the relevant packages' `build` scripts. `verify --pack` additionally packs each package with `pnpm pack` and asserts the metadata files are present in the published tarball.

## Testing strategy

- **Unit tests** — [Vitest](https://vitest.dev/) with the jsdom environment. Each package has its own `vitest.config.ts`; [`vitest.workspace.ts`](../vitest.workspace.ts) aggregates `packages/*/vitest.config.ts`. Coverage uses `@vitest/coverage-v8`.
- **End-to-end tests** — [Playwright](https://playwright.dev/) specs in [`apps/playground/e2e`](../apps/playground/e2e) drive the styled playground (control, display, overlay, layout/typography, and route-smoke suites) against a locally built app.

## CI/CD

- [`.github/workflows/nodejs.yml`](../.github/workflows/nodejs.yml) — runs `pnpm verify` on every push to `main` and every pull request (Node 22.21.1, pnpm 10.31.0, frozen lockfile).
- [`.github/workflows/npm-publish.yml`](../.github/workflows/npm-publish.yml) — triggered by pushing a git tag. It runs `pnpm verify`, then `pnpm release` (`changeset publish`). It uses npm **trusted publishing (OIDC)** with provenance when `NPM_TOKEN` is absent, and token auth when present.

Versioning is driven by [Changesets](https://github.com/changesets/changesets) ([`.changeset/config.json`](../.changeset/config.json)): `baseBranch: main`, `access: public`, internal dependency bumps applied as `patch`.

## Mapping to upstream Radix

| Upstream (`@radix-ui/*`)        | This repo (`@fictjs/*`)                            |
| ------------------------------- | -------------------------------------------------- |
| `radix-ui` (umbrella)           | `@fictjs/radix-ui`                                 |
| `@radix-ui/primitive`           | `@fictjs/core-primitive`                           |
| `@radix-ui/react-primitive`     | `@fictjs/primitive`                                |
| `@radix-ui/react-<component>`   | `@fictjs/<component>`                              |
| `@radix-ui/react-use-*` / hooks | `@fictjs/use-*`, `@fictjs/id`, `@fictjs/direction` |
| `@radix-ui/themes`              | `@fictjs/radix-ui-themes`                          |
| `@floating-ui/react-dom`        | `@fictjs/floating-ui-dom`                          |
| `react-remove-scroll`           | `@fictjs/fict-remove-scroll`                       |
| `react-remove-scroll-bar`       | `@fictjs/fict-remove-scroll-bar`                   |
| `react-style-singleton`         | `@fictjs/fict-style-singleton`                     |
| `use-sidecar`                   | `@fictjs/use-sidecar`                              |

A read-only checkout of the upstream repository lives in [`others/primitives/`](../others/primitives) for cross-referencing behavior while porting. It is not part of the workspace and is never published.
