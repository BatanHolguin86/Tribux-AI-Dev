import { test, expect } from '@playwright/test'

test.describe('Protected routes redirect to login', () => {
  test('dashboard redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
    await expect(page).toHaveURL(/redirect=.*dashboard/)
  })

  test('projects phase 00 redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/projects/00000000-0000-0000-0000-000000000000/phase/00')
    await expect(page).toHaveURL(/\/login/)
    await expect(page).toHaveURL(/redirect=.*phase/)
  })

  test('projects phase 01 redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/projects/00000000-0000-0000-0000-000000000000/phase/01')
    await expect(page).toHaveURL(/\/login/)
  })

  test('projects agents page redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/projects/00000000-0000-0000-0000-000000000000/agents')
    await expect(page).toHaveURL(/\/login/)
  })

  test('onboarding redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/onboarding')
    await expect(page).toHaveURL(/\/login/)
  })
})
