# Testing Notes

This package uses Vitest + JSDOM and focuses on behavior-level tests instead of snapshot-only assertions.

## Current coverage focus

- Controlled vs uncontrolled state for core compound components
- Open/close semantics for overlay/menu/disclosure primitives
- Accessibility state attributes (`aria-*`, `role`, `data-state`)
- Keyboard and pointer dismissal boundaries
- Queue and timeout lifecycle for Toast

## Run locally

```bash
pnpm test
pnpm test:coverage
```

See also:

- `docs/accessibility.md` for manual a11y verification contracts
- `docs/examples.md` for copyable composition patterns

## When adding components

1. Add at least one uncontrolled test and one controlled test.
2. Add one accessibility-semantic assertion (`role`, `aria-*`, or keyboard behavior).
3. Add one cleanup/dispose or close-path assertion.
