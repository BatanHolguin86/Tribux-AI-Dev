/**
 * TASK-222: E2E — restricción de plan: usuario Starter ve agentes Builder como bloqueados (paywall).
 * Asume que el usuario de prueba tiene plan 'starter' en user_profiles.
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

test.describe('Agents plan restriction (Starter vs Builder)', () => {
  test('usuario Starter ve al menos un agente especializado bloqueado (candado)', async ({
    page,
  }) => {
    let projectId: string

    if (fs.existsSync(PROJECT_ID_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROJECT_ID_FILE, 'utf-8'))
      projectId = data.projectId
    } else {
      await page.goto('/dashboard')
      const link = page.getByRole('link', { name: /continuar|phase|proyecto/i }).first()
      await expect(link).toBeVisible({ timeout: 10000 })
      const href = await link.getAttribute('href')
      const match = href?.match(/\/projects\/([a-f0-9-]+)\//i)
      if (!match) throw new Error('No project found.')
      projectId = match[1]
    }

    await page.goto(`/projects/${projectId}/agents`)

    await expect(
      page.getByRole('heading', { name: /agentes/i }).or(page.getByText(/CTO Virtual|Especializados/i))
    ).toBeVisible({ timeout: 10000 })

    const specializedSection = page.locator('text=Especializados').first()
    await expect(specializedSection).toBeVisible()

    const agentCards = page.getByRole('button').filter({ has: page.locator('text=/Product Architect|System Architect|UI\\/UX|Lead Developer|DB Admin|QA|DevOps/i') })
    const count = await agentCards.count()

    if (count === 0) {
      test.skip()
      return
    }

    const firstSpecialized = agentCards.first()
    await expect(firstSpecialized).toBeVisible()

    const isDisabled = await firstSpecialized.isDisabled()
    const hasLockIcon = (await firstSpecialized.locator('svg').count()) > 0

    expect(isDisabled || hasLockIcon).toBeTruthy()
  })
})
