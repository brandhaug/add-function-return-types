export type AnnotationKind =
	| 'primitive'
	| 'promise'
	| 'void'
	| 'unknown'
	| 'any'
	| 'jsx'
	| 'complex'

export type SkipReason =
	| 'ignoreExpressions'
	| 'ignoreTypedFunctionExpressions'
	| 'ignoreFunctionsWithoutTypeParameters'
	| 'ignoreHigherOrderFunctions'
	| 'ignoreConciseArrowFunctionExpressionsStartingWithVoid'
	| 'ignoreIIFEs'
	| 'ignoreAnonymousFunctions'
	| 'ignoreFunctions'
	| 'ignoreAnonymousObjects'
	| 'ignoreUnknown'
	| 'ignoreContextuallyTypedFunctionExpressions'
	| 'anyForbidden'
	| 'alreadyAnnotated'

export type RunStats = {
	annotations: Record<AnnotationKind, number>
	skipped: Record<SkipReason, number>
	filesModified: number
	filesUnchanged: number
	filesErrored: number
}

export const createRunStats = (): RunStats => ({
	annotations: {
		primitive: 0,
		promise: 0,
		void: 0,
		unknown: 0,
		any: 0,
		jsx: 0,
		complex: 0
	},
	skipped: {
		ignoreExpressions: 0,
		ignoreTypedFunctionExpressions: 0,
		ignoreFunctionsWithoutTypeParameters: 0,
		ignoreHigherOrderFunctions: 0,
		ignoreConciseArrowFunctionExpressionsStartingWithVoid: 0,
		ignoreIIFEs: 0,
		ignoreAnonymousFunctions: 0,
		ignoreFunctions: 0,
		ignoreAnonymousObjects: 0,
		ignoreUnknown: 0,
		ignoreContextuallyTypedFunctionExpressions: 0,
		anyForbidden: 0,
		alreadyAnnotated: 0
	},
	filesModified: 0,
	filesUnchanged: 0,
	filesErrored: 0
})

const primitives = new Set([
	'string',
	'number',
	'boolean',
	'null',
	'undefined',
	'bigint',
	'symbol'
])

export function classifyReturnType(typeText: string): AnnotationKind {
	const trimmed = typeText.trim()

	if (/^Promise<.+>$/s.test(trimmed)) return 'promise'
	if (trimmed === 'void') return 'void'
	if (trimmed === 'unknown') return 'unknown'
	if (trimmed === 'any') return 'any'
	if (/\b(?:JSX\.)?Element\b/.test(trimmed)) return 'jsx'
	if (primitives.has(trimmed.toLowerCase())) return 'primitive'
	return 'complex'
}

export function recordAnnotation(
	stats: RunStats,
	typeText: string
): AnnotationKind {
	const kind = classifyReturnType(typeText)
	stats.annotations[kind]++
	return kind
}

export function recordSkip(stats: RunStats, reason: SkipReason): void {
	stats.skipped[reason]++
}

const annotationOrder: AnnotationKind[] = [
	'primitive',
	'promise',
	'void',
	'unknown',
	'any',
	'jsx',
	'complex'
]

const skipOrder: SkipReason[] = [
	'ignoreExpressions',
	'ignoreTypedFunctionExpressions',
	'ignoreFunctionsWithoutTypeParameters',
	'ignoreHigherOrderFunctions',
	'ignoreConciseArrowFunctionExpressionsStartingWithVoid',
	'ignoreIIFEs',
	'ignoreAnonymousFunctions',
	'ignoreFunctions',
	'ignoreAnonymousObjects',
	'ignoreUnknown',
	'ignoreContextuallyTypedFunctionExpressions',
	'anyForbidden',
	'alreadyAnnotated'
]

/**
 * Adds the counters from one stats object into another. Used to aggregate the
 * per-worker stats of each batch back into the main run's totals.
 */
export function mergeStats(target: RunStats, source: RunStats): void {
	for (const kind of annotationOrder) {
		target.annotations[kind] += source.annotations[kind]
	}
	for (const reason of skipOrder) {
		target.skipped[reason] += source.skipped[reason]
	}
}

const pad = (label: string): string => label.padEnd(12)

export function formatStatsTable(stats: RunStats): string {
	const annotationLines = annotationOrder.map((kind): string => {
		return `  ${pad(kind)} ${stats.annotations[kind]}`
	})

	const skipLines = Object.entries(stats.skipped)
		.filter(([, count]): boolean => count > 0)
		.map(([reason, count]): string => {
			return `  ${reason} ${count}`
		})

	const filesLine = [
		`modified: ${stats.filesModified}`,
		`unchanged: ${stats.filesUnchanged}`,
		`errors: ${stats.filesErrored}`
	].join(', ')

	const totalAnnotations = Object.values(stats.annotations).reduce(
		(sum, count): number => sum + count,
		0
	)
	const totalSkipped = Object.values(stats.skipped).reduce(
		(sum, count): number => sum + count,
		0
	)

	const lines = [
		'Summary statistics',
		`  Files (${filesLine})`,
		`  Annotations added: ${totalAnnotations}`,
		...annotationLines,
		totalSkipped > 0
			? `  Skipped: ${totalSkipped}\n${skipLines.join('\n')}`
			: undefined
	]

	return lines.filter((line): line is string => line !== undefined).join('\n')
}
