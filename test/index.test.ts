import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { execa } from 'execa'
import path from 'node:path'
import fs from 'fs-extra'

describe('e2e tests', () => {
	const cliPath = path.resolve(__dirname, '../src/index.ts') // Update this path to your CLI script
	const testDir = path.resolve(__dirname, 'temp-test-dir')

	beforeEach(async () => {
		// Create a temporary directory for each test
		await fs.ensureDir(testDir)
	})

	afterEach(async () => {
		// Clean up the temporary directory after each test
		await fs.remove(testDir)
	})

	it('adds return types to functions without explicit return types', async () => {
		const sourceCode = `
function greet(name: string) {
  return 'Hello, ' + name;
}

const getNumber = () => {
  return 42;
}
`.trim()

		const filePath = path.join(testDir, 'greet_test.ts')
		await fs.writeFile(filePath, sourceCode)

		await execa('tsx', [cliPath], {
			cwd: testDir,
			preferLocal: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('function greet(name: string): string')
		expect(updatedSource).toContain('const getNumber = (): number =>')
	})

	it('does not modify functions with explicit return types', async () => {
		const sourceCode = `
function sum(a: number, b: number): number {
  return a + b;
}
`.trim()

		const filePath = path.join(testDir, 'sum_test.ts')
		await fs.writeFile(filePath, sourceCode)

		await execa('tsx', [cliPath], {
			cwd: testDir,
			preferLocal: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toBe(sourceCode)
	})

	it('handles arrow functions correctly', async () => {
		const sourceCode = `
const multiply = (a: number, b: number) => {
  return a * b;
}
`.trim()

		const filePath = path.join(testDir, 'multiply_test.ts')
		await fs.writeFile(filePath, sourceCode)

		await execa('tsx', [cliPath], {
			cwd: testDir,
			preferLocal: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'const multiply = (a: number, b: number): number =>'
		)
	})

	it('handles async functions', async () => {
		const sourceCode = `
async function fetchData(url: string) {
  const response = await fetch(url);
  return response.json();
}
`.trim()

		const filePath = path.join(testDir, 'fetchData_test.ts')
		await fs.writeFile(filePath, sourceCode)

		await execa('tsx', [cliPath], {
			cwd: testDir,
			preferLocal: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'async function fetchData(url: string): Promise<any>'
		)
	})

	it('does not modify constructors', async () => {
		const sourceCode = `
class Person {
  constructor(public name: string) {}
}
`.trim()

		const filePath = path.join(testDir, 'Person_test.ts')
		await fs.writeFile(filePath, sourceCode)

		await execa('tsx', [cliPath], {
			cwd: testDir,
			preferLocal: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toBe(sourceCode)
	})

	it('handles methods without return types', async () => {
		const sourceCode = `
class Calculator {
  add(a: number, b: number) {
    return a + b;
  }
}
`.trim()

		const filePath = path.join(testDir, 'Calculator_test.ts')
		await fs.writeFile(filePath, sourceCode)

		await execa('tsx', [cliPath], {
			cwd: testDir,
			preferLocal: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('add(a: number, b: number): number')
	})

	it('skips functions returning any or unknown types', async () => {
		const sourceCode = `
function parseData(data: string) {
  return JSON.parse(data);
}
`.trim()

		const filePath = path.join(testDir, 'parseData_test.ts')
		await fs.writeFile(filePath, sourceCode)

		await execa('tsx', [cliPath], {
			cwd: testDir,
			preferLocal: true
		})

		// Assuming the script does not add return types for functions returning any or unknown
		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toBe(sourceCode)
	})

	it('does not modify functions with existing return types', async () => {
		const sourceCode = `
function getUser(): { name: string; age: number } {
  return { name: 'Alice', age: 30 };
}
`.trim()

		const filePath = path.join(testDir, 'getUser_test.ts')
		await fs.writeFile(filePath, sourceCode)

		await execa('tsx', [cliPath], {
			cwd: testDir,
			preferLocal: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toBe(sourceCode)
	})

	it('handles functions returning anonymous objects', async () => {
		const sourceCode = `
function createUser(name: string, age: number) {
  return { name, age };
}
`.trim()

		const filePath = path.join(testDir, 'createUser_test.ts')
		await fs.writeFile(filePath, sourceCode)

		await execa('tsx', [cliPath], {
			cwd: testDir,
			preferLocal: true
		})

		// Assuming the script does not add return types for anonymous objects
		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toBe(sourceCode)
	})

	it('handles overloaded functions correctly', async () => {
		const sourceCode = `
function combine(a: string, b: string): string;
function combine(a: number, b: number): number;
function combine(a: any, b: any) {
  return a + b;
}
`.trim()

		const filePath = path.join(testDir, 'combine_test.ts')
		await fs.writeFile(filePath, sourceCode)

		await execa('tsx', [cliPath], {
			cwd: testDir,
			preferLocal: true
		})

		// Assuming the script does not modify overloaded functions
		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toBe(sourceCode)
	})

	it('adds return types to functions returning void', async () => {
		const sourceCode = `
function logMessage(message: string) {
  console.log(message);
}
`.trim()

		const filePath = path.join(testDir, 'logMessage_test.ts')
		await fs.writeFile(filePath, sourceCode)

		await execa('tsx', [cliPath], {
			cwd: testDir,
			preferLocal: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'function logMessage(message: string): void'
		)
	})

	it('handles generator functions', async () => {
		const sourceCode = `
function* idGenerator() {
  let id = 0;
  while (true) {
    yield id++;
  }
}
`.trim()

		const filePath = path.join(testDir, 'idGenerator_test.ts')
		await fs.writeFile(filePath, sourceCode)

		await execa('tsx', [cliPath], {
			cwd: testDir,
			preferLocal: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'function* idGenerator(): Generator<number, void, unknown>'
		)
	})

	it('handles functions with type parameters', async () => {
		const sourceCode = `
function identity<T>(arg: T) {
  return arg;
}
`.trim()

		const filePath = path.join(testDir, 'identity_test.ts')
		await fs.writeFile(filePath, sourceCode)

		await execa('tsx', [cliPath], {
			cwd: testDir,
			preferLocal: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('function identity<T>(arg: T): T')
	})

	it('adds return types to functions returning union types', async () => {
		const sourceCode = `
function toNumber(value: string | number) {
  if (typeof value === 'string') {
    return parseInt(value, 10);
  }
  return value;
}
`.trim()

		const filePath = path.join(testDir, 'toNumber_test.ts')
		await fs.writeFile(filePath, sourceCode)

		await execa('tsx', [cliPath], {
			cwd: testDir,
			preferLocal: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'function toNumber(value: string | number): number'
		)
	})

	it('handles methods in object literals', async () => {
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

		const filePath = path.join(testDir, 'objectLiteral_test.ts')
		await fs.writeFile(filePath, sourceCode)

		await execa('tsx', [cliPath], {
			cwd: testDir,
			preferLocal: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('greet(name: string): string')
		expect(updatedSource).toContain('add(a: number, b: number): number')
	})

	it('handles functions with destructured parameters', async () => {
		const sourceCode = `
function getFullName({ firstName, lastName }: { firstName: string; lastName: string }) {
  return firstName + ' ' + lastName;
}
`.trim()

		const filePath = path.join(testDir, 'getFullName_test.ts')
		await fs.writeFile(filePath, sourceCode)

		await execa('tsx', [cliPath], {
			cwd: testDir,
			preferLocal: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'function getFullName({ firstName, lastName }: { firstName: string; lastName: string }): string'
		)
	})

	it('handles functions with default parameters', async () => {
		const sourceCode = `
function greet(name: string = 'World') {
  return 'Hello, ' + name;
}
`.trim()

		const filePath = path.join(testDir, 'greetDefault_test.ts')
		await fs.writeFile(filePath, sourceCode)

		await execa('tsx', [cliPath], {
			cwd: testDir,
			preferLocal: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			`function greet(name: string = 'World'): string`
		)
	})

	it('handles functions with rest parameters', async () => {
		const sourceCode = `
function sum(...numbers: number[]) {
  return numbers.reduce((a, b) => a + b, 0);
}
`.trim()

		const filePath = path.join(testDir, 'sumRest_test.ts')
		await fs.writeFile(filePath, sourceCode)

		await execa('tsx', [cliPath], {
			cwd: testDir,
			preferLocal: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'function sum(...numbers: number[]): number'
		)
	})

	it('handles functions with optional parameters', async () => {
		const sourceCode = `
function getLength(str?: string) {
  return str ? str.length : 0;
}
`.trim()

		const filePath = path.join(testDir, 'getLength_test.ts')
		await fs.writeFile(filePath, sourceCode)

		await execa('tsx', [cliPath], {
			cwd: testDir,
			preferLocal: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('function getLength(str?: string): number')
	})

	it('does not modify functions inside namespaces', async () => {
		const sourceCode = `
namespace Utils {
  export function parse(data: string) {
    return JSON.parse(data);
  }
}
`.trim()

		const filePath = path.join(testDir, 'Utils_test.ts')
		await fs.writeFile(filePath, sourceCode)

		await execa('tsx', [cliPath], {
			cwd: testDir,
			preferLocal: true
		})

		// Assuming the script does not handle functions inside namespaces
		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toBe(sourceCode)
	})

	it('handles anonymous functions assigned to variables', async () => {
		const sourceCode = `
const double = function(n: number) {
  return n * 2;
};
`.trim()

		const filePath = path.join(testDir, 'double_test.ts')
		await fs.writeFile(filePath, sourceCode)

		await execa('tsx', [cliPath], {
			cwd: testDir,
			preferLocal: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'const double = function(n: number): number'
		)
	})

	it('handles functions returning functions', async () => {
		const sourceCode = `
function createAdder(a: number) {
  return function(b: number) {
    return a + b;
  };
}
`.trim()

		const filePath = path.join(testDir, 'createAdder_test.ts')
		await fs.writeFile(filePath, sourceCode)

		await execa('tsx', [cliPath], {
			cwd: testDir,
			preferLocal: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'function createAdder(a: number): (b: number) => number'
		)
	})

	it('handles higher-order functions', async () => {
		const sourceCode = `
function applyOperation(a: number, b: number, operation: (x: number, y: number) => number) {
  return operation(a, b);
}
`.trim()

		const filePath = path.join(testDir, 'applyOperation_test.ts')
		await fs.writeFile(filePath, sourceCode)

		await execa('tsx', [cliPath], {
			cwd: testDir,
			preferLocal: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain(
			'function applyOperation(a: number, b: number, operation: (x: number, y: number) => number): number'
		)
	})

	it('does not modify functions with inferred any return type due to untyped dependencies', async () => {
		const sourceCode = `
function getValue(key: string) {
  return (window as any)[key];
}
`.trim()

		const filePath = path.join(testDir, 'getValue_test.ts')
		await fs.writeFile(filePath, sourceCode)

		await execa('tsx', [cliPath], {
			cwd: testDir,
			preferLocal: true
		})

		// Should not modify because return type is any
		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toBe(sourceCode)
	})

	it('handles functions with conditional types', async () => {
		const sourceCode = `
function isType<T>(value: any): value is T {
  return typeof value === typeof ({} as T);
}
`.trim()

		const filePath = path.join(testDir, 'isType_test.ts')
		await fs.writeFile(filePath, sourceCode)

		await execa('tsx', [cliPath], {
			cwd: testDir,
			preferLocal: true
		})

		// Should not modify because return type is already specified
		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toBe(sourceCode)
	})

	it('saves modified files', async () => {
		const sourceCode = `
function greet(name: string) {
  return 'Hello, ' + name;
}
`.trim()

		const filePath = path.join(testDir, 'save_test.ts')
		await fs.writeFile(filePath, sourceCode)

		// No need to mark the file for cleanup; testDir is removed after each test
		await execa('tsx', [cliPath], {
			cwd: testDir,
			preferLocal: true
		})

		// Read the file from disk to verify it was saved
		const savedContent = await fs.readFile(filePath, 'utf-8')
		expect(savedContent).toContain('function greet(name: string): string')
	})

	// New tests based on your request

	it('handles --shallow argument', async () => {
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
		const topLevelFilePath = path.join(testDir, 'topLevel.ts')
		await fs.writeFile(topLevelFilePath, topLevelFile)

		// Create a subdirectory and write the subdirectory file
		const subDir = path.join(testDir, 'subdir')
		await fs.ensureDir(subDir)
		const subDirFilePath = path.join(subDir, 'subDirFile.ts')
		await fs.writeFile(subDirFilePath, subDirFile)

		// Run the CLI with the --shallow argument
		await execa('tsx', [cliPath, '--shallow'], {
			cwd: testDir,
			preferLocal: true
		})

		// Read the files back
		const updatedTopLevelFile = await fs.readFile(topLevelFilePath, 'utf-8')
		const updatedSubDirFile = await fs.readFile(subDirFilePath, 'utf-8')

		// Check that the top-level file was modified
		expect(updatedTopLevelFile).toContain('function topLevelFunction(): string')

		// Check that the subdirectory file was not modified
		expect(updatedSubDirFile).toBe(subDirFile)
	})

	it('handles --ignore argument', async () => {
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
		const processFilePath = path.join(testDir, 'process.ts')
		await fs.writeFile(processFilePath, fileToProcess)

		const ignoreFilePath = path.join(testDir, 'ignore.ts')
		await fs.writeFile(ignoreFilePath, fileToIgnore)

		// Run the CLI with the --ignore argument
		await execa('tsx', [cliPath, '--ignore', 'ignore.ts'], {
			cwd: testDir,
			preferLocal: true
		})

		// Read the files back
		const updatedProcessFile = await fs.readFile(processFilePath, 'utf-8')
		const updatedIgnoreFile = await fs.readFile(ignoreFilePath, 'utf-8')

		// Check that the file to process was modified
		expect(updatedProcessFile).toContain('function shouldBeProcessed(): number')

		// Check that the ignored file was not modified
		expect(updatedIgnoreFile).toBe(fileToIgnore)
	})

	it('handles --concurrency argument', async () => {
		// Create multiple files to process
		const numberOfFiles = 20
		const filePromises = []

		for (let i = 0; i < numberOfFiles; i++) {
			const fileContent = `
function func${i}() {
  return ${i};
}
`.trim()

			const filePath = path.join(testDir, `file${i}.ts`)
			filePromises.push(fs.writeFile(filePath, fileContent))
		}

		await Promise.all(filePromises)

		// Run the CLI with the --concurrency argument
		await execa('tsx', [cliPath, '--concurrency', '5'], {
			cwd: testDir,
			preferLocal: true
		})

		// Read back the files and check they have been modified
		const checkPromises = []

		for (let i = 0; i < numberOfFiles; i++) {
			const filePath = path.join(testDir, `file${i}.ts`)
			const expectedContent = `
function func${i}(): number {
  return ${i};
}
`.trim()

			checkPromises.push(
				fs.readFile(filePath, 'utf-8').then((updatedContent) => {
					expect(updatedContent.trim()).toBe(expectedContent)
				})
			)
		}

		await Promise.all(checkPromises)
	})
	it('ignores function expressions when --ignore-expressions is used', async () => {
		const sourceCode = `
const myFunction = function() {
  return 42;
}

const myArrowFunction = () => {
  return 43;
}
`.trim()

		const filePath = path.join(testDir, 'ignoreExpressions_test.ts')
		await fs.writeFile(filePath, sourceCode)

		await execa('tsx', [cliPath, '--ignore-expressions'], {
			cwd: testDir,
			preferLocal: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		// Should not have added return types
		expect(updatedSource).toBe(sourceCode)
	})

	it('ignores functions without type parameters when --ignore-functions-without-type-parameters is used', async () => {
		const sourceCode = `
function noTypeParams() {
  return 'hello';
}

function withTypeParams<T>() {
  return 'hello';
}
`.trim()

		const filePath = path.join(
			testDir,
			'ignoreFunctionsWithoutTypeParameters_test.ts'
		)
		await fs.writeFile(filePath, sourceCode)

		await execa(
			'tsx',
			[cliPath, '--ignore-functions-without-type-parameters'],
			{
				cwd: testDir,
				preferLocal: true
			}
		)

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('function noTypeParams() {') // Should not have return type added
		expect(updatedSource).toContain('function withTypeParams<T>(): string {') // Should have return type added
	})

	it('ignores functions with names in --ignore-names', async () => {
		const sourceCode = `
function allowedFunction() {
  return 1;
}

function notAllowedFunction() {
  return 2;
}
`.trim()

		const filePath = path.join(testDir, 'allowedNames_test.ts')
		await fs.writeFile(filePath, sourceCode)

		await execa('tsx', [cliPath, '--ignore-names', 'allowedFunction'], {
			cwd: testDir,
			preferLocal: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('function allowedFunction() {') // Should not have return type added
		expect(updatedSource).toContain('function notAllowedFunction(): number {') // Should have return type added
	})

	it('ignores higher order functions when --ignore-higher-order-functions is used', async () => {
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

		const filePath = path.join(testDir, 'ignoreHigherOrderFunctions_test.ts')
		await fs.writeFile(filePath, sourceCode)

		await execa('tsx', [cliPath, '--ignore-higher-order-functions'], {
			cwd: testDir,
			preferLocal: true
		})

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		expect(updatedSource).toContain('function higherOrder() {') // Should not have return type added
		expect(updatedSource).toContain('function normalFunction(): number {') // Should have return type added
	})

	it('ignores typed function expressions when --ignore-typed-function-expressions is used', async () => {
		const sourceCode = `
const typedFunction: () => number = function() {
  return 42;
}

const untypedFunction = function() {
  return 43;
}
`.trim()

		const filePath = path.join(
			testDir,
			'ignoreTypedFunctionExpressions_test.ts'
		)
		await fs.writeFile(filePath, sourceCode)

		await execa('tsx', [cliPath, '--ignore-typed-function-expressions'], {
			cwd: testDir,
			preferLocal: true
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

	it('ignores concise arrow functions starting with void when --ignore-concise-arrow-function-expressions-starting-with-void is used', async () => {
		const sourceCode = `
const arrowVoid = () => void doSomething();
const arrowNormal = () => 42;
`.trim()

		const filePath = path.join(
			testDir,
			'ignoreConciseArrowFunctionExpressionsStartingWithVoid_test.ts'
		)
		await fs.writeFile(filePath, sourceCode)

		await execa(
			'tsx',
			[
				cliPath,
				'--ignore-concise-arrow-function-expressions-starting-with-void'
			],
			{
				cwd: testDir,
				preferLocal: true
			}
		)

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		// arrowVoid should not have return type added
		expect(updatedSource).toContain(
			'const arrowVoid = () => void doSomething();'
		)
		// arrowNormal should have return type added
		expect(updatedSource).toContain('const arrowNormal = (): number => 42;')
	})

	it('ignores arrow functions returning const assertion when --ignore-direct-const-assertion-in-arrow-functions is used', async () => {
		const sourceCode = `
const arrowConst = () => ({ x: 1 } as const);
const arrowNormal = () => 42;
`.trim()

		const filePath = path.join(
			testDir,
			'ignoreDirectConstAssertionInArrowFunctions_test.ts'
		)
		await fs.writeFile(filePath, sourceCode)

		await execa(
			'tsx',
			[cliPath, '--ignore-direct-const-assertion-in-arrow-functions'],
			{
				cwd: testDir,
				preferLocal: true
			}
		)

		const updatedSource = await fs.readFile(filePath, 'utf-8')
		// arrowConst should not have return type added
		expect(updatedSource).toContain(
			'const arrowConst = () => ({ x: 1 } as const);'
		)
		// arrowNormal should have return type added
		expect(updatedSource).toContain('const arrowNormal = (): number => 42;')
	})
})
