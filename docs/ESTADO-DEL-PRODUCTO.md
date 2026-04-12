# Estado del producto vs código — Tribux

**Última revisión documental:** 2026-04-01  
**Fuente de verdad del código:** repositorio (`src/`, `infrastructure/supabase/migrations/`).  
**Criterios de release y evidencia QA:** [`docs/05-qa/v1-go-no-go.md`](./05-qa/v1-go-no-go.md).

Este documento resume **qué está implementado** y **dónde** para evitar divergencia entre specs y rutas reales. Los detalles de implementación siguen en `docs/01-specs/*/tasks.md` y en ADRs bajo [`docs/02-architecture/decisions/`](./02-architecture/decisions/README.md).

---

## 1. Stack (raíz del repo)

| Área        | Detalle (ver `package.json`)                          |
| ----------- | ----------------------------------------------------- |
| Framework   | Next.js 16 (App Router)                               |
| UI          | React 19, Tailwind CSS 4, componentes tipo shadcn/ui |
| Datos       | Supabase (Auth, DB, Storage), cliente `@supabase/ssr` |
| IA          | Vercel AI SDK (`ai`), Anthropic (`@ai-sdk/anthropic`) |
| Tests       | Vitest (`pnpm test`), Playwright (`pnpm test:e2e`)    |
| Validación  | Zod                                                     |

---

## 2. Autenticación y onboarding

- **Rutas:** `src/app/(auth)/` — login, registro, forgot-password, OAuth callback.
- **Onboarding (dashboard):** flujo multipaso; al completar, **`POST /api/onboarding/complete`** crea el primer proyecto y marca perfil (`onboarding_completed`, `onboarding_step: 5`).
- **`PATCH /api/onboarding/step`:** pasos enteros **0–5** (validación en `src/app/api/onboarding/step/route.ts`).
- **Rate limiting** y rutas de auth: revisar `src/app/api/auth/` (los paths exactos pueden diferir de specs históricos).

---

## 3. Proyectos y fases IA DLC (00–07)

- **Dashboard:** listado y CRUD de proyectos (`src/app/(dashboard)/dashboard/`, APIs bajo `/api/projects`).
- **Vista por proyecto:** `src/app/(dashboard)/projects/[id]/` — layout con fases, breadcrumb, sidebar.
- **Fases:** rutas `/projects/[id]/phase/00` … `/phase/07` — cada fase tiene layout y UI dedicada (`src/components/phase-00/`, `phase-01/`, …).
- **Aprobación y estado:** APIs bajo `/api/projects/[id]/phases/...` (approve, status, secciones, toggles, etc.).
- **Columna `last_activity`:** definida en migración base de proyectos (`002_create_projects.sql`); no hay migración separada `004_add_last_activity` en el repo.

### Tab Equipo (agentes)

- El chat de agentes vive en el **tab Equipo** dentro de las fases 00–07 (`PhaseTeamPanel`, etc.), no en una app separada.
- **`/projects/[id]/agents`** y **`/projects/[id]/experts`** **redirigen** a `/projects/[id]/phase/{current_phase}` (acceso rápido al mismo contexto).
- **APIs:** `/api/projects/[id]/agents/...` (listado, threads, chat streaming, etc.).

---

## 4. Phase 00 (Discovery) y Phase 01 (KIRO)

- **Phase 00:** chat por sección, documentos, gate final — componentes en `src/components/phase-00/` y APIs de fase 0 (incl. chat con comprobación de `ANTHROPIC_API_KEY` en servidor).
- **Phase 01:** features, documentos KIRO, chat — `src/components/phase-01/`, APIs de features y documentos.

---

## 5. Hub Diseño & UX

- **Ruta:** `/projects/[id]/designs` (galería, detalle, generate/refine según spec).
- **ADR:** [ADR-007](./02-architecture/decisions/ADR-007-design-hub-two-path-ux.md).

---

## 6. Fases 03–07 (entorno, desarrollo, QA, launch, iteración)

- Checklists por categoría/sección, persistencia vía APIs de fases y **`item_states`** en `phase_sections` (migración **`021_phase_sections_item_states.sql`** — necesaria para toggles por ítem).
- **Phase 04:** Kanban / `project_tasks` (migración **013** y siguientes).
- Narrativa de cierre y gates finales por fase: ver layouts `Phase03Layout` … `Phase07Layout` y tasks en `docs/01-specs/07-phase-03-environment/` … `11-phase-07-iteration/`.

---

## 7. Costes / infra (proyecto)

- UI de costes/infra en **`/projects/[id]/costs`** (`src/app/(dashboard)/projects/[id]/costs/page.tsx`, componentes `src/components/costs/`).
- Migración relacionada (tiers en proyectos): p. ej. **`030_add_infra_tiers_to_projects.sql`** (ver carpeta de migraciones).

---

## 8. Integraciones y secrets de proyecto

- Integraciones (p. ej. Figma) y campos en proyecto: migraciones **`022`**–**023** y APIs bajo `/api/projects/[id]/integrations` (validar rutas en `src/app/api/`).

---

## 9. Base de datos e infraestructura

- **Migraciones numeradas:** `infrastructure/supabase/migrations/` — aplicar **todas** en orden en cada entorno (última numeración en repo: **033**; el número exacto puede crecer).
- **Script acumulado legacy:** `scripts/pending-migrations.sql` puede quedar desfasado respecto a la carpeta `migrations/`; para operaciones usar preferentemente los archivos numerados del repo (ver [`docs/06-ops/v1-release.md`](./06-ops/v1-release.md)).
- **Buckets Storage (si se usan uploads):** `project-documents`, `project-chat`, `project-designs` (detalle en v1-release).

---

## 10. Tests

- **Unit + integración:** `pnpm test` — estructura bajo `tests/unit/` y `tests/integration/` (incl. APIs críticas).
- **E2E:** `tests/e2e/*.spec.ts` — inventario y prerequisitos en [`docs/05-qa/e2e-tests.md`](./05-qa/e2e-tests.md).

---

## 11. Documentos relacionados

| Documento | Uso |
| --------- | --- |
| [`docs/05-qa/v1-go-no-go.md`](./05-qa/v1-go-no-go.md) | Go/no-go v1, baseline local y staging |
| [`docs/00-discovery/estatus-v1-y-roadmap.md`](./00-discovery/estatus-v1-y-roadmap.md) | Roadmap y fases de producto |
| [`docs/06-ops/v1-release.md`](./06-ops/v1-release.md) | Deploy, variables, migraciones, buckets |
| [`CLAUDE.md`](../CLAUDE.md) | Convenciones y metodología IA DLC |
