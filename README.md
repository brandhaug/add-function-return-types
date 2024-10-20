# add-function-return-types

A CLI tool to add explicit return types to TypeScript functions.

## Usage

Install the tool globally using npm:

```bash
npm install -g add-function-return-types 
add-function-return-types [options]
```

Or use it directly with npx:

```bash
npx add-function-return-types [options]
```

By default, the tool:

- Uses the current working directory as the root path.
- Processes all .ts and .tsx files in the current directory recursively.
- Processes 10 files in parallel.
- Ignores node_modules and .d.ts files.
- Saves the files with updated return types.

## Options

- `--shallow`: Only process current directory.
- `--ignore <patterns>`: Comma-separated list of file glob patterns to ignore.
- `--concurrency <number>`: Concurrency limit for processing files (default: 10)
- `--ignore-concise-arrow-function-expressions-starting-with-void`: Ignore arrow functions that start with the void keyword.
- `--ignore-direct-const-assertion-in-arrow-functions`: Ignore arrow functions that immediately return an as const value.
- `--ignore-expressions`: Ignore function expressions (functions that are not part of a declaration).
- `--ignore-functions-without-type-parameters`: Ignore functions that don't have generic type parameters.
- `--ignore-higher-order-functions`: Ignore functions that immediately return another function expression.
- `--ignore-typed-function-expressions`: Ignore function expressions that already have type annotations on the variable.
- `--ignore-names <names>`: Comma-separated list of function or method names to ignore during processing (e.g., `--ignore-names "getData,processItem"`).

## Example

```bash
add-function-return-types --ignore "src/generated/**,tests/**" --concurrency 20
```

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request on GitHub.

## License

This project is licensed under the MIT License.
