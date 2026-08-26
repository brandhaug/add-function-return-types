import fs from 'node:fs'
import path from 'node:path'
import {
	Node,
	type ImportDeclaration,
	type Node as TsMorphNode,
	type Project,
	type SourceFile,
	type Symbol as TsMorphSymbol,
	type Type
} from 'ts-morph'

export type ExternalTypeRef = { name: string; moduleSpecifier: string }

const NON_TYPE_IDENTIFIERS = new Set([
	'Any',
	'Array',
	'ArrayLike',
	'AsyncGenerator',
	'AsyncIterable',
	'AsyncIterator',
	'BigInt',
	'Boolean',
	'Capitalized',
	'Date',
	'Error',
	'Exclude',
	'Extract',
	'Function',
	'Generator',
	'Iterable',
	'Iterator',
	'Lowercase',
	'Map',
	'NonNullable',
	'Number',
	'Object',
	'Omit',
	'Parameters',
	'Partial',
	'Pick',
	'Promise',
	'PromiseLike',
	'Readonly',
	'ReadonlyArray',
	'Record',
	'RegExp',
	'Required',
	'ReturnType',
	'Set',
	'String',
	'Symbol',
	'ThisType',
	'Uncapitalize',
	'Uppercase',
	'Awaited',
	'WeakMap',
	'WeakSet',
	'any',
	'bigint',
	'boolean',
	'false',
	'infer',
	'keyof',
	'never',
	'null',
	'number',
	'object',
	'readonly',
	'string',
	'symbol',
	'this',
	'true',
	'undefined',
	'unknown',
	'void'
])

/**
 * Removes constructs from an inferred type's text that would otherwise pollute
 * identifier extraction (dynamic `import(...)` types and string literals).
 */
