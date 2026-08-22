import * as p from '@clack/prompts'
import { addFunctionReturnTypes } from './add-function-return-types.js'
import { defaultOptions, type Options } from './options.js'

const booleanFlags = [
	'shallow',
	'overwrite',
	'ignore-any',
	'ignore-unknown',
	'ignore-anonymous-objects',
	'ignore-expressions',
	'ignore-functions-without-type-parameters',
	'ignore-higher-order-functions',
	'ignore-typed-function-expressions',
	'ignore-iifes',
	'ignore-concise-arrow-function-expressions-starting-with-void',
	'ignore-anonymous-functions',
	'dry-run'
] as const

const valueFlags = ['ignore-files', 'ignore-functions', 'tsconfig'] as const

type ParsedArgs = Partial<Record<(typeof booleanFlags)[number], boolean>> &
	Partial<Record<(typeof valueFlags)[number], string>> & { path?: string }

const booleanFlagSet: ReadonlySet<string> = new Set(booleanFlags)
const valueFlagSet: ReadonlySet<string> = new Set(valueFlags)

export const parseArgv = (argv: string[]): ParsedArgs => {
	const parsed: ParsedArgs = {}

	for (const arg of argv) {
		const [rawKey, inlineValue] = arg.split('=', 2)
		const key = (rawKey ?? '').replace(/^--/, '')

		if (booleanFlagSet.has(key)) {
			Object.assign(parsed, { [key]: true })
			continue
		}

		if (!valueFlagSet.has(key)) {
			parsed.path = key
			continue
		}

		const value = inlineValue ?? ''
		if (value === '') {
			throw new Error(`Missing value for --${key}`)
		}
		Object.assign(parsed, { [key]: value })
	}

	return parsed
}

const buildOptions = (
	path: string,
	flags: {
		shallow?: boolean
		ignoreFiles?: string[]
		ignoreFunctions?: string[]
		tsconfig?: string
	} & Partial<
		Pick<
			Options,
			| 'overwrite'
			| 'ignoreAny'
			| 'ignoreUnknown'
			| 'ignoreAnonymousObjects'
			| 'ignoreExpressions'
			| 'ignoreFunctionsWithoutTypeParameters'
			| 'ignoreHigherOrderFunctions'
			| 'ignoreTypedFunctionExpressions'
			| 'ignoreIIFEs'
			| 'ignoreConciseArrowFunctionExpressionsStartingWithVoid'
			| 'ignoreAnonymousFunctions'
			| 'dryRun'
		>
	>
): { path: string; shallow: boolean; ignoreFiles: string[]; overwrite: boolean; ignoreConciseArrowFunctionExpressionsStartingWithVoid: boolean; ignoreExpressions: boolean; ignoreFunctionsWithoutTypeParameters: boolean; ignoreHigherOrderFunctions: boolean; ignoreTypedFunctionExpressions: boolean; ignoreIIFEs: boolean; ignoreFunctions: string[]; ignoreAnonymousObjects: boolean; ignoreAny: boolean; ignoreUnknown: boolean; ignoreAnonymousFunctions: boolean; dryRun: boolean; tsconfig: string | undefined; } => ({
	path,
	shallow: flags.shallow ?? defaultOptions.shallow,
	ignoreFiles: flags.ignoreFiles ?? defaultOptions.ignoreFiles,
	overwrite: flags.overwrite ?? defaultOptions.overwrite,
	ignoreConciseArrowFunctionExpressionsStartingWithVoid:
		flags.ignoreConciseArrowFunctionExpressionsStartingWithVoid ??
		defaultOptions.ignoreConciseArrowFunctionExpressionsStartingWithVoid,
	ignoreExpressions:
		flags.ignoreExpressions ?? defaultOptions.ignoreExpressions,
	ignoreFunctionsWithoutTypeParameters:
		flags.ignoreFunctionsWithoutTypeParameters ??
		defaultOptions.ignoreFunctionsWithoutTypeParameters,
	ignoreHigherOrderFunctions:
		flags.ignoreHigherOrderFunctions ??
		defaultOptions.ignoreHigherOrderFunctions,
	ignoreTypedFunctionExpressions:
		flags.ignoreTypedFunctionExpressions ??
		defaultOptions.ignoreTypedFunctionExpressions,
	ignoreIIFEs: flags.ignoreIIFEs ?? defaultOptions.ignoreIIFEs,
	ignoreFunctions: flags.ignoreFunctions ?? defaultOptions.ignoreFunctions,
	ignoreAnonymousObjects:
		flags.ignoreAnonymousObjects ?? defaultOptions.ignoreAnonymousObjects,
	ignoreAny: flags.ignoreAny ?? defaultOptions.ignoreAny,
	ignoreUnknown: flags.ignoreUnknown ?? defaultOptions.ignoreUnknown,
	ignoreAnonymousFunctions:
		flags.ignoreAnonymousFunctions ?? defaultOptions.ignoreAnonymousFunctions,
	dryRun: flags.dryRun ?? defaultOptions.dryRun,
	tsconfig: flags.tsconfig ?? defaultOptions.tsconfig
})

