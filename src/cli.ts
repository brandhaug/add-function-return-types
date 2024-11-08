import { Command } from 'commander'
import { addFunctionReturnTypes } from './addFunctionReturnTypes'

export async function main(): Promise<void> {
	const program = new Command()

	program
		.name('add-function-return-types')
		.description(
			'CLI tool to add explicit return types to TypeScript functions'
		)
		.argument('[path]', 'Path to the directory or file to process (optional)')
		.option('--shallow', 'Process only the top-level directory')
		.option(
			'--ignore-files <patterns>',
			'Comma-separated list of file patterns to ignore'
		)
		.option(
			'--ignore-functions <names>',
			'Comma-separated list of function/method names to ignore'
		)
		.option('--overwrite', 'Overwrite existing return types')
		.option('--ignore-any', 'Ignore functions that return the any type')
		.option('--ignore-unknown', 'Ignore functions that return the unknown type')
		.option(
			'--ignore-anonymous-objects',
			'Ignore functions that return anonymous object types'
		)
		.option(
			'--ignore-expressions',
			'Ignore function expressions (functions not part of a declaration).'
		)
		.option(
			'--ignore-functions-without-type-parameters',
			"Ignore functions that don't have generic type parameters."
		)
		.option(
			'--ignore-higher-order-functions',
			'Ignore functions immediately returning another function expression.'
		)
		.option(
			'--ignore-typed-function-expressions',
			'Ignore function expressions with type annotations on the variable.'
		)
		.option(
			'--ignore-iifes',
			'Ignore immediately invoked function expressions (IIFEs)'
		)
		.option(
			'--ignore-concise-arrow-function-expressions-starting-with-void',
			'Ignore arrow functions that start with the `void` keyword.'
		)
		.option(
			'--ignore-anonymous-functions',
			'Ignore anonymous functions (functions without names)'
		)

	program.parse(process.argv)

	const path = program.args[0] || '.'

	const options = program.opts()
	const shallow = options.shallow || false
	const ignoreFiles = options.ignoreFiles ? options.ignoreFiles.split(',') : []
	const overwrite = options.overwrite || false
	const ignoreConciseArrowFunctionExpressionsStartingWithVoid =
		options.ignoreConciseArrowFunctionExpressionsStartingWithVoid || false
	const ignoreExpressions = options.ignoreExpressions || false
	const ignoreFunctionsWithoutTypeParameters =
		options.ignoreFunctionsWithoutTypeParameters || false
	const ignoreHigherOrderFunctions = options.ignoreHigherOrderFunctions || false
	const ignoreTypedFunctionExpressions =
		options.ignoreTypedFunctionExpressions || false
	const ignoreIIFEs = options.ignoreIifes || false
	const ignoreFunctions = options.ignoreFunctions
		? options.ignoreFunctions.split(',')
		: []
	const ignoreAnonymousObjects = options.ignoreAnonymousObjects || false
	const ignoreAny = options.ignoreAny || false
	const ignoreUnknown = options.ignoreUnknown || false
	const ignoreAnonymousFunctions = options.ignoreAnonymousFunctions || false

	await addFunctionReturnTypes({
		path,
		shallow,
		ignoreFiles,
		overwrite: overwrite,
		ignoreConciseArrowFunctionExpressionsStartingWithVoid,
		ignoreExpressions,
		ignoreFunctionsWithoutTypeParameters,
		ignoreHigherOrderFunctions,
		ignoreTypedFunctionExpressions,
		ignoreIIFEs,
		ignoreFunctions,
		ignoreAnonymousObjects,
		ignoreAny,
		ignoreUnknown,
		ignoreAnonymousFunctions
	})
}
