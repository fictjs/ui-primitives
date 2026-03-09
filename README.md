# ui-primitives

Modern Node.js + TypeScript monorepo scaffolded around `pnpm`, `turbo`, `vitest`, `eslint`, `tsup`, `prettier`, `commitizen`, and `changesets`.

## Tooling Decisions

- `pnpm` workspaces for deterministic installs and shared lockfile
- `catalog:` versions to keep toolchain upgrades centralized
- `turbo` task graph for build, test, lint, and typecheck orchestration
- `eslint` v10 flat config with `typescript-eslint`
- `vitest` v4 for fast package-level testing
- `tsup` for dual ESM/CJS package builds with type declarations
- `commitizen` + `cz-git` + `commitlint` + `husky` + `lint-staged` for commit hygiene
- `changesets` for monorepo versioning and npm publishing

## Workspace Layout

```text
.
├── libs
├── packages
│   └── ui-primitives
├── .changeset
├── .github/workflows
├── eslint.config.mjs
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.library.json
├── tsconfig.node.json
├── turbo.json
└── vitest.workspace.ts
```

## Getting Started

```bash
corepack enable
corepack pnpm install
corepack pnpm verify
```

## Common Commands

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm verify
pnpm format
pnpm commit
pnpm changeset
pnpm version-packages
pnpm release
```

## Release Flow

1. Add a changeset with `pnpm changeset`.
2. Merge to `main`.
3. GitHub Actions opens or updates the release PR.
4. Merging the release PR publishes changed public packages to npm.
