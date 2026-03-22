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

  // Copia a /public para abrir con http://localhost:3000/... (evita bloqueos de file:// en el navegador)
  const pubDir = path.join(root, 'public')
  fs.mkdirSync(pubDir, { recursive: true })
  const pubHtml = path.join(pubDir, 'informe-auditoria-integral.html')
  const pubPdf = path.join(pubDir, 'informe-auditoria-integral.pdf')
  fs.copyFileSync(htmlPath, pubHtml)
  fs.copyFileSync(pdfPath, pubPdf)
  console.log('OK (public):', pubHtml, pubPdf)
} finally {
  await browser.close()
}
