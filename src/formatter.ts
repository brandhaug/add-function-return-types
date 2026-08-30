import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export type FormatterName = 'oxfmt' | 'prettier' | 'biome'

export type DetectedFormatter = { name: FormatterName }

const formatterConfigFiles = {
	oxfmt: ['.oxfmtrc.json', '.oxfmtrc'],
	prettier: [
		'.prettierrc',
		'.prettierrc.json',
		'.prettierrc.yml',
		'.prettierrc.yaml',
		'.prettierrc.toml',
		'.prettierrc.cjs',
		'prettier.config.js',
		'prettier.config.mjs',
		'prettier.config.cjs'
	],
	biome: ['biome.json', 'biome.jsonc']
} satisfies Record<FormatterName, Array<string>>

const formatterPackageNames = {
	oxfmt: ['oxfmt'],
	prettier: ['prettier'],
	biome: ['@biomejs/biome']
} satisfies Record<FormatterName, Array<string>>

const formatterNames: ReadonlyArray<FormatterName> = [
	'oxfmt',
	'prettier',
	'biome'
]

async function fileExists(filePath: string): Promise<boolean> {
	try {
		await fs.access(filePath)
		return true
	} catch {
		return false
	}
}

type DependencySection = 'dependencies' | 'devDependencies' | 'peerDependencies'

/**
 * The subset of a package.json that formatter detection reads. Values are the
 * version maps of the dependency sections; `prettier` is probed only for its
 * presence. This is the contract parsed package.json files must satisfy.
 */
type PackageJson = Partial<
	Record<DependencySection, Record<string, string>>
> & { prettier?: unknown }

function hasDependency(packageJson: PackageJson, name: string): boolean {
	const sections: Array<DependencySection> = [
		'dependencies',
		'devDependencies',
		'peerDependencies'
	]
	return sections.some((section): boolean => {
		const deps = packageJson[section]
		return deps !== undefined && Object.hasOwn(deps, name)
	})
}

/**
 * Detects the target project's formatter (oxfmt, prettier or biome) by looking
 * for its config file or a dependency entry in package.json. Stops ascending at
 * the first package.json that declares no formatter (treated as the project root).
 * @param rootDir - The directory being processed.
 * @returns The detected formatter, or null if none was found.
 */
export async function detectFormatter(
	rootDir: string
): Promise<DetectedFormatter | null> {
	let dir = path.resolve(rootDir)

	while (true) {
		for (const name of formatterNames) {
			for (const configFile of formatterConfigFiles[name]) {
				if (await fileExists(path.join(dir, configFile))) {
					return { name }
				}
			}
		}

		const packageJsonPath = path.join(dir, 'package.json')
		if (await fileExists(packageJsonPath)) {
			let packageJson: PackageJson
			try {
				packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'))
			} catch {
				packageJson = {}
			}

			if (Object.hasOwn(packageJson, 'prettier')) {
				return { name: 'prettier' }
			}

			for (const name of formatterNames) {
				for (const packageName of formatterPackageNames[name]) {
					if (hasDependency(packageJson, packageName)) {
						return { name }
					}
				}
			}

			// A package.json without any formatter marks the project root.
			return null
		}

		const parentDir = path.dirname(dir)
		if (parentDir === dir) {
			return null
		}
		dir = parentDir
	}
}

async function resolveBin(
	name: FormatterName,
	fromDir: string
): Promise<string> {
	let dir = path.resolve(fromDir)
	while (true) {
		const binPath = path.join(dir, 'node_modules', '.bin', name)
		if (await fileExists(binPath)) {
			return binPath
		}
		const parentDir = path.dirname(dir)
		if (parentDir === dir) {
			break
		}
		dir = parentDir
	}
	// Fall back to the formatter of the running tool (e.g. when processing a
	// directory outside of any installed dependency tree).
	const fallbackBin = path.resolve('node_modules', '.bin', name)
	if (await fileExists(fallbackBin)) {
		return fallbackBin
	}
	return name
}

function formatArgs(name: FormatterName, filePath: string): Array<string> {
	const argSets = {
		oxfmt: [filePath, '--write'],
		biome: ['format', '--write', filePath],
		prettier: ['--write', filePath]
	} satisfies Record<FormatterName, Array<string>>
	return argSets[name]
}

/**
 * Formats a single modified file using the detected project formatter and the
 * project's own configuration.
 * @param filePath - The file to format (must have been modified by this tool).
 * @param formatter - The formatter detected for the target project.
 */
export async function formatFile(
	filePath: string,
	formatter: DetectedFormatter
): Promise<void> {
	const bin = await resolveBin(formatter.name, path.dirname(filePath))
	await execFileAsync(bin, formatArgs(formatter.name, filePath))
}

const DEFAULT_MAX_LINE_WIDTH = 80

type SplitState = { depth: number; current: string; previous: string }

function splitTopLevel(text: string, separator: string): Array<string> {
	const state: SplitState = { depth: 0, current: '', previous: '' }
	const parts: Array<string> = []

	for (const char of text) {
		if ('([{<'.includes(char)) {
			state.depth++
		} else if (
			')]}'.includes(char) &&
			!(char === '>' && state.previous === '=')
		) {
			state.depth--
		}

		if (char === separator && state.depth === 0) {
			parts.push(state.current.trim())
			state.current = ''
		} else {
			state.current += char
		}
		state.previous = char
	}

	parts.push(state.current.trim())
	return parts.filter((part): boolean => part.length > 0)
}

/**
 * Fallback used when no project formatter is available: breaks long emitted
 * type annotations across multiple lines at top-level object members or union
 * separators.
 * @param typeText - The emitted type annotation text.
 * @param maxWidth - The maximum width before wrapping.
 * @returns The possibly multi-line type annotation text.
 */
export function wrapLongType(
	typeText: string,
	maxWidth: number = DEFAULT_MAX_LINE_WIDTH
): string {
	if (maxWidth > 0 && typeText.length <= maxWidth) {
		return typeText
	}

	const braceStart = typeText.indexOf('{')
	const braceEnd = typeText.lastIndexOf('}')
	if (maxWidth > 0 && braceStart !== -1 && braceEnd > braceStart + 1) {
		for (const separator of [';', ',']) {
			const members = splitTopLevel(
				typeText.slice(braceStart + 1, braceEnd),
				separator
			)
			if (members.length > 1) {
				const suffix = typeText.slice(braceEnd + 1).trim()
				const body = members
					.map((member): string => `\t${member}${separator}`)
					.join('\n')
				return `${typeText.slice(0, braceStart + 1)}\n${body}\n}${suffix ? ` ${suffix}` : ''}`
			}
		}
	}

	const unionParts = splitTopLevel(typeText, '|')
	if (unionParts.length > 1) {
		return unionParts.join('\n\t| ')
	}

	return typeText
}
