# Informe de avances y hoja de ruta v1.0 — AI Squad Command Center

**Fecha:** 2026-03 (actualizado 2026-03-24 — Fases A, B y C cerradas)  
**Objetivo:** Resumir en qué hemos avanzado, el estatus actual y la hoja de ruta global sugerida para culminar la v1.0.

---

## 1. Estatus actual del proyecto

### Visión en una frase

El producto tiene **operativos** los módulos de diseño (Discovery + KIRO + Agentes con adjuntos) y el hub **Diseño & UX** (generate + kit con agente). Las fases **03–07** tienen checklists/Kanban persistidos, enlaces a runbooks y narrativa de cierre en dashboard y proyecto; parte del trabajo sigue siendo manual o externo (CI, Supabase, Vercel).

### Criterio go/no-go v1.0 (resumen)

Checklist detallada y registro de baseline: [`docs/05-qa/v1-go-no-go.md`](../05-qa/v1-go-no-go.md).

| Área                         | Estado             | Notas                                                                                                                                                                                                               |
| ---------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IA y configuración           | Depende de entorno | `ANTHROPIC_API_KEY` debe estar configurada; Phase 00 y agentes muestran mensajes claros si falla                                                                                                                    |
| Auth + Onboarding            | ✅ Implementado     | Flujo registro/login/onboarding y primer proyecto                                                                                                                                                                   |
| Phase 00 + Phase 01          | ✅ Implementado     | Discovery guiado, KIRO (features, docs, coherencia, gates)                                                                                                                                                          |
| Agentes (CTO + 8) + adjuntos | ✅ Implementado     | Threads, streaming, paywall, adjuntos en chat, contexto de adjuntos en prompt                                                                                                                                       |
| Diseño & UX (hub)            | ✅ Implementado     | Hub con Camino A/B: **A** = HTML persistido (`design_artifacts` + iframe); **B** = kit vía hilo UI/UX (HTML+Tailwind en chat, sin ASCII por regla de prompt). Backlog menor en `06-ui-ux-design-generator/tasks.md` |
| Fases 03–07                  | ✅ Operativas       | `PhaseProgressHeader` + checklists persistidos (ítems en 03/05/06/07; Kanban en 04); docs 05-qa / 06-ops enlazados; migración `021` (`item_states`)                                                                 |
| QA / E2E                     | ✅ Cubierto         | Specs + suite local estable (`pnpm test:e2e`: 0 fallos con credenciales/setup adecuados); ver `v1-go-no-go.md` y `e2e-tests.md`                                                                                    |

---

## 2. En qué hemos avanzado (resumen por áreas)

### 2.1 Metodología y documentación (KIRO + IA DLC)

- **Specs KIRO** por feature (01–11): requirements, design y tasks en `docs/01-specs/`.
- **Roadmap KIRO-first** aplicado en tres bloques:
  - **Bloque 1:** Alineación v1.0 en Auth, Dashboard, Phase 00, Phase 01, Orquestador+Agentes (TASK-5xx, 51x, 52x, 53x, 54x).
  - **Bloque 2:** Diseño & UX (feature 06) con TASK-601–607 + hub Camino A/B, ADR-007.
  - **Bloque 3:** Fases 03–07 + QA con tasks y checklists (TASK-7xx, 73x–78x, 710–712).
- **Docs de QA:** `docs/05-qa/e2e-tests.md` (specs E2E) y `docs/05-qa/v1-go-no-go.md` (definición de hecho v1 + baseline).

### 2.2 Base de datos e infraestructura

- Migraciones Supabase en `infrastructure/supabase/migrations/` (numeración actual **001–020+**), incluyendo:
  - `conversation_threads` con columna `attachments` (JSONB) para adjuntos del chat.
  - `design_artifacts` para el Generador UI/UX.
- RLS en tablas sensibles; runbooks en `docs/06-ops/` (migraciones staging, etc.).

### 2.3 IA y contexto

