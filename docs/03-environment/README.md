# Phase 03 — Environment Setup

**Fase IA DLC:** Environment Setup

En esta fase se configura el entorno de desarrollo e infraestructura del proyecto.

**Variables:** Copiar **`.env.example`** → `.env.local` y completar al menos:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (la service role solo en servidor; necesaria para `pnpm run plan:enterprise`).
- `ANTHROPIC_API_KEY` para flujos de IA.
- Opcional: Resend, Sentry, Stripe (`STRIPE_*`), credenciales E2E (`TEST_USER_*`).

**Contenido operativo:** Ver en la raíz del repositorio la carpeta **`/infrastructure/`**:

- `infrastructure/supabase/migrations/` — migraciones numeradas (001+); aplicar según runbook en `docs/06-ops/apply-migrations-staging.md`
- `infrastructure/supabase/seed.sql` — datos iniciales opcionales
- `infrastructure/github/workflows/` — CI/CD
- `infrastructure/scripts/` — deployment y utilidades de infra

**Scripts de desarrollo (raíz):** `scripts/` — p. ej. plan enterprise (`package.json` → `plan:enterprise`).

La documentación de decisiones de stack y proveedores está en `docs/02-architecture/decisions/` (ADR-001 a ADR-007).

**Estado del producto:** `docs/ESTADO-DEL-PRODUCTO.md`.
