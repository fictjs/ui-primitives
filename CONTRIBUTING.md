# Contributing to ui-primitives

Thanks for your interest in contributing! This document explains how to set up the repo, the conventions we follow, how to add a new package, and how changes get released.

By participating you agree to keep the community welcoming and respectful.

## Table of contents

- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Development workflow](#development-workflow)
- [Coding conventions](#coding-conventions)
- [Porting from Radix](#porting-from-radix)
- [Testing](#testing)
- [Adding a new package](#adding-a-new-package)
- [Commit conventions](#commit-conventions)
- [Changesets & releases](#changesets--releases)
- [Pull request checklist](#pull-request-checklist)

## Prerequisites

| Tool    | Version                                                |
| ------- | ------------------------------------------------------ |
| Node.js | `>= 22.13.0`; use `22.21.1` (see [`.nvmrc`](./.nvmrc)) |
| pnpm    | `10.31.0` (declared as `packageManager`)               |

We recommend Corepack so the correct pnpm version is used automatically:

```bash
corepack enable
corepack prepare pnpm@10.31.0 --activate
nvm use            # or `fnm use` — reads .nvmrc
```

## Getting started

```bash
pnpm install       # install workspace dependencies
pnpm build         # build all packages once (populates dist/)
pnpm dev           # run the playground at http://localhost:3100
```

Because Turborepo tasks depend on upstream builds (`^build`), running `pnpm build` once after install makes `lint`, `typecheck`, and `test` faster and more reliable.

## Project structure

- `packages/*` — primitives, utilities, and hooks published under `@fictjs/*`.
- `libs/*` — larger libraries: `radix-ui-themes` (styled layer + CSS), `floating-ui-dom`, scroll/style helpers, `use-sidecar`.
- `apps/playground` — the `@fictjs/radix-ui-themes-playground` Vite app used for manual QA and Playwright e2e tests.
- `scripts/` — `fict-metadata.mjs` and its e2e verifier.
- `others/primitives/` — a **read-only** copy of the upstream Radix repo for reference. Do not edit it and do not add it to the workspace.

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the layered package model and the Fict reactivity adaptation.

## Development workflow

Everything runs through Turborepo and can be scoped with pnpm filters.

```bash
# Whole workspace
pnpm build
pnpm test
pnpm lint
pnpm typecheck
pnpm format

# A single package
pnpm --filter @fictjs/accordion test
pnpm --filter @fictjs/accordion test:watch
pnpm --filter @fictjs/accordion dev        # tsup --watch
```

Before pushing, run the same gate CI runs:

```bash
pnpm verify
# = format:check && lint && typecheck && test && build && metadata:verify
```

### Dependency management

- Third-party versions are centralized in the **catalog** in [`pnpm-workspace.yaml`](./pnpm-workspace.yaml) (`catalogMode: strict`). Reference them as `"some-dep": "catalog:"` rather than hardcoding a version.
- Internal packages use the workspace protocol: `"@fictjs/context": "workspace:*"`.
- Runtime-backed packages declare `"@fictjs/runtime": ">=0.26.0"` as a **peer** dependency and use the `catalog:` version as a devDependency for local builds/tests. Pure DOM/type utilities and packages that intentionally peer-depend on `fict` instead should match their actual runtime imports.

## Coding conventions

We inherit the upstream Radix philosophy ([`others/primitives/philosophy.md`](./others/primitives/philosophy.md)): accessible, composable (one component → one DOM node), unstyled, and customizable via `data-*` state attributes.

Formatting and linting are enforced automatically, but please also follow these:

- **TypeScript only** for source (local scripts may be `.mjs`).
- **Prettier** — no semicolons, single quotes, `printWidth: 100`, trailing commas. Run `pnpm format`.
- **ESLint** — the flat config uses `typescript-eslint` type-checked rules and enforces inline type imports (`import { type Foo }`) and `^_` for intentionally unused vars.
- Prefer **braces** for control-flow statements and switch cases.
- Prefer **clear, descriptive names** over abbreviations.
- Use `data-state` / enumerated string states instead of ad-hoc booleans where a finite state machine applies.
- Do **not** add narrating comments; comment only non-obvious intent or constraints.

## Porting from Radix

When porting or fixing a primitive, keep behavior compatible with Radix while using Fict idioms:

- **Reactive props** use `MaybeAccessor<T> = T | (() => T)`; read them through the package's `readValue` helper so both static values and accessors work.
- **Hooks return accessors** (`() => T`), not plain values.
- **Forward props reactively** with `mergeProps()` and `prop(() => …)` from `@fictjs/runtime` instead of object spreads.
- **Scoped context** uses `createContextScope` from `@fictjs/context` so composed components (e.g. Accordion built on Collapsible) can share scopes.
- **Controllable state** goes through `@fictjs/use-controllable-state`.
- Preserve Radix's ARIA roles, keyboard handling, and `data-*` attribute names.
- Cross-check the equivalent implementation in `others/primitives/` when in doubt.

## Testing

- **Unit tests** live in each package's `test/` folder and run on Vitest + jsdom.

  ```bash
  pnpm test                              # all packages
  pnpm --filter @fictjs/dialog test      # one package
  pnpm test:coverage                     # with V8 coverage
  ```

- **End-to-end tests** live in [`apps/playground/e2e`](./apps/playground/e2e) and run on Playwright against the playground:

  ```bash
  pnpm --filter @fictjs/radix-ui-themes-playground test:e2e
  pnpm --filter @fictjs/radix-ui-themes-playground test:e2e:ui
  ```

Add or update tests for any behavior you change. Bug fixes should come with a regression test where practical.

## Adding a new package

Most packages follow the same shape. The fastest path is to copy an existing small package (e.g. `packages/separator`) and adapt it.

```
packages/<package-id>/
├── src/
│   ├── <package-id>.tsx   # implementation (or index.ts for non-component utils)
│   └── index.ts           # public exports
├── test/                  # Vitest specs
├── package.json
├── README.md
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

Checklist:

1. **`package.json`** — name `@fictjs/<id>`, `type: module`, dual `main`/`module`/`types` + `exports`, `files: ["dist", "README.md"]`, `engines.node >= 22.13.0`, `publishConfig` with `access: public` and `provenance: true`, the standard scripts block, the correct Fict runtime peer/devDependency for the package's actual imports, and internal deps as `workspace:*`.
2. **`tsup.config.ts`** — mirror the shared config (ESM + CJS, `dts`, `platform: neutral`, `target: es2022`, `treeshake`).
3. **`README.md`** — a short description that references the Radix package it ports.
4. Add it to the [`@fictjs/radix-ui`](./packages/radix-ui) aggregate (`src/index.ts` or `src/internal.ts`) and to its dependency list if it should be re-exported.
5. Update the package catalog table in the root [`README.md`](./README.md).
6. If the package exports Fict hooks with reactive return values, register it in [`scripts/fict-metadata.mjs`](./scripts/fict-metadata.mjs) and add the `fict` field + `build` metadata emit step.
7. Add a changeset: `pnpm changeset`.

## Commit conventions

We use [Conventional Commits](https://www.conventionalcommits.org/), enforced by commitlint via the Husky `commit-msg` hook. Use `!` for breaking changes.

```
feat(accordion): support horizontal orientation
fix(select): position content on open
docs: expand contributing guide
feat!: drop deprecated Tooltip.Arrow prop
```

The easiest way to write a compliant message is:

```bash
pnpm commit        # Commitizen (cz-git) interactive prompt
```

The pre-commit hook runs `lint-staged` (ESLint `--fix` + Prettier on staged files), so keep staged changes lint-clean.

## Changesets & releases

- Every user-facing change needs a changeset: `pnpm changeset`, then pick the bumped packages and semver level and write a summary.
- Maintainers apply versions with `pnpm version-packages` (`changeset version`).
- Pushing a git tag triggers the [Release workflow](./.github/workflows/npm-publish.yml), which runs `pnpm verify` and `pnpm release` (`changeset publish`) with npm trusted publishing / provenance.

## Pull request checklist

Before opening a PR, make sure:

- [ ] `pnpm format:check` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` passes
- [ ] `pnpm metadata:verify` passes (if you touched metadata packages)
- [ ] `pnpm metadata:e2e` passes (if you touched package metadata or consumer packaging)
- [ ] Playground Playwright tests pass (if you touched rendered UI or interactions)
- [ ] A changeset is included (`pnpm changeset`) for user-facing changes
- [ ] Commits follow Conventional Commits
- [ ] Tests were added/updated for the change

Running `pnpm verify` covers most of the above in one command.
