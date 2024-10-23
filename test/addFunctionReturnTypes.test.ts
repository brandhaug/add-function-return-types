import * as crypto from 'node:crypto'
import fs from 'node:fs/promises'
import * as os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
	type Options,
	addFunctionReturnTypes
} from '../src/addFunctionReturnTypes'

describe.concurrent('add-function-return-types', (): void => {
	// Use RUNNER_TEMP if available to avoid access errors in GHA
	const tmpDir = process.env.RUNNER_TEMP || os.tmpdir()

	// Define default options
	const defaultOptions: Options = {
		path: '.',
		shallow: false,
		ignorePatterns: [],
		concurrencyLimit: 10, // Assuming 10 as a reasonable default
		ignoreConciseArrowFunctionExpressionsStartingWithVoid: false,
		ignoreExpressions: false,
		ignoreFunctionsWithoutTypeParameters: false,
		ignoreHigherOrderFunctions: false,
		ignoreTypedFunctionExpressions: false,
		ignoreNames: [],
		overwriteExistingReturnTypes: false
	}

	// Helper function to run the addFunctionReturnTypes with overridden options
	const runAddFunctionReturnTypes = async (
		overrides: Partial<Options> = {}
	): Promise<void> => {
		const options: Options = { ...defaultOptions, ...overrides }
		await addFunctionReturnTypes(options)
	}

	it('handles to functions without explicit return types', async (): Promise<void> => {
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

	it('does not modify functions with explicit return types', async (): Promise<void> => {
		const sourceCode = `
function sum(a: number, b: number): number {
  return a + b;
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toBe(sourceCode)
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

	it('does not modify constructors', async (): Promise<void> => {
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

	it('skips functions returning any or unknown types', async (): Promise<void> => {
		const sourceCode = `
function parseData(data: string) {
  return JSON.parse(data);
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		// Assuming the script does not add return types for functions returning any or unknown
		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toBe(sourceCode)
	})

	it('does not modify functions with existing return types', async (): Promise<void> => {
		const sourceCode = `
function getUser(): { name: string; age: number } {
  return { name: 'Alice', age: 30 };
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toBe(sourceCode)
	})

	it('handles functions returning anonymous objects', async (): Promise<void> => {
		const sourceCode = `
function createUser(name: string, age: number) {
  return { name, age };
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		// Assuming the script does not add return types for anonymous objects
		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toBe(sourceCode)
	})

	it('handles overloaded functions correctly', async (): Promise<void> => {
		const sourceCode = `
function combine(a: string, b: string): string;
function combine(a: number, b: number): number;
function combine(a: any, b: any) {
  return a + b;
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		// Assuming the script does not modify overloaded functions
		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toBe(sourceCode)
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

	it('does not modify functions inside namespaces', async (): Promise<void> => {
		const sourceCode = `
namespace Utils {
  export function parse(data: string) {
    return JSON.parse(data);
  }
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		// Assuming the script does not handle functions inside namespaces
		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toBe(sourceCode)
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

	it('does not modify functions with inferred any return type due to untyped dependencies', async (): Promise<void> => {
		const sourceCode = `
function getValue(key: string) {
  return (window as any)[key];
}
`.trim()

		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		await runAddFunctionReturnTypes({ path: testDir })

		// Should not modify because return type is any
		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toBe(sourceCode)
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

		// Should not modify because return type is already specified
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

	it('handles array item types', async (): Promise<void> => {
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

	it('handles shallow option', async (): Promise<void> => {
		// Create files in the top-level directory and in a subdirectory
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

		// Run the function with shallow option
		await runAddFunctionReturnTypes({ path: testDir, shallow: true })

		// Read the files back
		const updatedTopLevelFile = await fs.readFile(topLevelFilePath, 'utf-8')
		const updatedSubDirFile = await fs.readFile(subDirFilePath, 'utf-8')

		// Check that the top-level file was modified
		expect(updatedTopLevelFile).toContain(
			'function topLevelFunction(): string {'
		)

		// Check that the subdirectory file was not modified
		expect(updatedSubDirFile).toBe(subDirFile)
	})

	it('handles ignorePatterns option', async (): Promise<void> => {
		// Create files
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

		// Write the files
		const testDir = await fs.mkdtemp(tmpDir)
		const processFilePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(processFilePath, fileToProcess)

		const ignoreFileName = `${crypto.randomUUID()}.ts`
		const ignoreFilePath = path.join(testDir, ignoreFileName)
		await fs.writeFile(ignoreFilePath, fileToIgnore)

		// Run the function with ignorePatterns option
		await runAddFunctionReturnTypes({
			path: testDir,
			ignorePatterns: [ignoreFileName]
		})

		// Read the files back
		const updatedProcessFile = await fs.readFile(processFilePath, 'utf-8')
		const updatedIgnoreFile = await fs.readFile(ignoreFilePath, 'utf-8')

		// Check that the file to process was modified
		expect(updatedProcessFile).toContain(
			'function shouldBeProcessed(): number {'
		)

		// Check that the ignored file was not modified
		expect(updatedIgnoreFile).toBe(fileToIgnore)
	})

	it('ignores function expressions when ignoreExpressions is true', async (): Promise<void> => {
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
		// Should not have added return types
		expect(updatedSource).toBe(sourceCode)
	})

	it('ignores functions without type parameters when ignoreFunctionsWithoutTypeParameters is true', async (): Promise<void> => {
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
		expect(updatedSource).toContain('function noTypeParams() {') // Should not have return type added
		expect(updatedSource).toContain('function withTypeParams<T>(): string {') // Should have return type added
	})

	it('ignores functions with names in ignoreNames', async (): Promise<void> => {
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
			ignoreNames: ['allowedFunction']
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('function allowedFunction() {') // Should not have return type added
		expect(updatedSource).toContain('function notAllowedFunction(): number {') // Should have return type added
	})

	it('ignores higher order functions when ignoreHigherOrderFunctions is true', async (): Promise<void> => {
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
		expect(updatedSource).toContain('function higherOrder() {') // Should not have return type added
		expect(updatedSource).toContain('function normalFunction(): number {') // Should have return type added
	})

	it('ignores typed function expressions when ignoreTypedFunctionExpressions is true', async (): Promise<void> => {
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
		// typedFunction should not have return type added
		expect(updatedSource).toContain(
			'const typedFunction: () => number = function() {'
		)
		// untypedFunction should have return type added
		expect(updatedSource).toContain(
			'const untypedFunction = function(): number {'
		)
	})

	it('ignores concise arrow functions starting with void when ignoreConciseArrowFunctionExpressionsStartingWithVoid is true', async (): Promise<void> => {
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
		// arrowVoid should not have return type added
		expect(updatedSource).toContain(
			'const arrowVoid = () => void doSomething();'
		)
		// arrowNormal should have return type added
		expect(updatedSource).toContain('const arrowNormal = (): number => 42;')
	})

	it('overwrites existing return types when overwriteExistingReturnTypes is true', async (): Promise<void> => {
		// Source code with an incorrect existing return type
		const sourceCode = `
function greet(name: string): number {
  return 'Hello, ' + name;
}
`.trim()

		// Write the source code to a temporary file
		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		// Run the function with overwriteExistingReturnTypes option
		await runAddFunctionReturnTypes({
			path: testDir,
			overwriteExistingReturnTypes: true
		})

		// Read the updated source code
		const updatedSource = await fs.readFile(filePath, 'utf-8')

		// Check that the incorrect return type has been corrected
		expect(updatedSource).toContain('function greet(name: string): string {')
	})

	it('ignores functions with correct existing return types when overwriteExistingReturnTypes is true', async (): Promise<void> => {
		// Source code with correct existing return types
		const sourceCode = `
function sum(a: number, b: number): number {
  return a + b;
}
`.trim()

		// Write the source code to a temporary file
		const testDir = await fs.mkdtemp(tmpDir)
		const filePath = path.join(testDir, `${crypto.randomUUID()}.ts`)
		await fs.writeFile(filePath, sourceCode)

		// Run the function with overwriteExistingReturnTypes option
		await runAddFunctionReturnTypes({
			path: testDir,
			overwriteExistingReturnTypes: true
		})

		// Read the updated source code
		const updatedSource = await fs.readFile(filePath, 'utf-8')

		// Check that the function remains unchanged
		expect(updatedSource).toBe(sourceCode)
	})

	// Additional tests where options are not used
	it('adds return types when ignoreExpressions is not used', async (): Promise<void> => {
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
		// Should have added return types
		expect(updatedSource).toContain('const myFunction = function(): number {')
		expect(updatedSource).toContain('const myArrowFunction = (): number =>')
	})

	it('adds return types when ignoreFunctionsWithoutTypeParameters is not used', async (): Promise<void> => {
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
		expect(updatedSource).toContain('function noTypeParams(): string {') // Should have return type added
		expect(updatedSource).toContain('function withTypeParams<T>(): string {') // Should have return type added
	})

	it('adds return types when ignoreNames is not used', async (): Promise<void> => {
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

		await runAddFunctionReturnTypes({ path: testDir })

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('function allowedFunction(): number {') // Should have return type added
		expect(updatedSource).toContain('function notAllowedFunction(): number {') // Should have return type added
	})

	it('adds return types when ignoreHigherOrderFunctions is not used', async (): Promise<void> => {
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
		expect(updatedSource).toContain('function higherOrder(): () => number {') // Should have return type added
		expect(updatedSource).toContain('function normalFunction(): number {') // Should have return type added
	})

	it('adds return types when ignoreTypedFunctionExpressions is not used', async (): Promise<void> => {
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
		// typedFunction should have return type added
		expect(updatedSource).toContain(
			'const typedFunction: () => number = function(): number {'
		)
	})
})
