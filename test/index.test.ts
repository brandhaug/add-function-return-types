import path from 'node:path'
import { execa } from 'execa'
import { describe, it } from 'vitest'

describe('index', (): void => {
  it('should work', async (): Promise<void> => {
    const cliPath = path.resolve(__dirname, '../src/index.ts')

    await execa('tsx', [cliPath], {
      preferLocal: true
    })
  })
})
