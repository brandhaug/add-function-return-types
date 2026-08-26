import {
	type ArrowFunction,
	type Expression,
	type FunctionDeclaration,
	type FunctionExpression,
	type MethodDeclaration,
	Node,
	type Project,
	type SourceFile,
	SyntaxKind,
	ts,
	type TypeParameterDeclaration
} from 'ts-morph'
import type { Options } from './options.js'
import { formatFile, wrapLongType, type DetectedFormatter } from './formatter.js'
import { getTypeNestingDepth } from './utils.js'
import { recordAnnotation, recordSkip, type RunStats } from './stats.js'
import {
	ensureImports,
	planAnnotation,
	type ExternalTypeRef
} from './add-type-imports.js'


type FunctionLikeNode =
	| FunctionDeclaration
	| FunctionExpression
	| ArrowFunction
	| MethodDeclaration

/**
 * Derives a base name for a function-like declaration, used for naming
 * extracted type aliases. Returns undefined when no usable name exists.
 */
function getFunctionBaseName(node: FunctionLikeNode): string | undefined {
	if (
		Node.isFunctionDeclaration(node) ||
		Node.isMethodDeclaration(node) ||
		Node.isFunctionExpression(node)
	) {
		return node.getName() ?? undefined
	}

	if (Node.isArrowFunction(node)) {
		const parent = node.getParent()
		if (Node.isVariableDeclaration(parent)) return parent.getName()
		if (Node.isPropertyDeclaration(parent)) return parent.getName()
		if (Node.isPropertyAssignment(parent)) return parent.getName()
		if (
			Node.isBinaryExpression(parent) &&
			parent.getOperatorToken().getKind() === SyntaxKind.EqualsToken &&
			Node.isIdentifier(parent.getLeft())
		) {
			return parent.getLeft().getText()
		}
	}

	return undefined
}

/**
 * Extracts an overly complex inferred return type into an exported type alias
 * placed near the top of the file (after imports), and returns the alias name.
 * Returns undefined if extraction is unsafe (anonymous functions, or types
 * referencing the function's own type parameters).
 */
