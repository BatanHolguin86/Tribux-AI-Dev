# Phase 04 — Core Development

**Fase IA DLC:** Core Development

En esta fase se implementa el código según los specs KIRO (tasks.md) aprobados.

**Código fuente:** Ver en la raíz del repositorio la carpeta **`/src/`**:

- `src/app/` — Next.js App Router (rutas, API)
- `src/components/` — Componentes React (p. ej. `design/` hub Diseño & UX, `projects/`, `phase-01/`, `shared/PhaseTeamPanel.tsx`)
- `src/lib/` — Utilidades, Supabase, validaciones, agentes (`src/lib/ai/agents/`), planes (`src/lib/plans/`)
- `src/hooks/`, `src/stores/`, `src/types/`

Los tests asociados están en `/tests/` (unit, integration, e2e).

**Scripts en la raíz (no son parte del bundle Next):**

- `scripts/set-user-plan-enterprise.mjs` — asignar plan enterprise a un usuario vía Supabase Admin API (`pnpm run plan:enterprise <email>`).
- `scripts/sql/grant-enterprise-test-user.sql` — alternativa SQL para pruebas.
- Otros: `scripts/test-anthropic.ts`, `scripts/export-executive-report-pdf.cjs`, etc.

**Estado del producto vs docs:** `docs/ESTADO-DEL-PRODUCTO.md`.
