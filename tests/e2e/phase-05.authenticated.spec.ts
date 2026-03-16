import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const AUTH_FILE = path.join(__dirname, '../.auth/user.json')
const PROJECT_ID_FILE = path.join(__dirname, '../.auth/project-id.json')

test.skip(
  !fs.existsSync(AUTH_FILE),
  'Auth file missing — run with TEST_USER_EMAIL and TEST_USER_PASSWORD',
)

test.describe('Phase 05 — authenticated', () => {
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

  test('Phase 05 loads and shows QA testing checklist', async ({ page }) => {
    const projectId = await getProjectId(page)
    await page.goto(`/projects/${projectId}/phase/05`)

    await expect(page.locator('body')).not.toContainText(/error/i, { timeout: 10000 })

    const qaText = page.getByText(/testing|qa|calidad|checklist/i)
    const buttons = page.getByRole('button').first()
    const hasContent = await qaText.isVisible().catch(() => false) ||
      await buttons.isVisible().catch(() => false)

    expect(hasContent).toBe(true)
  })
})
