import { test, expect } from '@playwright/test'

/**
 * Phase 01 E2E — unauthenticated.
 * TASK-171: Structure for Phase 01 E2E; full flow (features → generate → approve) lives in phase-01.authenticated.spec.ts.
 */
test.describe('Phase 01', () => {
  test('Phase 01 page redirects when not authenticated', async ({ page }) => {
    await page.goto('/projects/00000000-0000-0000-0000-000000000000/phase/01')
    await expect(page).toHaveURL(/\/login/)
  })
})