- **Context-builder:** `buildProjectContext`, `buildFullProjectContext`, `getApprovedDiscoveryDocs`, `getApprovedFeatureSpecs`, truncamiento progresivo.
- **Prompt-builder:** System prompts por agente (CTO Virtual + 8 especializados, incluido Operator), inyección de contexto de proyecto y **bloque de adjuntos recientes** en el prompt.
- **Manejo de errores (Fase A):** Rutas con `streamText` (Phase 00, Phase 01 feature chat, Phase 02 chat, agentes) alineadas a JSON con `error`/`message` donde aplica y UI con `ChatErrorBanner` / mensajes explícitos; `formatChatErrorResponse` para fallos de IA; clave Anthropic y créditos cubiertos en flujos principales.

### 2.4 Funcionalidad de producto

- **Phase 00 (Discovery):** Chat por sección, generación de documentos, gates de aprobación, persistencia en `agent_conversations` y `project_documents`.
- **Phase 01 (KIRO):** Features, documentos requirements/design/tasks, validación de coherencia entre specs, aprobaciones y gate final; `KiroWorkflowRail` integrado en `FeatureWorkspace` al editar un feature; lista de features con `FeatureList` y sugerencias.
- **Agentes:** CTO + especialistas + Operator; UI en el tab **Equipo** de `/projects/[id]/phase/00–07` (`PhaseTeamPanel`). Las rutas `/projects/[id]/experts` y `/agents` **redirigen** a la fase actual del proyecto. Threads, streaming, sugerencias proactivas, adjuntos y paywall por plan (Starter vs Builder/Agency).
- **Adjuntos en chat de agentes:** Subida a Storage (`project-chat`), metadatos en `conversation_threads.attachments`, UI (botón +, “Adjuntos listos”, listado “Archivos adjuntos en esta conversación”), resumen de adjuntos en el prompt del agente.
- **Vista Diseño & UX:** `/projects/[id]/designs` — hub con **Camino A** (formulario → `POST .../designs/generate` → HTML con Tailwind en iframe + controles viewport) y **Camino B** (herramientas numeradas → hilo `ui_ux_designer` con `getDesignWorkflowContext` + `design-tool-workflow`; entregables visuales en HTML+Tailwind, sin ASCII art). Tres niveles: wireframe, mockup low-fi, mockup high-fi. `ProjectBreadcrumb` contextual; detalle de artefacto con CTA al hub. Ver ADR-007 y `06-ui-ux-design-generator`.

### 2.5 Correcciones recientes

- **Phase 00:** Comprobación de `ANTHROPIC_API_KEY` al inicio del POST; respuesta JSON clara si falta; el usuario ve mensaje en UI en lugar de silencio.
- **Chat de agentes (500):** Orden de ejecución en la ruta de chat corregido (construcción de `allAttachments` antes de usarla en `buildAttachmentsSummary` y en el prompt).
- **Prompt-builder:** Ajuste de la template string para evitar error de parsing (construcción del prompt en dos pasos para incluir adjuntos).

### 2.6 Tests

- **Unitarios:** Prompts, context-builder, truncamiento, coherencia de specs, etc.
- **Integración:** Phase 00/01 (chat, approve), features, threads, agent chat, suggestions.
- **E2E:** Auth, rutas protegidas, Phase 00/01, agentes, paywall, smoke staging, **agents-with-attachments** (flujo adjuntos).

---

## 3. Lo que falta o está a medias para v1.0

- **Diseño & UX:** Hub en Phase 02 (Camino A/B), aprobación en detalle, panel aprobados en Phase 04, CTA en Secciones, chat → generate con `[GENERAR …]`, mini-vistas en lista. Pendientes menores: job asíncrono dedicado, E2E dedicado, parser `design.md` (TASK-003). Ver `06-ui-ux-design-generator/tasks.md`.
- **Fases 03–07:** Checklists/Kanban con persistencia (categoría + ítems en 03/05/06/07; tasks en 04). Evoluciones futuras: más automatización o sync con CI.
- **Staging / release:** Re-ejecutar E2E y smoke contra staging cuando cambie el entorno; mantener evidencia en `v1-go-no-go.md` antes de go-live.

