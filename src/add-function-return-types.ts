import path from 'node:path'
import fg from 'fast-glob'

type EntryInternal = Awaited<ReturnType<typeof fg>>[number]
import {
	type Expression,
	ModuleKind,
	Node,
	Project,
	ScriptTarget,
	SyntaxKind,
	ts
} from 'ts-morph'
import type { Options } from './options.js'
import { findPackageJsonFiles, getDependencies } from './utils.js'

/**
 * Processes TypeScript files in the current directory, adding explicit return types to functions where needed.
 * @param options - The options object.
 */
export async function addFunctionReturnTypes(options: Options): Promise<void> {
	const startTime = Date.now()
	console.info('Starting process to analyze TypeScript files')
	const pathToProcess = path.resolve(options.path)

	console.info(`Using directory: "${pathToProcess}"`)

	const allFiles = await getAllTsAndTsxFiles(pathToProcess, options)
	console.info(`${allFiles.length} TypeScript files found`)

	let project: Project

	if (options.tsconfig) {
		const tsconfigPath = path.resolve(options.tsconfig)
		console.info(`Using tsconfig: "${tsconfigPath}"`)
		project = new Project({
			tsConfigFilePath: tsconfigPath,
			skipAddingFilesFromTsConfig: true
		})
	} else {
		// Find package.json files
		const packageJsonFiles = await findPackageJsonFiles(pathToProcess)
		const dependencies = await getDependencies(packageJsonFiles)

		// Update Project configuration to include node_modules types
		project = new Project({
			compilerOptions: {
				allowSyntheticDefaultImports: true,
				esModuleInterop: true,
				module: ModuleKind.ESNext,
				target: ScriptTarget.ESNext,
				strict: true,
				noUncheckedIndexedAccess: true,
				types: dependencies,
				moduleResolution: ts.ModuleResolutionKind.NodeNext
			},
			skipAddingFilesFromTsConfig: true
		})
	}

	const totalFiles = allFiles.length
	const errors: string[] = []

	for (const [index, file] of allFiles.entries()) {
		try {
			const message = await processFile(project, file, options)
			console.info(`${index + 1}/${totalFiles}: ${message}`)
		} catch (error) {
			const errorMessage = `Error processing file ${file}: ${error instanceof Error ? error.message : String(error)}`
			console.error(errorMessage)
			errors.push(errorMessage)
		}
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
				if (body) {
					if (Node.isBlock(body)) {
						const statements = body.getStatements()
						if (statements.length === 1) {
							const statement = statements[0]
							if (Node.isReturnStatement(statement)) {
								const expr = statement.getExpression()
								if (
									expr &&
									(Node.isFunctionExpression(expr) ||
										Node.isArrowFunction(expr))
								) {
									return
								}
							}
						}
					} else if (
						Node.isFunctionExpression(body) ||
						Node.isArrowFunction(body)
					) {
						// Concise arrow function returning another function: () => () => 42
						return
					}
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

			// ignoreAnonymousFunctions: ignore functions without names
			if (options.ignoreAnonymousFunctions) {
				if (Node.isFunctionExpression(node) && !node.getName()) {
					return
				}

				if (Node.isArrowFunction(node)) {
					const parent = node.getParent()
					// Check if arrow function is assigned to a variable declaration, property declaration, or
					// it is a property assignment
					if (
						(!Node.isVariableDeclaration(parent) || !parent.getName()) &&
						!Node.isPropertyDeclaration(parent) &&
						!Node.isPropertyAssignment(parent) &&
						!(
							Node.isBinaryExpression(parent) &&
							parent.getOperatorToken().getKind() === SyntaxKind.EqualsToken
						)
					) {
						return
					}
				}
			}

			// Reset the return type so we get the inferred type
			if (options.overwrite) node.setReturnType('')

			let returnTypeSet = false

			// Attempt to use the type of the returned expression if it's a parameter
			const body = node.getBody()
			if (body) {
				let returnExpr: Expression | Node | undefined

				if (Node.isBlock(body)) {
					const returnStatements = body.getDescendantsOfKind(
						SyntaxKind.ReturnStatement
					)
					if (returnStatements.length === 1 && returnStatements[0]) {
						returnExpr = returnStatements[0].getExpression()
					}
				} else {
					// It's an expression body (arrow function with expression)
					returnExpr = body
				}

				if (returnExpr && Node.isIdentifier(returnExpr)) {
					const param = node
						.getParameters()
						.find((p): boolean => p.getName() === returnExpr.getText())
					if (param) {
						const paramTypeNode = param.getTypeNode()
						if (paramTypeNode) {
							const paramTypeText = paramTypeNode.getText()
							node.setReturnType(paramTypeText)
							modified = true
							returnTypeSet = true
							return // Return early since we've set the return type
						}
					}
				}
			}

			if (!returnTypeSet) {
				const type = node.getReturnType()
				const typeText = type.getText(
					node,
					ts.TypeFormatFlags.NoTruncation |
						ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope |
						ts.TypeFormatFlags.UseTypeOfFunction |
						ts.TypeFormatFlags.UseFullyQualifiedType
				)

				// ignoreAnonymousObjectTypes: ignore functions that return anonymous object types
				if (options.ignoreAnonymousObjects && typeText.includes('{')) {
					return
				}

				// ignoreAny: ignore functions that return the any type
				if (options.ignoreAny && /\bany\b/.test(typeText)) {
					return
				}

				// ignoreUnknown: ignore functions that return the unknown type
				if (options.ignoreUnknown && /\bunknown\b/.test(typeText)) {
					return
				}

				node.setReturnType(typeText)
				modified = true
			}
		} catch (error) {
			const position = node.getStart()
			const { line, column } = sourceFile.getLineAndColumnAtPos(position)
			console.error(
				`Error processing node at ${filePath}:${line}:${column} - ${error instanceof Error ? error.message : String(error)}`
			)
		}
	})

	if (!modified) {
		return `No changes made to "${filePath}"`
	}

	if (options.dryRun) {
		return `Would modify "${filePath}" (dry run)`
	}

	await sourceFile.save()
	return `Processed and saved "${filePath}"`
}
