import { describe, expect, it } from 'bun:test'
import {
	classifyReturnType,
	createRunStats,
	formatStatsTable,
	recordAnnotation,
	recordSkip
} from '../src/stats'

describe('stats', (): void => {
	describe('createRunStats', (): void => {
		it('returns zeroed counters for every annotation kind', (): void => {
			const stats = createRunStats()

			expect(stats.annotations).toEqual({
				primitive: 0,
				promise: 0,
				void: 0,
				unknown: 0,
				any: 0,
				jsx: 0,
				complex: 0
			})
			expect(Object.values(stats.skipped).every((count) => count === 0)).toBe(
				true
			)
			expect(stats.filesModified).toBe(0)
			expect(stats.filesUnchanged).toBe(0)
			expect(stats.filesErrored).toBe(0)
		})
	})

	describe('classifyReturnType', (): void => {
		it('classifies primitives', (): void => {
			expect(classifyReturnType('string')).toBe('primitive')
			expect(classifyReturnType('number')).toBe('primitive')
			expect(classifyReturnType('boolean')).toBe('primitive')
			expect(classifyReturnType('undefined')).toBe('primitive')
			expect(classifyReturnType('null')).toBe('primitive')
		})

		it('classifies promises, void, unknown and any', (): void => {
			expect(classifyReturnType('Promise<string>')).toBe('promise')
			expect(classifyReturnType('void')).toBe('void')
			expect(classifyReturnType('unknown')).toBe('unknown')
			expect(classifyReturnType('any')).toBe('any')
		})

		it('classifies JSX elements', (): void => {
			expect(classifyReturnType('JSX.Element')).toBe('jsx')
			expect(classifyReturnType('React.JSX.Element')).toBe('jsx')
		})

		it('falls back to complex for structural or imported types', (): void => {
			expect(classifyReturnType('{ a: string; b: number; }')).toBe('complex')
			expect(classifyReturnType('SQLiteTextBuilder')).toBe('complex')
			expect(classifyReturnType('Promise<IndexBuilder>')).toBe('promise')
		})
	})

	describe('recordAnnotation', (): void => {
		it('increments the bucket matching the type text', (): void => {
			const stats = createRunStats()

			expect(recordAnnotation(stats, 'string')).toBe('primitive')
			recordAnnotation(stats, 'any')
			recordAnnotation(stats, 'Promise<void>')

			expect(stats.annotations.primitive).toBe(1)
			expect(stats.annotations.any).toBe(1)
			expect(stats.annotations.promise).toBe(1)
		})
	})

	describe('recordSkip', (): void => {
		it('increments the given skip reason', (): void => {
			const stats = createRunStats()

			recordSkip(stats, 'anyForbidden')
			recordSkip(stats, 'anyForbidden')
			recordSkip(stats, 'alreadyAnnotated')

			expect(stats.skipped.anyForbidden).toBe(2)
			expect(stats.skipped.alreadyAnnotated).toBe(1)
			expect(stats.skipped.ignoreExpressions).toBe(0)
		})
	})

	describe('formatStatsTable', (): void => {
		it('renders annotation counts, file counts and non-zero skips', (): void => {
			const stats = createRunStats()
			stats.filesModified = 3
			stats.annotations.any = 10
			stats.annotations.primitive = 2
			recordSkip(stats, 'anyForbidden')

			const table = formatStatsTable(stats)

			expect(table).toContain('Summary statistics')
			expect(table).toContain('modified: 3')
			expect(table).toMatch(/primitive\s+2/)
			expect(table).toMatch(/any\s+10/)
			expect(table).toContain('Skipped: 1')
			expect(table).toContain('anyForbidden 1')
		})
	})
})
