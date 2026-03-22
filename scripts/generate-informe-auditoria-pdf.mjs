/**
 * Regenera docs/informe-auditoria-integral.pdf desde el HTML del informe.
 * Requiere: pnpm exec playwright install chromium (una vez por máquina/CI)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const htmlPath = path.join(root, 'docs/informe-auditoria-integral.html')
const pdfPath = path.join(root, 'docs/informe-auditoria-integral.pdf')

const html = fs.readFileSync(htmlPath, 'utf8')

const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'load', timeout: 120_000 })
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '14mm', right: '12mm', bottom: '14mm', left: '12mm' },
  })
  console.log('OK:', pdfPath)
} finally {
  await browser.close()
}