function extractTypeAlias(
	sourceFile: SourceFile,
	node: FunctionLikeNode,
	typeText: string
): string | undefined {
	const baseName = getFunctionBaseName(node)
	if (!baseName) return undefined

	const typeParamNames = new Set(
		node
			.getTypeParameters()
			.map((param: TypeParameterDeclaration): string => param.getName())
	)
	for (const name of typeParamNames) {
		if (new RegExp(`\\b${name}\\b`).test(typeText)) return undefined
	}

	const pascalName = baseName
		.replace(/[^a-zA-Z0-9]/g, '')
		.replace(/^./, (c: string): string => c.toUpperCase())
	if (!pascalName) return undefined

	let aliasName = `${pascalName}Return`
	let suffix = 2
	while (sourceFile.getTypeAlias(aliasName)) {
		aliasName = `${pascalName}Return${suffix}`
		suffix++
	}

	let insertIndex = 0
	const statements = sourceFile.getStatements()
	for (const [index, statement] of statements.entries()) {
		if (Node.isImportDeclaration(statement)) insertIndex = index + 1
	}

	sourceFile.insertTypeAlias(insertIndex, {
		isExported: true,
		name: aliasName,
		type: typeText
	})

	return aliasName
}

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
	options: Options,
	stats?: RunStats,
	formatter: DetectedFormatter | null = null
): Promise<string> {
	const sourceFile =
		project.getSourceFile(filePath) || project.addSourceFileAtPath(filePath)

	let modified = false
	const pendingImports = new Map<string, ExternalTypeRef>()

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
				if (stats) recordSkip(stats, 'alreadyAnnotated')
				return
			}

			// Check for allowedNames
			const name =
				Node.isMethodDeclaration(node) || Node.isFunctionDeclaration(node)
					? node.getName()
					: undefined

			if (name && options.ignoreFunctions.includes(name)) {
				if (stats) recordSkip(stats, 'ignoreFunctions')
				return
			}

			// Ignore functions based on options

			// ignoreExpressions: ignore function expressions (functions not part of a declaration)
			if (
				options.ignoreExpressions &&
				(Node.isFunctionExpression(node) || Node.isArrowFunction(node))
			) {
				if (stats) recordSkip(stats, 'ignoreExpressions')
				return
			}

			// ignoreTypedFunctionExpressions: ignore function expressions with type annotations on the variable
			if (
				options.ignoreTypedFunctionExpressions &&
				(Node.isFunctionExpression(node) || Node.isArrowFunction(node))
			) {
				const parent = node.getParent()
				if (Node.isVariableDeclaration(parent) && parent.getTypeNode()) {
					if (stats) recordSkip(stats, 'ignoreTypedFunctionExpressions')
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
					if (stats)
						recordSkip(stats, 'ignoreContextuallyTypedFunctionExpressions')
					return
				}
			}

			// ignoreFunctionsWithoutTypeParameters: ignore functions that don't have generic type parameters
			if (
				options.ignoreFunctionsWithoutTypeParameters &&
				node.getTypeParameters().length === 0
			) {
				if (stats) recordSkip(stats, 'ignoreFunctionsWithoutTypeParameters')
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
						if (stats) recordSkip(stats, 'ignoreHigherOrderFunctions')
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
					if (stats)
						recordSkip(
							stats,
							'ignoreConciseArrowFunctionExpressionsStartingWithVoid'
						)
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
					if (stats) recordSkip(stats, 'ignoreIIFEs')
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
						if (stats) recordSkip(stats, 'ignoreAnonymousFunctions')
						return
					}
				}
			}

			// Reset the return type so we get the inferred type
			const priorReturnType = options.overwrite
				? node.getReturnTypeNode()?.getText()
				: undefined
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
							node.setReturnType(
								formatter === null ? wrapLongType(paramTypeText) : paramTypeText
							)
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
					if (stats) recordSkip(stats, 'ignoreAnonymousObjects')
					return
				}

				// Never emit `any`: an explicit `any` annotation is strictly worse than no annotation.
				if (/\bany\b/.test(typeText)) {
					if (stats) recordSkip(stats, 'anyForbidden')
					return
				}

				// ignoreUnknown: ignore functions that return the unknown type
				if (options.ignoreUnknown && /\bunknown\b/.test(typeText)) {
					if (stats) recordSkip(stats, 'ignoreUnknown')
					return
				}

				// Complexity guard: cap printed length and nesting depth by
				// extracting the type into a named exported alias when possible.
				const nestingDepth = getTypeNestingDepth(typeText)
				if (
					typeText.length > options.maxTypeLength ||
					nestingDepth > options.maxTypeDepth
				) {
					const aliasName = extractTypeAlias(sourceFile, node, typeText)
					if (!aliasName) return
					node.setReturnType(aliasName)
					modified = true
					return
				}

				// Resolve referenced named types to imports; skip the function
				// if a referenced type cannot be resolved reliably (would emit TS2304)
				const plan = planAnnotation(project, type, sourceFile, node, typeText)
				if (!plan.ok) {
					if (options.overwrite && priorReturnType !== undefined) {
						node.setReturnType(priorReturnType)
					}
					return
				}

				for (const ref of plan.imports) {
					if (!pendingImports.has(ref.name)) {
						pendingImports.set(ref.name, ref)
					}
				}

				node.setReturnType(plan.typeText)
				modified = true
				if (stats) recordAnnotation(stats, plan.typeText)
			}
		} catch (error) {
			const position = node.getStart()
			const { line, column } = sourceFile.getLineAndColumnAtPos(position)
			console.error(
				`Error processing node at ${filePath}:${line}:${column} - ${error instanceof Error ? error.message : String(error)}`
			)
		}
	})

	if (pendingImports.size > 0) {
		ensureImports(sourceFile, [...pendingImports.values()])
		modified = true
	}

	if (!modified) {
		return `No changes made to "${filePath}"`
	}

	if (options.dryRun) {
		return `Would modify "${filePath}" (dry run)`
	}

	if (formatter !== null) {
		await formatFile(filePath, formatter).catch((error: unknown): void => {
			console.warn(
				`Warning: could not format "${filePath}" with ${formatter.name}:`,
				error instanceof Error ? error.message : String(error)
			)
		})
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