type IgnoreValue = Exclude<
	keyof Options,
	'path' | 'ignoreFiles' | 'ignoreFunctions' | 'tsconfig'
>

type IgnoreOption = {
	value: IgnoreValue
	label: string
	hint: string
}

const ignoreOptionGroups: { title: string; options: IgnoreOption[] }[] = [
	{
		title: 'Scope',
		options: [
			{
				value: 'shallow',
				label: 'Shallow',
				hint: 'Process only the top-level directory'
			},
			{
				value: 'ignoreExpressions',
				label: 'Ignore expressions',
				hint: 'Ignore function expressions (not part of a declaration)'
			},
			{
				value: 'ignoreAnonymousFunctions',
				label: 'Ignore anonymous functions',
				hint: 'Functions without names'
			}
		]
	},
	{
		title: 'Return types',
		options: [
			{ value: 'ignoreAny', label: 'Ignore any', hint: 'Return type any' },
			{
				value: 'ignoreUnknown',
				label: 'Ignore unknown',
				hint: 'Return type unknown'
			},
			{
				value: 'ignoreAnonymousObjects',
				label: 'Ignore anonymous objects',
				hint: 'Anonymous object return types'
			}
		]
	},
	{
		title: 'Function shapes',
		options: [
			{
				value: 'ignoreFunctionsWithoutTypeParameters',
				label: 'Ignore functions without type parameters',
				hint: "Functions that don't have generic type parameters"
			},
			{
				value: 'ignoreHigherOrderFunctions',
				label: 'Ignore higher-order functions',
				hint: 'Functions immediately returning another function expression'
			},
			{
				value: 'ignoreTypedFunctionExpressions',
				label: 'Ignore typed function expressions',
				hint: 'Function expressions with type annotations on the variable'
			},
			{
				value: 'ignoreIIFEs',
				label: 'Ignore IIFEs',
				hint: 'Immediately invoked function expressions'
			},
			{
				value: 'ignoreConciseArrowFunctionExpressionsStartingWithVoid',
				label: 'Ignore void-starting arrow functions',
				hint: 'Arrow functions starting with the `void` keyword'
			}
		]
	}
]

const handleCancel = <T>(value: T | symbol): T => {
	const cancelled: boolean = p.isCancel(value)
	if (cancelled) {
		p.cancel('Operation cancelled')
		process.exit(0)
	}
	return value as T
}

