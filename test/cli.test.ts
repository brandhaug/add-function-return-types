import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
	type Options,
	addFunctionReturnTypes
} from '../src/addFunctionReturnTypes'
import { main } from '../src/cli'

vi.mock('../src/addFunctionReturnTypes', () => ({
	addFunctionReturnTypes: vi.fn()
}))

describe.concurrent('cli', (): void => {
	// Preserve the original process.argv to restore after tests
	const originalArgv = process.argv

	beforeEach((): void => {
		// Reset modules and mocks before each test
		vi.resetModules()
		vi.clearAllMocks()
		// Set a default argv (node and script name)
		process.argv = ['node', 'cli.js']
	})

	afterEach((): void => {
		// Restore the original process.argv after each test
		process.argv = originalArgv
		vi.resetAllMocks()
	})

	it('should pass default options when no arguments are provided', async (): Promise<void> => {
		// Call the main function
		await main()

		const options: Options = {
			path: '.',
			shallow: false,
			ignorePatterns: [],
			concurrencyLimit: 10,
			overwriteExistingReturnTypes: false,
			ignoreConciseArrowFunctionExpressionsStartingWithVoid: false,
			ignoreExpressions: false,
			ignoreFunctionsWithoutTypeParameters: false,
			ignoreHigherOrderFunctions: false,
			ignoreTypedFunctionExpressions: false,
			ignoreIIFEs: false,
			ignoreNames: []
		}

		// Assert that addFunctionReturnTypes was called with default options
		expect(addFunctionReturnTypes).toHaveBeenCalledWith(options)
	})

	it('should correctly parse and pass all provided arguments', async (): Promise<void> => {
		// Define the simulated command-line arguments
		process.argv = [
			'node',
			'cli.js',
			'src',
			'--shallow',
			'--ignore=**/*.test.ts,**/node_modules/**',
			'--concurrency=5',
			'--overwrite-existing-return-types',
			'--ignore-concise-arrow-function-expressions-starting-with-void',
			'--ignore-expressions',
			'--ignore-functions-without-type-parameters',
			'--ignore-higher-order-functions',
			'--ignore-typed-function-expressions',
			'--ignore-iifes',
			'--ignore-names=foo,bar'
		]

		// Call the main function
		await main()

		const options: Options = {
			path: 'src',
			shallow: true,
			ignorePatterns: ['**/*.test.ts', '**/node_modules/**'],
			concurrencyLimit: 5,
			overwriteExistingReturnTypes: true,
			ignoreConciseArrowFunctionExpressionsStartingWithVoid: true,
			ignoreExpressions: true,
			ignoreFunctionsWithoutTypeParameters: true,
			ignoreHigherOrderFunctions: true,
			ignoreTypedFunctionExpressions: true,
			ignoreIIFEs: true,
			ignoreNames: ['foo', 'bar']
		}

		// Assert that addFunctionReturnTypes was called with the expected options
		expect(addFunctionReturnTypes).toHaveBeenCalledWith(options)
	})

	it('should handle partial arguments correctly', async (): Promise<void> => {
		// Define a subset of command-line arguments
		process.argv = [
			'node',
			'cli.js',
			'--ignore=**/*.spec.ts',
			'--concurrency=20'
		]

		// Call the main function
		await main()

		const options: Options = {
			path: '.',
			shallow: false,
			ignorePatterns: ['**/*.spec.ts'],
			concurrencyLimit: 20,
			overwriteExistingReturnTypes: false,
			ignoreConciseArrowFunctionExpressionsStartingWithVoid: false,
			ignoreExpressions: false,
			ignoreFunctionsWithoutTypeParameters: false,
			ignoreHigherOrderFunctions: false,
			ignoreTypedFunctionExpressions: false,
			ignoreIIFEs: false,
			ignoreNames: []
		}

		// Assert that addFunctionReturnTypes was called with the expected options
		expect(addFunctionReturnTypes).toHaveBeenCalledWith(options)
	})
})
