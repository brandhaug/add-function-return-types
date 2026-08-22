import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		setupFiles: ['./test/mocks/setup-clack.ts'],
		testTimeout: 1000000000
	}
})
