import { beforeEach, describe, expect, it, mock } from 'bun:test'
import * as clack from '@clack/prompts'

// Mock addFunctionReturnTypes before importing the CLI so main() never
// touches the filesystem.
const addFunctionReturnTypes = mock((_options?: Options): Promise<void> =>
	Promise.resolve()
)

mock.module(
	'../src/add-function-return-types.ts',
	(): { addFunctionReturnTypes: any; } => ({ addFunctionReturnTypes })
)

const { main } = await import('../src/cli')

describe('cli', (): void => {
	beforeEach((): void => {
		addFunctionReturnTypes.mockClear()
		process.argv = ['node', 'cli.js']
		// Restore the deterministic global mock defaults before each test
		clack.isCancel.mockReturnValue(false)
		clack.text.mockImplementation(
			async ({ initialValue }: { initialValue?: string }): Promise<string> =>
				initialValue === undefined ? '' : initialValue
		)
		clack.confirm.mockResolvedValue(false)
		clack.multiselect.mockResolvedValue([])
	})

	it('calls addFunctionReturnTypes with defaults when all prompts are accepted as-is', async (): Promise<void> => {
		await main()

		expect(clack.text).toHaveBeenCalledWith(
			expect.objectContaining({ initialValue: '.' })
		)
		expect(addFunctionReturnTypes).toHaveBeenCalledTimes(1)
		expect(addFunctionReturnTypes).toHaveBeenCalledWith({
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
			ignoreAnonymousFunctions: false,
			dryRun: false,
			tsconfig: undefined
		})
	})

	it('passes selected ignore options, dry-run, overwrite and tsconfig through', async (): Promise<void> => {
		clack.text
			.mockResolvedValueOnce('src')
			.mockResolvedValueOnce('tsconfig.app.json')
		clack.confirm
			.mockResolvedValueOnce(true) // configure ignore options?
			.mockResolvedValueOnce(true) // dry run?
			.mockResolvedValueOnce(true) // overwrite? (skipped on dry run, but safe)
		clack.multiselect
			.mockResolvedValueOnce(['shallow', 'ignoreAny'])
			.mockResolvedValueOnce(['ignoreUnknown'])
			.mockResolvedValueOnce([])

		await main()

		expect(addFunctionReturnTypes).toHaveBeenCalledTimes(1)
		expect(addFunctionReturnTypes).toHaveBeenCalledWith(
			expect.objectContaining({
				path: 'src',
				shallow: true,
				ignoreAny: true,
				ignoreUnknown: true,
				dryRun: true,
				overwrite: false,
				ignoreExpressions: false,
				tsconfig: 'tsconfig.app.json'
			})
		)
	})

	it('returns gracefully when a prompt is cancelled', async (): Promise<void> => {
		clack.isCancel.mockReturnValue(true)

		await main()

		expect(clack.cancel).toHaveBeenCalledWith('Operation cancelled')
		expect(addFunctionReturnTypes).not.toHaveBeenCalled()
	})

	it('prints usage for --help without running the migration', async (): Promise<void> => {
		await main(['--help'])

		expect(addFunctionReturnTypes).not.toHaveBeenCalled()
	})

	it('rejects unknown flags instead of treating them as a path', async (): Promise<void> => {
		await main(['src', '--dr-run'])

		expect(process.exitCode).toBe(1)
		expect(addFunctionReturnTypes).not.toHaveBeenCalled()
		process.exitCode = 0
	})
})
