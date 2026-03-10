import { test, expect } from '@playwright/test'

/**
 * Phase 00 E2E tests.
 *
 * Note: Full flow (chat, document generation) requires:
 * - Authenticated user (use storageState with a test session)
 * - Anthropic credits (or mock the chat API)
 *
 * See docs/05-qa/ for QA runbook and test user setup.
 */
test.describe('Phase 00', () => {
  test('Phase 00 page redirects when not authenticated', async ({ page }) => {
    await page.goto('/projects/00000000-0000-0000-0000-000000000000/phase/00')
    await expect(page).toHaveURL(/\/login/)
  })

  test.skip('Phase 00 loads and shows chat input when authenticated', async ({ page }) => {
    // Requires storageState with valid session. Run locally with:
    // PLAYWRIGHT_AUTH_FILE=./tests/.auth/user.json pnpm test:e2e
    // and a prior login flow that saves storageState.
    await page.goto('/projects/00000000-0000-0000-0000-000000000000/phase/00')
    await expect(page.getByPlaceholder(/escribe|mensaje|pregunta/i)).toBeVisible()
    await expect(page.getByText(/problem statement|brief|personas/i)).toBeVisible()
  })
})
