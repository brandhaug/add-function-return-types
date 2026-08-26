import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import type { Options } from '../src/options'
import { defaultOptions } from '../src/options'

const { main } = await import('../src/cli')

describe('cli', (): void => {
	// Preserve the original process.argv to restore after tests
	const originalArgv = process.argv
	const run = mock((_options?: Options): Promise<void> => Promise.resolve())

	beforeEach((): void => {
		// Clear mocks before each test
		run.mockClear()
		// Set a default argv (node and script name)
		process.argv = ['node', 'cli.js']
	})

	afterEach((): void => {
		// Restore the original process.argv after each test
		process.argv = originalArgv
		run.mockReset()
	})

	it('should pass default options when no arguments are provided', async (): Promise<void> => {
		// Call the main function with an injected runner so nothing touches disk
		await main([], run)

		const options: Options = {
			path: '.',
			shallow: false,
			ignoreFiles: [],
			overwrite: false,
			ignoreConciseArrowFunctionExpressionsStartingWithVoid: false,
			ignoreContextuallyTypedFunctionExpressions: true,
			ignoreExpressions: false,
			ignoreFunctionsWithoutTypeParameters: false,
			ignoreHigherOrderFunctions: false,
			ignoreTypedFunctionExpressions: false,
			ignoreIIFEs: false,
			ignoreFunctions: [],
			ignoreAnonymousObjects: false,
			ignoreUnknown: false,
			ignoreAnonymousFunctions: false,
			dryRun: false,
			json: false,
			tsconfig: undefined,
			useCache: true,
			clearCache: false
		}

		// Assert that the runner was called with default options
		expect(run).toHaveBeenCalledWith(options)
	})

	it('should correctly parse and pass all provided arguments', async (): Promise<void> => {
		// Define the simulated command-line arguments
		const argv = [
			'src',
			'--shallow',
			'--ignore-files=**/*.test.ts,**/node_modules/**',
			'--overwrite',
			'--ignore-concise-arrow-function-expressions-starting-with-void',
			'--ignore-expressions',
			'--ignore-functions-without-type-parameters',
			'--ignore-higher-order-functions',
			'--ignore-typed-function-expressions',
			'--ignore-iifes',
			'--ignore-functions=foo,bar',
			'--ignore-anonymous-objects',
			'--ignore-unknown',
			'--ignore-anonymous-functions',
			'--dry-run',
			'--tsconfig=tsconfig.app.json'
		]

		// Call the main function
		await main(argv, run)

		const options: Options = {
			path: 'src',
			shallow: true,
			ignoreFiles: ['**/*.test.ts', '**/node_modules/**'],
			overwrite: true,
			ignoreConciseArrowFunctionExpressionsStartingWithVoid: true,
			ignoreContextuallyTypedFunctionExpressions: true,
			ignoreExpressions: true,
			ignoreFunctionsWithoutTypeParameters: true,
			ignoreHigherOrderFunctions: true,
			ignoreTypedFunctionExpressions: true,
			ignoreIIFEs: true,
			ignoreFunctions: ['foo', 'bar'],
			ignoreAnonymousObjects: true,
			ignoreUnknown: true,
			ignoreAnonymousFunctions: true,
			dryRun: true,
			json: false,
			tsconfig: 'tsconfig.app.json',
			useCache: true,
			clearCache: false
		}

		// Assert that the runner was called with the expected options
		expect(run).toHaveBeenCalledWith(options)
	})

	it('should handle partial arguments correctly', async (): Promise<void> => {
		// Define a subset of command-line arguments
		await main(['--ignore-files=**/*.spec.ts'], run)

		const options: Options = {
			path: '.',
			shallow: false,
			ignoreFiles: ['**/*.spec.ts'],
			overwrite: false,
			ignoreConciseArrowFunctionExpressionsStartingWithVoid: false,
			ignoreContextuallyTypedFunctionExpressions: true,
			ignoreExpressions: false,
			ignoreFunctionsWithoutTypeParameters: false,
			ignoreHigherOrderFunctions: false,
			ignoreTypedFunctionExpressions: false,
			ignoreIIFEs: false,
			ignoreFunctions: [],
			ignoreAnonymousObjects: false,
			ignoreUnknown: false,
			ignoreAnonymousFunctions: false,
			dryRun: false,
			json: false,
			tsconfig: undefined,
			useCache: true,
			clearCache: false
		}

		// Assert that the runner was called with the expected options
		expect(run).toHaveBeenCalledWith(options)
	})

	it('rejects unknown flags instead of treating them as a path', async (): Promise<void> => {
		await main(['src', '--dr-run'], run)

		expect(process.exitCode).toBe(1)
		expect(run).not.toHaveBeenCalled()
		process.exitCode = 0
	})

	it('prints usage for --help without running anything', async (): Promise<void> => {
		await main(['--help'], run)

		expect(run).not.toHaveBeenCalled()
	})

	it('accepts cache control flags', async (): Promise<void> => {
		await main(['src', '--no-cache', '--clear-cache'], run)

		expect(run).toHaveBeenCalledWith(
			expect.objectContaining({
				path: 'src',
				useCache: false,
				clearCache: true
			})
		)
		expect(defaultOptions.useCache).toBe(true)
	})
})
