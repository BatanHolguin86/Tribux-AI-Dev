# Estado del producto — AI Squad Command Center

**Última revisión:** marzo 2026  
**Propósito:** Una sola fuente de verdad para alinear documentación, QA y roadmap con lo que **hace hoy** el código y la infraestructura.

---

## Resumen ejecutivo

- **Stack:** Next.js **16** (App Router), React 19, TypeScript strict, Tailwind 4, Supabase (Auth + DB + Storage), Vercel AI SDK + Anthropic (`ANTHROPIC_API_KEY`).
- **Flujo principal:** Auth → Onboarding → Dashboard → proyecto por fases **00–07** (IA DLC).
- **Valor entregado hoy:** Phase 00 (Discovery) y Phase 01 (KIRO) con chat guiado, documentos y aprobaciones; **hub Diseño & UX** (`/projects/[id]/designs`) con Camino A (generación HTML persistida) y Camino B (kit con agente UI/UX en hilo); **agentes** (CTO + especialistas + Operator) en el tab **Equipo** de la fase activa, con threads, streaming, sugerencias proactivas, adjuntos y límites por **plan**.
- **Parcial / esqueleto:** Fases 03–07 con UI y checklists en evolución; billing Stripe opcional según `.env`.

---

## Rutas y navegación (UX real)

| Ruta / patrón                    | Comportamiento                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------- |
| `/projects/[id]/phase/00` … `07` | Workspace principal de la fase; tab **Equipo** abre el panel de agentes (`PhaseTeamPanel`).    |
| `/projects/[id]/experts`         | **Redirección** a `/projects/[id]/phase/{current_phase}` (acceso rápido desde `ProjectTools`). |
| `/projects/[id]/agents`          | Igual: **redirección** a la fase actual (compatibilidad).                                      |
| `/projects/[id]/designs`         | Hub **Diseño & UX** (Camino A + B). Detalle: `/projects/[id]/designs/[artifactId]`.            |
| APIs agentes                     | `/api/projects/[id]/agents/...` (lista, threads, chat, suggestions) — sin cambio de prefijo.   |

**Componentes de navegación/contexto:** `ProjectBreadcrumb`, `ProjectTools`, `PhasesStepper`, `PhaseWorkspaceTabs`, `KiroWorkflowRail` (Phase 01).

---

## Hub Diseño & UX (ADR-007)

| Camino                     | Descripción breve                         | Implementación                                                                                                                                                                          |
| -------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A — Pantallas visuales** | Wireframes / mockups persistidos          | `POST /api/projects/[id]/designs/generate` → filas `design_artifacts` (HTML en `content`, `mime_type` `text/html`), vista en **iframe**; Storage `project-designs` best-effort.         |
| **B — Kit con agente**     | Style guide, flows, etc. vía conversación | Hilo `ui_ux_designer` con contexto de `design-tool-workflow.ts` y `getDesignWorkflowContext`. El prompt del agente exige **HTML + Tailwind** en bloques ` ```html `, **sin ASCII art**. |

Specs detallados: `docs/01-specs/06-ui-ux-design-generator/`.

---

## Agentes, planes y límites

- **Registro de agentes y prompts:** `src/lib/ai/agents/` (incl. `cto-virtual.ts`, `ui-ux-designer.ts`, Operator).
- **Paywall / feature flags:** `src/lib/plans/guards.ts` (Starter vs Builder / Agency; Operator en plan alto).
- **Persistencia de chat libre:** tabla **`conversation_threads`** (mensajes, metadatos, **`attachments`** JSONB).
- **Phase 00/01** pueden seguir usando **`agent_conversations`** según flujo de fase; no confundir con threads de agentes en Equipo.

---

## Base de datos e infraestructura

- **Migraciones:** `infrastructure/supabase/migrations/` (numeración actual **001–020** y siguientes).
- **Buckets relevantes:** documentos de proyecto, chat (`project-chat`), diseños (`project-designs` cuando exista).
- **Runbooks:** `docs/06-ops/` (p. ej. migraciones staging, Sentry).

---

## Scripts y entorno de desarrollo

| Necesidad                        | Cómo                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Plantilla de variables           | `.env.example` (Supabase, Anthropic, Stripe opcional, E2E, etc.)                                                   |
| Plan enterprise en local/staging | `pnpm run plan:enterprise <email>` → `scripts/set-user-plan-enterprise.mjs` (requiere `SUPABASE_SERVICE_ROLE_KEY`) |
| SQL manual                       | `scripts/sql/grant-enterprise-test-user.sql`                                                                       |

Más detalle: `docs/03-environment/README.md`, `docs/04-development/README.md`.

---

## Documentación del repo (estructura)

Las carpetas bajo `docs/` usan **prefijo numérico de fase IA DLC** (`00-discovery`, `01-specs`, … `06-ops`). El archivo **`docs/README.md`** es el índice maestro.

**Decisiones técnicas:** `docs/02-architecture/decisions/` (índice en `README.md` de esa carpeta).

---

## Documentos relacionados

- Roadmap y criterios v1.0: `docs/00-discovery/estatus-v1-y-roadmap.md`
- E2E y QA: `docs/05-qa/e2e-tests.md`
- Arquitectura de carpetas (detalle; revisar nota de vigencia al inicio): `docs/02-architecture/folder-structure.md`
- Checklists de implementación alineados con este documento: `docs/01-specs/05-orchestrator/tasks.md`, `docs/01-specs/06-ui-ux-design-generator/tasks.md`
