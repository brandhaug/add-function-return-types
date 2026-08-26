export type Options = {
	path: string
	shallow: boolean
	ignoreFiles: string[]
	ignoreConciseArrowFunctionExpressionsStartingWithVoid: boolean
	ignoreExpressions: boolean
	ignoreFunctionsWithoutTypeParameters: boolean
	ignoreHigherOrderFunctions: boolean
	ignoreIIFEs: boolean
	ignoreTypedFunctionExpressions: boolean
	ignoreContextuallyTypedFunctionExpressions: boolean
	ignoreFunctions: string[]
	overwrite: boolean
	ignoreAnonymousObjects: boolean
	ignoreUnknown: boolean
	ignoreAnonymousFunctions: boolean
	dryRun: boolean
	includeGenerated: boolean
	format: boolean
	maxTypeLength: number
	maxTypeDepth: number
	json: boolean
	tsconfig: string | undefined
	useCache: boolean
	clearCache: boolean
}

export const defaultOptions: Options = {
	path: '.',
	shallow: false,
	ignoreFiles: [],
	ignoreConciseArrowFunctionExpressionsStartingWithVoid: false,
	ignoreExpressions: false,
	ignoreFunctionsWithoutTypeParameters: false,
	ignoreHigherOrderFunctions: false,
	ignoreTypedFunctionExpressions: false,
	ignoreContextuallyTypedFunctionExpressions: true,
	ignoreFunctions: [],
	ignoreIIFEs: false,
	overwrite: false,
	ignoreAnonymousObjects: false,
	ignoreAnonymousFunctions: false,
	ignoreUnknown: false,
	dryRun: false,
	includeGenerated: false,
	format: true,
	maxTypeLength: 150,
	maxTypeDepth: 4,
	json: false,
	tsconfig: undefined,
	useCache: true,
	clearCache: false
}

export const defaultGeneratedIgnorePatterns = [
	'**/*.gen.ts',
	'**/*.gen.tsx',
	'**/*.generated.ts',
	'**/*.generated.tsx',
	'**/__generated__/**',
	'**/generated/**'
]
