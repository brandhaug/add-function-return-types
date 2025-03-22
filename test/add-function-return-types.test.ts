import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { addFunctionReturnTypes } from '../src/add-function-return-types'
import { type Options, defaultOptions } from '../src/options'

describe.concurrent('add-function-return-types', (): void => {
	// Use RUNNER_TEMP if available to avoid access errors in GHA
	const tmpDir = process.env.RUNNER_TEMP || os.tmpdir()

	// Helper function to run the addFunctionReturnTypes with overridden options
	const runAddFunctionReturnTypes = async (
		overrides: Partial<Options> = {}
	): Promise<void> => {
		const options: Options = { ...defaultOptions, ...overrides }
		await addFunctionReturnTypes(options)
	}

	it('handles functions without explicit return types', async (): Promise<void> => {
		const sourceCode = `
function greet(name: string) {
  return 'Hello, ' + name;
}

const getNumber = () => {
  return 42;
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('function greet(name: string): string {')
		expect(updatedSource).toContain('const getNumber = (): number =>')
	})

	it('handles arrow functions correctly', async (): Promise<void> => {
		const sourceCode = `
const multiply = (a: number, b: number) => {
  return a * b;
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'const multiply = (a: number, b: number): number =>'
		)
	})

	it('handles async functions', async (): Promise<void> => {
		const sourceCode = `
async function fetchData(url: string) {
  const response = await fetch(url);
  return response.json();
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'async function fetchData(url: string): Promise<any> {'
		)
	})

	it('ignores constructors', async (): Promise<void> => {
		const sourceCode = `
class Person {
  constructor(public name: string) {}
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toBe(sourceCode)
	})

	it('handles methods without return types', async (): Promise<void> => {
		const sourceCode = `
class Calculator {
  add(a: number, b: number) {
    return a + b;
  }
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('add(a: number, b: number): number {')
	})

	it('handles overloaded functions', async (): Promise<void> => {
		const sourceCode = `
function combine(a: string, b: string) {
	return a + b;
}
function combine(a: number, b: number) {
	return a + b;
}
function combine(a: any, b: any) {
  return a + b;
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('combine(a: string, b: string): string {')
		expect(updatedSource).toContain('combine(a: number, b: number): number {')
		expect(updatedSource).toContain('combine(a: any, b: any): any {')
	})

	it('handles to functions returning void', async (): Promise<void> => {
		const sourceCode = `
function logMessage(message: string) {
  console.log(message);
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'function logMessage(message: string): void {'
		)
	})

	it('handles generator functions', async (): Promise<void> => {
		const sourceCode = `
function* idGenerator() {
  let id = 0;
  while (true) {
    yield id++;
  }
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'function* idGenerator(): Generator<number, void, unknown> {'
		)
	})

	it('handles functions with type parameters', async (): Promise<void> => {
		const sourceCode = `
function identity<T>(arg: T) {
  return arg;
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('function identity<T>(arg: T): T {')
	})

	it('handles to functions returning union types', async (): Promise<void> => {
		const sourceCode = `
function toNumber(value: string | number) {
  if (typeof value === 'string') {
    return parseInt(value, 10);
  }
  return value;
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'function toNumber(value: string | number): number {'
		)
	})

	it('handles methods in object literals', async (): Promise<void> => {
		const sourceCode = `
const obj = {
  greet(name: string) {
    return 'Hello, ' + name;
  },
  add(a: number, b: number) {
    return a + b;
  }
};
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('greet(name: string): string {')
		expect(updatedSource).toContain('add(a: number, b: number): number {')
	})

	it('handles functions with destructured parameters', async (): Promise<void> => {
		const sourceCode = `
function getFullName({ firstName, lastName }: { firstName: string; lastName: string }) {
  return firstName + ' ' + lastName;
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'function getFullName({ firstName, lastName }: { firstName: string; lastName: string }): string {'
		)
	})

	it('handles functions with default parameters', async (): Promise<void> => {
		const sourceCode = `
function greet(name: string = 'World') {
  return 'Hello, ' + name;
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			`function greet(name: string = 'World'): string {`
		)
	})

	it('handles functions with rest parameters', async (): Promise<void> => {
		const sourceCode = `
function sum(...numbers: number[]) {
  return numbers.reduce((a, b) => a + b, 0);
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'function sum(...numbers: number[]): number {'
		)
	})

	it('handles functions with optional parameters', async (): Promise<void> => {
		const sourceCode = `
function getLength(str?: string) {
  return str ? str.length : 0;
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'function getLength(str?: string): number {'
		)
	})

	it('handles functions inside namespaces', async (): Promise<void> => {
		const sourceCode = `
namespace Utils {
  export function extract() {
    return 'string';
  }
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('export function extract(): string {')
	})

	it('handles anonymous functions assigned to variables', async (): Promise<void> => {
		const sourceCode = `
const double = function(n: number) {
  return n * 2;
};
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'const double = function(n: number): number {'
		)
	})

	it('handles functions returning functions', async (): Promise<void> => {
		const sourceCode = `
function createAdder(a: number) {
  return function(b: number) {
    return a + b;
  };
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'function createAdder(a: number): (b: number) => number {'
		)
	})

	it('handles higher-order functions', async (): Promise<void> => {
		const sourceCode = `
function applyOperation(a: number, b: number, operation: (x: number, y: number) => number) {
  return operation(a, b);
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'function applyOperation(a: number, b: number, operation: (x: number, y: number) => number): number {'
		)
	})

	it('handles functions with inferred any return type due to untyped dependencies', async (): Promise<void> => {
		const sourceCode = `
function getValue(key: string) {
  return (window as any)[key];
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('function getValue(key: string): any {')
	})

	it('handles functions with conditional types', async (): Promise<void> => {
		const sourceCode = `
function isType<T>(value: any): value is T {
  return typeof value === typeof ({} as T);
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toBe(sourceCode)
	})

	it('handles functions with undefined union return types', async (): Promise<void> => {
		const sourceCode = `
function toNumber(value: string) {
  if (!value) return;
  return parseInt(value, 10);
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'function toNumber(value: string): number | undefined {'
		)
	})

	it('handles functions with null union return types', async (): Promise<void> => {
		const sourceCode = `
function toNumber(value: string) {
  if (!value) return null;
  return parseInt(value, 10);
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'function toNumber(value: string): number | null {'
		)
	})

	it('handles function returning an array item', async (): Promise<void> => {
		const sourceCode = `
function firstItem(values: string[]) {
  return values[0];
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'function firstItem(values: string[]): string | undefined {'
		)
	})

	it('ignores sub directories if shallow is true', async (): Promise<void> => {
		const topLevelFile = `
function topLevelFunction() {
  return 'Top Level';
}
`.trim()

		const subDirFile = `
function subDirFunction() {
  return 'Sub Directory';
}
`.trim()

		// Write the top-level file
		const testDir = await fs.mkdtemp(tmpDir)
		const topLevelFilePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(topLevelFilePath, topLevelFile)

		// Create a subdirectory and write the subdirectory file
		const subDir = path.join(testDir, 'subdir')
		await fs.mkdir(subDir)
		const subDirFilePath = path.join(subDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(subDirFilePath, subDirFile)

		await runAddFunctionReturnTypes({ path: testDir, shallow: true })

		const updatedTopLevelFile = await fs.readFile(topLevelFilePath, 'utf-8')
		const updatedSubDirFile = await fs.readFile(subDirFilePath, 'utf-8')

		expect(updatedTopLevelFile).toContain(
			'function topLevelFunction(): string {'
		)

		expect(updatedSubDirFile).toBe(subDirFile)
	})

	it('ignores files matching ignorefiles', async (): Promise<void> => {
		const fileToProcess = `
function shouldBeProcessed() {
  return 1;
}
`.trim()

		const fileToIgnore = `
function shouldBeIgnored() {
  return 2;
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const processFilePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(processFilePath, fileToProcess)

		const ignoreFileName = `${crypto.randomUUID()}.ts`
		const ignoreFilePath = path.join(testDir, ignoreFileName)
		await fs.writeFile(ignoreFilePath, fileToIgnore)

		await runAddFunctionReturnTypes({
			path: testDir,
			ignoreFiles: [ignoreFileName]
		})

		const updatedProcessFile = await fs.readFile(processFilePath, 'utf-8')
		const updatedIgnoreFile = await fs.readFile(ignoreFilePath, 'utf-8')

		expect(updatedProcessFile).toContain(
			'function shouldBeProcessed(): number {'
		)

		expect(updatedIgnoreFile).toBe(fileToIgnore)
	})

	it('ignores function expressions if ignoreExpressions is true', async (): Promise<void> => {
		const sourceCode = `
const myFunction = function() {
  return 42;
}

const myArrowFunction = () => {
  return 43;
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir, ignoreExpressions: true })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toBe(sourceCode)
	})

	it('ignores functions without type parameters if ignoreFunctionsWithoutTypeParameters is true', async (): Promise<void> => {
		const sourceCode = `
function noTypeParams() {
  return 'hello';
}

function withTypeParams<T>() {
  return 'hello';
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({
			path: testDir,
			ignoreFunctionsWithoutTypeParameters: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('function noTypeParams() {')
		expect(updatedSource).toContain('function withTypeParams<T>(): string {')
	})

	it('ignores functions with names in ignoreFunctions', async (): Promise<void> => {
		const sourceCode = `
function allowedFunction() {
  return 1;
}

function notAllowedFunction() {
  return 2;
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({
			path: testDir,
			ignoreFunctions: ['allowedFunction']
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('function allowedFunction() {')
		expect(updatedSource).toContain('function notAllowedFunction(): number {')
	})

	it('ignores higher order functions if ignoreHigherOrderFunctions is true', async (): Promise<void> => {
		const sourceCode = `
function higherOrder() {
  return function() {
    return 42;
  }
}

function normalFunction() {
  return 42;
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({
			path: testDir,
			ignoreHigherOrderFunctions: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('function higherOrder() {')
		expect(updatedSource).toContain('function normalFunction(): number {')
	})

	it('ignores typed function expressions if ignoreTypedFunctionExpressions is true', async (): Promise<void> => {
		const sourceCode = `
const typedFunction: () => number = function() {
  return 42;
}

const untypedFunction = function() {
  return 43;
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({
			path: testDir,
			ignoreTypedFunctionExpressions: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'const typedFunction: () => number = function() {'
		)
		expect(updatedSource).toContain(
			'const untypedFunction = function(): number {'
		)
	})

	it('ignores concise arrow functions starting with void if ignoreConciseArrowFunctionExpressionsStartingWithVoid is true', async (): Promise<void> => {
		const sourceCode = `
const arrowVoid = () => void doSomething();
const arrowNormal = () => 42;
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({
			path: testDir,
			ignoreConciseArrowFunctionExpressionsStartingWithVoid: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'const arrowVoid = () => void doSomething();'
		)
		expect(updatedSource).toContain('const arrowNormal = (): number => 42;')
	})

	it('handles functions with existing return types if overwrite is true', async (): Promise<void> => {
		// Source code with an incorrect existing return type
		const sourceCode = `
function greet(name: string): number {
  return 'Hello, ' + name;
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({
			path: testDir,
			overwrite: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')

		expect(updatedSource).toContain('function greet(name: string): string {')
	})

	it('ignores existing return types if overwrite is false', async (): Promise<void> => {
		// Source code with an incorrect existing return type
		const sourceCode = `
function greet(name: string): number {
  return 'Hello, ' + name;
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({
			path: testDir
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('function greet(name: string): number {')
	})

	it('handles expressions if ignoreExpressions is false', async (): Promise<void> => {
		const sourceCode = `
const myFunction = function() {
  return 42;
}

const myArrowFunction = () => {
  return 43;
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('const myFunction = function(): number {')
		expect(updatedSource).toContain('const myArrowFunction = (): number =>')
	})

	it('handles functions without type parameters if ignoreFunctionsWithoutTypeParameters is false', async (): Promise<void> => {
		const sourceCode = `
function noTypeParams() {
  return 'hello';
}

function withTypeParams<T>() {
  return 'hello';
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('function noTypeParams(): string {')
		expect(updatedSource).toContain('function withTypeParams<T>(): string {')
	})

	it('handles higher order functions if ignoreHigherOrderFunctions is false', async (): Promise<void> => {
		const sourceCode = `
function higherOrder() {
  return function() {
    return 42;
  }
}

function normalFunction() {
  return 42;
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('function higherOrder(): () => number {')
		expect(updatedSource).toContain('function normalFunction(): number {')
	})

	it('handles typed function expressions if ignoreTypedFunctionExpressions is false', async (): Promise<void> => {
		const sourceCode = `
const typedFunction: () => number = function() {
  return 42;
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'const typedFunction: () => number = function(): number {'
		)
	})

	it('handles IIFEs if ignoreIIFEs is false', async (): Promise<void> => {
		const sourceCode = `
		(function() {
			return 42;
		})();
		`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('(function(): number {')
	})

	it('ignores IIFEs if ignoreIIFEs is true', async (): Promise<void> => {
		const sourceCode = `
	  (function() {
		return 42;
	  })();

	  function normalFunction() {
		return 43;
	  }
	  `.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({
			path: testDir,
			ignoreIIFEs: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('(function() {')
		expect(updatedSource).toContain('function normalFunction(): number {')
	})

	it('ignores return type if overwrite is true and ignoreHigherOrderFunctions is true', async (): Promise<void> => {
		const sourceCode = `
			function higherOrder(callback: () => number): number | null {
				return callback();
			}
		`

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({
			path: testDir,
			ignoreIIFEs: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')

		await runAddFunctionReturnTypes({
			overwrite: true,
			ignoreHigherOrderFunctions: true
		})

		expect(updatedSource).toContain(
			'function higherOrder(callback: () => number): number | null {'
		)
	})

	it('handles functions returning returning anonymous objects if ignoreAnonymousObjectTypes is false', async (): Promise<void> => {
		const sourceCode = `
function getObject() {
  return { foo: 'bar', baz: 42 };
}

function getNormalType() {
  return 'string';
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'function getObject(): { foo: string; baz: number; } {'
		)
		expect(updatedSource).toContain('function getNormalType(): string {')
	})

	it('handles functions returning a defined object type', async (): Promise<void> => {
		const sourceCode = `
interface User {
  name: string;
  age: number;
}

function getUser() {
	const user: User = { name: 'John Doe', age: 30 };
return user;
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('function getUser(): User {')
	})

	it('ignores functions returning anonymous object types if ignoreAnonymousObjectTypes is true', async (): Promise<void> => {
		const sourceCode = `
function getObject() {
  return { foo: 'bar', baz: 42 };
}

function getNormalType() {
  return 'string';
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({
			path: testDir,
			ignoreAnonymousObjects: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('function getObject() {')
		expect(updatedSource).toContain('function getNormalType(): string {')
	})

	it('ignores functions returning any if ignoreAny is true', async (): Promise<void> => {
		const sourceCode = `
function returnAny() {
  return JSON.parse('{"foo": "bar"}');
}

function getNormalType() {
  return 'string';
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({
			path: testDir,
			ignoreAny: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('function returnAny() {')
		expect(updatedSource).toContain('function getNormalType(): string {')
	})

	it('handles functions returning any if ignoreAny is false', async (): Promise<void> => {
		const sourceCode = `
function returnAny(): any {
  return Math.random() > 0.5 ? 'string' : 42;
}

function inferredAny() {
  return JSON.parse('{"foo": "bar"}');
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('function returnAny(): any {')
		expect(updatedSource).toContain('function inferredAny(): any {')
	})

	it('ignores functions returning unknown if ignoreAny is true', async (): Promise<void> => {
		const sourceCode = `
function returnUnknown() {
  return JSON.parse('{"foo": "bar"}') as unknown;
}

function getNormalType() {
  return 'string';
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({
			path: testDir,
			ignoreUnknown: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('function returnUnknown() {')
		expect(updatedSource).toContain('function getNormalType(): string {')
	})

	it('handles functions returning unknown if ignoreAny is false', async (): Promise<void> => {
		const sourceCode = `
function returnUnknown(): unknown {
	return JSON.parse('{"foo": "bar"}') as unknown;
}

function inferredUnknown() {
  return JSON.parse(localStorage.getItem('data') || '{}') as unknown;
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('function returnUnknown(): unknown {')
		expect(updatedSource).toContain('function inferredUnknown(): unknown {')
	})

	it('ignores anonymous functions if ignoreAnonymousFunctions is true', async (): Promise<void> => {
		const sourceCode = `
(function() {
    return 42;
})

(() => {
    return 'string';
})

function namedFunction() {
    return true;
}

const namedArrow = () => {
    return 456;
}

class Class {
    arrowClassProp = () => {
        return 456;
    }
}

const object = {
    arrowObjectProp: () => {
        return 456;
    }
};

const object2 = {};
object2.arrowObject2Prop = () => {
    return 456;
};

let variable;
variable = () => {
    return 456;
};
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({
			path: testDir,
			ignoreAnonymousFunctions: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('(function() {')
		expect(updatedSource).toContain('(() => {')
		expect(updatedSource).toContain('function namedFunction(): boolean {')
		expect(updatedSource).toContain('const namedArrow = (): number => {')
		expect(updatedSource).toContain('arrowClassProp = (): number => {')
		expect(updatedSource).toContain('arrowObjectProp: (): number => {')
		expect(updatedSource).toContain('arrowObject2Prop = (): number => {')
		expect(updatedSource).toContain('variable = (): number => {')
	})

	it('handles anonymous functions if ignoreAnonymousFunctions is false', async (): Promise<void> => {
		const sourceCode = `
(function() {
    return 42;
})

(() => {
    return 'string';
})

function namedFunction() {
    return true;
}

const namedArrow = () => {
    return 456;
}

class Class {
    arrowClassProp = () => {
        return 456;
    }
}

const object = {
    arrowObjectProp: () => {
        return 456;
    }
};

const object2 = {};
object2.arrowObject2Prop = () => {
    return 456;
};

let variable;
variable = () => {
    return 456;
};
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({
			path: testDir,
			ignoreAnonymousFunctions: false
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('(function(): number {')
		expect(updatedSource).toContain('((): string => {')
		expect(updatedSource).toContain('function namedFunction(): boolean {')
		expect(updatedSource).toContain('const namedArrow = (): number => {')
		expect(updatedSource).toContain('arrowClassProp = (): number => {')
		expect(updatedSource).toContain('arrowObjectProp: (): number => {')
		expect(updatedSource).toContain('arrowObject2Prop = (): number => {')
		expect(updatedSource).toContain('variable = (): number => {')
	})

	it('ignores functions returning Promise<any> if ignoreAny is true', async (): Promise<void> => {
		const sourceCode = `
async function returnPromiseAny() {
  return Promise.resolve(JSON.parse('{"foo": "bar"}'));
}

async function getNormalType() {
  return Promise.resolve('string');
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({
			path: testDir,
			ignoreAny: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('async function returnPromiseAny() {')
		expect(updatedSource).toContain(
			'async function getNormalType(): Promise<string> {'
		)
	})

	it('handles functions returning Promise<any> if ignoreAny is false', async (): Promise<void> => {
		const sourceCode = `
async function returnPromiseAny(): Promise<any> {
  return Promise.resolve(Math.random() > 0.5 ? 'string' : 42);
}

async function inferredPromiseAny() {
  return Promise.resolve(JSON.parse('{"foo": "bar"}'));
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'async function returnPromiseAny(): Promise<any> {'
		)
		expect(updatedSource).toContain(
			'async function inferredPromiseAny(): Promise<any> {'
		)
	})

	it('ignores functions returning Promise<unknown> if ignoreUnknown is true', async (): Promise<void> => {
		const sourceCode = `
async function returnPromiseUnknown() {
  return Promise.resolve(JSON.parse('{"foo": "bar"}') as unknown);
}

async function getNormalType() {
  return Promise.resolve('string');
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({
			path: testDir,
			ignoreUnknown: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('async function returnPromiseUnknown() {')
		expect(updatedSource).toContain(
			'async function getNormalType(): Promise<string> {'
		)
	})

	it('handles functions returning Promise<unknown> if ignoreUnknown is false', async (): Promise<void> => {
		const sourceCode = `
async function returnPromiseUnknown(): Promise<unknown> {
  return Promise.resolve(JSON.parse('{"foo": "bar"}') as unknown);
}

async function inferredPromiseUnknown() {
  return Promise.resolve(JSON.parse(localStorage.getItem('data') || '{}') as unknown);
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'async function returnPromiseUnknown(): Promise<unknown> {'
		)
		expect(updatedSource).toContain(
			'async function inferredPromiseUnknown(): Promise<unknown> {'
		)
	})

	it('ignores functions returning Promise with anonymous object types if ignoreAnonymousObjects is true', async (): Promise<void> => {
		const sourceCode = `
async function getPromiseObject() {
    return Promise.resolve({ foo: 'bar', baz: 42 });
}

async function getNormalType() {
    return Promise.resolve('string');
}

function getRegularObject() {
    return { foo: 'bar' };
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({
			path: testDir,
			ignoreAnonymousObjects: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('async function getPromiseObject() {')
		expect(updatedSource).toContain(
			'async function getNormalType(): Promise<string> {'
		)
		expect(updatedSource).toContain('function getRegularObject() {')
	})

	it('handles functions returning Promise with anonymous object types if ignoreAnonymousObjects is false', async (): Promise<void> => {
		const sourceCode = `
async function getPromiseObject() {
    return Promise.resolve({ foo: 'bar', baz: 42 });
}

async function getNormalType() {
    return Promise.resolve('string');
}

function getRegularObject() {
    return { foo: 'bar' };
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({
			path: testDir,
			ignoreAnonymousObjects: false
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'async function getPromiseObject(): Promise<{ foo: string; baz: number; }> {'
		)
		expect(updatedSource).toContain(
			'async function getNormalType(): Promise<string> {'
		)
		expect(updatedSource).toContain(
			'function getRegularObject(): { foo: string; } {'
		)
	})

	it('ignores functions returning Record with any/unknown/anonymous objects if respective options are true', async (): Promise<void> => {
		const sourceCode = `
function getRecordAny() {
    return { key1: JSON.parse('{}'), key2: 'value' } as Record<string, any>;
}

function getRecordUnknown() {
    return { key1: JSON.parse('{}'), key2: 'value' } as Record<string, unknown>;
}

function getRecordAnonymous() {
    return { key1: { foo: 'bar' }, key2: { baz: 42 } } as Record<string, { [key: string]: any }>;
}

function getNormalRecord() {
    return { key1: 'value1', key2: 'value2' } as Record<string, string>;
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({
			path: testDir,
			ignoreAny: true,
			ignoreUnknown: true,
			ignoreAnonymousObjects: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('function getRecordAny() {')
		expect(updatedSource).toContain('function getRecordUnknown() {')
		expect(updatedSource).toContain('function getRecordAnonymous() {')
		expect(updatedSource).toContain(
			'function getNormalRecord(): Record<string, string> {'
		)
	})

	it('ignores functions returning arrays with any/unknown/anonymous objects if respective options are true', async (): Promise<void> => {
		const sourceCode = `
function getArrayAny() {
    return [JSON.parse('{}'), 'value'];
}

function getArrayUnknown() {
    return [JSON.parse('{}'), 'value'] as unknown[];
}

function getArrayAnonymous() {
    return [{ foo: 'bar' }, { baz: 42 }];
}

function getNormalArray() {
    return ['value1', 'value2'];
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({
			path: testDir,
			ignoreAny: true,
			ignoreUnknown: true,
			ignoreAnonymousObjects: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('function getArrayAny() {')
		expect(updatedSource).toContain('function getArrayUnknown() {')
		expect(updatedSource).toContain('function getArrayAnonymous() {')
		expect(updatedSource).toContain('function getNormalArray(): string[] {')
	})

	it('handles functions returning Record/Array with any/unknown/anonymous objects if respective options are false', async (): Promise<void> => {
		const sourceCode = `
function getRecordAny() {
    return { key1: JSON.parse('{}'), key2: 'value' } as Record<string, any>;
}

function getArrayUnknown() {
    return [JSON.parse('{}'), 'value'] as unknown[];
}

function getArrayAnonymous() {
    return [{ foo: 'bar', baz: 42 }];
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({
			path: testDir,
			ignoreAny: false,
			ignoreUnknown: false,
			ignoreAnonymousObjects: false
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'function getRecordAny(): Record<string, any> {'
		)
		expect(updatedSource).toContain('function getArrayUnknown(): unknown[] {')
		expect(updatedSource).toContain(
			'function getArrayAnonymous(): { foo: string; baz: number; }[] {'
		)
	})

	it('handles nested return types correctly', async (): Promise<void> => {
		const sourceCode = `
type TagsQuery = {
  team: {
    tags: {
      edges: Array<{
        node: {
          id: string;
          name: string;
        };
      }>;
    };
  };
};

export const useSortTags = (
  tags: TagsQuery['team']['tags']['edges']
) => {
  return tags
}`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(": TagsQuery['team']['tags']['edges'] => {")
	})
})
