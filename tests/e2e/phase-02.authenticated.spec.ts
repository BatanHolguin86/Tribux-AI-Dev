import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const AUTH_FILE = path.join(__dirname, '../.auth/user.json')
const PROJECT_ID_FILE = path.join(__dirname, '../.auth/project-id.json')

test.skip(
  !fs.existsSync(AUTH_FILE),
  'Auth file missing — run with TEST_USER_EMAIL and TEST_USER_PASSWORD',
)

test.describe('Phase 02 — authenticated', () => {
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

  test('Phase 02 loads and shows architecture sections when authenticated', async ({ page }) => {
    const projectId = await getProjectId(page)
    await page.goto(`/projects/${projectId}/phase/02`)

    // Should show the page without error
    await expect(page.locator('body')).not.toContainText(/error/i, { timeout: 10000 })

    // Should show section nav or progress indicator
    const progressText = page.getByText(/secciones completadas/i)
    const sectionButton = page.getByRole('button').first()
    const hasContent = await progressText.isVisible().catch(() => false) ||
      await sectionButton.isVisible().catch(() => false)

    expect(hasContent).toBe(true)
  })

  test('Phase 02 shows chat input for architecture discussion', async ({ page }) => {
    const projectId = await getProjectId(page)
    await page.goto(`/projects/${projectId}/phase/02`)

    // Look for chat input or textarea
    const chatInput = page.getByRole('textbox').first()
    const isVisible = await chatInput.isVisible({ timeout: 10000 }).catch(() => false)

    // Phase 02 should have a chat input if sections are not all approved
    // or a final gate if all approved
    const finalGate = page.getByText(/aprobar phase 02|fase completada/i)
    const hasFinalGate = await finalGate.isVisible().catch(() => false)

    expect(isVisible || hasFinalGate).toBe(true)
  })
})