const promptForOptions = async (): Promise<{ path: string; shallow: boolean; ignoreFiles: string[]; overwrite: boolean; ignoreConciseArrowFunctionExpressionsStartingWithVoid: boolean; ignoreExpressions: boolean; ignoreFunctionsWithoutTypeParameters: boolean; ignoreHigherOrderFunctions: boolean; ignoreTypedFunctionExpressions: boolean; ignoreIIFEs: boolean; ignoreFunctions: string[]; ignoreAnonymousObjects: boolean; ignoreAny: boolean; ignoreUnknown: boolean; ignoreAnonymousFunctions: boolean; dryRun: boolean; tsconfig: string | undefined; }> => {
	p.intro('add-function-return-types')
	p.log.message(
		'A CLI tool to add explicit return types to TypeScript functions'
	)

	const path = handleCancel(
		await p.text({
			message: 'Path to the directory or file to process',
			initialValue: defaultOptions.path
		})
	)

	let ignoreValues: string[] = []
	const configureIgnore = handleCancel(
		await p.confirm({ message: 'Configure ignore options?' })
	)

	if (configureIgnore) {
		for (const group of ignoreOptionGroups) {
			const selected = handleCancel(
				await p.multiselect({
					message: `Select ${group.title.toLowerCase()} options to ignore`,
					required: false,
					options: group.options.map(
						(option): { value: IgnoreValue; label: string; hint: string; } => ({
							value: option.value,
							label: option.label,
							hint: option.hint
						})
					)
				})
			)
			ignoreValues.push(...selected)
		}
	}

	const dryRun = handleCancel(
		await p.confirm({
			message: 'Dry run? (preview changes without modifying files)',
			initialValue: defaultOptions.dryRun
		})
	)

	const overwrite = dryRun
		? false
		: handleCancel(
				await p.confirm({ message: 'Overwrite existing return types?' })
			)

	const tsconfigInput = handleCancel(
		await p.text({
			message: 'Path to a tsconfig.json file for type resolution (optional)',
			placeholder: 'Leave empty for default resolution'
		})
	)

	const tsconfig =
		typeof tsconfigInput === 'string' && tsconfigInput.length > 0
			? tsconfigInput
			: undefined

	const selected = new Set(ignoreValues)
	const flagFor = (key: IgnoreValue): true | undefined =>
		selected.has(key) || undefined

	return buildOptions(path, {
		shallow: flagFor('shallow'),
		ignoreExpressions: flagFor('ignoreExpressions'),
		ignoreAnonymousFunctions: flagFor('ignoreAnonymousFunctions'),
		ignoreAny: flagFor('ignoreAny'),
		ignoreUnknown: flagFor('ignoreUnknown'),
		ignoreAnonymousObjects: flagFor('ignoreAnonymousObjects'),
		ignoreFunctionsWithoutTypeParameters: flagFor(
			'ignoreFunctionsWithoutTypeParameters'
		),
		ignoreHigherOrderFunctions: flagFor('ignoreHigherOrderFunctions'),
		ignoreTypedFunctionExpressions: flagFor('ignoreTypedFunctionExpressions'),
		ignoreIIFEs: flagFor('ignoreIIFEs'),
		ignoreConciseArrowFunctionExpressionsStartingWithVoid: flagFor(
			'ignoreConciseArrowFunctionExpressionsStartingWithVoid'
		),
		dryRun,
		overwrite,
		tsconfig
	})
}

export async function main(): Promise<void> {
	const userArguments = process.argv.slice(2)

	let options: Options

	if (userArguments.length > 0) {
		// Legacy non-interactive mode: flags were passed on the command line.
		const parsed = parseArgv(userArguments)
		options = buildOptions(parsed.path ?? defaultOptions.path, {
			shallow: parsed['shallow'],
			overwrite: parsed['overwrite'],
			ignoreAny: parsed['ignore-any'],
			ignoreUnknown: parsed['ignore-unknown'],
			ignoreAnonymousObjects: parsed['ignore-anonymous-objects'],
			ignoreExpressions: parsed['ignore-expressions'],
			ignoreFunctionsWithoutTypeParameters:
				parsed['ignore-functions-without-type-parameters'],
			ignoreHigherOrderFunctions: parsed['ignore-higher-order-functions'],
			ignoreTypedFunctionExpressions:
				parsed['ignore-typed-function-expressions'],
			ignoreIIFEs: parsed['ignore-iifes'],
			ignoreConciseArrowFunctionExpressionsStartingWithVoid:
				parsed['ignore-concise-arrow-function-expressions-starting-with-void'],
			ignoreAnonymousFunctions: parsed['ignore-anonymous-functions'],
			dryRun: parsed['dry-run'],
			ignoreFiles: parsed['ignore-files']?.split(','),
			ignoreFunctions: parsed['ignore-functions']?.split(','),
			tsconfig: parsed['tsconfig']
		})
	} else {
		options = await promptForOptions()
	}

	await addFunctionReturnTypes(options)

	p.outro(
		options.dryRun
			? 'Dry run complete — no files were modified'
			: 'Done! Explicit return types have been added.'
	)
}
