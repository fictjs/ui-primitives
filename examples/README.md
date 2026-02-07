# Examples

This folder contains an executable demo app for `@fictjs/ui-primitives`.

## Purpose

- Validate real integration behavior across multiple primitives
- Provide a runnable playground for manual QA
- Produce deterministic screenshot baselines for visual regression checks

## Local Development

```bash
pnpm examples:dev
```

Open `http://127.0.0.1:4173`.

## Build and Preview

```bash
pnpm examples:build
pnpm examples:preview
```

## Screenshot Baseline Workflow

Install browser binary once:

```bash
pnpm examples:screenshots:install
```

Generate baseline screenshots:

```bash
pnpm examples:screenshots
```

Output directory:

- `examples/screenshots/baseline`

Current baseline set:

- `01-home.png`
- `02-dialog-open.png`
- `03-menu-open.png`
- `04-tabs-qa.png`
- `05-toast-open.png`

## When to Update Baselines

Update baselines when:

- visual output intentionally changes
- layout or interaction timing changes expected screenshot states
- demo component composition changes

Do not update baselines for unrelated refactors.

## Troubleshooting

- If screenshot command fails due to missing browser, run `pnpm examples:screenshots:install`.
- If port `4173` is in use, stop the existing process before running example commands.
