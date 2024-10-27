import path from 'node:path'
import fg from 'fast-glob'
import pLimit from 'p-limit'
import { ModuleKind, Node, Project, ScriptTarget, ts } from 'ts-morph'

export type Options = {
	path: string
	shallow: boolean
	ignoreFiles: string[]
	concurrencyLimit: number
	ignoreConciseArrowFunctionExpressionsStartingWithVoid: boolean
	ignoreExpressions: boolean
	ignoreFunctionsWithoutTypeParameters: boolean
	ignoreHigherOrderFunctions: boolean
	ignoreIIFEs: boolean
	ignoreTypedFunctionExpressions: boolean
	ignoreFunctions: string[]
	overwrite: boolean
	ignoreAnonymousObjects: boolean
	ignoreAny: boolean
	ignoreUnknown: boolean
}

/**
 * Processes TypeScript files in the current directory, adding explicit return types to functions where needed.
 * @param options - The options object.
 */
export async function addFunctionReturnTypes(options: Options): Promise<void> {
	console.info('Starting process to analyze TypeScript files')
	const pathToProcess = path.resolve(options.path)

	console.info(`Using directory: ${pathToProcess}`)

	const allFiles = await getAllTsAndTsxFiles(pathToProcess, options)
	console.info(`${allFiles.length} TypeScript files found`)

	const project = new Project({
		compilerOptions: {
			allowSyntheticDefaultImports: true,
			esModuleInterop: true,
			module: ModuleKind.ESNext,
			target: ScriptTarget.ESNext,
			strict: true,
			noUncheckedIndexedAccess: true
		},
		skipAddingFilesFromTsConfig: true
	})

	// Limit concurrency to prevent overwhelming the system
	const limit = pLimit(options.concurrencyLimit)

	const totalFiles = allFiles.length
	let processedFiles = 0

	await Promise.all(
		allFiles.map(
			(file): Promise<void> =>
				limit(async (): Promise<void> => {
					try {
						const message = await processFile(project, file, options)
						processedFiles++
						console.info(`${processedFiles}/${totalFiles}: ${message}`)
					} catch (error) {
						console.error(`Error processing file ${file}:`, error)
						process.exit(1)
					}
				})
		)
	)

	console.info('Processing complete.')
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
): Promise<string[]> {
	const extensions = ['ts', 'tsx']
	const patterns = extensions.map((ext): string => `**/*.${ext}`)

	const defaultIgnorefiles = ['**/node_modules/**', '**/*.d.ts']
	return fg(patterns, {
		cwd: rootPath,
		ignore: defaultIgnorefiles.concat(options.ignoreFiles),
		absolute: true,
		deep: options.shallow ? 0 : undefined // Recursive by default, shallow if specified
	})
}

/**
 * Processes a TypeScript file, adding explicit return types to functions where needed.
 * @param project - The ts-morph Project instance.
 * @param filePath - The path to the file to process.
 * @param options - The options object.
 * @returns A promise that resolves when processing is complete.
 */
async function processFile(
	project: Project,
	filePath: string,
	options: Options
): Promise<string> {
	const sourceFile =
		project.getSourceFile(filePath) || project.addSourceFileAtPath(filePath)

	let modified = false

	sourceFile.forEachDescendant((node): void => {
		try {
			// Check if the node is a function or method
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

			// Check if the node is a constructor
			if (Node.isConstructorDeclaration(node)) {
				return
			}

			// Check if node already has a return type
			if (!options.overwrite && node.getReturnTypeNode()) {
				return
			}

			// Check for allowedNames
			const name =
				Node.isMethodDeclaration(node) || Node.isFunctionDeclaration(node)
					? node.getName()
					: undefined

			if (name && options.ignoreFunctions.includes(name)) {
				return
			}

			// Ignore functions based on options

			// ignoreExpressions: ignore function expressions (functions not part of a declaration)
			if (
				options.ignoreExpressions &&
				(Node.isFunctionExpression(node) || Node.isArrowFunction(node))
			) {
				return
			}

			// ignoreTypedFunctionExpressions: ignore function expressions with type annotations on the variable
			if (
				options.ignoreTypedFunctionExpressions &&
				(Node.isFunctionExpression(node) || Node.isArrowFunction(node))
			) {
				const parent = node.getParent()
				if (Node.isVariableDeclaration(parent) && parent.getTypeNode()) {
					return
				}
			}

			// ignoreFunctionsWithoutTypeParameters: ignore functions that don't have generic type parameters
			if (
				options.ignoreFunctionsWithoutTypeParameters &&
				node.getTypeParameters().length === 0
			) {
				return
			}

			// ignoreHigherOrderFunctions: ignore functions immediately returning another function expression
			if (options.ignoreHigherOrderFunctions) {
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

			// ignoreConciseArrowFunctionExpressionsStartingWithVoid: ignore arrow functions starting with `void`
			if (
				options.ignoreConciseArrowFunctionExpressionsStartingWithVoid &&
				Node.isArrowFunction(node)
			) {
				const body = node.getBody()
				if (Node.isVoidExpression(body)) {
					return
				}
			}

			// ignoreIIFEs: ignore immediately invoked function expressions
			if (options.ignoreIIFEs) {
				const parent = node.getParent()
				if (Node.isParenthesizedExpression(parent)) {
					const grandParent = parent.getParent()
					if (
						Node.isCallExpression(grandParent) &&
						grandParent.getExpression() === parent
					) {
						return
					}
				} else if (
					Node.isCallExpression(parent) &&
					parent.getExpression() === node
				) {
					return
				}
			}

			// Reset the return type so we get the inferred type
			if (options.overwrite) node.setReturnType('')

			const type = node.getReturnType()
			const typeText = type.getText(node, ts.TypeFormatFlags.NoTruncation)

			// ignoreAnonymousObjectTypes: ignore functions that return anonymous object types
			if (options.ignoreAnonymousObjects && typeText.startsWith('{')) {
				return
			}

			// ignoreAny: ignore functions that return the any type
			if (options.ignoreAny && type.isAny()) {
				return
			}

			// ignoreAny: ignore functions that return the unknown type
			if (options.ignoreUnknown && type.isUnknown()) {
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

	if (!modified) {
		return `No changes made to "${filePath}"`
	}

	await sourceFile.save()
	return `Processed and saved "${filePath}"`
}
