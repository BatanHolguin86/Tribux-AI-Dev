# Como ver el Informe de auditoria integral

Los archivos estan en:

- `docs/informe-auditoria-integral.html`
- `docs/informe-auditoria-integral.pdf`

Copias servibles por HTTP (misma version): `public/informe-auditoria-integral.html` y `public/informe-auditoria-integral.pdf` (se actualizan al correr `pnpm run docs:informe-pdf`).

## Opcion A — Con la app Next.js (recomendado)

1. En la raiz del repo: `pnpm dev`
2. En el navegador abre:
   - **HTML:** http://localhost:3000/informe-auditoria-integral.html
   - **PDF:** http://localhost:3000/informe-auditoria-integral.pdf

Asi evitas restricciones de algunos navegadores con archivos `file://`.

## Opcion B — Abrir el archivo directamente (macOS)

1. **PDF:** clic derecho en `docs/informe-auditoria-integral.pdf` → **Abrir con** → **Vista previa** (o Adobe Reader).  
   No uses el visor de texto del editor para PDFs (no es un lector de PDF).

2. **HTML:** clic derecho → **Abrir con** → Chrome / Safari / Firefox.

3. Si macOS dice que no se puede abrir o el archivo viene “de internet”, en Terminal:

```bash
xattr -dr com.apple.quarantine docs/informe-auditoria-integral.html docs/informe-auditoria-integral.pdf
```

(Lo mismo para las copias en `public/` si hace falta.)

## Opcion C — Regenerar PDF y sincronizar `public/`

```bash
pnpm exec playwright install chromium   # una vez
pnpm run docs:informe-pdf
```

Luego usa la opcion A o B.

## Produccion (Vercel)

Si el deploy incluye la carpeta `public/`, el informe quedara en:

- `https://TU_DOMINIO/informe-auditoria-integral.html`
- `https://TU_DOMINIO/informe-auditoria-integral.pdf`
