import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
	findPackageJsonFiles,
	findRepoRoot,
	getDependencies
} from '../src/repoUtils'

describe.concurrent('repoUtils', (): void => {
	// Use RUNNER_TEMP if available to avoid access errors in GHA
	const tmpDir = process.env.RUNNER_TEMP || os.tmpdir()

	describe('findRepoRoot', (): void => {
		it('should find repository root with .git directory', async (): Promise<void> => {
			const testDir = await fs.mkdtemp(tmpDir)
			try {
				// Create minimal structure needed for this test
				await fs.mkdir(path.join(testDir, '.git'), { recursive: true })
				await fs.mkdir(path.join(testDir, 'packages', 'a'), { recursive: true })

				const startPath = path.join(testDir, 'packages', 'a')
				const result = await findRepoRoot(startPath)
				expect(result).toBe(testDir)
			} finally {
				await fs.rm(testDir, { recursive: true, force: true })
			}
		})

		it('should return start path when no .git directory exists', async (): Promise<void> => {
			const testDir = await fs.mkdtemp(tmpDir)
			try {
				const noGitDir = path.join(testDir, 'no-git')
				await fs.mkdir(noGitDir, { recursive: true })

				const result = await findRepoRoot(noGitDir)
				expect(result).toBe(noGitDir)
			} finally {
				await fs.rm(testDir, { recursive: true, force: true })
			}
		})
	})

	describe('findPackageJsonFiles', (): void => {
		it('should find all package.json files in the repository', async (): Promise<void> => {
			const testDir = await fs.mkdtemp(tmpDir)
			try {
				// Create test package.json files
				await fs.mkdir(path.join(testDir, 'packages', 'a'), { recursive: true })
				await fs.writeFile(path.join(testDir, 'package.json'), '{}')
				await fs.writeFile(
					path.join(testDir, 'packages', 'a', 'package.json'),
					'{}'
				)

				const result = await findPackageJsonFiles(testDir)
				expect(result).toHaveLength(2)
				expect(result).toContain(path.join(testDir, 'package.json'))
				expect(result).toContain(
					path.join(testDir, 'packages', 'a', 'package.json')
				)
			} finally {
				await fs.rm(testDir, { recursive: true, force: true })
			}
		})
	})

	describe('getDependencies', (): void => {
		it('should extract all dependencies from package.json files', async (): Promise<void> => {
			const testDir = await fs.mkdtemp(tmpDir)
			try {
				// Create test package.json files with dependencies
				await fs.mkdir(path.join(testDir, 'packages', 'a'), { recursive: true })

				await fs.writeFile(
					path.join(testDir, 'package.json'),
					JSON.stringify({
						dependencies: {
							react: '^17.0.0',
							lodash: '^4.17.0'
						},
						devDependencies: {
							typescript: '^4.5.0'
						}
					})
				)

				await fs.writeFile(
					path.join(testDir, 'packages', 'a', 'package.json'),
					JSON.stringify({
						dependencies: {
							axios: '^0.24.0'
						}
					})
				)

				const packageJsonFiles = await findPackageJsonFiles(testDir)
				const dependencies = await getDependencies(packageJsonFiles)

				expect(dependencies).toContain('react')
				expect(dependencies).toContain('lodash')
				expect(dependencies).toContain('typescript')
				expect(dependencies).toContain('axios')
			} finally {
				await fs.rm(testDir, { recursive: true, force: true })
			}
		})

		it('should handle invalid package.json files', async (): Promise<void> => {
			const testDir = await fs.mkdtemp(tmpDir)
			try {
				// Create one valid and one invalid package.json
				await fs.mkdir(path.join(testDir, 'packages', 'b'), { recursive: true })

				await fs.writeFile(
					path.join(testDir, 'package.json'),
					JSON.stringify({
						dependencies: {
							react: '^17.0.0',
							lodash: '^4.17.0'
						}
					})
				)

				await fs.writeFile(
					path.join(testDir, 'packages', 'b', 'package.json'),
					'invalid json'
				)

				const packageJsonFiles = await findPackageJsonFiles(testDir)
				const dependencies = await getDependencies(packageJsonFiles)

				expect(dependencies).toContain('react')
				expect(dependencies).toContain('lodash')
			} finally {
				await fs.rm(testDir, { recursive: true, force: true })
			}
		})
	})
})
