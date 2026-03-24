/**
 * Generates the managerial PDF from HTML in docs/reports/_informe-ejecutivo-build.html
 * Run: node scripts/export-executive-report-pdf.cjs
 */
const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const htmlPath = path.join(root, "docs/reports/_informe-ejecutivo-build.html");
const pdfName = "informe-ejecutivo-ceo-inversionistas-ai-squad-2026-03-v2.pdf";
const pdfPath = path.join(root, "docs/reports", pdfName);
const desktopPath = path.join(
  process.env.HOME || "",
  "Desktop",
  pdfName,
);

(async () => {
  if (!fs.existsSync(htmlPath)) {
    console.error("Missing:", htmlPath);
    process.exit(1);
  }
  const html = fs.readFileSync(htmlPath, "utf8");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: "12mm", right: "12mm", bottom: "14mm", left: "12mm" },
  });
  await browser.close();
  if (process.env.HOME) {
    fs.copyFileSync(pdfPath, desktopPath);
    console.log("PDF:", pdfPath);
    console.log("Copia Escritorio:", desktopPath);
  } else {
    console.log("PDF:", pdfPath);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
