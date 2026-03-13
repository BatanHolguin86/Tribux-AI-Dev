import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

const AUTH_FILE = path.join(__dirname, '../.auth/user.json')
const PROJECT_ID_FILE = path.join(__dirname, '../.auth/project-id.json')

test.skip(
  !fs.existsSync(AUTH_FILE),
  'Auth file missing — run with TEST_USER_EMAIL and TEST_USER_PASSWORD',
)

test.describe('Agents — authenticated with attachments', () => {
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

  test('upload attachment, see chips and get response without error', async ({ page }) => {
    const projectId = await getProjectId(page)

    await page.goto(`/projects/${projectId}/agents`)

    const newThreadBtn = page.getByRole('button', {
      name: /iniciar conversacion|nueva conversacion/i,
    })
    await expect(newThreadBtn).toBeVisible()
    await newThreadBtn.click()

    const chatInput = page.getByPlaceholder(/escribe|respuesta/i)
    await expect(chatInput).toBeVisible({ timeout: 5000 })

    // Crear archivo temporal a adjuntar
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-attach-'))
    const filePath = path.join(tmpDir, 'nota-ejemplo.txt')
    fs.writeFileSync(filePath, 'Esta es una nota de ejemplo para adjuntar al chat de agentes.')

    // Abrir selector de archivos y adjuntar
    const attachButton = page.getByRole('button', { name: /\+/ })
    await expect(attachButton).toBeVisible()

    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      attachButton.click(),
    ])

    await fileChooser.setFiles(filePath)

    // Ver indicador de adjuntos listos
    await expect(page.getByText(/adjuntos listos/i)).toBeVisible({ timeout: 5000 })

    // Enviar mensaje con el adjunto
    const testMessage = 'Analiza el archivo adjunto y dime en una frase de que trata.'
    await chatInput.fill(testMessage)
    await page.getByRole('button', { name: /enviar/i }).click()

    // Ver el mensaje del usuario
    await expect(page.getByText(testMessage)).toBeVisible({ timeout: 5000 })

    // Ver chips de "Adjuntos recientes del hilo"
    await expect(page.getByText(/adjuntos recientes del hilo/i)).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByText(/nota-ejemplo\.txt/i)).toBeVisible({ timeout: 15000 })

    // Ver que llega respuesta del agente o, al menos, que no aparece un banner de error
    const assistantBubble = page
      .locator('.rounded-bl-md.bg-gray-100, .bg-violet-100.text-violet-600')
      .first()
    await expect(assistantBubble).toBeVisible({ timeout: 60000 })

    const errorBanner = page.getByText(/error de conexi[óo]n|no se pudo cargar la conversaci[óo]n/i)
    await expect(errorBanner).toHaveCount(0)
  })
})
