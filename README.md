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
- `--ignore <patterns>`: Comma-separated list of glob patterns to ignore.
- `--concurrency <number>`: Concurrency limit for processing files (default: 10).

## Example

```bash
add-function-return-types --ignore "src/generated/**,tests/**" --concurrency 20
```

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request on GitHub.

## License

This project is licensed under the MIT License.
