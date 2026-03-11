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

  // Authenticated test moved to phase-00.authenticated.spec.ts
  // Run with: TEST_USER_EMAIL=... TEST_USER_PASSWORD=... pnpm test:e2e
})
