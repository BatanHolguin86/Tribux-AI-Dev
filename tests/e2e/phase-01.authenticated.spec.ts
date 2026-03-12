import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const AUTH_FILE = path.join(__dirname, '../.auth/user.json')
const PROJECT_ID_FILE = path.join(__dirname, '../.auth/project-id.json')

test.skip(
  !fs.existsSync(AUTH_FILE),
  'Auth file missing — run with TEST_USER_EMAIL and TEST_USER_PASSWORD'
)

test.describe('Phase 01 — authenticated', () => {
  test('Phase 01 loads and shows features area when authenticated', async ({ page }) => {
    let projectId: string

    if (fs.existsSync(PROJECT_ID_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROJECT_ID_FILE, 'utf-8'))
      projectId = data.projectId
    } else {
      await page.goto('/dashboard')
      const link = page.getByRole('link', { name: /continuar|phase|proyecto/i }).first()
      await expect(link).toBeVisible()
      const href = await link.getAttribute('href')
      const match = href?.match(/\/projects\/([a-f0-9-]+)\/phase\//i)
      if (!match) throw new Error('No project found. Complete onboarding with the test user first.')
      projectId = match[1]
    }

    await page.goto(`/projects/${projectId}/phase/01`)

    await expect(
      page.getByText(/features|especificación|requisitos|design|tasks/i).first()
    ).toBeVisible({ timeout: 10000 })
  })

  test('Phase 01 retomar: persistence after reload', async ({ page }) => {
    let projectId: string

    if (fs.existsSync(PROJECT_ID_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROJECT_ID_FILE, 'utf-8'))
      projectId = data.projectId
    } else {
      await page.goto('/dashboard')
      const link = page.getByRole('link', { name: /continuar|phase|proyecto/i }).first()
      await expect(link).toBeVisible()
      const href = await link.getAttribute('href')
      const match = href?.match(/\/projects\/([a-f0-9-]+)\/phase\//i)
      if (!match) throw new Error('No project found.')
      projectId = match[1]
    }

    await page.goto(`/projects/${projectId}/phase/01`)
    await expect(
      page.getByText(/features|especificación|requisitos|design|tasks/i).first()
    ).toBeVisible({ timeout: 10000 })

    await page.reload()
    await expect(
      page.getByText(/features|especificación|requisitos|design|tasks/i).first()
    ).toBeVisible({ timeout: 10000 })
  })
})
