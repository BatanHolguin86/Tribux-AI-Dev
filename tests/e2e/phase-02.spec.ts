import { test, expect } from '@playwright/test'

test.describe('Phase 02', () => {
  test('Phase 02 page redirects when not authenticated', async ({ page }) => {
    await page.goto('/projects/any-id/phase/02')
    await expect(page).toHaveURL(/\/login/)
  })
})
