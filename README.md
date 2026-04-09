# add-function-return-types

A CLI tool and library that adds explicit return types to TypeScript functions using type inference.

[![npm version](https://img.shields.io/npm/v/add-function-return-types)](https://www.npmjs.com/package/add-function-return-types)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## About

TypeScript can infer return types, but explicit return types improve readability, catch accidental changes, and are required by linting rules like [`@typescript-eslint/explicit-function-return-type`](https://typescript-eslint.io/rules/explicit-function-return-type/). This tool adds them automatically by analyzing your code with [ts-morph](https://github.com/dsherret/ts-morph).

## Installation

```bash
npm install -g add-function-return-types
```

Or run directly with npx:

```bash
npx add-function-return-types
```

### Requirements

- Node.js >= 20

## Usage

```bash
add-function-return-types [path] [options]
```

By default, the tool:

- Uses the current working directory as the root path
- Processes all `.ts` and `.tsx` files recursively
- Ignores `node_modules` and `.d.ts` files
- Saves files in place with the added return types

### Examples

Process the current directory:

```bash
add-function-return-types
```

Process a specific directory:

```bash
add-function-return-types src/
```

Ignore generated files and specific functions:

```bash
add-function-return-types --ignore-files "src/generated/**,tests/**" --ignore-functions "map,filter"
```

Preview changes without modifying files:

```bash
add-function-return-types --dry-run
```

Use a specific tsconfig for type resolution:

```bash
add-function-return-types --tsconfig tsconfig.app.json
```

### Programmatic API

The core function can also be imported directly:

```typescript
import { addFunctionReturnTypes } from 'add-function-return-types'

await addFunctionReturnTypes({
	path: './src',
	shallow: false,
	overwrite: false,
	ignoreFiles: ['src/generated/**'],
	ignoreFunctions: [],
	ignoreAny: false,
	ignoreUnknown: false,
	ignoreAnonymousObjects: false,
	ignoreAnonymousFunctions: false,
	ignoreExpressions: false,
	ignoreFunctionsWithoutTypeParameters: false,
	ignoreHigherOrderFunctions: false,
	ignoreTypedFunctionExpressions: false,
	ignoreIIFEs: false,
	ignoreConciseArrowFunctionExpressionsStartingWithVoid: false,
	dryRun: false,
	tsconfig: undefined
})
```

## Options

| Option                                                           | Description                                                     |
| ---------------------------------------------------------------- | --------------------------------------------------------------- |
| `--shallow`                                                      | Only process the top-level directory (no recursion)             |
| `--overwrite`                                                    | Overwrite functions that already have return types              |
| `--ignore-files <patterns>`                                      | Comma-separated file glob patterns to ignore                    |
| `--ignore-functions <names>`                                     | Comma-separated function/method names to ignore                 |
| `--ignore-any`                                                   | Skip functions that return `any`                                |
| `--ignore-unknown`                                               | Skip functions that return `unknown`                            |
| `--ignore-anonymous-objects`                                     | Skip functions that return anonymous object types               |
| `--ignore-anonymous-functions`                                   | Skip anonymous functions (functions without names)              |
| `--ignore-expressions`                                           | Skip function expressions (not part of a declaration)           |
| `--ignore-functions-without-type-parameters`                     | Skip functions without generic type parameters                  |
| `--ignore-higher-order-functions`                                | Skip functions that immediately return another function         |
| `--ignore-typed-function-expressions`                            | Skip function expressions with type annotations on the variable |
| `--ignore-iifes`                                                 | Skip immediately-invoked function expressions                   |
| `--ignore-concise-arrow-function-expressions-starting-with-void` | Skip arrow functions starting with `void`                       |
| `--dry-run`                                                      | Preview changes without modifying files                         |
| `--tsconfig <path>`                                              | Path to a tsconfig.json file for type resolution                |

## Contributing

Contributions are welcome! Feel free to [open an issue](https://github.com/brandhaug/add-function-return-types/issues) or submit a pull request.

### Development setup

```bash
git clone https://github.com/brandhaug/add-function-return-types.git
cd add-function-return-types
npm install
npm run build
```

### Running tests

```bash
npm test
```

## License

This project is licensed under the [MIT License](LICENSE).
