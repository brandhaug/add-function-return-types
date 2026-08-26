# add-function-return-types

A CLI tool and library that adds explicit return types to TypeScript functions using type inference.

[![npm version](https://img.shields.io/npm/v/add-function-return-types)](https://www.npmjs.com/package/add-function-return-types)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## About

TypeScript infers return types, but explicit ones improve readability, catch accidental changes, and satisfy rules like [`@typescript-eslint/explicit-function-return-type`](https://typescript-eslint.io/rules/explicit-function-return-type/). This tool adds them automatically by analyzing your code with [ts-morph](https://github.com/dsherret/ts-morph).

## Installation

```bash
npm install -g add-function-return-types
```

Or run directly with npx:

```bash
npx add-function-return-types
```

Requires Node.js >= 20.

## Usage

```bash
add-function-return-types [path] [options]
```

With no arguments the CLI runs an interactive prompt flow; passing a path or any flag runs non-interactively.

By default the tool:

- Processes all `.ts` and `.tsx` files under the given path, recursively
- Ignores `node_modules`, `.d.ts`, and generated codegen output (`*.gen.ts`, `*.generated.ts`, `__generated__/`, `generated/`)
- Never writes `any` return types — `any` (including `Promise<any>` and `any[]`) is always skipped, since an explicit `any` is worse than no annotation
- Skips function expressions whose type is fixed by context (e.g. callbacks passed to typed functions)
- Extracts complex inferred return types into named exported type aliases instead of inlining huge types
- Adds imports for named types referenced by inferred return types
- Formats modified files with the project's formatter (oxfmt, prettier, or biome), or wraps long types manually when none is detected
- Type-checks modified files afterwards and auto-reverts any that gained new type errors
- Processes files in parallel and caches results on disk (`.add-function-return-types-cache.json`) so re-runs skip unchanged files

After each run it prints a summary of annotations, skips, and files changed (`--json` for machine-readable output).

### Examples

```bash
add-function-return-types                       # interactive
add-function-return-types src/                  # process a specific directory
add-function-return-types src/ --dry-run        # preview without writing files
add-function-return-types --json                # machine-readable summary
add-function-return-types --include-generated   # also process codegen output
```

### Configuration

Key options; run `add-function-return-types --help` for the full list.

| Option                                           | Description                                                 |
| ------------------------------------------------ | ----------------------------------------------------------- |
| `--dry-run`                                      | Preview changes without modifying files                     |
| `--overwrite`                                    | Overwrite functions that already have a return type         |
| `--ignore-files <glob,..>`                       | Comma-separated file patterns to ignore                     |
| `--ignore-functions <names>`                     | Comma-separated function names to ignore                    |
| `--include-generated`                            | Also process generated codegen output                       |
| `--no-cache` / `--clear-cache`                   | Disable / clear the on-disk incremental cache               |
| `--max-type-length=<n>` / `--max-type-depth=<n>` | Thresholds that trigger extracting a named type alias       |
| `--no-format`                                    | Skip formatting modified files with the project's formatter |
| `--no-verify`                                    | Skip post-run type-checking and auto-revert                 |
| `--json`                                         | Emit a machine-readable JSON summary                        |
| `--tsconfig <path>`                              | Use a specific tsconfig.json for type resolution            |

### Programmatic API

```typescript
import {
	addFunctionReturnTypes,
	defaultOptions
} from 'add-function-return-types'

await addFunctionReturnTypes({
	...defaultOptions,
	path: './src',
	dryRun: true
})
```

`defaultOptions` (and the `Options` type) are exported; the object accepts the same options as the CLI flags.

## Contributing

Contributions are welcome — feel free to [open an issue](https://github.com/brandhaug/add-function-return-types/issues) or submit a pull request.

```bash
git clone https://github.com/brandhaug/add-function-return-types.git
cd add-function-return-types
npm install
npm run build
npm test
```

## License

This project is licensed under the [MIT License](LICENSE).