---

## 4. Hoja de ruta global sugerida para culminar v1.0

### Fase A — Estabilidad y experiencia de errores (1–2 sprints) — ✅ Cerrada (mar 2026)

1. **Unificar manejo de errores de IA** — ✅

   Rutas con `streamText` revisadas: respuestas JSON con `error`/`message` en fallos configurables; UI con `ChatErrorBanner` y mensajes explícitos (clave, créditos, red).

2. **Checklist go/no-go en código/docs** — ✅

   Publicada y con baseline en [`docs/05-qa/v1-go-no-go.md`](../05-qa/v1-go-no-go.md); actualizar al cerrar ítems en CI/staging.

3. **Ejecutar y estabilizar E2E** — ✅ (local)

   Suite `pnpm test:e2e` estable (0 fallos con setup documentado). Smoke staging: repetir tras despliegues.

### Fase B — Cerrar valor “diseño” (1 sprint) — ✅ Cerrada (mar 2026)

1. **Diseño & UX — cerrar brechas spec** — ✅

   Phase 02: CTA en Secciones hacia Herramientas (`DesignHubSectionCallout` + contexto de tabs). Generación: overlay “Generando…” (síncrono); lista con mini-vista HTML (`?thumb=1`). Chat → generate: comando `[GENERAR wireframe] …` en UI/UX Designer. Detalle: `tasks.md` del feature 06 actualizado.

2. **Marcar “aprobado para desarrollo”** — ✅

   PATCH `approved` ya existía en detalle de artefacto; Phase 04 muestra panel **Diseños aprobados** con enlaces a cada artefacto (`Phase04ResourceBar`).

### Fase C — Esqueleto “construir + lanzar” (1 sprint) — ✅ Cerrada (mar 2026)

1. **Fases 03–07 operativas** — ✅

   `PhaseProgressHeader` en 03–07; categorías persistidas en `phase_sections`; **ítems** por categoría en `item_states` (JSON) vía `POST .../phases/{3|5|6|7}/sections/[section]/item`. Phase 04: Kanban = checklist persistido (`project_tasks`) + `PhaseDocsCallout` y cabecera con estado vacío claro. Enlaces a `docs/06-ops/`, `docs/05-qa/` (incl. `v1-go-no-go.md`) y `docs/04-development/` ampliados. Migración: `021_phase_sections_item_states.sql`.

2. **Narrativa de cierre** — ✅

   `DlcClosingNarrative` en dashboard (`ProjectsGrid`) y layout de proyecto (debajo del breadcrumb): explica flujo 03–07 y trabajo manual vs. in-app.

### Fase D — Cierre v1.0

1. **Revisión final**

   Recorrer la checklist go/no-go con un usuario de prueba; corregir bugs críticos.

2. **Documentación de release** — ✅ (mar 2026)

   Guía operativa: [`docs/06-ops/v1-release.md`](../06-ops/v1-release.md) (alcance v1.0, limitaciones, env, migraciones incl. `021`, buckets, checklist pre-deploy). README raíz y `docs/README.md` enlazan a la guía.

3. **Lanzamiento**

   Deploy a producción según criterios de negocio (staging estable, métricas básicas si aplica).

---

## 5. Resumen ejecutivo

- **Avances:** Base metodológica (KIRO + IA DLC), Auth/Dashboard, Phase 00 y 01 completas, Orquestador + 9 agentes con adjuntos y contexto enriquecido, hub **Diseño & UX** (Camino A/B, generate, `design_artifacts`), QA documentada y tests E2E definidos. Correcciones recientes en Phase 00 y chat de agentes para evitar 500 y pantallas mudas.
- **Estado:** “Diseñar” (00–02) y “construir + lanzar” (03–07) con checklists/Kanban persistidos e ítems por categoría donde aplica; narrativa en dashboard y proyecto.
- **Hoja de ruta sugerida:** **(A)(B)(C) Hechas.** **Siguiente:** (D) Revisión go/no-go con usuario de prueba, docs de release y lanzamiento.

