import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const AUTH_FILE = path.join(__dirname, '../.auth/user.json')
const PROJECT_ID_FILE = path.join(__dirname, '../.auth/project-id.json')

test.skip(
  !fs.existsSync(AUTH_FILE),
  'Auth file missing — run with TEST_USER_EMAIL and TEST_USER_PASSWORD',
)

test.describe('Phase 04 — authenticated', () => {
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

  test('Phase 04 loads and shows kanban board when authenticated', async ({ page }) => {
    const projectId = await getProjectId(page)
    await page.goto(`/projects/${projectId}/phase/04`)

    // Should show the page without error
    await expect(page.locator('body')).not.toContainText(/error/i, { timeout: 10000 })

    // Should show kanban columns or task-related elements
    const kanbanText = page.getByText(/kanban|tareas|tasks|columna|board/i)
    const taskElement = page.getByRole('button').first()
    const hasContent = await kanbanText.isVisible().catch(() => false) ||
      await taskElement.isVisible().catch(() => false)

    expect(hasContent).toBe(true)
  })

  test('Phase 04 shows task status columns', async ({ page }) => {
    const projectId = await getProjectId(page)
    await page.goto(`/projects/${projectId}/phase/04`)

    // Look for status column headings (todo, in progress, review, done)
    const todoText = page.getByText(/todo|por hacer|pendiente/i)
    const inProgressText = page.getByText(/in.?progress|en.?progreso|en.?curso/i)
    const reviewText = page.getByText(/review|revision/i)
    const doneText = page.getByText(/done|completado|terminado/i)

    const hasTodo = await todoText.first().isVisible({ timeout: 10000 }).catch(() => false)
    const hasInProgress = await inProgressText.first().isVisible().catch(() => false)
    const hasReview = await reviewText.first().isVisible().catch(() => false)
    const hasDone = await doneText.first().isVisible().catch(() => false)

    // At least some status columns should be visible
    const visibleColumns = [hasTodo, hasInProgress, hasReview, hasDone].filter(Boolean).length
    expect(visibleColumns).toBeGreaterThanOrEqual(1)
  })
})
