import { describe, it, expect } from 'vitest'

/**
 * Admin API routes — verify all handlers exist and are properly exported.
 * Deep testing requires admin auth mock which is complex;
 * these tests verify route structure and handler signatures.
 */

describe('admin finance routes', () => {
  it('GET /api/admin/finance/overview exists', async () => {
    const mod = await import('@/app/api/admin/finance/overview/route')
    expect(mod.GET).toBeDefined()
    expect(typeof mod.GET).toBe('function')
  })

  it('GET /api/admin/finance/users/[userId] exists', async () => {
    const mod = await import('@/app/api/admin/finance/users/[userId]/route')
    expect(mod.GET).toBeDefined()
  })
})

describe('admin marketing routes', () => {
  it('GET /api/admin/marketing/threads exists', async () => {
    const mod = await import('@/app/api/admin/marketing/threads/route')
    expect(mod.GET).toBeDefined()
    expect(mod.POST).toBeDefined()
  })

  it('GET/DELETE /api/admin/marketing/threads/[threadId] exists', async () => {
    const mod = await import('@/app/api/admin/marketing/threads/[threadId]/route')
    expect(mod.GET).toBeDefined()
    expect(mod.DELETE).toBeDefined()
  })

  it('GET/POST /api/admin/marketing/artifacts exists', async () => {
    const mod = await import('@/app/api/admin/marketing/artifacts/route')
    expect(mod.GET).toBeDefined()
    expect(mod.POST).toBeDefined()
  })

  it('PATCH/DELETE /api/admin/marketing/artifacts/[id] exists', async () => {
    const mod = await import('@/app/api/admin/marketing/artifacts/[id]/route')
    expect(mod.PATCH).toBeDefined()
    expect(mod.DELETE).toBeDefined()
  })

  it('POST /api/admin/marketing/chat exists', async () => {
    const mod = await import('@/app/api/admin/marketing/chat/route')
    expect(mod.POST).toBeDefined()
  })
})

describe('admin platform-config routes', () => {
  it('GET/PUT /api/admin/platform-config exists', async () => {
    const mod = await import('@/app/api/admin/platform-config/route')
    expect(mod.GET).toBeDefined()
    expect(mod.PUT).toBeDefined()
  })

  it('POST /api/admin/platform-config/test exists', async () => {
    const mod = await import('@/app/api/admin/platform-config/test/route')
    expect(mod.POST).toBeDefined()
  })
})
