# Tasks: Generador de diseños UI/UX

**Feature:** Generador de diseños UI/UX (wireframes y mockups) + hub Diseño & UX
**Fase IA DLC:** Phase 02 — Architecture & Design
**Fecha:** 2026-03-08 · sincronizado con código marzo 2026
**Status:** Checklist sincronizado con código (marzo 2026); ítems `[ ]` = backlog real

---

## Estado en código (marzo 2026) — sincronizar con este checklist

Entregado en aplicación; el bloque **Checklist numerado** más abajo refleja el mismo estado con `[x]` / `[ ]`.

- [x] **HUB:** Vista `/projects/[id]/designs` — Camino A + B (`DesignGenerator`, `DesignChat`, `design-tool-workflow.ts`).
- [x] **API:** `POST .../designs/generate`, `GET .../designs`, `GET/PATCH .../designs/[id]`, `POST .../refine` (`src/app/api/projects/[id]/designs/`).
- [x] **Tests integración:** `tests/integration/api/designs-generate.test.ts`, `designs-crud.test.ts`.
- [x] **Tipos / Zod:** `src/types/design.ts`, `src/lib/validations/designs.ts`.
- [x] **UX:** `ProjectBreadcrumb`, `ProjectTools`, `ArtifactDetail` + iframe + viewports.
- [x] **ADR-007** documentado.
- [x] **HTML + Tailwind** (sin ASCII) en generate y en prompt del agente UI/UX.
- [x] **DB `content` primario** + Storage `project-designs` best-effort.
- [x] **Generación síncrona** (`generateText`), rate limit en generate/refine.
- [x] **Gate Phase 01:** `completed` **o** `active` con ≥1 feature en progreso de spec (ver `designs/generate/route.ts`).

**Backlog frecuente:** TASK-016 (bloque Phase 02), thumbnails en lista, worker async opcional, TASK-020 (chat → generate automático), E2E dedicado, TASK-023/607 (diseños aprobados en Phase 04).

---

## Checklist de Implementacion

### Setup & Base de datos

- [x] **TASK-001:** Migración `010_create_design_artifacts.sql` (+ evoluciones p. ej. `019_add_design_artifacts_content.sql`) — tabla `design_artifacts`, RLS, índices
- [x] **TASK-002:** Bucket Storage `project-designs` (privado; uso best-effort si el bucket no existe en un entorno)
- [ ] **TASK-003:** Helper dedicado que parsee `design.md` y devuelva lista de pantallas _(parcial: pantallas las envía el usuario en el formulario Camino A; el contexto KIRO llega vía `getApprovedFeatureSpecs` / prompts, sin parser único de secciones UI)_

### Backend — API

- [x] **TASK-004:** `POST .../designs/generate` — valida Phase 01 (ver TASK-022), body type + screens + refinement; crea artefactos _(generación **síncrona** en la misma request, no cola de jobs)_
- [x] **TASK-005:** Lógica de generación por pantalla integrada en el flujo de TASK-004 _(no worker separado; HTML en columna `content` + upload Storage opcional)_
- [x] **TASK-006:** `GET .../designs` — lista artefactos _(sin `thumbnail_url` generada; previews en UI vía HTML/iframe donde aplica)_
- [x] **TASK-007:** `GET .../designs/[artifactId]` — detalle _(lectura desde DB `content` principalmente, no solo signed URL)_
- [x] **TASK-008:** `PATCH .../designs/[artifactId]` — `status`, `updated_at`
- [x] **TASK-009:** `POST .../designs/[artifactId]/refine`
- [x] **TASK-010:** Schemas Zod en `src/lib/validations/designs.ts`
- [x] **TASK-011:** Rate limiting `DESIGN_RATE_LIMIT` en generate y refine

### Frontend — Vistas

