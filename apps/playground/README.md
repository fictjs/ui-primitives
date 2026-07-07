# @fictjs/radix-ui-themes-playground

Private demo and end-to-end test app for the [`ui-primitives`](https://github.com/fictjs/ui-primitives) monorepo. It exercises the [`@fictjs/radix-ui`](https://github.com/fictjs/ui-primitives/tree/main/packages/radix-ui) primitives and the [`@fictjs/radix-ui-themes`](https://github.com/fictjs/ui-primitives/tree/main/libs/radix-ui-themes) styled components in a real Fict + Vite application, and is the target the Playwright suite runs against.

> This app is `private` and is not published to npm.

## Getting started

From the repository root:

```bash
pnpm install
pnpm --filter @fictjs/radix-ui-themes-playground dev
```

The `dev` script first builds the workspace dependencies (`build:deps`) and then starts Vite on port `3100`.

## Scripts

- **`dev`** — build dependencies, then start the dev server (`http://localhost:3100`).
- **`dev:e2e`** — dev server bound to `127.0.0.1:3110` (strict port) for Playwright.
- **`build`** / **`preview`** — production build and preview (port `4100`).
- **`test`** — run unit tests with Vitest.
- **`test:e2e`** / **`test:e2e:ui`** — run the Playwright end-to-end suite.
- **`lint`** / **`typecheck`** — ESLint and TypeScript checks.

## Documentation

See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme), the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md), and the [contributing guide](https://github.com/fictjs/ui-primitives/blob/main/CONTRIBUTING.md).

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
