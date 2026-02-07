# Examples

This folder contains an executable demo app for `@fictjs/ui-primitives`.

## Run locally

```bash
pnpm examples:dev
```

Open `http://127.0.0.1:4173`.

## Build static demo

```bash
pnpm examples:build
pnpm examples:preview
```

## Screenshot baseline

Install browser binary once:

```bash
pnpm examples:screenshots:install
```

Generate baseline screenshots:

```bash
pnpm examples:screenshots
```

Outputs are written to `examples/screenshots/baseline`.
