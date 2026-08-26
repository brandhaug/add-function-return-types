import path from 'node:path'
import { Worker } from 'node:worker_threads'
import os from 'node:os'
import fg from 'fast-glob'

type EntryInternal = Awaited<ReturnType<typeof fg>>[number]
import {
	CACHE_VERSION,
	computeContentHash,
	computeOptionsHash,
	getCachePath,
	loadCache,
	removeCache,
	saveCache,
	type CacheFile
} from './cache.js'
import { detectFormatter, type DetectedFormatter } from './formatter.js'
import { resolveTsconfigPath, verifyModifiedFiles } from './verify.js'
import { defaultGeneratedIgnorePatterns, type Options } from './options.js'
import {
	createRunStats,
	formatStatsTable,
	mergeStats,
	type RunStats
} from './stats.js'
import * as p from '@clack/prompts'
import { findPackageJsonFiles, getDependencies } from './utils.js'
import fs from 'node:fs/promises'

type ResultMessage =
	| { type: 'result'; file: string; status: string }
	| { type: 'error'; file: string; message: string }
	| { type: 'done'; hashes: Record<string, string>; stats: RunStats }

/**
 * Processes TypeScript files in the given directory, adding explicit return types to functions where needed.
 * Files are partitioned into batches that are processed in parallel by a bounded pool of worker threads,
 * each with its own ts-morph Project. An on-disk cache keyed by file content hash + options hash + cache
 * version is used to skip unchanged files on re-runs.
 * @param options - The options object.
 */
export async function addFunctionReturnTypes(options: Options): Promise<void> {
	const startTime = Date.now()
	console.info('Starting process to analyze TypeScript files')
	const pathToProcess = path.resolve(options.path)

	console.info(`Using directory: "${pathToProcess}"`)

	const allFiles = await getAllTsAndTsxFiles(pathToProcess, options)
	console.info(`${allFiles.length} TypeScript files found`)

	const cachePath = getCachePath(pathToProcess)

	if (options.clearCache) {
		await removeCache(cachePath)
		console.info('Cache cleared')
	}

	const optionsHash = computeOptionsHash(options)
	const canUseCache = options.useCache && !options.dryRun && !options.clearCache
	const cachedEntries = canUseCache
		? await loadCache(cachePath, optionsHash)
		: {}

	// Determine which files are unchanged since the last run.
	const pendingFiles: string[] = []
	let skippedCount = 0

	for (const file of allFiles) {
		const cachedHash = cachedEntries[file]
		if (cachedHash === undefined) {
			pendingFiles.push(file)
			continue
		}

		try {
			const content = await fs.readFile(file, 'utf8')
			if (computeContentHash(content) === cachedHash) {
				skippedCount++
				continue
			}
		} catch {
			// File could not be read; fall through and try processing it.
		}
		pendingFiles.push(file)
	}

	console.info(
		`${pendingFiles.length} file(s) to process, ${skippedCount} skipped by cache`
	)

	let formatter: DetectedFormatter | null = null
	if (options.format) {
		formatter = await detectFormatter(pathToProcess)
		if (formatter) {
			console.info(
				`Detected "${formatter.name}" formatter — modified files will be formatted`
			)
		} else {
			console.info(
				'No formatter detected (oxfmt/prettier/biome) — long type annotations will be wrapped manually'
			)
		}
	}

	const results = new Map<string, string>()
	const errors: string[] = []
	const stats = createRunStats()
	const newHashes = new Map<string, string>()
	const totalFiles = allFiles.length

	const pendingOriginals: Record<string, string> = {}
	if (options.verify && !options.dryRun && pendingFiles.length > 0) {
		for (const file of pendingFiles) {
			try {
				pendingOriginals[file] = await fs.readFile(file, 'utf8')
			} catch {
				// ignore unreadable files
			}
		}
	}

	if (pendingFiles.length > 0) {
		const types = options.tsconfig ? [] : await resolveTypes(pathToProcess)
		await runWorkerPool(
			pendingFiles,
			options,
			types,
			results,
			errors,
			newHashes,
			stats,
			formatter
		)
	}

	// Print results in stable file order regardless of completion order.
	for (const [index, file] of allFiles.entries()) {
		const status = results.get(file) ?? `Skipped "${file}" (unchanged)`
		console.info(`${index + 1}/${totalFiles}: ${status}`)
	}

	// Post-run verification: revert any modified file that gained new type errors.
	if (
		options.verify &&
		!options.dryRun &&
		Object.keys(pendingOriginals).length > 0
	) {
		const modifiedFiles = Object.entries(pendingOriginals)
			.filter(
				([file]): boolean => results.get(file)?.startsWith('Processed') ?? false
			)
			.map(
				([filePath, originalText]): {
					filePath: string
					originalText: string
				} => ({
					filePath,
					originalText
				})
			)
		if (modifiedFiles.length > 0) {
			const tsconfigPath = await resolveTsconfigPath(
				options.tsconfig,
				pathToProcess
			)
			if (tsconfigPath) {
				const reverted = await verifyModifiedFiles(tsconfigPath, modifiedFiles)
				for (const file of reverted) {
					results.set(file, `Reverted "${file}" (introduced new type errors)`)
					newHashes.delete(file)
					stats.filesModified--
					stats.filesUnchanged++
				}
			}
		}
	}

	// Aggregate file-level counts.
	for (const status of results.values()) {
		if (status.startsWith('Processed')) stats.filesModified++
		else if (status.startsWith('No changes')) stats.filesUnchanged++
	}
	stats.filesErrored = errors.length
	stats.filesUnchanged += skippedCount

	if (options.json) {
		console.log(JSON.stringify(stats))
	} else if (!options.dryRun || results.size > 0) {
		p.log.message(formatStatsTable(stats))
	}

	// Persist the cache so unchanged files are skipped on the next run.
	if (!options.dryRun && !options.clearCache && options.useCache) {
		const cache: CacheFile = {
			version: CACHE_VERSION,
			optionsHash,
			files: { ...cachedEntries, ...Object.fromEntries(newHashes) }
		}
		await saveCache(cachePath, cache).catch((error: unknown): void => {
			console.warn(`Warning: Could not write cache file "${cachePath}":`, error)
		})
	}

	const endTime = Date.now()
	console.info(
		'Processing complete after %d seconds',
		(endTime - startTime) / 1000
	)

	if (errors.length > 0) {
		console.error(`\nFailed to process ${errors.length} file(s):`)
		for (const error of errors) {
			console.error(`  - ${error}`)
		}
		process.exit(1)
	}
}

