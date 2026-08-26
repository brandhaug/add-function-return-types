import fs from 'node:fs/promises'
import path from 'node:path'
import { Diagnostic, Project } from 'ts-morph'

export type ModifiedFile = {
	filePath: string
	originalText: string
}

/**
 * Resolves the tsconfig.json to use for verification. Uses the explicitly
 * provided path if given, otherwise searches upwards from startDir.
 */
export async function resolveTsconfigPath(
	explicit: string | undefined,
	startDir: string
): Promise<string | undefined> {
	if (explicit) {
		const resolved = path.resolve(explicit)
		try {
			await fs.access(resolved)
			return resolved
		} catch {
			return undefined
		}
	}

	let current = path.resolve(startDir)
	while (true) {
		const candidate = path.join(current, 'tsconfig.json')
		try {
			await fs.access(candidate)
			return candidate
		} catch {
			const parent = path.dirname(current)
			if (parent === current) return undefined
			current = parent
		}
	}
}

const diagnosticKey = (diagnostic: Diagnostic): string => {
	const message = diagnostic.getMessageText()
	return `${diagnostic.getCode()}:${typeof message === 'string' ? message : message.getMessageText()}`
}

/**
 * Collects pre-emit diagnostics limited to the given files, keyed by file path.
 */
export function collectDiagnosticsForFiles(
	project: Project,
	filePaths: ReadonlySet<string>
): Map<string, Map<string, number>> {
	const result = new Map<string, Map<string, number>>()
	for (const diagnostic of project.getPreEmitDiagnostics()) {
		const sourceFile = diagnostic.getSourceFile()
		if (!sourceFile) continue
		const filePath = sourceFile.getFilePath()
		if (!filePaths.has(filePath)) continue
		let counts = result.get(filePath)
		if (!counts) {
			counts = new Map<string, number>()
			result.set(filePath, counts)
		}
		const key = diagnosticKey(diagnostic)
		counts.set(key, (counts.get(key) ?? 0) + 1)
	}
	return result
}

/**
 * Returns true when `after` contains more errors than `baseline` for the
 * same file, meaning new errors were introduced.
 */
export function hasNewDiagnostics(
	baseline: Map<string, number> | undefined,
	after: Map<string, number> | undefined
): boolean {
	for (const [key, count] of after ?? []) {
		if (count > (baseline?.get(key) ?? 0)) return true
	}
	return false
}

/**
 * Verifies modified files by comparing diagnostics before and after saving.
 * Any file that gains new errors is reverted to its original content.
 * Returns the list of reverted file paths.
 */
export async function verifyModifiedFiles(
	tsconfigPath: string,
	modifiedFiles: ModifiedFile[]
): Promise<string[]> {
	const touchedPaths = new Set(
		modifiedFiles.map((file): string => file.filePath)
	)
	const project = new Project({ tsConfigFilePath: tsconfigPath })

	for (const filePath of touchedPaths) {
		if (!project.getSourceFile(filePath)) {
			project.addSourceFileAtPath(filePath)
		}
	}

	const baseline = collectDiagnosticsForFiles(project, touchedPaths)

	// Files have already been written by the processing pipeline; reload.
	for (const filePath of touchedPaths) {
		project.getSourceFile(filePath)?.refreshFromFileSystemSync()
	}

	const after = collectDiagnosticsForFiles(project, touchedPaths)

	const revertedFiles: string[] = []
	for (const file of modifiedFiles) {
		if (
			!hasNewDiagnostics(baseline.get(file.filePath), after.get(file.filePath))
		) {
			continue
		}

		const newErrors = [...(after.get(file.filePath)?.keys() ?? [])]
		console.error(
			`Reverting "${file.filePath}" - new TypeScript error(s) introduced:\n  - ${newErrors.join('\n  - ')}`
		)
		await fs.writeFile(file.filePath, file.originalText)
		revertedFiles.push(file.filePath)
	}

	return revertedFiles
}
