import { spawn } from 'node:child_process'
import path from 'node:path'
import { describe, it } from 'vitest'

describe('index', (): void => {
	it('should work', async (): Promise<void> => {
		const cliPath = path.resolve(__dirname, '../src/bin.ts')

		await new Promise<void>((resolve, reject): void => {
			const child = spawn('bun', [cliPath], { stdio: 'inherit' })
			child.on('exit', (code): void =>
				code === 0 ? resolve() : reject(new Error(`CLI exited with code ${code}`))
			)
		})
	})
})
