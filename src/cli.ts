import { Command } from 'commander'
import { addFunctionReturnTypes } from './add-function-return-types'
import { defaultOptions } from './options'

export async function main(): Promise<void> {
  const program = new Command()

  program
    .name('add-function-return-types')
    .description('CLI tool to add explicit return types to TypeScript functions')
    .argument('[path]', 'Path to the directory or file to process (optional)')
    .option('--shallow', 'Process only the top-level directory')
    .option('--ignore-files <patterns>', 'Comma-separated list of file patterns to ignore')
    .option('--ignore-functions <names>', 'Comma-separated list of function/method names to ignore')
    .option('--overwrite', 'Overwrite existing return types')
    .option('--ignore-any', 'Ignore functions that return the any type')
    .option('--ignore-unknown', 'Ignore functions that return the unknown type')
    .option('--ignore-anonymous-objects', 'Ignore functions that return anonymous object types')
    .option('--ignore-expressions', 'Ignore function expressions (functions not part of a declaration).')
    .option('--ignore-functions-without-type-parameters', "Ignore functions that don't have generic type parameters.")
    .option('--ignore-higher-order-functions', 'Ignore functions immediately returning another function expression.')
    .option('--ignore-typed-function-expressions', 'Ignore function expressions with type annotations on the variable.')
    .option('--ignore-iifes', 'Ignore immediately invoked function expressions (IIFEs)')
    .option(
      '--ignore-concise-arrow-function-expressions-starting-with-void',
      'Ignore arrow functions that start with the `void` keyword.'
    )
    .option('--ignore-anonymous-functions', 'Ignore anonymous functions (functions without names)')

  program.parse(process.argv)

  const options = program.opts()
  const path = program.args[0] || defaultOptions.path

  await addFunctionReturnTypes({
    path,
    shallow: options.shallow ?? defaultOptions.shallow,
    ignoreFiles: options.ignoreFiles ? options.ignoreFiles.split(',') : defaultOptions.ignoreFiles,
    overwrite: options.overwrite ?? defaultOptions.overwrite,
    ignoreConciseArrowFunctionExpressionsStartingWithVoid:
      options.ignoreConciseArrowFunctionExpressionsStartingWithVoid ??
      defaultOptions.ignoreConciseArrowFunctionExpressionsStartingWithVoid,
    ignoreExpressions: options.ignoreExpressions ?? defaultOptions.ignoreExpressions,
    ignoreFunctionsWithoutTypeParameters:
      options.ignoreFunctionsWithoutTypeParameters ?? defaultOptions.ignoreFunctionsWithoutTypeParameters,
    ignoreHigherOrderFunctions: options.ignoreHigherOrderFunctions ?? defaultOptions.ignoreHigherOrderFunctions,
    ignoreTypedFunctionExpressions:
      options.ignoreTypedFunctionExpressions ?? defaultOptions.ignoreTypedFunctionExpressions,
    ignoreIIFEs: options.ignoreIifes ?? defaultOptions.ignoreIIFEs,
    ignoreFunctions: options.ignoreFunctions ? options.ignoreFunctions.split(',') : defaultOptions.ignoreFunctions,
    ignoreAnonymousObjects: options.ignoreAnonymousObjects ?? defaultOptions.ignoreAnonymousObjects,
    ignoreAny: options.ignoreAny ?? defaultOptions.ignoreAny,
    ignoreUnknown: options.ignoreUnknown ?? defaultOptions.ignoreUnknown,
    ignoreAnonymousFunctions: options.ignoreAnonymousFunctions ?? defaultOptions.ignoreAnonymousFunctions
  })
}