export function sanitizeTypeText(text: string): string {
	return text
		.replaceAll(/\bimport\s*\(([^)]*)\)\s*\.\s*/g, '')
		.replaceAll(/(["'])(?:\\.|(?!\1)[^\\\n])*\1/g, "''")
		.trim()
}

/**
 * Extracts capitalized identifiers from a type's text — the plausible named
 * type entities that may need imports.
 */
export function extractTypeIdentifierCandidates(text: string): Set<string> {
	const names = new Set<string>()
	for (const match of text.matchAll(/\b[A-Za-z_$][\w$]*\b/g)) {
		const name = match[0]
		if (!/^[A-Z]/.test(name)) continue
		if (NON_TYPE_IDENTIFIERS.has(name)) continue
		names.add(name)
	}
	return names
}

/**
 * Rewrites namespace-qualified references (e.g. `NS.Widget`) to the bare
 * imported name (`Widget`) once an import for it will be added.
 */
export function stripQualifiers(text: string, name: string): string {
	return text.replaceAll(
		new RegExp(`(?:[A-Za-z_$][\\w$]*\\.)+${name}\\b`, 'g'),
		name
	)
}

/**
 * Collects names that are already usable in the file: imports, local
 * declarations and in-scope type parameters.
 */
export function collectLocallyAvailableNames(
	sourceFile: SourceFile,
	fnNode: TsMorphNode
): Set<string> {
	const names = new Set<string>()

	for (const imp of sourceFile.getImportDeclarations()) {
		const defaultImport = imp.getDefaultImport()
		if (defaultImport) names.add(defaultImport.getText())
		const namespaceImport = imp.getNamespaceImport()
		if (namespaceImport) names.add(namespaceImport.getText())
		for (const specifier of imp.getNamedImports()) {
			names.add(specifier.getName())
		}
	}

	for (const decl of [
		...sourceFile.getFunctions(),
		...sourceFile.getClasses(),
		...sourceFile.getInterfaces(),
		...sourceFile.getTypeAliases(),
		...sourceFile.getEnums(),
		...sourceFile.getModules(),
		...sourceFile.getVariableDeclarations()
	]) {
		const name = decl.getName()
		if (name) names.add(name)
	}

	let current: TsMorphNode | undefined = fnNode
	while (current) {
		if (
			Node.isFunctionDeclaration(current) ||
			Node.isMethodDeclaration(current) ||
			Node.isArrowFunction(current) ||
			Node.isFunctionExpression(current)
		) {
			for (const typeParam of current.getTypeParameters()) {
				names.add(typeParam.getName())
			}
		}
		current = current.getParent()
	}

	return names
}

function isExportedDeclaration(decl: TsMorphNode): boolean {
	if (Node.isVariableDeclaration(decl)) {
		return decl.getVariableStatement()?.isExported() ?? false
	}
	if (
		Node.isFunctionDeclaration(decl) ||
		Node.isClassDeclaration(decl) ||
		Node.isInterfaceDeclaration(decl) ||
		Node.isTypeAliasDeclaration(decl) ||
		Node.isEnumDeclaration(decl)
	) {
		return decl.isExported()
	}
	return false
}

/**
 * Walks the inferred type graph and maps referenced type entity names to the
 * source files of their (external, exported) declarations.
 */
export function collectExternalTypeDeclarations(
	rootType: Type,
	sourceFile: SourceFile,
	candidates: Set<string>
): Map<string, SourceFile> {
	const result = new Map<string, SourceFile>()
	const visited = new WeakSet<object>()

	const consider = (symbol: TsMorphSymbol): void => {
		const name = symbol.getName()
		if (!candidates.has(name) || result.has(name)) return
		for (const decl of symbol.getDeclarations()) {
			const declSourceFile = decl.getSourceFile()
			if (declSourceFile === sourceFile) continue
			if (!isExportedDeclaration(decl)) continue
			result.set(name, declSourceFile)
			return
		}
	}

	const walk = (type: Type | undefined, depth: number): void => {
		if (!type || depth > 6) return
		if (visited.has(type.compilerType)) return
		visited.add(type.compilerType)

		const symbol = type.getAliasSymbol() ?? type.getSymbol()
		if (symbol) consider(symbol)

		for (const arg of type.getTypeArguments()) walk(arg, depth + 1)
		if (type.isUnion()) {
			for (const member of type.getUnionTypes()) walk(member, depth + 1)
		}
		if (type.isIntersection()) {
			for (const member of type.getIntersectionTypes()) {
				walk(member, depth + 1)
			}
		}
		if (type.isTuple()) {
			for (const element of type.getTupleElements()) {
				walk(element, depth + 1)
			}
		}
		const withTarget = type as Type & { getTarget?: () => Type | undefined }
		const target = withTarget.getTarget?.()
		if (target) walk(target, depth + 1)
		const stringIndex = type.getStringIndexType()
		if (stringIndex) walk(stringIndex, depth + 1)
		const numberIndex = type.getNumberIndexType()
		if (numberIndex) walk(numberIndex, depth + 1)
		for (const signature of type.getCallSignatures()) {
			walk(signature.getReturnType(), depth + 1)
		}
		if (depth < 3) {
			for (const property of type.getProperties()) {
				try {
					walk(property.getTypeAtLocation(sourceFile), depth + 1)
				} catch {
					// Property types are best-effort
				}
			}
		}
	}

	walk(rootType, 0)
	return result
}

function isAmbientLibFile(filePath: string): boolean {
	return (
		/[\\/]node_modules[\\/]typescript[\\/]/.test(filePath) ||
		/(^|[\\/])lib\.[^\\/]+\.d\.ts$/.test(filePath)
	)
}

/**
 * Computes the module specifier to import a declaration from. Returns `null`
 * for ambient/library declarations that are globally available, and `undefined`
 * when no reliable specifier can be determined.
 */
export function getModuleSpecifier(
	declFile: SourceFile,
	currentFile: SourceFile
): string | null | undefined {
	const declPath = declFile.getFilePath()
	if (isAmbientLibFile(declPath)) return null

	const nodeModulesIndex = declPath.indexOf(
		`${path.sep}node_modules${path.sep}`
	)
	if (nodeModulesIndex !== -1) {
		let dir = path.dirname(declPath)
		while (dir.includes(`${path.sep}node_modules`)) {
			const packageJsonPath = path.join(dir, 'package.json')
			if (fs.existsSync(packageJsonPath)) {
				try {
					const parsed: unknown = JSON.parse(
						fs.readFileSync(packageJsonPath, 'utf8')
					)
					const pkgName =
						typeof parsed === 'object' &&
						parsed !== null &&
						'name' in parsed &&
						typeof parsed.name === 'string'
							? parsed.name
							: undefined
					if (!pkgName) return undefined
					let rel = path.relative(dir, declPath).split(path.sep).join('/')
					rel = rel.replace(/\.(d\.)?(m|c)?tsx?$/, '')
					rel = rel.replace(/\/index$/, '')
					if (rel.startsWith('node_modules')) return undefined
					return rel ? `${pkgName}/${rel}` : pkgName
				} catch {
					return undefined
				}
			}
			const parent = path.dirname(dir)
			if (parent === dir) return undefined
			dir = parent
		}
		return undefined
	}

	let rel = path
		.relative(path.dirname(currentFile.getFilePath()), declPath)
		.split(path.sep)
		.join('/')
	rel = rel.replace(/\.tsx?$/, '')
	if (!rel.startsWith('.')) rel = `./${rel}`
	return rel
}

/**
 * Returns the subset of names that are globally available without an import,
 * verified through the type checker using a throwaway probe file.
 */
export function resolveGloballyAvailableNames(
	project: Project,
	names: string[]
): Set<string> {
	const globallyAvailable = new Set<string>()
	if (names.length === 0) return globallyAvailable

	const probePath = path.join(path.sep, '__afrt_probe__.ts')
	const probe =
		project.getSourceFile(probePath) ?? project.createSourceFile(probePath, '')

	probe.replaceWithText(
		names
			.map((name, i): string => `declare const __p${i}: ${name}<unknown>`)
			.join('\n')
	)

	names.forEach((name, i): void => {
		const line = i + 1
		const cannotFind = probe
			.getPreEmitDiagnostics()
			.some((diagnostic): boolean => {
				if (diagnostic.getLineNumber() !== line) return false
				const message = diagnostic.getMessageText()
				const text =
					typeof message === 'string' ? message : message.getMessageText()
				return text.includes('Cannot find name') && text.includes(name)
			})
		if (!cannotFind) globallyAvailable.add(name)
	})

	return globallyAvailable
}

function importHasNamed(
	importDeclaration: ImportDeclaration,
	name: string
): boolean {
	return importDeclaration
		.getNamedImports()
		.some((specifier): boolean => specifier.getName() === name)
}

function normalizedSpecifier(specifier: string): string {
	return specifier.replace(/\.(m|c)?js$/, '')
}

/**
 * Adds import statements for the given references, merging into existing
 * import declarations and respecting the file's type-import style.
 */
export function ensureImports(
	sourceFile: SourceFile,
	refs: ExternalTypeRef[]
): void {
	const importDeclarations = sourceFile.getImportDeclarations()
	const fileUsesTypeOnlyImports = importDeclarations.some(
		(imp): boolean =>
			imp.isTypeOnly() ||
			imp.getNamedImports().some((specifier): boolean => specifier.isTypeOnly())
	)
	const fileUsesInlineTypeImports = importDeclarations.some((imp): boolean =>
		imp.getNamedImports().some((specifier): boolean => specifier.isTypeOnly())
	)

	for (const ref of refs) {
		const existing = importDeclarations.find(
			(imp): boolean =>
				normalizedSpecifier(imp.getModuleSpecifierValue()) ===
				normalizedSpecifier(ref.moduleSpecifier)
		)

		if (existing) {
			if (importHasNamed(existing, ref.name)) continue
			if (existing.isTypeOnly()) {
				existing.addNamedImport(ref.name)
			} else if (fileUsesInlineTypeImports) {
				existing.insertNamedImport(0, `type ${ref.name}`)
			} else {
				existing.addNamedImport(ref.name)
			}
		} else if (importDeclarations.length > 0 && !fileUsesTypeOnlyImports) {
			sourceFile.addImportDeclaration({
				moduleSpecifier: ref.moduleSpecifier,
				namedImports: [ref.name]
			})
		} else {
			sourceFile.addImportDeclaration({
				moduleSpecifier: ref.moduleSpecifier,
				namedImports: [`type ${ref.name}`]
			})
		}
	}
}

export type AnnotationPlan =
	| { ok: true; typeText: string; imports: ExternalTypeRef[] }
	| { ok: false }

/**
 * Decides how to annotate a function whose inferred return type text is
 * `typeText`: resolves referenced external types to imports, or reports that
 * the function should be skipped when a name cannot be resolved reliably.
 */
export function planAnnotation(
	project: Project,
	inferredType: Type,
	sourceFile: SourceFile,
	fnNode: TsMorphNode,
	rawTypeText: string
): AnnotationPlan {
	if (!rawTypeText || rawTypeText.includes('<error>')) return { ok: false }

	const sanitized = sanitizeTypeText(rawTypeText)
	if (!sanitized) return { ok: false }

	const locals = collectLocallyAvailableNames(sourceFile, fnNode)
	const candidates = extractTypeIdentifierCandidates(sanitized)
	for (const local of locals) candidates.delete(local)

	const imports: ExternalTypeRef[] = []
	if (candidates.size > 0) {
		const externals = collectExternalTypeDeclarations(
			inferredType,
			sourceFile,
			candidates
		)
		const unresolved: string[] = []

		for (const candidate of candidates) {
			const declFile = externals.get(candidate)
			if (!declFile) {
				unresolved.push(candidate)
				continue
			}
			const specifier = getModuleSpecifier(declFile, sourceFile)
			if (specifier === undefined) return { ok: false }
			if (specifier !== null) {
				imports.push({ name: candidate, moduleSpecifier: specifier })
			}
		}

		if (unresolved.length > 0) {
			const globals = resolveGloballyAvailableNames(project, unresolved)
			if (globals.size !== unresolved.length) return { ok: false }
		}
	}

	let finalText = sanitized
	for (const ref of imports) {
		finalText = stripQualifiers(finalText, ref.name)
	}

	return { ok: true, typeText: finalText, imports }
}
