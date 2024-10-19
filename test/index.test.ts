import * as fs from 'node:fs'
import * as path from 'node:path'
import { Project } from 'ts-morph'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { processFile } from '../src'

describe('processFile', (): void => {
	let project: Project
	const createdFiles: string[] = []

	beforeEach((): void => {
		project = new Project()
	})

	afterEach((): void => {
		// Clean up any files that were saved to disk
		for (const filePath of createdFiles) {
			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath)
			}
		}
		createdFiles.length = 0 // Clear the array
	})

	function createTestSourceFile(fileName: string, sourceCode: string) {
		const filePath = path.resolve(__dirname, fileName)
		const sourceFile = project.createSourceFile(filePath, sourceCode, {
			overwrite: true
		})
		createdFiles.push(filePath)
		return { sourceFile, filePath }
	}

	it('adds return types to functions without explicit return types', async (): Promise<void> => {
		const sourceCode = `
      function greet(name: string) {
        return 'Hello, ' + name;
      }
      
      const getNumber = () => {
        return 42;
      }
    `.trim()

		const { sourceFile } = createTestSourceFile('greet_test.ts', sourceCode)

		await processFile(project, sourceFile.getFilePath())

		const updatedSource = sourceFile.getText()
		expect(updatedSource).toContain('function greet(name: string): string')
		expect(updatedSource).toContain('const getNumber = (): number =>')
	})

	it('does not modify functions with explicit return types', async (): Promise<void> => {
		const sourceCode = `
      function sum(a: number, b: number): number {
        return a + b;
      }
    `.trim()

		const { sourceFile } = createTestSourceFile('sum_test.ts', sourceCode)

		await processFile(project, sourceFile.getFilePath())

		const updatedSource = sourceFile.getText()
		expect(updatedSource).toBe(sourceCode)
	})

	it('handles arrow functions correctly', async (): Promise<void> => {
		const sourceCode = `
      const multiply = (a: number, b: number) => {
        return a * b;
      }
    `.trim()

		const { sourceFile } = createTestSourceFile('multiply_test.ts', sourceCode)

		await processFile(project, sourceFile.getFilePath())

		const updatedSource = sourceFile.getText()
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

		const { sourceFile } = createTestSourceFile('fetchData_test.ts', sourceCode)

		await processFile(project, sourceFile.getFilePath())

		const updatedSource = sourceFile.getText()
		expect(updatedSource).toContain(
			'async function fetchData(url: string): Promise<any>'
		)
	})

	it('does not modify constructors', async (): Promise<void> => {
		const sourceCode = `
      class Person {
        constructor(public name: string) {}
      }
    `.trim()

		const { sourceFile } = createTestSourceFile('Person_test.ts', sourceCode)

		await processFile(project, sourceFile.getFilePath())

		const updatedSource = sourceFile.getText()
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

		const { sourceFile } = createTestSourceFile(
			'Calculator_test.ts',
			sourceCode
		)

		await processFile(project, sourceFile.getFilePath())

		const updatedSource = sourceFile.getText()
		expect(updatedSource).toContain('add(a: number, b: number): number')
	})

	it('skips functions returning any or unknown types', async (): Promise<void> => {
		const sourceCode = `
      function parseData(data: string) {
        return JSON.parse(data);
      }
    `.trim()

		const { sourceFile } = createTestSourceFile('parseData_test.ts', sourceCode)

		await processFile(project, sourceFile.getFilePath())

		const updatedSource = sourceFile.getText()
		expect(updatedSource).toBe(sourceCode)
	})

	it('does not modify functions with existing return types', async (): Promise<void> => {
		const sourceCode = `
      function getUser(): { name: string; age: number } {
        return { name: 'Alice', age: 30 };
      }
    `.trim()

		const { sourceFile } = createTestSourceFile('getUser_test.ts', sourceCode)

		await processFile(project, sourceFile.getFilePath())

		const updatedSource = sourceFile.getText()
		expect(updatedSource).toBe(sourceCode)
	})

	it('handles functions returning anonymous objects', async (): Promise<void> => {
		const sourceCode = `
      function createUser(name: string, age: number) {
        return { name, age };
      }
    `.trim()

		const { sourceFile } = createTestSourceFile(
			'createUser_test.ts',
			sourceCode
		)

		await processFile(project, sourceFile.getFilePath())

		const updatedSource = sourceFile.getText()
		// Assuming the script does not add return types for anonymous objects
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

		const { sourceFile } = createTestSourceFile('combine_test.ts', sourceCode)

		await processFile(project, sourceFile.getFilePath())

		const updatedSource = sourceFile.getText()
		expect(updatedSource).toBe(sourceCode)
	})

	it('adds return types to functions returning void', async (): Promise<void> => {
		const sourceCode = `
      function logMessage(message: string) {
        console.log(message);
      }
    `.trim()

		const { sourceFile } = createTestSourceFile(
			'logMessage_test.ts',
			sourceCode
		)

		await processFile(project, sourceFile.getFilePath())

		const updatedSource = sourceFile.getText()
		expect(updatedSource).toContain(
			'function logMessage(message: string): void'
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

		const { sourceFile } = createTestSourceFile(
			'idGenerator_test.ts',
			sourceCode
		)

		await processFile(project, sourceFile.getFilePath())

		const updatedSource = sourceFile.getText()
		expect(updatedSource).toContain(
			'function* idGenerator(): Generator<number, void, unknown>'
		)
	})

	it('handles functions with type parameters', async (): Promise<void> => {
		const sourceCode = `
      function identity<T>(arg: T) {
        return arg;
      }
    `.trim()

		const { sourceFile } = createTestSourceFile('identity_test.ts', sourceCode)

		await processFile(project, sourceFile.getFilePath())

		const updatedSource = sourceFile.getText()
		expect(updatedSource).toContain('function identity<T>(arg: T): T')
	})

	it('adds return types to functions returning union types', async (): Promise<void> => {
		const sourceCode = `
      function toNumber(value: string | number) {
        if (typeof value === 'string') {
          return parseInt(value, 10);
        }
        return value;
      }
    `.trim()

		const { sourceFile } = createTestSourceFile('toNumber_test.ts', sourceCode)

		await processFile(project, sourceFile.getFilePath())

		const updatedSource = sourceFile.getText()
		expect(updatedSource).toContain(
			'function toNumber(value: string | number): number'
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

		const { sourceFile } = createTestSourceFile(
			'objectLiteral_test.ts',
			sourceCode
		)

		await processFile(project, sourceFile.getFilePath())

		const updatedSource = sourceFile.getText()

		expect(updatedSource).toContain('greet(name: string): string')
		expect(updatedSource).toContain('add(a: number, b: number): number')
	})

	it('handles functions with destructured parameters', async (): Promise<void> => {
		const sourceCode = `
      function getFullName({ firstName, lastName }: { firstName: string; lastName: string }) {
        return firstName + ' ' + lastName;
      }
    `.trim()

		const { sourceFile } = createTestSourceFile(
			'getFullName_test.ts',
			sourceCode
		)

		await processFile(project, sourceFile.getFilePath())

		const updatedSource = sourceFile.getText()
		expect(updatedSource).toContain(
			'function getFullName({ firstName, lastName }: { firstName: string; lastName: string }): string'
		)
	})

	it('handles functions with default parameters', async (): Promise<void> => {
		const sourceCode = `
      function greet(name: string = 'World') {
        return 'Hello, ' + name;
      }
    `.trim()

		const { sourceFile } = createTestSourceFile(
			'greetDefault_test.ts',
			sourceCode
		)

		await processFile(project, sourceFile.getFilePath())

		const updatedSource = sourceFile.getText()
		expect(updatedSource).toContain(
			`function greet(name: string = 'World'): string`
		)
	})

	it('handles functions with rest parameters', async (): Promise<void> => {
		const sourceCode = `
      function sum(...numbers: number[]) {
        return numbers.reduce((a, b) => a + b, 0);
      }
    `.trim()

		const { sourceFile } = createTestSourceFile('sumRest_test.ts', sourceCode)

		await processFile(project, sourceFile.getFilePath())

		const updatedSource = sourceFile.getText()
		expect(updatedSource).toContain(
			'function sum(...numbers: number[]): number'
		)
	})

	it('handles functions with optional parameters', async (): Promise<void> => {
		const sourceCode = `
      function getLength(str?: string) {
        return str ? str.length : 0;
      }
    `.trim()

		const { sourceFile } = createTestSourceFile('getLength_test.ts', sourceCode)

		await processFile(project, sourceFile.getFilePath())

		const updatedSource = sourceFile.getText()
		expect(updatedSource).toContain('function getLength(str?: string): number')
	})

	it('does modify functions inside namespaces', async (): Promise<void> => {
		const sourceCode = `
      namespace Utils {
        export function parse(data: string) {
          return JSON.parse(data);
        }
      }
    `.trim()

		const { sourceFile } = createTestSourceFile('Utils_test.ts', sourceCode)

		await processFile(project, sourceFile.getFilePath())

		const updatedSource = sourceFile.getText()
		// Assuming the script does not handle functions inside namespaces
		expect(updatedSource).toBe(sourceCode)
	})

	it('handles anonymous functions assigned to variables', async (): Promise<void> => {
		const sourceCode = `
      const double = function(n: number) {
        return n * 2;
      };
    `.trim()

		const { sourceFile } = createTestSourceFile('double_test.ts', sourceCode)

		await processFile(project, sourceFile.getFilePath())

		const updatedSource = sourceFile.getText()
		expect(updatedSource).toContain(
			'const double = function(n: number): number'
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

		const { sourceFile } = createTestSourceFile(
			'createAdder_test.ts',
			sourceCode
		)

		await processFile(project, sourceFile.getFilePath())

		const updatedSource = sourceFile.getText()
		expect(updatedSource).toContain(
			'function createAdder(a: number): (b: number) => number'
		)
	})

	it('handles higher-order functions', async (): Promise<void> => {
		const sourceCode = `
      function applyOperation(a: number, b: number, operation: (x: number, y: number) => number) {
        return operation(a, b);
      }
    `.trim()

		const { sourceFile } = createTestSourceFile(
			'applyOperation_test.ts',
			sourceCode
		)

		await processFile(project, sourceFile.getFilePath())

		const updatedSource = sourceFile.getText()
		expect(updatedSource).toContain(
			'function applyOperation(a: number, b: number, operation: (x: number, y: number) => number): number'
		)
	})

	it('does not modify functions with inferred any return type due to untyped dependencies', async (): Promise<void> => {
		const sourceCode = `
      function getValue(key: string) {
        return (window as any)[key];
      }
    `.trim()

		const { sourceFile } = createTestSourceFile('getValue_test.ts', sourceCode)

		await processFile(project, sourceFile.getFilePath())

		const updatedSource = sourceFile.getText()
		// Should not modify because return type is any
		expect(updatedSource).toBe(sourceCode)
	})

	it('handles functions with conditional types', async (): Promise<void> => {
		const sourceCode = `
      function isType<T>(value: any): value is T {
        return typeof value === typeof ({} as T);
      }
    `.trim()

		const { sourceFile } = createTestSourceFile('isType_test.ts', sourceCode)

		await processFile(project, sourceFile.getFilePath())

		const updatedSource = sourceFile.getText()
		// Should not modify because return type is already specified
		expect(updatedSource).toBe(sourceCode)
	})

	it('saves modified files', async (): Promise<void> => {
		const sourceCode = `
      function greet(name: string) {
        return 'Hello, ' + name;
      }
    `.trim()

		const { sourceFile, filePath } = createTestSourceFile(
			'save_test.ts',
			sourceCode
		)

		// Mark the file for cleanup after test
		createdFiles.push(filePath)

		await processFile(project, sourceFile.getFilePath())

		// Read the file from disk to verify it was saved
		const savedContent = fs.readFileSync(filePath, 'utf-8')
		expect(savedContent).toContain('function greet(name: string): string')
	})
})
