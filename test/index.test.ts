import { beforeEach, describe, expect, it, mock } from 'bun:test'
import type { Options } from '../src/options'
import * as clack from '@clack/prompts'

const { main } = await import('../src/cli')

describe('cli prompts', (): void => {
	const run = mock((_options?: Options): Promise<void> => Promise.resolve())

	beforeEach((): void => {
		run.mockClear()
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

	it('calls the runner with defaults when all prompts are accepted as-is', async (): Promise<void> => {
		await main([], run)

		expect(clack.text).toHaveBeenCalledWith(
			expect.objectContaining({ initialValue: '.' })
		)
		expect(run).toHaveBeenCalledTimes(1)
		expect(run).toHaveBeenCalledWith({
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
			includeGenerated: false,
			maxTypeLength: 150,
			maxTypeDepth: 4,
			format: true,
			verify: true,
			tsconfig: undefined,
			useCache: true,
			clearCache: false
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
			.mockResolvedValueOnce(['shallow'])
			.mockResolvedValueOnce(['ignoreUnknown'])
			.mockResolvedValueOnce([])

		await main([], run)

		expect(run).toHaveBeenCalledTimes(1)
		expect(run).toHaveBeenCalledWith(
			expect.objectContaining({
				path: 'src',
				shallow: true,
				ignoreUnknown: true,
				dryRun: true,
				json: false,
				includeGenerated: false,
				maxTypeLength: 150,
				maxTypeDepth: 4,
				format: true,
				verify: true,
				overwrite: false,
				ignoreExpressions: false,
				tsconfig: 'tsconfig.app.json',
				useCache: true,
				clearCache: false
			})
		)
	})

	it('returns gracefully when a prompt is cancelled', async (): Promise<void> => {
		clack.isCancel.mockReturnValue(true)

		await main([], run)

		expect(clack.cancel).toHaveBeenCalledWith('Operation cancelled')
		expect(run).not.toHaveBeenCalled()
	})

	it('prints usage for --help without running anything', async (): Promise<void> => {
		await main(['--help'], run)

		expect(run).not.toHaveBeenCalled()
	})
})
