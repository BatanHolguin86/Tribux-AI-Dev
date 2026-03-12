/**
 * TASK-176: Smoke test — crear proyecto → Phase 00 → Phase 01 → definir feature.
 * Ejecutable en local o staging: BASE_URL=https://staging.xxx pnpm test:e2e tests/e2e/smoke-staging.authenticated.spec.ts
 */
import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const AUTH_FILE = path.join(__dirname, '../.auth/user.json')
const PROJECT_ID_FILE = path.join(__dirname, '../.auth/project-id.json')

test.skip(
  !fs.existsSync(AUTH_FILE),
  'Auth file missing — run with TEST_USER_EMAIL and TEST_USER_PASSWORD'
)

test.describe('Smoke staging — Phase 00 + Phase 01', () => {
  test('dashboard loads and has at least one project or CTA', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(
      page.getByRole('heading', { level: 1 }).or(page.getByText(/proyectos|dashboard|continuar/i))
    ).toBeVisible({ timeout: 10000 })
  })

  test('Phase 00 loads with sections and chat input', async ({ page }) => {
    let projectId: string

    if (fs.existsSync(PROJECT_ID_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROJECT_ID_FILE, 'utf-8'))
      projectId = data.projectId
    } else {
      await page.goto('/dashboard')
      const link = page.getByRole('link', { name: /continuar|phase|proyecto/i }).first()
      await expect(link).toBeVisible({ timeout: 10000 })
      const href = await link.getAttribute('href')
      const match = href?.match(/\/projects\/([a-f0-9-]+)\/phase\//i)
      if (!match) throw new Error('No project found. Complete onboarding first.')
      projectId = match[1]
    }

    await page.goto(`/projects/${projectId}/phase/00`)
    await expect(page.getByPlaceholder(/escribe|mensaje|pregunta/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/problem statement|brief|personas/i)).toBeVisible()
  })

  test('Phase 01 loads with features area and add-feature capability', async ({ page }) => {
    let projectId: string

    if (fs.existsSync(PROJECT_ID_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROJECT_ID_FILE, 'utf-8'))
      projectId = data.projectId
    } else {
      await page.goto('/dashboard')
      const link = page.getByRole('link', { name: /continuar|phase|proyecto/i }).first()
      await expect(link).toBeVisible({ timeout: 10000 })
      const href = await link.getAttribute('href')
      const match = href?.match(/\/projects\/([a-f0-9-]+)\/phase\//i)
      if (!match) throw new Error('No project found.')
      projectId = match[1]
    }

    await page.goto(`/projects/${projectId}/phase/01`)
    await expect(
      page.getByText(/features|especificación|requisitos|design|tasks/i).first()
    ).toBeVisible({ timeout: 10000 })
    await expect(
      page.getByRole('button', { name: /agregar feature/i }).or(
        page.getByText(/agrega o pide sugerencias|selecciona un feature/i)
      )
    ).toBeVisible({ timeout: 5000 })
  })
})
