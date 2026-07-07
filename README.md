# ui-primitives

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22.13.0-3c873a.svg)](./.nvmrc)
[![pnpm](https://img.shields.io/badge/pnpm-10.31.0-f69220.svg)](https://pnpm.io/)
[![Built with Turborepo](https://img.shields.io/badge/built%20with-Turborepo-000.svg)](https://turborepo.com/)

**Accessible, unstyled, low-level UI primitives for [Fict](https://github.com/fictjs), ported from [Radix UI](https://www.radix-ui.com/primitives).**

`ui-primitives` is a monorepo that brings the full [Radix Primitives](https://www.radix-ui.com/primitives) surface — and the [Radix Themes](https://www.radix-ui.com/themes) styled layer — to **Fict**, a fine-grained reactive (signals-based) UI framework. Every component keeps Radix's accessibility guarantees, composable "one component renders one DOM node" API, and `data-*` state model, while adapting the implementation to Fict's reactivity primitives (accessors, `prop()`, scoped signal contexts) instead of React hooks.

> The published packages live under the [`@fictjs`](https://www.npmjs.com/org/fictjs) npm scope. The umbrella entry point is [`@fictjs/radix-ui`](./packages/radix-ui).

---

## Table of contents

- [Why this project](#why-this-project)
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick start](#quick-start)
- [The Fict reactivity model](#the-fict-reactivity-model)
- [Repository layout](#repository-layout)
- [Package catalog](#package-catalog)
- [Development](#development)
- [Testing](#testing)
- [Fict export metadata](#fict-export-metadata)
- [Releasing](#releasing)
- [Contributing](#contributing)
- [Acknowledgements](#acknowledgements)
- [License](#license)

---

## Why this project

Radix Primitives are the de-facto standard for building accessible design systems on React. Fict applications could not use them directly because Radix relies on the React runtime (hooks, `forwardRef`, `React.createElement`, synthetic events).

This repository is a **faithful, behavior-compatible port**:

- **Same API shape** — component names, sub-components, props, and `data-state`/`data-*` attributes mirror Radix so existing Radix knowledge and documentation transfer directly.
- **Same accessibility** — WAI-ARIA roles, keyboard navigation, focus management, and RTL support are preserved.
- **Fict-native internals** — reactivity is expressed with Fict signals and accessors, positioning uses `@floating-ui/dom`, and scroll-locking/focus utilities are re-implemented for the Fict runtime.
- **Radix Themes included** — [`@fictjs/radix-ui-themes`](./libs/radix-ui-themes) ports the styled component layer and CSS token system so you can ship a polished UI immediately.

## Features

- **60+ packages** — one focused package per primitive plus shared utilities and hooks.
- **Accessible by default** — keyboard interaction, focus trapping, collision-aware positioning, scroll locking, live-region announcements.
- **Controlled or uncontrolled** — every stateful primitive supports both modes via `useControllableState`.
- **Unstyled core, styled themes** — primitives ship zero styles; `@fictjs/radix-ui-themes` adds the full Radix Themes design system.
- **Tree-shakeable ESM + CJS** — dual builds with `.d.ts` types and source maps produced by [tsup](https://tsup.egoist.dev/).
- **Thoroughly tested** — unit tests in [Vitest](https://vitest.dev/) (jsdom) and end-to-end smoke tests in [Playwright](https://playwright.dev/).
- **Modern toolchain** — pnpm workspaces, Turborepo task graph, Changesets releases, Conventional Commits.

## Requirements

| Tool         | Version                                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------------------------- |
| Node.js      | `>= 22.13.0` (CI and local dev pin `22.21.1` via [`.nvmrc`](./.nvmrc))                                            |
| pnpm         | `10.31.0` (declared as `packageManager`)                                                                          |
| Fict runtime | `fict 0.26.x` brings `@fictjs/runtime 0.26.x`; runtime-backed packages peer-depend on `@fictjs/runtime >= 0.26.0` |

Enable pnpm via Corepack:

```bash
corepack enable
corepack prepare pnpm@10.31.0 --activate
```

## Installation

Install the umbrella package (all primitive namespaces) plus the Fict runtime:

```bash
pnpm add @fictjs/radix-ui fict
```

Or install only the primitives you need:

```bash
pnpm add @fictjs/accordion @fictjs/dialog @fictjs/tooltip fict
```

For a batteries-included, styled experience add Radix Themes:

```bash
pnpm add @fictjs/radix-ui-themes @fictjs/radix-ui fict
```

## Quick start

### Unstyled primitives

```tsx
/** @jsxImportSource fict */
import { Accordion } from '@fictjs/radix-ui'

export function FAQ() {
  return (
    <Accordion.Root type="single" collapsible defaultValue="what">
      <Accordion.Item value="what">
        <Accordion.Header>
          <Accordion.Trigger>What is Fict?</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content>A fine-grained reactive UI framework.</Accordion.Content>
      </Accordion.Item>

      <Accordion.Item value="why">
        <Accordion.Header>
          <Accordion.Trigger>Why these primitives?</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content>Accessible building blocks you can style yourself.</Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  )
}
```

Primitives ship no styles. Target the `data-state` attributes (`data-state="open" | "closed"`, `data-disabled`, `data-orientation`, …) to style each state, exactly as you would with Radix.

### Styled Radix Themes

```tsx
/** @jsxImportSource fict */
import '@fictjs/radix-ui-themes/styles.css'
import { Button, Card, Flex, Text, Theme } from '@fictjs/radix-ui-themes'

export function App() {
  return (
    <Theme accentColor="teal" grayColor="slate" radius="large">
      <Card>
        <Flex direction="column" gap="3">
          <Text size="3">Hello from Fict Radix Themes.</Text>
          <Button>Continue</Button>
        </Flex>
      </Card>
    </Theme>
  )
}
```

> JSX is enabled either with the `/** @jsxImportSource fict */` pragma or by configuring [`@fictjs/vite-plugin`](https://github.com/fictjs) in your Vite project (see [`apps/playground/vite.config.ts`](./apps/playground/vite.config.ts) for a working setup).

## The Fict reactivity model

Fict is signals-based, so the port differs from Radix/React in a few important, consistent ways. The full details live in [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md), but the essentials are:

- **Props can be values _or_ accessors.** Reactive props accept `MaybeAccessor<T> = T | (() => T)`. Pass a getter (e.g. `open={() => isOpen()}`) to keep a prop live.
- **Hooks return accessors, not values.** `useId()`, `useSize()`, `useControllableState()` etc. return getter functions (`() => T`) you call to read the current value.
- **Reactive prop forwarding** uses `mergeProps()` and `prop(() => …)` from `@fictjs/runtime` instead of object spreads, so downstream updates stay fine-grained.
- **Context is scoped and signal-based** via `createContextScope`, mirroring Radix's scoping mechanism for nested/composed components.
- **State is controllable** through `useControllableState`, which warns (in dev) if a component flips between controlled and uncontrolled.

```tsx
import { useControllableState } from '@fictjs/radix-ui/internal'

const [open, setOpen] = useControllableState<boolean>({
  prop: () => props.open, // controlled value (accessor)
  defaultProp: () => props.defaultOpen ?? false,
  onChange: props.onOpenChange,
  caller: 'MyComponent',
})

open() // read current value
setOpen(true) // update (no-op in controlled mode, emits onChange)
```

## Repository layout

```
ui-primitives/
├── apps/
│   └── playground/          # @fictjs/radix-ui-themes-playground — Vite demo + Playwright e2e
├── libs/
│   ├── radix-ui-themes/     # Styled Radix Themes port + CSS token system
│   ├── floating-ui-dom/     # @floating-ui/dom bindings for Fict positioning
│   ├── use-sidecar/         # Code-splitting sidecar utilities
│   ├── fict-remove-scroll/  # Scroll isolation
│   ├── fict-remove-scroll-bar/
│   └── fict-style-singleton/
├── packages/                # 60+ primitive, utility, and hook packages (see catalog)
├── scripts/                 # fict-metadata.mjs (+ e2e verifier) for export metadata
├── others/primitives/       # Upstream Radix Primitives checkout, kept for reference only
├── turbo.json               # Turborepo task graph
├── pnpm-workspace.yaml       # Workspaces + dependency catalog (catalogMode: strict)
└── tsconfig.base.json       # Shared strict TypeScript compiler options
```

`others/primitives/` is a read-only reference copy of the upstream Radix repository used while porting; it is **not** part of the pnpm workspace and is not published.

## Package catalog

All packages are published under the `@fictjs` scope, share `MIT` license, and build to ESM + CJS with types. Import them individually or via the [`@fictjs/radix-ui`](./packages/radix-ui) aggregate.

### Component primitives

| Package                                                                 | Description                      |
| ----------------------------------------------------------------------- | -------------------------------- |
| [`@fictjs/accessible-icon`](./packages/accessible-icon)                 | Accessible icon helper           |
| [`@fictjs/accordion`](./packages/accordion)                             | Accordion                        |
| [`@fictjs/alert-dialog`](./packages/alert-dialog)                       | Alert dialog                     |
| [`@fictjs/announce`](./packages/announce)                               | Live-region announcements        |
| [`@fictjs/arrow`](./packages/arrow)                                     | Arrow SVG for popovers/tooltips  |
| [`@fictjs/aspect-ratio`](./packages/aspect-ratio)                       | Aspect-ratio container           |
| [`@fictjs/avatar`](./packages/avatar)                                   | Avatar with image fallback       |
| [`@fictjs/checkbox`](./packages/checkbox)                               | Checkbox                         |
| [`@fictjs/collapsible`](./packages/collapsible)                         | Collapsible                      |
| [`@fictjs/context-menu`](./packages/context-menu)                       | Context menu                     |
| [`@fictjs/dialog`](./packages/dialog)                                   | Modal dialog                     |
| [`@fictjs/dropdown-menu`](./packages/dropdown-menu)                     | Dropdown menu                    |
| [`@fictjs/form`](./packages/form)                                       | Accessible form primitives       |
| [`@fictjs/hover-card`](./packages/hover-card)                           | Hover card                       |
| [`@fictjs/label`](./packages/label)                                     | Label                            |
| [`@fictjs/menu`](./packages/menu)                                       | Menu (shared menu behavior)      |
| [`@fictjs/menubar`](./packages/menubar)                                 | Menubar                          |
| [`@fictjs/navigation-menu`](./packages/navigation-menu)                 | Navigation menu                  |
| [`@fictjs/one-time-password-field`](./packages/one-time-password-field) | OTP field (unstable)             |
| [`@fictjs/password-toggle-field`](./packages/password-toggle-field)     | Password toggle field (unstable) |
| [`@fictjs/popover`](./packages/popover)                                 | Popover                          |
| [`@fictjs/popper`](./packages/popper)                                   | Popper positioning wrapper       |
| [`@fictjs/portal`](./packages/portal)                                   | Portal                           |
| [`@fictjs/progress`](./packages/progress)                               | Progress bar                     |
| [`@fictjs/radio-group`](./packages/radio-group)                         | Radio group                      |
| [`@fictjs/scroll-area`](./packages/scroll-area)                         | Custom scroll area               |
| [`@fictjs/select`](./packages/select)                                   | Select                           |
| [`@fictjs/separator`](./packages/separator)                             | Separator                        |
| [`@fictjs/slider`](./packages/slider)                                   | Slider                           |
| [`@fictjs/switch`](./packages/switch)                                   | Switch                           |
| [`@fictjs/tabs`](./packages/tabs)                                       | Tabs                             |
| [`@fictjs/toast`](./packages/toast)                                     | Toast                            |
| [`@fictjs/toggle`](./packages/toggle)                                   | Toggle                           |
| [`@fictjs/toggle-group`](./packages/toggle-group)                       | Toggle group                     |
| [`@fictjs/toolbar`](./packages/toolbar)                                 | Toolbar                          |
| [`@fictjs/tooltip`](./packages/tooltip)                                 | Tooltip                          |
| [`@fictjs/visually-hidden`](./packages/visually-hidden)                 | Visually hidden content          |

### Utilities & internal building blocks

| Package                                                     | Description                                                                  |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [`@fictjs/primitive`](./packages/primitive)                 | Low-level polymorphic DOM element components (`Primitive.div`, …, `asChild`) |
| [`@fictjs/core-primitive`](./packages/core-primitive)       | DOM/event helpers (`composeEventHandlers`, `getOwnerDocument`, …)            |
| [`@fictjs/slot`](./packages/slot)                           | Slot / `asChild` merging                                                     |
| [`@fictjs/compose-refs`](./packages/compose-refs)           | Ref composition                                                              |
| [`@fictjs/context`](./packages/context)                     | Scoped context (`createContextScope`)                                        |
| [`@fictjs/collection`](./packages/collection)               | Item collections for keyboard navigation                                     |
| [`@fictjs/direction`](./packages/direction)                 | LTR/RTL direction context                                                    |
| [`@fictjs/dismissable-layer`](./packages/dismissable-layer) | Outside/escape dismissal                                                     |
| [`@fictjs/focus-guards`](./packages/focus-guards)           | Focus guards                                                                 |
| [`@fictjs/focus-scope`](./packages/focus-scope)             | Focus trapping                                                               |
| [`@fictjs/presence`](./packages/presence)                   | Mount/unmount presence + exit animations                                     |
| [`@fictjs/roving-focus`](./packages/roving-focus)           | Roving tabindex                                                              |
| [`@fictjs/rect`](./packages/rect)                           | Rectangle observation utilities                                              |

### Hooks

| Package                                                               | Description                                       |
| --------------------------------------------------------------------- | ------------------------------------------------- |
| [`@fictjs/id`](./packages/id)                                         | Stable id accessor                                |
| [`@fictjs/use-callback-ref`](./packages/use-callback-ref)             | Stable callback ref                               |
| [`@fictjs/use-controllable-state`](./packages/use-controllable-state) | Controlled/uncontrolled state (+ reducer variant) |
| [`@fictjs/use-effect-event`](./packages/use-effect-event)             | Stable event callback                             |
| [`@fictjs/use-escape-keydown`](./packages/use-escape-keydown)         | Escape-key listener                               |
| [`@fictjs/use-is-hydrated`](./packages/use-is-hydrated)               | Hydration state accessor                          |
| [`@fictjs/use-layout-effect`](./packages/use-layout-effect)           | SSR-safe layout effect                            |
| [`@fictjs/use-previous`](./packages/use-previous)                     | Previous value accessor                           |
| [`@fictjs/use-rect`](./packages/use-rect)                             | Element rect observation                          |
| [`@fictjs/use-size`](./packages/use-size)                             | Element size observation                          |

### Aggregate & libraries

| Package                                                           | Description                                                                        |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [`@fictjs/radix-ui`](./packages/radix-ui)                         | Umbrella package: all primitive namespaces + `@fictjs/radix-ui/internal` utilities |
| [`@fictjs/radix-ui-themes`](./libs/radix-ui-themes)               | Styled Radix Themes port with CSS token entrypoints                                |
| [`@fictjs/floating-ui-dom`](./libs/floating-ui-dom)               | `@floating-ui/dom` positioning bindings for Fict                                   |
| [`@fictjs/use-sidecar`](./libs/use-sidecar)                       | Sidecar code-splitting utilities                                                   |
| [`@fictjs/fict-remove-scroll`](./libs/fict-remove-scroll)         | Scroll isolation                                                                   |
| [`@fictjs/fict-remove-scroll-bar`](./libs/fict-remove-scroll-bar) | Body scroll removal without layout shift                                           |
| [`@fictjs/fict-style-singleton`](./libs/fict-style-singleton)     | Deduplicated `<style>` injection                                                   |

## Development

```bash
# 1. Use the pinned Node version
nvm use            # reads .nvmrc (22.21.1)

# 2. Install dependencies (frozen in CI)
pnpm install

# 3. Run the interactive playground on http://localhost:3100
pnpm dev
```

### Common commands

All builds/tests/lints run through Turborepo, which respects the inter-package dependency graph and caches results.

| Command                             | What it does                                                                            |
| ----------------------------------- | --------------------------------------------------------------------------------------- |
| `pnpm build`                        | Build every package (`turbo run build`)                                                 |
| `pnpm dev`                          | Run the playground app (builds its deps, then Vite on port 3100)                        |
| `pnpm dev:workspace`                | Watch-build every package in parallel                                                   |
| `pnpm test`                         | Run all unit tests                                                                      |
| `pnpm test:coverage`                | Run unit tests with V8 coverage                                                         |
| `pnpm test:watch`                   | Watch-mode unit tests                                                                   |
| `pnpm typecheck`                    | Type-check every package                                                                |
| `pnpm lint` / `pnpm lint:fix`       | ESLint (flat config, type-checked)                                                      |
| `pnpm format` / `pnpm format:check` | Prettier                                                                                |
| `pnpm metadata:verify`              | Verify Fict export metadata (see below)                                                 |
| `pnpm verify`                       | Full gate: `format:check` → `lint` → `typecheck` → `test` → `build` → `metadata:verify` |
| `pnpm commit`                       | Commitizen prompt (`cz-git`) for Conventional Commits                                   |
| `pnpm changeset`                    | Record a changeset for the next release                                                 |

Scope any command to a single package with pnpm filters:

```bash
pnpm --filter @fictjs/accordion test
pnpm --filter @fictjs/radix-ui-themes build
```

### Tooling

- **Package manager:** pnpm workspaces with a **strict dependency catalog** in [`pnpm-workspace.yaml`](./pnpm-workspace.yaml) (`catalogMode: strict`). Third-party versions are declared once in the catalog and referenced as `catalog:`.
- **Task runner:** [Turborepo](./turbo.json).
- **Bundler:** [tsup](https://tsup.egoist.dev/) — ESM + CJS, `.d.ts`, source maps, `platform: neutral`, `target: es2022`, tree-shaking.
- **TypeScript:** strict mode, `NodeNext` modules, `verbatimModuleSyntax` — see [`tsconfig.base.json`](./tsconfig.base.json).
- **Lint/format:** ESLint flat config with `typescript-eslint` type-checked rules ([`eslint.config.mjs`](./eslint.config.mjs)); Prettier (no semicolons, single quotes, width 100, trailing commas).
- **Git hooks:** Husky runs `lint-staged` on pre-commit and `commitlint` on commit-msg.

## Testing

- **Unit tests** — [Vitest](https://vitest.dev/) with the jsdom environment, one config per package, aggregated by [`vitest.workspace.ts`](./vitest.workspace.ts). Run everything with `pnpm test`, or a package with `pnpm --filter <pkg> test`.
- **End-to-end tests** — [Playwright](https://playwright.dev/) specs in [`apps/playground/e2e`](./apps/playground/e2e) exercise the primitives through the styled playground:

```bash
pnpm --filter @fictjs/radix-ui-themes-playground test:e2e      # headless
pnpm --filter @fictjs/radix-ui-themes-playground test:e2e:ui   # Playwright UI
```

## Fict export metadata

Some Fict hooks return reactive containers whose shape the Fict compiler needs to understand (e.g. which return values are signals vs. memos). Those packages ship a `*.fict.meta.json` sidecar plus a `fict` field in their `package.json`.

This metadata is **generated and verified** by [`scripts/fict-metadata.mjs`](./scripts/fict-metadata.mjs):

- `build` scripts of the relevant packages run `node ../../scripts/fict-metadata.mjs emit .` after tsup.
- `pnpm metadata:verify` (invoked by `pnpm verify`) re-checks that every `package.json#fict` block and metadata file matches the canonical config, and — with `--pack` — that the files are actually included in the published tarball.
- `pnpm metadata:e2e` runs the standalone end-to-end verifier ([`scripts/verify-fict-metadata-e2e.mjs`](./scripts/verify-fict-metadata-e2e.mjs)).

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md#fict-export-metadata) for the full rationale.

## Releasing

Releases are managed with [Changesets](https://github.com/changesets/changesets) and published to npm by CI:

1. Add a changeset describing your change: `pnpm changeset`.
2. Merge to `main`. When ready, apply version bumps: `pnpm version-packages` (runs `changeset version`).
3. Pushing a git tag triggers [`.github/workflows/npm-publish.yml`](./.github/workflows/npm-publish.yml), which runs `pnpm verify` and then `pnpm release` (`changeset publish`).

Publishing uses npm **trusted publishing (OIDC)** with provenance when `NPM_TOKEN` is not set, and falls back to token auth when it is. The [`CI` workflow](./.github/workflows/nodejs.yml) runs `pnpm verify` on every push and pull request.

## Contributing

Contributions are welcome! Please read [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the development workflow, coding conventions, how to add a new package, and the PR checklist. All commits must follow [Conventional Commits](https://www.conventionalcommits.org/) (enforced by commitlint).

## Acknowledgements

This project is a port of [Radix Primitives](https://www.radix-ui.com/primitives) and [Radix Themes](https://www.radix-ui.com/themes) by [WorkOS](https://workos.com). Huge thanks to the Radix team for the design, accessibility research, and reference implementation. Positioning is powered by [Floating UI](https://floating-ui.com/).

## License

[MIT](./LICENSE) © Fict contributors. Radix Primitives are © WorkOS.
