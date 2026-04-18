import { describe, it, expect } from 'vitest'

describe('export template functions', () => {
  it('readme template module exists', async () => {
    const mod = await import('@/lib/export/templates/readme-template')
    expect(mod).toBeDefined()
  })

  it('transfer template module exists', async () => {
    const mod = await import('@/lib/export/templates/transfer-template')
    expect(mod).toBeDefined()
  })
})
