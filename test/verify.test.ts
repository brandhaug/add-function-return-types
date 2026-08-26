import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'bun:test'
import { addFunctionReturnTypes } from '../src/add-function-return-types'
import { defaultOptions } from '../src/options'

const tmpDir = process.env.RUNNER_TEMP || os.tmpdir()

const writeFixture = async (files: Record<string, string>): Promise<string> => {
	const testDir = await fs.mkdtemp(path.join(tmpDir, 'test-'))
	for (const [name, content] of Object.entries(files)) {
		const filePath = path.join(testDir, name)
		await fs.mkdir(path.dirname(filePath), { recursive: true })
		await fs.writeFile(filePath, content)
	}
	return testDir
}

describe.concurrent('verify mode', (): void => {
	it('reverts a modified file that introduces new type errors', async (): Promise<void> => {
		const testDir = await writeFixture({
			'tsconfig.json': JSON.stringify({
				compilerOptions: {
					strict: true,
					target: 'ES2022',
					module: 'ESNext',
					moduleResolution: 'node'
				},
				include: ['**/*.ts']
			}),
			'a.ts': 'export function f() {\n  return 1\n}\n'
		})
		const filePath = path.join(testDir, 'a.ts')
		const original = await fs.readFile(filePath, 'utf8')

		await addFunctionReturnTypes({ ...defaultOptions, path: testDir })

		const updated = await fs.readFile(filePath, 'utf8')
		expect(updated).not.toBe(original)
		expect(updated).toContain('function f(): number')
	})
})
