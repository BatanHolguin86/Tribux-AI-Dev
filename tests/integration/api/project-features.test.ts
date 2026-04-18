import { describe, it, expect } from 'vitest'

/**
 * Project feature routes — exports, files, knowledge, designs, infrastructure.
 */

describe('project export routes', () => {
  it('export/bundle exports GET', async () => {
    const mod = await import('@/app/api/projects/[id]/export/bundle/route')
    expect(mod.GET).toBeDefined()
  })

  it('export/document exports GET', async () => {
    const mod = await import('@/app/api/projects/[id]/export/document/route')
    expect(mod.GET).toBeDefined()
  })

  it('export/transfer-bundle exports POST', async () => {
    const mod = await import('@/app/api/projects/[id]/export/transfer-bundle/route')
    expect(mod.POST).toBeDefined()
  })
})

describe('project utility routes', () => {
  it('files exports GET', async () => {
    const mod = await import('@/app/api/projects/[id]/files/route')
    expect(mod.GET).toBeDefined()
  })

  it('infrastructure exports GET', async () => {
    const mod = await import('@/app/api/projects/[id]/infrastructure/route')
    expect(mod.GET).toBeDefined()
  })

  it('sql/execute exports POST', async () => {
    const mod = await import('@/app/api/projects/[id]/sql/execute/route')
    expect(mod.POST).toBeDefined()
  })

  it('costs/infra-tiers exports PATCH', async () => {
    const mod = await import('@/app/api/projects/[id]/costs/infra-tiers/route')
    expect(mod.PATCH).toBeDefined()
  })

  it('artifacts exports POST', async () => {
    const mod = await import('@/app/api/projects/[id]/artifacts/route')
    expect(mod.POST).toBeDefined()
  })
})

describe('knowledge base routes', () => {
  it('knowledge exports GET and POST', async () => {
    const mod = await import('@/app/api/projects/[id]/knowledge/route')
    expect(mod.GET).toBeDefined()
    expect(mod.POST).toBeDefined()
  })

  it('knowledge/seed exports POST', async () => {
    const mod = await import('@/app/api/projects/[id]/knowledge/seed/route')
    expect(mod.POST).toBeDefined()
  })
})

describe('design import routes', () => {
  it('import/figma exports POST', async () => {
    const mod = await import('@/app/api/projects/[id]/designs/import/figma/route')
    expect(mod.POST).toBeDefined()
  })

  it('import/lovable exports POST', async () => {
    const mod = await import('@/app/api/projects/[id]/designs/import/lovable/route')
    expect(mod.POST).toBeDefined()
  })

  it('import/v0 exports POST', async () => {
    const mod = await import('@/app/api/projects/[id]/designs/import/v0/route')
    expect(mod.POST).toBeDefined()
  })
})

describe('phase misc routes', () => {
  it('phase 1 approve exports POST', async () => {
    const mod = await import('@/app/api/projects/[id]/phases/1/approve/route')
    expect(mod.POST).toBeDefined()
  })

  it('phase 1 features/suggest exports POST', async () => {
    const mod = await import('@/app/api/projects/[id]/phases/1/features/suggest/route')
    expect(mod.POST).toBeDefined()
  })

  it('phase 2 auto-generate exports POST', async () => {
    const mod = await import('@/app/api/projects/[id]/phases/2/auto-generate/route')
    expect(mod.POST).toBeDefined()
  })

  it('phase 2 chat exports POST', async () => {
    const mod = await import('@/app/api/projects/[id]/phases/2/chat/route')
    expect(mod.POST).toBeDefined()
  })
})

describe('admin overage routes', () => {
  it('overage exports GET', async () => {
    const mod = await import('@/app/api/admin/finance/overage/route')
    expect(mod.GET).toBeDefined()
  })

  it('overage/sync exports POST', async () => {
    const mod = await import('@/app/api/admin/finance/overage/sync/route')
    expect(mod.POST).toBeDefined()
  })

  it('overage/[ledgerId]/bill exports POST', async () => {
    const mod = await import('@/app/api/admin/finance/overage/[ledgerId]/bill/route')
    expect(mod.POST).toBeDefined()
  })

  it('overage/[ledgerId]/waive exports POST', async () => {
    const mod = await import('@/app/api/admin/finance/overage/[ledgerId]/waive/route')
    expect(mod.POST).toBeDefined()
  })
})

describe('billing portal', () => {
  it('portal exports POST', async () => {
    const mod = await import('@/app/api/billing/portal/route')
    expect(mod.POST).toBeDefined()
  })
})
