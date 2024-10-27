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
			'--ignore <patterns>',
			'Comma-separated list of file patterns to ignore'
		)
		.option(
			'--concurrency <number>',
			'Concurrency limit for processing files',
			(value): number => Number.parseInt(value, 10),
			10
		)
		.option(
			'--ignore-concise-arrow-function-expressions-starting-with-void',
			'Ignore arrow functions that start with the `void` keyword.'
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
			'--ignore-names <names>',
			'Comma-separated list of function/method names to ignore'
		)
		.option(
			'--overwrite-existing-return-types',
			'Overwrite existing return types'
		)
		.option(
			'--ignore-anonymous-object-types',
			'Ignore functions that return anonymous object types'
		)
		.option('--ignore-any-type', 'Ignore functions that return the any type')
		.option(
			'--ignore-unknown-type',
			'Ignore functions that return the unknown type'
		)

	program.parse(process.argv)

	const path = program.args[0] || '.'

	const options = program.opts()
	const shallow = options.shallow || false
	const ignorePatterns = options.ignore ? options.ignore.split(',') : []
	const concurrencyLimit = options.concurrency
	const overwriteExistingReturnTypes =
		options.overwriteExistingReturnTypes || false
	const ignoreConciseArrowFunctionExpressionsStartingWithVoid =
		options.ignoreConciseArrowFunctionExpressionsStartingWithVoid || false
	const ignoreExpressions = options.ignoreExpressions || false
	const ignoreFunctionsWithoutTypeParameters =
		options.ignoreFunctionsWithoutTypeParameters || false
	const ignoreHigherOrderFunctions = options.ignoreHigherOrderFunctions || false
	const ignoreTypedFunctionExpressions =
		options.ignoreTypedFunctionExpressions || false
	const ignoreIIFEs = options.ignoreIifes || false
	const ignoreNames = options.ignoreNames ? options.ignoreNames.split(',') : []
	const ignoreAnonymousObjectTypes = options.ignoreAnonymousObjectTypes || false
	const ignoreAnyType = options.ignoreAnyType || false
	const ignoreUnknownType = options.ignoreUnknownType || false

	await addFunctionReturnTypes({
		path,
		shallow,
		ignorePatterns,
		concurrencyLimit,
		overwriteExistingReturnTypes,
		ignoreConciseArrowFunctionExpressionsStartingWithVoid,
		ignoreExpressions,
		ignoreFunctionsWithoutTypeParameters,
		ignoreHigherOrderFunctions,
		ignoreTypedFunctionExpressions,
		ignoreIIFEs,
		ignoreNames,
		ignoreAnonymousObjectTypes,
		ignoreAnyType,
		ignoreUnknownType
	})
}
