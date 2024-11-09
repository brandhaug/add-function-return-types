import fs from 'node:fs/promises'
import path from 'node:path'
import fg from 'fast-glob'

/**
 * Recursively searches for .git directory in parent directories
 * @param currentPath - The current directory path
 */
async function searchForGitFileRecursive(
	currentPath: string
): Promise<string | null> {
	try {
		// Check if .git exists in current directory
		await fs.access(path.join(currentPath, '.git'))
		return currentPath
	} catch {
		// If we're at root directory, stop searching
		const parentPath = path.dirname(currentPath)
		if (parentPath === currentPath) {
			return null
		}
		// Continue searching in parent directory
		return searchForGitFileRecursive(parentPath)
	}
}

/**
 * Finds the repository root directory by looking for .git
 * @param startPath - The starting directory path
 * @returns The repository root path or the start path if no .git is found
 */
export async function findRepoRoot(startPath: string): Promise<string> {
	console.info('Searching for repository root...')

	const rootPath = await searchForGitFileRecursive(path.resolve(startPath))

	if (rootPath) {
		console.info(`Found repository root at: "${rootPath}"`)
		return rootPath
	}

	console.info(
		`No .git directory found, using start path as root: "${startPath}"`
	)
	return startPath
}

/**
 * Finds and reads package.json files in the project directory
 * @param startPath - The starting directory path
 * @returns An array of package.json file paths
 */
export async function findPackageJsonFiles(
	startPath: string
): Promise<string[]> {
	console.info('Looking for package.json files...')
	// First find the repository root
	const repoRoot = await findRepoRoot(startPath)

	const patterns = ['**/package.json']

	// Use fast-glob to find all package.json files within the repository root
	const packageJsonFiles = await fg(patterns, {
		cwd: repoRoot,
		ignore: ['**/node_modules/**'],
		absolute: true
	})

	console.info(`Found ${packageJsonFiles.length} package.json files:`)

	for (const file of packageJsonFiles) {
		console.info(`- "${file}"`)
	}

	return packageJsonFiles
}

/**
 * Gets dependencies from package.json files
 * @param packageJsonPaths - Array of paths to package.json files
 * @returns Array of dependency package names
 */
export async function getDependencies(
	packageJsonPaths: string[]
): Promise<string[]> {
	console.info('Extracting dependencies from package.json files...')
	const dependencies = new Set<string>()

	for (const packageJsonPath of packageJsonPaths) {
		try {
			const content = await fs.readFile(packageJsonPath, 'utf-8')
			const packageJson = JSON.parse(content)

			// Add all types of dependencies
			const allDeps = {
				...packageJson.dependencies,
				...packageJson.devDependencies,
				...packageJson.peerDependencies
			}

			const depsCount = Object.keys(allDeps).length
			console.info(
				`Processing ${depsCount} dependencies from "${packageJsonPath}"`
			)

			for (const dep in allDeps) {
				dependencies.add(dep)
			}
		} catch (error) {
			console.warn(`Warning: Could not process "${packageJsonPath}":`, error)
		}
	}

	const finalDeps = Array.from(dependencies)
	console.info(`Total unique dependencies: ${finalDeps.length}`)
	return finalDeps
}
