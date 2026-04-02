/**
 * E2E: critical API routes — auth boundaries and JSON error shape (no session).
 * Uses Playwright request API (no auth setup dependency).
 */
import { test, expect } from '@playwright/test'

test.describe('API routes without authentication', () => {
  test('GET /api/projects returns 401', async ({ request }) => {
    const res = await request.get('/api/projects')
    expect(res.status()).toBe(401)
    const json = await res.json().catch(() => null)
    if (json && typeof json === 'object' && 'error' in json) {
      expect((json as { error: string }).error).toBeTruthy()
    }
  })

  test('POST /api/projects returns 401', async ({ request }) => {
    const res = await request.post('/api/projects', {
      data: { name: 'X', industry: 'tech' },
    })
    expect(res.status()).toBe(401)
  })

  test('GET /api/projects/[id]/costs returns 401 without session', async ({ request }) => {
    const res = await request.get(
      '/api/projects/00000000-0000-0000-0000-000000000001/costs',
    )
    expect(res.status()).toBe(401)
  })

  test('GET /api/projects/[id]/agents/suggestions returns 401', async ({ request }) => {
    const res = await request.get(
      '/api/projects/00000000-0000-0000-0000-000000000001/agents/suggestions',
    )
    expect(res.status()).toBe(401)
  })

  test('GET /api/projects/[id]/readiness returns 401', async ({ request }) => {
    const res = await request.get(
      '/api/projects/00000000-0000-0000-0000-000000000001/readiness',
    )
    expect(res.status()).toBe(401)
  })
})
