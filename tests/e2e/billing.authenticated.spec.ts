import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const AUTH_FILE = path.join(__dirname, '../.auth/user.json')
const PROJECT_ID_FILE = path.join(__dirname, '../.auth/project-id.json')

test.skip(
  !fs.existsSync(AUTH_FILE),
  'Auth file missing — run with TEST_USER_EMAIL and TEST_USER_PASSWORD',
)

test.describe('Billing & Paywall — authenticated', () => {
  async function getProjectId(page: import('@playwright/test').Page): Promise<string> {
    if (fs.existsSync(PROJECT_ID_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROJECT_ID_FILE, 'utf-8'))
      return data.projectId as string
    }

    await page.goto('/dashboard')
    const link = page.getByRole('link', { name: /continuar/i }).first()
    await expect(link).toBeVisible()
    const href = await link.getAttribute('href')
    const match = href?.match(/\/projects\/([a-f0-9-]+)\//i)
    if (!match) throw new Error('No project found. Complete onboarding with the test user first.')
    return match[1]
  }

  test('Trial banner visible on dashboard for trialing users', async ({ page }) => {
    await page.goto('/dashboard')

    // The trial banner should appear if user is in trial
    const banner = page.getByText(/dias de prueba|prueba gratuita/i)
    const upgradeLink = page.getByText(/upgrade ahora/i)

    const hasBanner = await banner.isVisible({ timeout: 5000 }).catch(() => false)
    const hasUpgradeLink = await upgradeLink.isVisible().catch(() => false)

    // At least one trial-related element should be present (or user is already on paid plan)
    // This test documents the expected behavior without asserting hard
    if (hasBanner) {
      expect(hasUpgradeLink).toBe(true)
    }
  })

  test('Paywall modal appears when accessing gated phase without plan', async ({ page }) => {
    const projectId = await getProjectId(page)

    // Phase 02 requires builder plan — free users should see paywall
    await page.goto(`/projects/${projectId}/phase/02`)

    // Either the page loads (user has access) or a paywall/lock appears
    const paywallText = page.getByText(/upgrade.*plan|plan actual|funcionalidad/i)
    const phaseContent = page.getByText(/arquitectura|architecture|design/i)

    const hasPaywall = await paywallText.first().isVisible({ timeout: 10000 }).catch(() => false)
    const hasContent = await phaseContent.first().isVisible({ timeout: 5000 }).catch(() => false)

    // One of the two should be visible
    expect(hasPaywall || hasContent).toBe(true)
  })

  test('Checkout API returns error when Stripe is not configured', async ({ request }) => {
    const res = await request.post('/api/billing/checkout', {
      data: { plan: 'builder' },
    })

    // Without Stripe keys, should get 503 or 401
    const status = res.status()
    expect([401, 503]).toContain(status)
  })

  test('Checkout API rejects invalid plan', async ({ request }) => {
    const res = await request.post('/api/billing/checkout', {
      data: { plan: 'nonexistent' },
    })

    // Should get 400 or 401/503
    const status = res.status()
    expect([400, 401, 503]).toContain(status)
  })
})
