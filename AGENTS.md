# AGENTS.md

## Project Overview

A CLI tool and library that adds explicit return types to TypeScript functions using type inference. Built with `ts-morph` for AST manipulation. Published to npm as `add-function-return-types`.

- **Language:** TypeScript (ES Modules, target ES2022)
- **Runtime:** Node.js >= 20
- **Key dependencies:** `ts-morph`, `commander`, `fast-glob`

## Setup

```sh
npm install
```

No environment variables or database setup required.

## Development

```sh
npm run build        # Compile TypeScript (tsc → dist/)
npm start            # Run compiled output
npm run validate     # Run lint + typecheck + tests (full CI check)
```

There is no dev server or watch mode — this is a CLI tool.

## Testing

- **Framework:** Vitest
- **Config:** `vitest.config.ts`
- **Test location:** `test/` directory
- **Naming convention:** `*.test.ts`

```sh
npm test                              # Run all tests (watch mode)
npx vitest run                        # Run all tests once
npx vitest run -t "test name"         # Run a specific test
npx vitest run test/utils.test.ts     # Run a specific file
```

Test files:
- `test/add-function-return-types.test.ts` — Core functionality (extensive edge cases)
- `test/cli.test.ts` — CLI argument parsing
- `test/utils.test.ts` — Utility functions
- `test/index.test.ts` — Module exports

## Linting & Formatting

Uses **oxlint** (linter) and **oxfmt** (formatter), both Rust-based.

```sh
npm run lint           # Lint with type-aware rules (oxlint)
npm run format         # Format all files (oxfmt --write)
npm run format:check   # Check formatting without writing
```

- **Lint config:** `.oxlintrc.json` — plugins: typescript, unicorn, oxc
- **Format config:** `.oxfmtrc.json` — tabs, single quotes, no semicolons, 80 char width

## Build & Output

```sh
npm run build    # tsc compiles src/ → dist/
```

- Output: `dist/` directory (`.js` + `.d.ts` files)
- Module format: ES Modules (`"type": "module"`)
- Entry point: `dist/index.js` (library), `dist/bin.js` (CLI)

## Project Structure

```
src/
  index.ts                        # Public API exports
  bin.ts                          # CLI entry point
  cli.ts                          # Argument parsing (commander)
  options.ts                      # Option types and defaults
  add-function-return-types.ts    # Core logic (AST manipulation)
  utils.ts                        # Utility functions
test/
  *.test.ts                       # Vitest test files
dist/                             # Compiled output (gitignored)
```
