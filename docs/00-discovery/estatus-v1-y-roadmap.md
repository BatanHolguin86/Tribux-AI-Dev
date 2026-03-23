# Informe de avances y hoja de ruta v1.0 — AI Squad Command Center

**Fecha:** 2026-03  
**Objetivo:** Resumir en qué hemos avanzado, el estatus actual y la hoja de ruta global sugerida para culminar la v1.0.

---

## 1. Estatus actual del proyecto

### Visión en una frase

El producto tiene **operativos** los módulos de diseño (Discovery + KIRO + Agentes con adjuntos) y el hub **Diseño & UX** (generate + kit con agente). Las fases 03–07 tienen especificación y tareas definidas, pero la implementación es parcial o en esqueleto.

### Criterio go/no-go v1.0 (resumen)

| Área | Estado | Notas |
|------|--------|--------|
| IA y configuración | Depende de entorno | `ANTHROPIC_API_KEY` debe estar configurada; Phase 00 y agentes muestran mensajes claros si falla |
| Auth + Onboarding | ✅ Implementado | Flujo registro/login/onboarding y primer proyecto |
| Phase 00 + Phase 01 | ✅ Implementado | Discovery guiado, KIRO (features, docs, coherencia, gates) |
| Agentes (CTO + 8) + adjuntos | ✅ Implementado | Threads, streaming, paywall, adjuntos en chat, contexto de adjuntos en prompt |
| Diseño & UX (hub) | ✅ Implementado | Hub con Camino A/B, generate HTML visual (wireframe/lowfi/highfi) + lista + detalle con iframe + chat kit HTML (nunca ASCII); revisar backlog menor en `06-ui-ux-design-generator/tasks.md` |
| Fases 03–07 | ⚠️ Esqueleto | Tasks.md y checklists definidos; UI mínima por fase |
| QA / E2E | ✅ Cubierto | Specs para auth, Phase 00/01, agentes, paywall, adjuntos, smoke staging |

---

## 2. En qué hemos avanzado (resumen por áreas)

### 2.1 Metodología y documentación (KIRO + IA DLC)

- **Specs KIRO** por feature (01–11): requirements, design y tasks en `docs/01-specs/`.
- **Roadmap KIRO-first** aplicado en tres bloques:
  - **Bloque 1:** Alineación v1.0 en Auth, Dashboard, Phase 00, Phase 01, Orquestador+Agentes (TASK-5xx, 51x, 52x, 53x, 54x).
  - **Bloque 2:** Diseño & UX (feature 06) con TASK-601–607 + hub Camino A/B, ADR-007.
  - **Bloque 3:** Fases 03–07 + QA con tasks y checklists (TASK-7xx, 73x–78x, 710–712).
- **Docs de QA:** `docs/05-qa/e2e-tests.md` actualizado con todos los specs E2E y flujos v1.0.

### 2.2 Base de datos e infraestructura

- Migraciones Supabase numeradas (001–015), incluyendo:
  - `conversation_threads` con columna `attachments` (JSONB) para adjuntos del chat.
  - `design_artifacts` para el Generador UI/UX.
- RLS en tablas sensibles; runbooks en `docs/06-ops/` (migraciones staging, etc.).

### 2.3 IA y contexto

- **Context-builder:** `buildProjectContext`, `buildFullProjectContext`, `getApprovedDiscoveryDocs`, `getApprovedFeatureSpecs`, truncamiento progresivo.
- **Prompt-builder:** System prompts por agente (CTO Virtual + 8 especializados, incluido Operator), inyección de contexto de proyecto y **bloque de adjuntos recientes** en el prompt.
- **Manejo de errores:** `formatChatErrorResponse`, `ChatErrorBanner`; detección de créditos insuficientes; Phase 00 comprueba `ANTHROPIC_API_KEY` y devuelve mensaje claro si falta.

### 2.4 Funcionalidad de producto

- **Phase 00 (Discovery):** Chat por sección, generación de documentos, gates de aprobación, persistencia en `agent_conversations` y `project_documents`.
- **Phase 01 (KIRO):** Features, documentos requirements/design/tasks, validación de coherencia entre specs, aprobaciones y gate final.
- **Agentes:** Listado CTO + 8 especializados, threads por agente, streaming, sugerencias proactivas, paywall por plan (Starter vs Builder/Agency).
- **Adjuntos en chat de agentes:** Subida a Storage (`project-chat`), metadatos en `conversation_threads.attachments`, UI (botón +, “Adjuntos listos”, listado “Archivos adjuntos en esta conversación”), resumen de adjuntos en el prompt del agente.
- **Vista Diseño & UX:** `/projects/[id]/designs` — hub con **Camino A** (formulario → `POST .../designs/generate` → HTML visual con Tailwind CSS renderizado en iframe con controles mobile/tablet/desktop) y **Camino B** (herramientas numeradas → hilo UI/UX con HTML visual, nunca ASCII art, + `getDesignWorkflowContext` + `design-tool-workflow`). Tres niveles: wireframe (neutro), mockup low-fi (componentes detallados), mockup high-fi (tipo Figma). Breadcrumb contextual (`ProjectBreadcrumb`). Detalle de artefacto con CTA al hub. Ver ADR-007 y spec `06-ui-ux-design-generator`.

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