- [x] **TASK-012:** `src/app/(dashboard)/projects/[id]/designs/page.tsx` + componentes hub (`DesignGenerator`, lista) _(lista sin miniaturas raster — ver backlog)_
- [x] **TASK-013:** `src/app/(dashboard)/projects/[id]/designs/[artifactId]/page.tsx` + `ArtifactDetail` (iframe HTML, refinar, aprobar)
- [x] **TASK-014:** Flujo de generación integrado en **Camino A** del hub _(no modal con nombre `DesignGenerateModal` aislado; mismo comportamiento funcional)_
- [x] **TASK-015:** Refinar en detalle (formulario / flujo en `ArtifactDetail`)
- [ ] **TASK-016:** Bloque resumen + CTA en **Phase 02** hacia hub o modal de generación
- [ ] **TASK-017:** UX explícita “Generando…” con polling si la generación pasa a async largo en el futuro _(hoy el generate es síncrono; estado `generating` breve)_
- [x] **TASK-018:** Acceso **Diseño & UX** desde `ProjectTools` (y breadcrumb); no depende solo de un ítem legacy en sidebar

### Agente UI/UX Designer

- [x] **TASK-019:** Agente `ui_ux_designer` en `src/lib/ai/agents/` + registry
- [ ] **TASK-020:** Desde el **chat** del UI/UX Designer, detectar intención y disparar `POST .../designs/generate` automáticamente
- [x] **TASK-021:** Contexto de proyecto en prompts / `buildFullProjectContext` / specs aprobados según flujo

### Integración y guards

- [x] **TASK-022:** Guard en generate: Phase 01 no `locked`; si `active`, exige ≥1 feature con spec en progreso _(comportamiento actual documentado en `ESTADO-DEL-PRODUCTO.md`)_
- [ ] **TASK-023:** Panel o enlace en **Phase 04** a diseños `approved` para dev

### Tipos y tests

- [x] **TASK-024:** `src/types/design.ts`
- [ ] **TASK-025:** Archivo unitario `tests/unit/validations/designs.test.ts` _(validación cubierta en tests de integración `designs-generate` / `designs-crud`)_
- [ ] **TASK-026:** E2E dedicado flujo diseño completo _(opcional / backlog)_

### Deploy y documentación

- [x] **TASK-027:** `ANTHROPIC_API_KEY`, `maxDuration` en route generate; sin API de imágenes externa en v1 actual
- [x] **TASK-028:** ADR-007 + `design.md` del feature + `ESTADO-DEL-PRODUCTO.md`

### Alineacion v1.0 KIRO

- [x] **TASK-601:** Alcance v1.0 acotado a HTML+Tailwind persistido y hub; extras en backlog explícito en `requirements.md` / este archivo
- [x] **TASK-602:** `design.md` del feature describe modelo, APIs y hub (revisar contra código si se amplía Phase 02/04)
- [x] **TASK-603:** Este `tasks.md` separa `[x]` entregado vs `[ ]` backlog
- [x] **TASK-604:** `design_artifacts` + RLS + Storage
- [x] **TASK-605:** `POST /designs/generate` con contexto KIRO y persistencia en DB
- [x] **TASK-606:** Vista `/projects/[id]/designs` operativa
- [ ] **TASK-607:** Superficie en Phase 04 para diseños aprobados + flujo dev _(PATCH approved existe; falta integración UX Phase 04)_

---

## Orden de Ejecucion Sugerido (actualizado)

**Hecho (tramo entregado):** TASK-001,002,004–015,018–019,021–022,024,027–028,601–606.

**Backlog priorizado sugerido:** TASK-016 → TASK-023/607 → TASK-020 → TASK-017 (async + polling) → TASK-003 → TASK-025–026.

---

## Definition of Done — Generador de diseños UI/UX

- [x] Wireframes / mockups generables por pantalla (nombres en formulario Camino A) con HTML+Tailwind persistido
- [x] Mockups low-fi y high-fi según `type` en API
- [x] Diseños en DB (`content`) + listado en `/projects/[id]/designs`; Storage best-effort
- [x] Refinar y marcar aprobado (PATCH) desde detalle
- [ ] Agente UI/UX Designer dispara generate automáticamente desde chat (TASK-020)
- [ ] Phase 02 con bloque Diseño; Phase 04 con enlace a aprobados (TASK-016, TASK-023/607)
- [x] RLS en `design_artifacts`; bucket acotado al proyecto
- [x] Rate limit en generate/refine
- [x] Tests de integración API diseños; E2E dedicado aún backlog (TASK-026)
