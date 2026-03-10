import { test as setup, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const AUTH_FILE = path.join(__dirname, '../.auth/user.json')
const PROJECT_ID_FILE = path.join(__dirname, '../.auth/project-id.json')

setup('authenticate and save session', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL
  const password = process.env.TEST_USER_PASSWORD

  setup.skip(
    !email || !password,
    'Omitiendo: TEST_USER_EMAIL y TEST_USER_PASSWORD requeridos para flujos autenticados'
  )

  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email!)
  await page.getByLabel(/contrasena|password/i).fill(password!)
  await page.getByRole('button', { name: /iniciar sesion|iniciar/i }).click()

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })

  await page.context().storageState({ path: AUTH_FILE })

  const continuarLink = page.getByRole('link', { name: /continuar/i }).first()
  const href = await continuarLink.getAttribute('href')
  if (href) {
    const match = href.match(/\/projects\/([a-f0-9-]+)\/phase\//i)
    if (match) {
      fs.mkdirSync(path.dirname(PROJECT_ID_FILE), { recursive: true })
      fs.writeFileSync(PROJECT_ID_FILE, JSON.stringify({ projectId: match[1] }))
    }
  }
})
