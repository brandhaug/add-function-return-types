import * as p from '@clack/prompts'
import { addFunctionReturnTypes } from './add-function-return-types.js'
import { defaultOptions, type Options } from './options.js'

const booleanFlags = [
	'shallow',
	'overwrite',
	'ignore-unknown',
	'ignore-anonymous-objects',
	'ignore-expressions',
	'ignore-functions-without-type-parameters',
	'ignore-higher-order-functions',
	'ignore-typed-function-expressions',
	'ignore-contextually-typed-function-expressions',
	'ignore-iifes',
	'ignore-concise-arrow-function-expressions-starting-with-void',
	'ignore-anonymous-functions',
	'dry-run',
	'no-cache',
	'clear-cache',
	'include-generated',
	'json'
] as const

const valueFlags = ['ignore-files', 'ignore-functions', 'tsconfig'] as const

type ParsedArgs = Partial<Record<(typeof booleanFlags)[number], boolean>> &
	Partial<Record<(typeof valueFlags)[number], string>> & {
		path?: string
		help?: boolean
	}

export type { ParsedArgs }

const booleanFlagSet: ReadonlySet<string> = new Set(booleanFlags)
const valueFlagSet: ReadonlySet<string> = new Set(valueFlags)

const usage = `Usage: add-function-return-types [path] [options]

Positional:
  path                     Directory or file to process

Options:
  --shallow                Process only the top-level directory
  --overwrite              Overwrite existing return types
  --dry-run                Preview changes without modifying files
  --no-cache               Disable the incremental cache
  --clear-cache            Delete the cache file before processing
  --include-generated      Also process generated files (*.gen.ts, *.generated.ts, __generated__/, generated/)
  --json                   Emit machine-readable JSON summary instead of a table
  --tsconfig=<path>        Path to a tsconfig.json for type resolution
  --ignore-files=<glob,..> File patterns to ignore
  --ignore-functions=<names>
                           Function names to ignore
    --ignore-unknown         Ignore 'unknown' return types
  --ignore-anonymous-objects
  --ignore-expressions
  --ignore-functions-without-type-parameters
  --ignore-higher-order-functions
  --ignore-typed-function-expressions
  --no-ignore-contextually-typed-function-expressions
                           Annotate function expressions even when their type is
                           fixed by context (skipping is the default)
  --ignore-iifes
  --ignore-concise-arrow-function-expressions-starting-with-void
  --ignore-anonymous-functions
  -h, --help               Show this help`

