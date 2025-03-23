import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addFunctionReturnTypes } from '../src/add-function-return-types'
import { main } from '../src/cli'
import type { Options } from '../src/options'

vi.mock('../src/add-function-return-types.ts', (): object => ({
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
      ignoreFiles: [],
      overwrite: false,
      ignoreConciseArrowFunctionExpressionsStartingWithVoid: false,
      ignoreExpressions: false,
      ignoreFunctionsWithoutTypeParameters: false,
      ignoreHigherOrderFunctions: false,
      ignoreTypedFunctionExpressions: false,
      ignoreIIFEs: false,
      ignoreFunctions: [],
      ignoreAnonymousObjects: false,
      ignoreAny: false,
      ignoreUnknown: false,
      ignoreAnonymousFunctions: false
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
      '--ignore-any',
      '--ignore-unknown',
      '--ignore-anonymous-functions'
    ]

    // Call the main function
    await main()

    const options: Options = {
      path: 'src',
      shallow: true,
      ignoreFiles: ['**/*.test.ts', '**/node_modules/**'],
      overwrite: true,
      ignoreConciseArrowFunctionExpressionsStartingWithVoid: true,
      ignoreExpressions: true,
      ignoreFunctionsWithoutTypeParameters: true,
      ignoreHigherOrderFunctions: true,
      ignoreTypedFunctionExpressions: true,
      ignoreIIFEs: true,
      ignoreFunctions: ['foo', 'bar'],
      ignoreAnonymousObjects: true,
      ignoreAny: true,
      ignoreUnknown: true,
      ignoreAnonymousFunctions: true
    }

    // Assert that addFunctionReturnTypes was called with the expected options
    expect(addFunctionReturnTypes).toHaveBeenCalledWith(options)
  })

  it('should handle partial arguments correctly', async (): Promise<void> => {
    // Define a subset of command-line arguments
    process.argv = ['node', 'cli.js', '--ignore-files=**/*.spec.ts']

    // Call the main function
    await main()

    const options: Options = {
      path: '.',
      shallow: false,
      ignoreFiles: ['**/*.spec.ts'],
      overwrite: false,
      ignoreConciseArrowFunctionExpressionsStartingWithVoid: false,
      ignoreExpressions: false,
      ignoreFunctionsWithoutTypeParameters: false,
      ignoreHigherOrderFunctions: false,
      ignoreTypedFunctionExpressions: false,
      ignoreIIFEs: false,
      ignoreFunctions: [],
      ignoreAnonymousObjects: false,
      ignoreAny: false,
      ignoreUnknown: false,
      ignoreAnonymousFunctions: false
    }

    // Assert that addFunctionReturnTypes was called with the expected options
    expect(addFunctionReturnTypes).toHaveBeenCalledWith(options)
  })
})
