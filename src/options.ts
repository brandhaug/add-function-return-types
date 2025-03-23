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
  ignoreFunctions: string[]
  overwrite: boolean
  ignoreAnonymousObjects: boolean
  ignoreAny: boolean
  ignoreUnknown: boolean
  ignoreAnonymousFunctions: boolean
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
  ignoreFunctions: [],
  ignoreIIFEs: false,
  overwrite: false,
  ignoreAnonymousObjects: false,
  ignoreAnonymousFunctions: false,
  ignoreAny: false,
  ignoreUnknown: false
}
