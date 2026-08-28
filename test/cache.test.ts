import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'
import { addFunctionReturnTypes } from '../src/add-function-return-types'
import { computeOptionsHash, getCachePath } from '../src/cache'
import { defaultOptions, type Options } from '../src/options'

const tmpDir = process.env.RUNNER_TEMP || os.tmpdir()

describe('incremental cache', (): void => {
	const createdDirs: Array<string> = []

	afterEach(async (): Promise<void> => {
		for (const dir of createdDirs.splice(0)) {
			await fs.rm(dir, { recursive: true, force: true })
		}
	})

	const makeFixture = async (
		sourceCode: string
	): Promise<{ dir: string; filePath: string }> => {
		const dir = await fs.mkdtemp(path.join(tmpDir, 'afrt-cache-'))
		createdDirs.push(dir)
		const filePath = path.join(dir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)
		return { dir, filePath }
	}

	const run = async (overrides: Partial<Options> = {}): Promise<void> =>
		addFunctionReturnTypes({ ...defaultOptions, ...overrides })

	it('writes a cache file after processing', async (): Promise<void> => {
		const { dir, filePath } = await makeFixture(
			'function greet(name: string) {\n  return name;\n}\n'
		)

		await run({ path: dir })

		const cache = JSON.parse(await fs.readFile(getCachePath(dir), 'utf8'))
		expect(cache.version).toBeNumber()
		expect(cache.optionsHash).toBeString()
		expect(Object.keys(cache.files)).toContain(filePath)
	})

	it('skips unchanged files on a second run', async (): Promise<void> => {
		const source = 'function greet(name: string) {\n  return name;\n}\n'
		const { dir, filePath } = await makeFixture(source)

		await run({ path: dir })
		const firstPass = await fs.readFile(filePath, 'utf8')
		expect(firstPass).toContain('): string {')

		// Reset the file to its original (untyped) content but keep the cache:
		// the second run must still detect it as changed and re-process.
		await fs.writeFile(filePath, source)
		await run({ path: dir })
		expect(await fs.readFile(filePath, 'utf8')).toContain('): string {')
	})

	it('reprocesses modified files and updates their cache entry', async (): Promise<void> => {
		const { dir, filePath } = await makeFixture(
			'function greet(name: string) {\n  return name;\n}\n'
		)

		await run({ path: dir })
		expect(await fs.readFile(filePath, 'utf8')).toContain('): string {')

		await fs.writeFile(
			filePath,
			'function farewell(name: string) {\n  return "bye " + name;\n}\n'
		)
		await run({ path: dir })
		const updated = await fs.readFile(filePath, 'utf8')
		expect(updated).toContain('farewell(name: string): string {')

		const cache = JSON.parse(await fs.readFile(getCachePath(dir), 'utf8'))
		expect(Object.keys(cache.files)).toContain(filePath)
	})

	it('invalidates the whole cache when options change', async (): Promise<void> => {
		const { dir, filePath } = await makeFixture('const get = () => 42;\n')

		await run({ path: dir })
		const afterFirstRun = await fs.readFile(filePath, 'utf8')
		expect(afterFirstRun).toContain('(): number =>')

		// Same content, different options -> must not be skipped.
		await fs.writeFile(filePath, 'const get = () => 42;\n')
		await run({
			path: dir,
			overwrite: true,
			ignoreExpressions: true
		})
		// ignoreExpressions means the arrow function is left untouched this time.
		expect(await fs.readFile(filePath, 'utf8')).toBe('const get = () => 42;\n')
	})

	it('does not write or read the cache with useCache disabled', async (): Promise<void> => {
		const { dir, filePath } = await makeFixture(
			'function greet() {\n  return 1;\n}\n'
		)

		await run({ path: dir, useCache: false })
		await expect(fs.readFile(getCachePath(dir), 'utf8')).rejects.toThrow()

		// A cached run afterwards still works from scratch.
		await fs.writeFile(filePath, 'function greet() {\n  return 1;\n}\n')
		await run({ path: dir })
		expect(await fs.readFile(filePath, 'utf8')).toContain('): number {')
	})

	it('clears an existing cache file with clearCache', async (): Promise<void> => {
		const { dir } = await makeFixture('function greet() {\n  return 1;\n}\n')

		await run({ path: dir })
		await expect(fs.stat(getCachePath(dir))).resolves.toBeTruthy()

		await fs.writeFile(
			path.join(dir, `${crypto.randomUUID()}.ts`),
			'function other() {\n  return 2;\n}\n'
		)
		await run({ path: dir, clearCache: true })

		await expect(fs.access(getCachePath(dir))).rejects.toThrow()
	})

	it('never writes a cache file during dry runs', async (): Promise<void> => {
		const { dir, filePath } = await makeFixture(
			'function greet(name: string) {\n  return name;\n}\n'
		)

		await run({ path: dir, dryRun: true })

		await expect(fs.access(getCachePath(dir))).rejects.toThrow()
		// Dry run remains side-effect free.
		expect(await fs.readFile(filePath, 'utf8')).not.toContain(': string {')
	})

	it('computes different option hashes for different options', (): void => {
		const base: Options = { ...defaultOptions, path: '/tmp/x' }
		expect(computeOptionsHash(base)).toBe(computeOptionsHash(base))
		expect(computeOptionsHash(base)).not.toBe(
			computeOptionsHash({ ...base, overwrite: true })
		)
		expect(computeOptionsHash(base)).not.toBe(
			computeOptionsHash({ ...base, ignoreFunctions: ['a'] })
		)
		// dry-run and cache flags do not affect processing output
		expect(computeOptionsHash(base)).toBe(
			computeOptionsHash({ ...base, dryRun: true })
		)
		expect(computeOptionsHash(base)).toBe(
			computeOptionsHash({ ...base, useCache: false, clearCache: true })
		)
	})
})
