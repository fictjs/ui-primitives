# Contributing

Thanks for contributing to `@fictjs/ui-primitives`.

## Prerequisites

- Node `>=18`
- `pnpm` (repo uses `pnpm@9`)

## Setup

```bash
pnpm install --ignore-workspace
```

## Branch and Commit Style

- Keep each PR focused on one concern (feature, fix, docs, or refactor)
- Prefer small commits with clear scope
- Use commit messages with a short type/scope prefix when possible

Examples:

- `feat(overlay): add ...`
- `fix(form): correct ...`
- `docs: update ...`
- `test(menu): add ...`

## Quality Gates

Run these before opening a PR:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

If your change touches the demo app or visual behavior, also run:

```bash
pnpm examples:build
pnpm examples:screenshots
```

## Testing Expectations

When adding or changing behavior:

1. Add or update tests in `test/`.
2. Cover controlled and uncontrolled flows where relevant.
3. Assert accessibility semantics (`role`, `aria-*`, keyboard behavior).
4. Assert cleanup/close paths (dismiss, unmount, timers, etc.).

See `docs/testing.md` for details.

## Documentation Expectations

Update docs alongside behavior changes:

- Component-level docs in `docs/components/*`
- API index updates in `docs/api-reference.md` when exports change
- Accessibility notes/checklists where semantics change
- Example snippets if usage pattern changes

## Project Structure

- `src/components/*`: primitives grouped by domain
- `src/internal/*`: shared internals (state, refs, ids, accessors)
- `test/*`: behavior tests
- `docs/*`: documentation
- `examples/*`: executable demo and screenshot baseline assets

## Pull Request Checklist

- [ ] Tests updated and passing
- [ ] Docs updated for behavior/API changes
- [ ] No unrelated file changes
- [ ] Changelog/release notes impact considered

## Release

Release guidance lives in `docs/release.md`.
