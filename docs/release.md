# Release Checklist

Use this checklist for publishing `@fictjs/ui-primitives`.

## 1. Pre-release validation

Run all quality gates:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm examples:build
```

If visual or interaction behavior changed:

```bash
pnpm examples:screenshots
```

## 2. Documentation validation

Confirm docs are updated for behavior/API changes:

- `README.md`
- `docs/components/*`
- `docs/api-reference.md` (if exports changed)
- `docs/testing.md` / `docs/accessibility.md` where relevant
- `examples/README.md` if demo workflow changed

## 3. Versioning

Bump version in `package.json` using your preferred release process.

Example (patch):

```bash
pnpm version patch
```

## 4. Publish

Publish from a clean git state.

```bash
pnpm publish --access public --provenance --no-git-checks
```

Notes:

- Package already includes `publishConfig.access=public` and `provenance=true`.
- Remove `--no-git-checks` if your release environment enforces clean checks automatically.

## 5. Post-publish

- Verify package on npm registry
- Verify install in a clean consumer app
- Tag release in git and attach release notes