export const parseArgv = (argv: string[]): ParsedArgs => {
	const parsed: ParsedArgs & { help?: boolean } = {}

	for (const arg of argv) {
		const [rawKey, inlineValue] = arg.split('=', 2)
		const key = (rawKey ?? '').replace(/^--/, '')

		if (key === 'help' || key === 'h') {
			parsed.help = true
			continue
		}

		if (booleanFlagSet.has(key)) {
			Object.assign(parsed, { [key]: true })
			continue
		}

		if (key.startsWith('no-') && booleanFlagSet.has(key.slice(3))) {
			Object.assign(parsed, { [key.slice(3)]: false })
			continue
		}

		if (!valueFlagSet.has(key)) {
			if (arg.startsWith('-')) {
				throw new Error(`Unknown option: ${arg}`)
			}
			parsed.path = key
			continue
		}

		const value = inlineValue ?? ''
		if (value === '') {
			throw new Error(`Missing value for --${key} (use --${key}=<value>)`)
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
			| 'ignoreUnknown'
			| 'ignoreAnonymousObjects'
			| 'ignoreExpressions'
			| 'ignoreFunctionsWithoutTypeParameters'
			| 'ignoreHigherOrderFunctions'
			| 'ignoreTypedFunctionExpressions'
			| 'ignoreContextuallyTypedFunctionExpressions'
			| 'ignoreIIFEs'
			| 'ignoreConciseArrowFunctionExpressionsStartingWithVoid'
			| 'ignoreAnonymousFunctions'
			| 'dryRun'
			| 'useCache'
			| 'clearCache'
			| 'includeGenerated'
			| 'json'
		>
	>
): Options => ({
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
	ignoreContextuallyTypedFunctionExpressions:
		flags.ignoreContextuallyTypedFunctionExpressions ??
		defaultOptions.ignoreContextuallyTypedFunctionExpressions,
	ignoreIIFEs: flags.ignoreIIFEs ?? defaultOptions.ignoreIIFEs,
	ignoreFunctions: flags.ignoreFunctions ?? defaultOptions.ignoreFunctions,
	ignoreAnonymousObjects:
		flags.ignoreAnonymousObjects ?? defaultOptions.ignoreAnonymousObjects,
	ignoreUnknown: flags.ignoreUnknown ?? defaultOptions.ignoreUnknown,
	ignoreAnonymousFunctions:
		flags.ignoreAnonymousFunctions ?? defaultOptions.ignoreAnonymousFunctions,
	dryRun: flags.dryRun ?? defaultOptions.dryRun,
	tsconfig: flags.tsconfig ?? defaultOptions.tsconfig,
	useCache: flags.useCache ?? defaultOptions.useCache,
	clearCache: flags.clearCache ?? defaultOptions.clearCache,
	includeGenerated:
		flags.includeGenerated ?? defaultOptions.includeGenerated,
	json: flags.json ?? defaultOptions.json
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
				value: 'ignoreContextuallyTypedFunctionExpressions',
				label: 'Ignore contextually typed function expressions',
				hint: 'Function expressions whose type is fixed by context (default)'
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

class CancelledError extends Error {}

const handleCancel = <T>(value: T | symbol): T => {
	if (p.isCancel(value)) {
		throw new CancelledError()
	}
	return value
}

const promptForOptions = async (): Promise<Options> => {
	p.intro('add-function-return-types')
	p.log.message(
		'A CLI tool to add explicit return types to TypeScript functions'
	)

	const path = handleCancel<string>(
		await p.text({
			message: 'Path to the directory or file to process',
			initialValue: defaultOptions.path
		})
	)

	let ignoreValues: string[] = []
	const configureIgnore = handleCancel<boolean>(
		await p.confirm({ message: 'Configure ignore options?' })
	)

	if (configureIgnore) {
		for (const group of ignoreOptionGroups) {
			const selected = handleCancel<IgnoreValue[]>(
				await p.multiselect({
					message: `Select ${group.title.toLowerCase()} options to ignore`,
					required: false,
					options: group.options.map(
						(option): { value: IgnoreValue; label: string; hint: string } => ({
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

	const dryRun = handleCancel<boolean>(
		await p.confirm({
			message: 'Dry run? (preview changes without modifying files)',
			initialValue: defaultOptions.dryRun
		})
	)

	const overwrite = dryRun
		? false
		: handleCancel<boolean>(
				await p.confirm({ message: 'Overwrite existing return types?' })
			)

	const tsconfigInput = handleCancel<string>(
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
		ignoreContextuallyTypedFunctionExpressions: flagFor(
			'ignoreContextuallyTypedFunctionExpressions'
		),
		ignoreAnonymousFunctions: flagFor('ignoreAnonymousFunctions'),
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

export async function main(
	argv: string[] = process.argv.slice(2),
	run: typeof addFunctionReturnTypes = addFunctionReturnTypes
): Promise<void> {
	const userArguments = [...argv]

	if (userArguments.includes('--help') || userArguments.includes('-h')) {
		console.log(usage)
		return
	}

	try {
		let options: Options

		if (userArguments.length > 0) {
			// Non-interactive mode: flags were passed on the command line.
			let parsed: ReturnType<typeof parseArgv>
			try {
				parsed = parseArgv(userArguments)
			} catch (error) {
				console.error(error instanceof Error ? error.message : error)
				console.error(`\n${usage}`)
				process.exitCode = 1
				return
			}
			options = buildOptions(parsed.path ?? defaultOptions.path, {
				shallow: parsed['shallow'],
				overwrite: parsed['overwrite'],
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
					parsed[
						'ignore-concise-arrow-function-expressions-starting-with-void'
					],
				ignoreContextuallyTypedFunctionExpressions:
					parsed['ignore-contextually-typed-function-expressions'],
				ignoreAnonymousFunctions: parsed['ignore-anonymous-functions'],
				dryRun: parsed['dry-run'],
				useCache: !parsed['no-cache'],
				clearCache: parsed['clear-cache'],
				includeGenerated: parsed['include-generated'],
				json: parsed['json'],
				ignoreFiles: parsed['ignore-files']?.split(','),
				ignoreFunctions: parsed['ignore-functions']?.split(','),
				tsconfig: parsed['tsconfig']
			})
		} else {
			options = await promptForOptions()
		}

		await run(options)

		p.outro(
			options.dryRun
				? 'Dry run complete — no files were modified'
				: 'Done! Explicit return types have been added.'
		)
	} catch (error) {
		if (error instanceof CancelledError) {
			p.cancel('Operation cancelled')
			return
		}
		throw error
	}
}
