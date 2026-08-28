import { parentPort, type MessagePort, workerData } from 'node:worker_threads'
import fs from 'node:fs/promises'
import { computeContentHash, type CacheFile } from './cache.js'
import { type DetectedFormatter } from './formatter.js'
import { createProject, processFile } from './process-file.js'
import { createRunStats, type RunStats } from './stats.js'
import { type Options } from './options.js'

type WorkerData = {
	files: Array<string>
	options: Options
	types: Array<string>
	formatter: DetectedFormatter | null
}

type ResultMessage =
	| { type: 'result'; file: string; status: string }
	| { type: 'error'; file: string; message: string }
	| { type: 'done'; hashes: CacheFile['files']; stats: RunStats }

const port: MessagePort | null = parentPort
if (!port) {
	throw new Error('This module must be run inside a worker thread')
}

/**
 * Validates the payload handed to this worker by the main thread. `workerData`
 * arrives as `any`, so the shape is checked before anything is destructured.
 */
function isWorkerData(value: unknown): value is WorkerData {
	if (typeof value !== 'object' || value === null) {
		return false
	}
	if (!('files' in value) || !('options' in value) || !('types' in value)) {
		return false
	}
	if (!('formatter' in value)) {
		return false
	}
	if (!Array.isArray(value.files)) {
		return false
	}
	if (typeof value.options !== 'object' || value.options === null) {
		return false
	}
	if (!Array.isArray(value.types)) {
		return false
	}
	if (value.formatter === null) {
		return true
	}
	if (typeof value.formatter !== 'object') {
		return false
	}
	return 'name' in value.formatter && typeof value.formatter.name === 'string'
}

// SAFETY: workerData arrives as `any` from node:worker_threads; the shape is
// fully validated by isWorkerData() immediately below before destructuring.
const data = workerData as unknown
if (!isWorkerData(data)) {
	throw new Error('Invalid worker data')
}
const { files, options, types, formatter } = data

const project = await createProject(options, types)
const hashes: CacheFile['files'] = {}
const stats = createRunStats()

for (const file of files) {
	try {
		const status = await processFile(project, file, options, stats, formatter)
		port.postMessage({ type: 'result', file, status } satisfies ResultMessage)

		if (!options.dryRun) {
			const content = await fs.readFile(file, 'utf8')
			hashes[file] = computeContentHash(content)
		}
	} catch (error) {
		port.postMessage({
			type: 'error',
			file,
			message: `Error processing file ${file}: ${error instanceof Error ? error.message : String(error)}`
		} satisfies ResultMessage)
	}
}

port.postMessage({ type: 'done', hashes, stats } satisfies ResultMessage)