/**
 * Runs the pending files through a bounded pool of worker threads. Each worker
 * gets its own ts-morph Project and reuses it for every file in its batch.
 */
async function runWorkerPool(
	files: string[],
	options: Options,
	types: string[],
	results: Map<string, string>,
	errors: string[],
	newHashes: Map<string, string>,
	stats: RunStats,
	formatter: DetectedFormatter | null
): Promise<void> {
	const workerCount = Math.max(1, Math.min(os.cpus().length, files.length))
	const batches = partitionFiles(files, workerCount)

	await Promise.all(
		batches.map((batch): Promise<void> =>
			runWorker(
				batch,
				options,
				types,
				results,
				errors,
				newHashes,
				stats,
				formatter
			)
		)
	)
}

function runWorker(
	files: string[],
	options: Options,
	types: string[],
	results: Map<string, string>,
	errors: string[],
	newHashes: Map<string, string>,
	stats: RunStats,
	formatter: DetectedFormatter | null
): Promise<void> {
	return new Promise((resolve, reject): void => {
		const worker = new Worker(getWorkerModuleUrl(), {
			workerData: { files, options, types, formatter }
		})

		worker.on('message', (message: ResultMessage): void => {
			switch (message.type) {
				case 'result': {
					results.set(message.file, message.status)
					break
				}
				case 'error': {
					console.error(message.message)
					errors.push(message.message)
					break
				}
				case 'done': {
					for (const [file, hash] of Object.entries(message.hashes)) {
						newHashes.set(file, hash)
					}
					mergeStats(stats, message.stats)
					break
				}
			}
		})

		worker.on('error', reject)
		worker.on('exit', (code): void => {
			if (code !== 0) {
				reject(new Error(`Worker stopped with exit code ${code}`))
				return
			}
			resolve()
		})
	})
}

/**
 * Resolves the URL of the worker module, accounting for whether we are running
 * from TypeScript sources (e.g. via bun) or from compiled JavaScript in dist/.
 */
function getWorkerModuleUrl(): URL {
	const isTypeScript = import.meta.url.endsWith('.ts')
	return new URL(`./worker.${isTypeScript ? 'ts' : 'js'}`, import.meta.url)
}

/**
 * Partitions files into roughly equal batches using round-robin distribution
 * so each worker gets a balanced mix of files.
 */
function partitionFiles(files: string[], batchCount: number): string[][] {
	const batches: string[][] = Array.from(
		{ length: batchCount },
		(): string[] => []
	)
	for (const [index, file] of files.entries()) {
		batches[index % batchCount]?.push(file)
	}
	return batches.filter((batch): boolean => batch.length > 0)
}

async function resolveTypes(pathToProcess: string): Promise<string[]> {
	// Find package.json files
	const packageJsonFiles = await findPackageJsonFiles(pathToProcess)
	return getDependencies(packageJsonFiles)
}

/**
 * Retrieves all TypeScript and TSX files in the specified directory.
 * @param rootPath - The root directory to search.
 * @param options - The options object.
 * @returns A promise that resolves to an array of file paths.
 */
async function getAllTsAndTsxFiles(
	rootPath: string,
	options: Options
): Promise<EntryInternal[]> {
	const extensions = ['ts', 'tsx']
	const patterns = extensions.map((ext): string => `**/*.${ext}`)

	const defaultIgnorefiles = [
		'**/node_modules/**',
		'**/*.d.ts',
		...(options.includeGenerated ? [] : defaultGeneratedIgnorePatterns)
	]
	return fg(patterns, {
		cwd: rootPath,
		ignore: [...defaultIgnorefiles, ...options.ignoreFiles],
		absolute: true,
		deep: options.shallow ? 0 : undefined // Recursive by default, shallow if specified
	})
}
