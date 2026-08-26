import { type Expression, Node, type Project, SyntaxKind, ts } from 'ts-morph'
import type { Options } from './options.js'

/**
 * Processes a single TypeScript file, adding explicit return types to functions where needed.
 * The file is saved unless `options.dryRun` is set.
 * @param project - The ts-morph Project instance that owns the file.
 * @param filePath - Absolute path to the file to process.
 * @param options - The options object.
 * @returns A status message describing what happened.
 */
export async function processFile(
	project: Project,
	filePath: string,
	options: Options
): Promise<string> {
	const sourceFile =
		project.getSourceFile(filePath) || project.addSourceFileAtPath(filePath)

	let modified = false

	sourceFile.forEachDescendant((node): undefined => {
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

			// ignoreContextuallyTypedFunctionExpressions: skip function expressions
			// whose type is already fixed by context (e.g. arguments to a call,
			// tagged templates, or properties of object literals with a known
			// contextual type). Annotating these yields huge structural expansions.
			if (
				options.ignoreContextuallyTypedFunctionExpressions &&
				(Node.isFunctionExpression(node) || Node.isArrowFunction(node))
			) {
				const contextualType = node.getContextualType()
				if (
					contextualType !== undefined &&
					contextualType.getCallSignatures().length > 0
				) {
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

				// Never emit `any`: an explicit `any` annotation is strictly worse than no annotation.
				if (/\bany\b/.test(typeText)) {
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

/**
 * Creates a ts-morph Project configured from the given options.
 * Each worker process/thread creates its own Project and reuses it for every
 * file in its batch so the underlying language service/program is shared.
 */
export async function createProject(
	options: Options,
	types: string[] = []
): Promise<Project> {
	const { ModuleKind, Project, ScriptTarget } = await import('ts-morph')
	const path = await import('node:path')

	if (options.tsconfig) {
		return new Project({
			tsConfigFilePath: path.resolve(options.tsconfig),
			skipAddingFilesFromTsConfig: true
		})
	}

	return new Project({
		compilerOptions: {
			allowSyntheticDefaultImports: true,
			esModuleInterop: true,
			module: ModuleKind.ESNext,
			target: ScriptTarget.ESNext,
			strict: true,
			noUncheckedIndexedAccess: true,
			types,
			moduleResolution: ts.ModuleResolutionKind.NodeNext
		},
		skipAddingFilesFromTsConfig: true
	})
}
