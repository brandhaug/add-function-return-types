#!/usr/bin/env node

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
	.option(
		'--ignore <patterns>',
		'Comma-separated list of file patterns to ignore'
	)
	.option(
		'--concurrency <number>',
		'Concurrency limit for processing files',
		(value) => Number.parseInt(value, 10),
		10
	)
	.option(
		'--ignore-concise-arrow-function-expressions-starting-with-void',
		'Ignore arrow functions that start with the `void` keyword.'
	)
	.option(
		'--ignore-direct-const-assertion-in-arrow-functions',
		'Ignore arrow functions immediately returning an `as const` value.'
	)
	.option(
		'--ignore-expressions',
		'Ignore function expressions (functions not part of a declaration).'
	)
	.option(
		'--ignore-functions-without-type-parameters',
		"Ignore functions that don't have generic type parameters."
	)
	.option(
		'--ignore-higher-order-functions',
		'Ignore functions immediately returning another function expression.'
	)
	.option(
		'--ignore-typed-function-expressions',
		'Ignore function expressions with type annotations on the variable.'
	)
	.option(
		'--ignore-names <names>',
		'Comma-separated list of function/method names to ignore'
	)

program.parse(process.argv)

const options = program.opts()
const shallow = options.shallow || false
const ignorePatterns = options.ignore ? options.ignore.split(',') : []
const concurrencyLimit = options.concurrency

// New options
const ignoreConciseArrowFunctionExpressionsStartingWithVoid =
	options.ignoreConciseArrowFunctionExpressionsStartingWithVoid || false
const ignoreDirectConstAssertionInArrowFunctions =
	options.ignoreDirectConstAssertionInArrowFunctions || false
const ignoreExpressions = options.ignoreExpressions || false
const ignoreFunctionsWithoutTypeParameters =
	options.ignoreFunctionsWithoutTypeParameters || false
const ignoreHigherOrderFunctions = options.ignoreHigherOrderFunctions || false
const ignoreTypedFunctionExpressions =
	options.ignoreTypedFunctionExpressions || false
const ignoreNames = options.ignoreNames ? options.ignoreNames.split(',') : []

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

	const totalFiles = allFiles.length

	await Promise.all(
		allFiles.map((file, index) =>
			limit(async (): Promise<void> => {
				try {
					await processFile(project, file)
				} catch (error) {
					console.error(`Error processing file ${file}:`, error)
					process.exit(1)
				} finally {
					console.info(`Progress: ${index + 1}/${totalFiles} files processed`)
				}
			})
		)
	)

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
	const patterns = extensions.map((ext) => `**/*.${ext}`)

	const defaultIgnorePatterns = ['**/node_modules/**', '**/*.d.ts']
	return fg(patterns, {
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
	const sourceFile =
		project.getSourceFile(filePath) || project.addSourceFileAtPath(filePath)

	let modified = false

	sourceFile.forEachDescendant((node): void => {
		try {
			if (
				!(
					Node.isFunctionDeclaration(node) ||
					Node.isFunctionExpression(node) ||
					Node.isArrowFunction(node) ||
					Node.isMethodDeclaration(node)
				)
			) {
				return
			}

			if (Node.isConstructorDeclaration(node) || node.getReturnTypeNode()) {
				return
			}

			// Check for allowedNames
			const name =
				Node.isMethodDeclaration(node) || Node.isFunctionDeclaration(node)
					? node.getName()
					: undefined

			if (name && ignoreNames.includes(name)) {
				return
			}

			// Ignore functions based on options

			// ignoreExpressions: ignore function expressions (functions not part of a declaration)
			if (
				ignoreExpressions &&
				(Node.isFunctionExpression(node) || Node.isArrowFunction(node))
			) {
				return
			}

			// ignoreTypedFunctionExpressions: ignore function expressions with type annotations on the variable
			if (
				ignoreTypedFunctionExpressions &&
				(Node.isFunctionExpression(node) || Node.isArrowFunction(node))
			) {
				const parent = node.getParent()
				if (Node.isVariableDeclaration(parent) && parent.getTypeNode()) {
					return
				}
			}

			// ignoreFunctionsWithoutTypeParameters: ignore functions that don't have generic type parameters
			if (
				ignoreFunctionsWithoutTypeParameters &&
				node.getTypeParameters().length === 0
			) {
				return
			}

			// ignoreHigherOrderFunctions: ignore functions immediately returning another function expression
			if (ignoreHigherOrderFunctions) {
				const body = node.getBody()
				if (!body || !Node.isBlock(body)) return

				const statements = body.getStatements()
				if (statements.length !== 1) return

				const statement = statements[0]
				if (!Node.isReturnStatement(statement)) return

				const expr = statement.getExpression()
				if (
					expr &&
					(Node.isFunctionExpression(expr) || Node.isArrowFunction(expr))
				) {
					return
				}
			}

			// ignoreDirectConstAssertionInArrowFunctions: ignore arrow functions immediately returning an `as const` value
			if (
				ignoreDirectConstAssertionInArrowFunctions &&
				Node.isArrowFunction(node)
			) {
				const body = node.getBody()
				if (Node.isAsExpression(body) && body.getType().getText() === 'const') {
					return
				}
			}

			// ignoreConciseArrowFunctionExpressionsStartingWithVoid: ignore arrow functions starting with `void`
			if (
				ignoreConciseArrowFunctionExpressionsStartingWithVoid &&
				Node.isArrowFunction(node)
			) {
				const body = node.getBody()
				if (Node.isVoidExpression(body)) {
					return
				}
			}

			const type = node.getReturnType()
			const typeText = type.getText(node, ts.TypeFormatFlags.NoTruncation)

			if (type.isAny() || type.isUnknown() || typeText.includes('{')) {
				return
			}

			node.setReturnType(typeText)
			modified = true
		} catch (error) {
			const position = node.getStart()
			const { line, column } = sourceFile.getLineAndColumnAtPos(position)
			console.error(
				`Error processing node at ${filePath}:${line}:${column} - ${
					error instanceof Error ? error.message : error
				}`
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
