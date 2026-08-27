# AGENTS.md

## Purpose & Scope

CLI + library that adds explicit return types to TypeScript functions via `ts-morph` type inference. Published to npm as `add-function-return-types`. TypeScript ESM (target ES2022), Node.js >= 20, bun >= 1.4 for dev/test.

Core v5 invariants:

- `any` return types are NEVER emitted — skipped as `anyForbidden` in `process-file.ts`; there is no flag to re-enable.
- Contextually-typed function expressions (type fixed by context) are skipped by default (`ignoreContextuallyTypedFunctionExpressions: true`).
- Verify (auto-revert of files that gain new type errors) and format are ON by default.

## Entry Points & Contracts

- Library: `src/index.ts` exports `addFunctionReturnTypes`, `Options`, `defaultOptions`, and stats helpers (`RunStats`, `createRunStats`, `formatStatsTable`, `classifyReturnType`, `recordAnnotation`, `recordSkip`, `AnnotationKind`, `SkipReason`).
- CLI: `src/bin.ts` → `main()` in `src/cli.ts`. No args → interactive `@clack/prompts` flow; any path/flag → non-interactive `parseArgv`. Compiled to `dist/bin.js`; library to `dist/index.js`.
- `Options`, `defaultOptions`, and `defaultGeneratedIgnorePatterns` live in `src/options.ts`.
- Module map: `add-function-return-types.ts` (orchestration: file discovery via fast-glob, incremental cache, bounded worker pool, verify, stats), `process-file.ts` (per-file AST work: annotation, alias extraction), `add-type-imports.ts` (import planning for named types), `formatter.ts` (formatter detection + fallback wrapping), `verify.ts` (post-run type-check + auto-revert), `worker.ts`, `cache.ts`, `stats.ts`, `utils.ts`.
- Contracts: modified files that gain new type errors are reverted to their original content. The cache is keyed by content hash + options hash + version — bump `CACHE_VERSION` in `cache.ts` whenever processing logic changes emitted output.

## Usage Patterns

```sh
npm install          # install (prepare script sets core.hooksPath to .githooks)
npm run build        # tsc → dist/ (.js + .d.ts, ESM)
npm run validate     # lint + typecheck + tests
npm test             # bun test --isolate --timeout 120000
npm run lint         # oxlint --type-aware
npm run format       # oxfmt --write
```

Tests: `bun:test`, `test/*.test.ts`. Files: `add-function-return-types` (core), `cache`, `cli` (arg parsing), `index` (prompt flow, uses `test/mocks/setup-clack.ts`), `stats`, `utils`, `verify`.

## Anti-patterns

- Do not add formatting to CI — enforcement is the pre-commit hook only: `.githooks/pre-commit` runs `bunx lint-staged`, which formats (oxfmt) and lints (oxlint `--type-aware --fix`) only staged files.
- Do not reintroduce an `--ignore-any` option — `any` is always skipped by contract.
- Do not leave disable directives that suppress nothing — `reportUnusedDisableDirectives: deny`.
- Do not forget to bump `CACHE_VERSION` when processing logic changes emitted output.
- Do not commit with a non-Conventional-Commit title — the PR gate rejects it.

## Dependencies & Edges

- Runtime: `ts-morph`, `@clack/prompts`, `fast-glob`.
- Dev: `oxlint` + `oxlint-tsgolint` (type-aware), `ultracite` (anti-slop jsPlugin), `oxfmt`, `lint-staged`, `typescript`, `@types/node`.
- Lint config `.oxlintrc.json`: plugins typescript/unicorn/oxc/import/promise + anti-slop; correctness/suspicious/perf = error. Format config `.oxfmtrc.json`: tabs, single quotes, no semicolons, 80 cols.
- CI: `ci.yml` (lint + typecheck + test + build), `pr-gate.yml` (conventional-commits), `release.yml` (release-please → npm publish on master).
- `CLAUDE.md` is a symlink to this file.

## Patterns & Pitfalls

- `npm run lint` runs oxlint type-aware; `npm run typecheck` runs `tsc --noEmit`.
- No dev server or watch mode — this is a CLI tool.
- `_arg`-prefixed names mark intentionally-unused parameters (`no-unused-vars` `argsIgnorePattern: ^_`).
- No environment variables or database setup.
