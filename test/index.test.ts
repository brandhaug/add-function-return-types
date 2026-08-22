import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as clack from '@clack/prompts'
import { addFunctionReturnTypes } from '../src/add-function-return-types'
import { main } from '../src/cli'

vi.mock(
	'../src/add-function-return-types.ts',
	(): { addFunctionReturnTypes: Mock<Procedure>; } => ({
		addFunctionReturnTypes: vi.fn()
	})
)

const mockedAdd = vi.mocked(addFunctionReturnTypes)

describe('cli', (): void => {
	beforeEach((): void => {
		vi.clearAllMocks()
		process.argv = ['node', 'cli.js']
		// Restore the deterministic global mock defaults before each test
		vi.mocked(clack.isCancel).mockReturnValue(false)
		vi.mocked(clack.text).mockImplementation(
			async ({ initialValue }: { initialValue?: string }): Promise<string> =>
				initialValue === undefined ? '' : initialValue
		)
		vi.mocked(clack.confirm).mockResolvedValue(false)
		vi.mocked(clack.multiselect).mockResolvedValue([])
	})

	it('calls addFunctionReturnTypes with defaults when all prompts are accepted as-is', async (): Promise<void> => {
		await main()

		expect(clack.text).toHaveBeenCalledWith(
			expect.objectContaining({ initialValue: '.' })
		)
		expect(mockedAdd).toHaveBeenCalledTimes(1)
		expect(mockedAdd).toHaveBeenCalledWith({
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
		vi.mocked(clack.text)
			.mockResolvedValueOnce('src')
			.mockResolvedValueOnce('tsconfig.app.json')
		vi.mocked(clack.confirm)
			.mockResolvedValueOnce(true) // configure ignore options?
			.mockResolvedValueOnce(true) // dry run?
			.mockResolvedValueOnce(true) // overwrite? (skipped on dry run, but safe)
		vi.mocked(clack.multiselect)
			.mockResolvedValueOnce(['shallow', 'ignoreAny'])
			.mockResolvedValueOnce(['ignoreUnknown'])
			.mockResolvedValueOnce([])

		await main()

		expect(mockedAdd).toHaveBeenCalledTimes(1)
		const options = mockedAdd.mock.calls[0]?.[0]
		expect(options?.path).toBe('src')
		expect(options?.shallow).toBe(true)
		expect(options?.ignoreAny).toBe(true)
		expect(options?.ignoreUnknown).toBe(true)
		expect(options?.dryRun).toBe(true)
		expect(options?.overwrite).toBe(false)
		expect(options?.ignoreExpressions).toBe(false)
		expect(options?.tsconfig).toBe('tsconfig.app.json')
	})

	it('exits gracefully when a prompt is cancelled', async (): Promise<void> => {
		vi.mocked(clack.isCancel).mockReturnValue(true)
		vi.spyOn(process, 'exit').mockImplementation((): never => {
			throw new Error('process.exit called')
		})

		await expect(main()).rejects.toThrow('process.exit called')

		expect(clack.cancel).toHaveBeenCalledWith('Operation cancelled')
		expect(mockedAdd).not.toHaveBeenCalled()
		vi.spyOn(process, 'exit').mockRestore()
	})
})
