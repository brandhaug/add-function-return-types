import { vi } from 'vitest'

// Global deterministic mock of the interactive prompts so CLI tests run
// non-interactively. Individual tests can override these with vi.mocked().
vi.mock(
	'@clack/prompts',
	(): { intro: Mock<Procedure>; outro: Mock<Procedure>; cancel: Mock<Procedure>; log: { message: Mock<Procedure>; info: Mock<Procedure>; warn: Mock<Procedure>; error: Mock<Procedure>; }; isCancel: Mock<() => boolean>; text: Mock<({ initialValue }: { initialValue?: string; }) => Promise<string>>; confirm: Mock<() => Promise<boolean>>; multiselect: Mock<() => Promise<never[]>>; } => ({
		intro: vi.fn(),
		outro: vi.fn(),
		cancel: vi.fn(),
		log: {
			message: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn()
		},
		isCancel: vi.fn((): boolean => false),
		text: vi.fn(
			async ({ initialValue }: { initialValue?: string }): Promise<string> =>
				initialValue === undefined ? '' : initialValue
		),
		confirm: vi.fn(async (): Promise<boolean> => false),
		multiselect: vi.fn(async (): Promise<never[]> => [])
	})
)
