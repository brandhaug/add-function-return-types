import { mock } from 'bun:test'

// Global deterministic mock of the interactive prompts so CLI tests run
// non-interactively. Individual tests can override these via the exported
// mock handles.
export const intro = mock((_message?: string): void => {})
export const outro = mock((_message?: string): void => {})
export const cancel = mock((_message?: string): void => {})
export const isCancel = mock((): boolean => false)
export const text = mock(
	async ({ initialValue }: { initialValue?: string }): Promise<string> =>
		initialValue === undefined ? '' : initialValue
)
export const confirm = mock(async (): Promise<boolean> => false)
export const multiselect = mock(async (): Promise<never[]> => [])

export const log = {
	message: mock((_message?: string): void => {}),
	info: mock((_message?: string): void => {}),
	warn: mock((_message?: string): void => {}),
	error: mock((_message?: string): void => {})
}

mock.module('@clack/prompts', () => ({
	intro,
	outro,
	cancel,
	log,
	isCancel,
	text,
	confirm,
	multiselect
}))
