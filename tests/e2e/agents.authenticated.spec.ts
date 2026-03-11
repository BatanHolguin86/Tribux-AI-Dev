import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const AUTH_FILE = path.join(__dirname, '../.auth/user.json')
const PROJECT_ID_FILE = path.join(__dirname, '../.auth/project-id.json')

test.skip(
  !fs.existsSync(AUTH_FILE),
  'Auth file missing — run with TEST_USER_EMAIL and TEST_USER_PASSWORD'
)

test.describe('Agents — authenticated', () => {
  test('agents page loads with agent selector and CTO Virtual', async ({ page }) => {
    let projectId: string

    if (fs.existsSync(PROJECT_ID_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROJECT_ID_FILE, 'utf-8'))
      projectId = data.projectId
    } else {
      await page.goto('/dashboard')
      const link = page.getByRole('link', { name: /continuar/i }).first()
      await expect(link).toBeVisible()
      const href = await link.getAttribute('href')
      const match = href?.match(/\/projects\/([a-f0-9-]+)\//i)
      if (!match) throw new Error('No project found. Complete onboarding with the test user first.')
      projectId = match[1]
    }

    await page.goto(`/projects/${projectId}/agents`)

    await expect(page.getByText('Agentes')).toBeVisible()
    await expect(page.getByText('CTO Virtual')).toBeVisible()
    await expect(page.getByText('Especializados')).toBeVisible()
  })

  test('create conversation, see chat input and send message', async ({ page }) => {
    let projectId: string
    if (fs.existsSync(PROJECT_ID_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROJECT_ID_FILE, 'utf-8'))
      projectId = data.projectId
    } else {
      await page.goto('/dashboard')
      const link = page.getByRole('link', { name: /continuar/i }).first()
      await expect(link).toBeVisible()
      const href = await link.getAttribute('href')
      const match = href?.match(/\/projects\/([a-f0-9-]+)\//i)
      if (!match) throw new Error('No project found.')
      projectId = match[1]
    }

    await page.goto(`/projects/${projectId}/agents`)

    const newThreadBtn = page.getByRole('button', {
      name: /iniciar conversacion|nueva conversacion/i,
    })
    await expect(newThreadBtn).toBeVisible()
    await newThreadBtn.click()

    const chatInput = page.getByPlaceholder(/escribe|respuesta/i)
    await expect(chatInput).toBeVisible({ timeout: 5000 })

    const testMessage = 'Hola, que tecnologias recomiendas?'
    chatInput.fill(testMessage)
    await page.getByRole('button', { name: /enviar/i }).click()

    await expect(page.getByText(testMessage)).toBeVisible({ timeout: 5000 })
  })

  test('full flow: send message, see response, save artifact', async ({ page }) => {
    let projectId: string
    if (fs.existsSync(PROJECT_ID_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROJECT_ID_FILE, 'utf-8'))
      projectId = data.projectId
    } else {
      await page.goto('/dashboard')
      const link = page.getByRole('link', { name: /continuar/i }).first()
      await expect(link).toBeVisible()
      const href = await link.getAttribute('href')
      const match = href?.match(/\/projects\/([a-f0-9-]+)\//i)
      if (!match) throw new Error('No project found.')
      projectId = match[1]
    }

    await page.goto(`/projects/${projectId}/agents`)

    const newThreadBtn = page.getByRole('button', {
      name: /iniciar conversacion|nueva conversacion/i,
    })
    await expect(newThreadBtn).toBeVisible()
    await newThreadBtn.click()

    const chatInput = page.getByPlaceholder(/escribe|respuesta/i)
    await expect(chatInput).toBeVisible({ timeout: 5000 })

    chatInput.fill('Lista en una linea: Next.js, TypeScript, Supabase.')
    await page.getByRole('button', { name: /enviar/i }).click()

    const assistantBubble = page.locator('.rounded-bl-md.bg-gray-100').first()
    await expect(assistantBubble).toBeVisible({ timeout: 60000 })

    await assistantBubble.hover()
    const saveBtn = page.getByTitle(/guardar como artifact/i)
    await expect(saveBtn).toBeVisible({ timeout: 2000 })
    await saveBtn.click()

    await expect(page.getByText('Guardar como Artifact')).toBeVisible()
    await page.getByLabel(/nombre/i).fill('Stack E2E')
    await page.getByRole('button', { name: /guardar artifact/i }).click()
    await expect(page.getByText('Guardar como Artifact')).not.toBeVisible({
      timeout: 5000,
    })
  })
})
