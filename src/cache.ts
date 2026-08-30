import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { type Options } from './options.js'

/**
 * Bump this whenever processing logic changes in a way that invalidates
 * previously cached results (i.e. anything that affects emitted output).
 */
export const CACHE_VERSION = 1

const CACHE_FILE_NAME = '.add-function-return-types-cache.json'

export type CacheFile = {
	version: number
	optionsHash: string
	files: Record<string, string>
}

export function getCachePath(targetDir: string): string {
	return path.join(path.resolve(targetDir), CACHE_FILE_NAME)
}

export function computeContentHash(content: string): string {
	return crypto.createHash('sha256').update(content).digest('hex')
}

/**
 * Computes a stable hash of the options that affect processing output.
 * Path, dry-run and cache-control flags are excluded on purpose: they do not
 * change how a file's return types are computed.
 */
export function computeOptionsHash(options: Options): string {
	const relevant = {
		shallow: options.shallow,
		ignoreConciseArrowFunctionExpressionsStartingWithVoid:
			options.ignoreConciseArrowFunctionExpressionsStartingWithVoid,
		ignoreExpressions: options.ignoreExpressions,
		ignoreFunctionsWithoutTypeParameters:
			options.ignoreFunctionsWithoutTypeParameters,
		ignoreHigherOrderFunctions: options.ignoreHigherOrderFunctions,
		ignoreIIFEs: options.ignoreIIFEs,
		ignoreTypedFunctionExpressions: options.ignoreTypedFunctionExpressions,
		ignoreContextuallyTypedFunctionExpressions:
			options.ignoreContextuallyTypedFunctionExpressions,
		ignoreFunctions: options.ignoreFunctions.toSorted(),
		overwrite: options.overwrite,
		ignoreAnonymousObjects: options.ignoreAnonymousObjects,
		ignoreUnknown: options.ignoreUnknown,
		ignoreAnonymousFunctions: options.ignoreAnonymousFunctions,
		tsconfig: options.tsconfig ? path.resolve(options.tsconfig) : undefined,
		ignoreFiles: options.ignoreFiles.toSorted()
	}
	return computeContentHash(JSON.stringify(relevant))
}

/**
 * Type guard for the on-disk cache file shape. The cache is written by this
 * tool, but it is still external input: a stale or hand-edited file must not
 * be trusted just because `JSON.parse` returned an object.
 */
function isCacheFile(value: unknown): value is CacheFile {
	if (typeof value !== 'object' || value === null) {
		return false
	}
	if (
		!('version' in value) ||
		!('optionsHash' in value) ||
		!('files' in value)
	) {
		return false
	}
	if (typeof value.version !== 'number') {
		return false
	}
	if (typeof value.optionsHash !== 'string') {
		return false
	}
	if (
		typeof value.files !== 'object' ||
		value.files === null ||
		Array.isArray(value.files)
	) {
		return false
	}
	return true
}

export async function loadCache(
	cachePath: string,
	optionsHash: string
): Promise<Record<string, string>> {
	try {
		const content = await fs.readFile(cachePath, 'utf8')
		const parsed: unknown = JSON.parse(content)
		if (
			!isCacheFile(parsed) ||
			parsed.version !== CACHE_VERSION ||
			parsed.optionsHash !== optionsHash
		) {
			return {}
		}
		return parsed.files
	} catch {
		return {}
	}
}

export async function saveCache(
	cachePath: string,
	cache: CacheFile
): Promise<void> {
	await fs.writeFile(cachePath, `${JSON.stringify(cache, null, '\t')}\n`)
}

export async function removeCache(cachePath: string): Promise<void> {
	try {
		await fs.unlink(cachePath)
	} catch {
		// Cache file did not exist; nothing to do.
	}
}