- **Diseño & UX:** Hub completo con generación HTML visual (wireframe/lowfi/highfi), refinamiento, aprobación y almacenamiento dual (DB + Storage). Pendientes menores: thumbnails en lista, job asíncrono dedicado, integración modal en Phase 02, E2E. Revisar `tasks.md` del feature 06.
- **Fases 03–07:** Implementar en UI los checklists interactivos (Environment, Dev, QA, Launch, Iteration) y la persistencia del estado por proyecto, para que el usuario pueda marcar tareas y ver progreso real.
- **Experiencia de errores unificada:** Que todos los flujos que llaman a Anthropic (Phase 00, Phase 01 chat, agentes) muestren mensajes consistentes (clave faltante, créditos, timeout) vía `ChatErrorBanner` o equivalente.
- **Validación operativa:** Ejecutar la suite E2E en local y en staging y cerrar los fallos que aparezcan; dejar documentado qué tests son bloqueantes para v1.0.

---

## 4. Hoja de ruta global sugerida para culminar v1.0

### Fase A — Estabilidad y experiencia de errores (1–2 sprints)

1. **Unificar manejo de errores de IA**  
   Revisar todas las rutas que usan `streamText` (Phase 00, Phase 01 chat, agentes) y asegurar que ante falta de clave, créditos o error de red se devuelva un cuerpo JSON con `error`/`message` y que la UI muestre siempre un mensaje claro (no pantalla en blanco ni “Error de conexión” genérico sin detalle).
2. **Checklist go/no-go en código/docs**  
   Dejar en `docs/05-qa/` o en el PRD una checklist corta de 5–7 ítems (IA configurada, Auth+Onboarding, Phase 00+01, agentes+adjuntos, hub **Diseño & UX** accesible, E2E críticos pasando) y usarla como criterio de release v1.0.
3. **Ejecutar y estabilizar E2E**  
   Correr `pnpm test:e2e` (y smoke en staging); corregir fallos y marcar tests opcionales si hace falta para no bloquear el release.

### Fase B — Cerrar valor “diseño” (1 sprint)

4. **Diseño & UX — cerrar brechas spec**  
   Validar criterios abiertos en `docs/01-specs/06-ui-ux-design-generator/tasks.md` (Phase 02 modal, polling/generating UX, chat → generate, thumbnails). El generate y el hub Camino A/B ya están en código base.
5. **Marcar “aprobado para desarrollo”**  
   Permitir en la UI de diseños marcar un artefacto como aprobado y exponerlo en Phase 04 (referencia para el usuario).

### Fase C — Esqueleto “construir + lanzar” (1 sprint)

6. **Fases 03–07 operativas**  
   Implementar en cada fase (03–07) la vista con `PhaseProgressHeader` y un checklist persistido (por proyecto), con opción de marcar ítems como completados. Enlazar a runbooks existentes en `docs/06-ops/` y `docs/05-qa/`.
7. **Narrativa de cierre**  
   Asegurar que desde el dashboard o la navegación quede claro que el usuario puede “completar” Environment, Dev, QA, Launch e Iteration (aunque parte del trabajo sea manual/externo), alineado con el objetivo de “diseña + construye + lanza”.

### Fase D — Cierre v1.0

8. **Revisión final**  
   Recorrer la checklist go/no-go con un usuario de prueba; corregir bugs críticos.
9. **Documentación de release**  
   Actualizar README o `docs/` con requisitos de despliegue (variables de entorno, migraciones, buckets) y con la definición de “v1.0” (alcance y limitaciones conocidas).
10. **Lanzamiento**  
    Deploy a producción según criterios de negocio (staging estable, métricas básicas si aplica).

---

## 5. Resumen ejecutivo

- **Avances:** Base metodológica (KIRO + IA DLC), Auth/Dashboard, Phase 00 y 01 completas, Orquestador + 9 agentes con adjuntos y contexto enriquecido, hub **Diseño & UX** (Camino A/B, generate, `design_artifacts`), QA documentada y tests E2E definidos. Correcciones recientes en Phase 00 y chat de agentes para evitar 500 y pantallas mudas.
- **Estado:** El producto permite hoy “diseñar” de punta a punta (Discovery → KIRO → Agentes); “construir” y “lanzar” están en especificación y en esqueleto de fases 03–07.
- **Hoja de ruta sugerida:** (A) Estabilidad y mensajes de error unificados + E2E verdes; (B) Cerrar brechas spec Diseño & UX + integración Phase 02; (C) Checklists 03–07 operativos; (D) Checklist go/no-go, docs de release y lanzamiento. Con esto se puede cerrar una v1.0 alineada al objetivo del producto y estable para pruebas reales.
