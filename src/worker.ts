import { parentPort, type MessagePort, workerData } from 'node:worker_threads'
import fs from 'node:fs/promises'
import { computeContentHash, type CacheFile } from './cache.js'
import type { DetectedFormatter } from './formatter.js'
import { createProject, processFile } from './process-file.js'
import { createRunStats, type RunStats } from './stats.js'
import type { Options } from './options.js'

type WorkerData = {
	files: string[]
	options: Options
	types: string[]
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

const { files, options, types, formatter } = workerData as WorkerData

const project = await createProject(options, types)
const hashes: CacheFile['files'] = {}
const stats = createRunStats()

for (const file of files) {
	try {
		const status = await processFile(project, file, options, stats, formatter)
		port.postMessage({ type: 'result', file, status } satisfies ResultMessage)

		if (!options.dryRun) {
			const content = await fs.readFile(file, 'utf-8')
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
