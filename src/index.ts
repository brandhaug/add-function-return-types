#!/usr/bin/env node

import cliProgress from 'cli-progress'
import { Command } from 'commander'
import fg from 'fast-glob'
import pLimit from 'p-limit'
import { Node, Project, ts } from 'ts-morph'

/**
 * CLI tool to add explicit return types to TypeScript functions.
 */
const program = new Command()

program
	.name('add-function-return-types')
	.description('CLI tool to add explicit return types to TypeScript functions')
	.option('--shallow', 'Process only the top-level directory')
	.option('--ignore <patterns>', 'Comma-separated list of patterns to ignore')
	.option(
		'--concurrency <number>',
		'Concurrency limit for processing files',
		(value): number => Number.parseInt(value, 10),
		10
	)

program.parse(process.argv)

const options = program.opts()
const shallow = options.shallow || false
const ignorePatterns = options.ignore ? options.ignore.split(',') : []
const concurrencyLimit = options.concurrency

void (async (): Promise<void> => {
	console.info('Starting process to analyze TypeScript files')
	const rootPath = process.cwd()

	console.info(`Using directory: ${rootPath}`)

	const allFiles = await getAllTsAndTsxFiles(rootPath, shallow, ignorePatterns)
	console.info(`${allFiles.length} TypeScript files found`)

	const project = new Project({
		skipAddingFilesFromTsConfig: true
	})

	// Limit concurrency to prevent overwhelming the system
	const limit = pLimit(concurrencyLimit)

	const progressBar = new cliProgress.SingleBar(
		{},
		cliProgress.Presets.shades_classic
	)
	progressBar.start(allFiles.length, 0)

	await Promise.all(
		allFiles.map(
			(file): Promise<void> =>
				limit(async (): Promise<void> => {
					try {
						await processFile(project, file)
					} catch (error) {
						console.error(`Error processing file ${file}:`, error)
						process.exit(1)
					} finally {
						progressBar.increment()
					}
				})
		)
	)

	progressBar.stop()

	console.info('Processing complete.')
})()

/**
 * Retrieves all TypeScript and TSX files in the specified directory.
 * @param rootPath - The root directory to search.
 * @param shallow - Whether to search only in the top-level directory.
 * @param ignorePatterns - Patterns to ignore.
 * @returns A promise that resolves to an array of file paths.
 */
async function getAllTsAndTsxFiles(
	rootPath: string,
	shallow: boolean,
	ignorePatterns: string[]
): Promise<string[]> {
	const extensions = ['ts', 'tsx']
	const patterns = extensions.map((ext): string => `**/*.${ext}`)

	const defaultIgnorePatterns = ['**/node_modules/**', '**/*.d.ts']
	return await fg(patterns, {
		cwd: rootPath,
		ignore: defaultIgnorePatterns.concat(ignorePatterns),
		absolute: true,
		deep: shallow ? 0 : undefined // Recursive by default, shallow if specified
	})
}

/**
 * Processes a TypeScript file, adding explicit return types to functions where needed.
 * @param project - The ts-morph Project instance.
 * @param filePath - The path to the file to process.
 * @returns A promise that resolves when processing is complete.
 */
export async function processFile(
	project: Project,
	filePath: string
): Promise<void> {
	let sourceFile = project.getSourceFile(filePath)
	if (!sourceFile) {
		sourceFile = project.addSourceFileAtPath(filePath)
	}

	let modified = false

	sourceFile.forEachDescendant((node): void => {
		try {
			if (
				Node.isFunctionDeclaration(node) ||
				Node.isFunctionExpression(node) ||
				Node.isArrowFunction(node) ||
				Node.isMethodDeclaration(node)
			) {
				if (Node.isConstructorDeclaration(node) || node.getReturnTypeNode()) {
					return
				}

				const type = node.getReturnType()
				const typeText = type.getText(node, ts.TypeFormatFlags.NoTruncation)

				if (type.isAny() || type.isUnknown() || typeText.includes('{')) {
					return
				}

				node.setReturnType(typeText)
				modified = true
			}
		} catch (error) {
			const position = node.getStart()
			const { line, column } = sourceFile.getLineAndColumnAtPos(position)
			console.error(
				`Error processing node at ${filePath}:${line}:${column} - ${error instanceof Error ? error.message : error}`
			)
		}
	})

	if (modified) {
		await sourceFile.save()
		console.info(`Processed and saved file: ${filePath}`)
	} else {
		console.info(`No changes made to file: ${filePath}`)
	}
}
