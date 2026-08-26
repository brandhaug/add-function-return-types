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
	tsconfig: undefined,
	useCache: true,
	clearCache: false
}
