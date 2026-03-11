import { test, expect } from '@playwright/test'

/**
 * Agents E2E tests (unauthenticated).
 *
 * Authenticated flow: agents.authenticated.spec.ts
 */
test.describe('Agents', () => {
  test('agents page redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/projects/00000000-0000-0000-0000-000000000000/agents')
    await expect(page).toHaveURL(/\/login/)
  })
})
