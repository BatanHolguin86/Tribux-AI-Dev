# Tasks: Generador KIRO — Phase 01 Interactivo

**Feature:** 04 — Generador KIRO (Phase 01)
**Fase IA DLC:** Phase 01 — Requirements & Spec
**Fecha:** 2026-03-08
**Status:** Pendiente aprobacion CEO/CPO

---

## Checklist de Implementacion

### Base de Datos
- [ ] **TASK-129:** Crear migracion `008_create_project_features.sql` — tabla `project_features` con RLS, unique constraint (project_id, name) e indice en (project_id, display_order)
- [ ] **TASK-130:** Crear migracion `009_create_feature_documents.sql` — tabla `feature_documents` con RLS y unique constraint (feature_id, document_type)
- [ ] **TASK-131:** Actualizar politicas de `agent_conversations` para soportar `phase_number = 1` con section pattern `feature_{feature_id}_{document_type}`

### Refactorizacion — Componentes Compartidos
- [ ] **TASK-132:** Mover `ChatHistory.tsx`, `ChatMessage.tsx`, `ChatInput.tsx`, `StreamingIndicator.tsx` de `src/components/phase-00/` a `src/components/shared/chat/`; actualizar imports en Phase 00
- [ ] **TASK-133:** Mover `DocumentPanel.tsx`, `DocumentViewer.tsx`, `DocumentEditor.tsx`, `DocumentHeader.tsx` de `src/components/phase-00/` a `src/components/shared/document/`; actualizar imports en Phase 00
- [ ] **TASK-134:** Mover `ApprovalGate.tsx` a `src/components/shared/` y parametrizar textos de boton y callback via props
- [ ] **TASK-135:** Verificar que Phase 00 sigue funcionando correctamente despues de la refactorizacion (tests existentes pasan)

### Tipos y Configuracion IA
- [ ] **TASK-136:** Crear `src/types/feature.ts` — tipos `ProjectFeature`, `FeatureStatus`, `FeatureDocument`, `KiroDocumentType`
- [ ] **TASK-137:** Crear `src/lib/ai/prompts/phase-01.ts` — system prompts para cada tipo de documento KIRO (requirements, design, tasks) + funcion `buildKiroPrompt(docType, projectContext, discoveryDocs, previousSpecs)`
- [ ] **TASK-138:** Crear `src/lib/ai/prompts/feature-suggestions.ts` — prompt especializado para sugerir features basados en el discovery
- [ ] **TASK-139:** Actualizar `src/lib/ai/context-builder.ts` — agregar funciones `getApprovedDiscoveryDocs(projectId)` y `getApprovedFeatureSpecs(projectId, currentFeatureId)` para construir contexto acumulativo
- [ ] **TASK-140:** Implementar truncamiento inteligente de contexto cuando supera 50K tokens — resumir specs de features anteriores manteniendo data models y API contracts

### Backend — API Routes
- [ ] **TASK-141:** Crear `GET /api/projects/[id]/phases/1/features` — retorna features con estado de documentos; incluye conteo de features completados
- [ ] **TASK-142:** Crear `POST /api/projects/[id]/phases/1/features` — crea feature con validacion Zod (name required, max 100 chars); asigna display_order automaticamente
- [ ] **TASK-143:** Crear `PATCH /api/projects/[id]/phases/1/features/[featureId]` — actualiza nombre, descripcion, display_order; valida que el feature pertenezca al usuario
- [ ] **TASK-144:** Crear `DELETE /api/projects/[id]/phases/1/features/[featureId]` — solo si status es `pending`; elimina documentos asociados de Storage
- [ ] **TASK-145:** Crear `POST /api/projects/[id]/phases/1/features/suggest` — genera sugerencias de features con streaming basado en el discovery aprobado
- [ ] **TASK-146:** Crear `POST /api/projects/[id]/phases/1/features/[featureId]/chat` — chat con orquestador para documento especifico; construye contexto completo (discovery + specs previos); streaming via Vercel AI SDK
- [ ] **TASK-147:** Crear `POST /api/projects/[id]/phases/1/features/[featureId]/documents/[docType]/generate` — genera documento KIRO; almacena en Storage y registra en `feature_documents`; streaming
- [ ] **TASK-148:** Crear `PATCH /api/projects/[id]/phases/1/features/[featureId]/documents/[docType]` — edicion manual de documento; incrementa version
- [ ] **TASK-149:** Crear `POST /api/projects/[id]/phases/1/features/[featureId]/documents/[docType]/approve` — aprueba documento; si los 3 estan aprobados, marca feature como `spec_complete`
- [ ] **TASK-150:** Crear `POST /api/projects/[id]/phases/1/approve` — valida todos los features aprobados; actualiza `project_phases` phase 1 → completed, phase 2 → active

### Frontend — Layout y Pagina
- [ ] **TASK-151:** Crear `src/app/(dashboard)/projects/[id]/phase/01/page.tsx` — Server Component que carga features, documentos y estado; determina feature activo
- [ ] **TASK-152:** Crear `src/app/(dashboard)/projects/[id]/phase/01/loading.tsx` — skeleton con sidebar de features y split view

### Frontend — Componentes de Feature
- [ ] **TASK-153:** Crear `Phase01Layout.tsx` — layout con FeatureList sidebar (25%) + split view (75%); responsive con dropdown en mobile
- [ ] **TASK-154:** Crear `DiscoverySummary.tsx` — panel colapsable con resumen de los 5 documentos de Phase 00; inicialmente expandido en primera visita, colapsado despues
- [ ] **TASK-155:** Crear `FeatureList.tsx` — sidebar con lista de features ordenable (drag & drop con @dnd-kit); muestra estado e indicadores [R][D][T] por feature
- [ ] **TASK-156:** Crear `FeatureItem.tsx` — item individual con nombre, estado (icono + color), y 3 mini-indicadores de documento (requirements/design/tasks)
- [ ] **TASK-157:** Crear `AddFeatureForm.tsx` — form inline o modal para agregar feature (nombre + descripcion); validacion con Zod
- [ ] **TASK-158:** Crear `FeatureSuggestions.tsx` — card con sugerencias del orquestador al entrar por primera vez; boton "Aceptar sugerencias" que crea los features automaticamente
- [ ] **TASK-159:** Crear `DocumentTypeNav.tsx` — tabs para requirements/design/tasks con estado visual (locked/pending/active/approved); secuencia obligatoria

### Frontend — Chat y Documentos (reutilizacion)
- [ ] **TASK-160:** Crear `KiroChat.tsx` — wrapper que configura los componentes compartidos de chat para Phase 01 (endpoints, contexto, textos)
- [ ] **TASK-161:** Configurar `ApprovalGate` para Phase 01 — textos especificos: "Aprobar requirements" / "Aprobar design" / "Aprobar tasks"

### Frontend — Gates y Flujo
- [ ] **TASK-162:** Crear `Phase01FinalGate.tsx` — gate final con lista de features y documentos aprobados, conteo total, boton de aprobacion final con confirmacion
- [ ] **TASK-163:** Implementar logica de desbloqueo en `DocumentTypeNav` — requirements primero, design requiere requirements aprobado, tasks requiere design aprobado
- [ ] **TASK-164:** Implementar animacion de celebracion al aprobar Phase 01 — redirigir a `/projects/:id/phase/02`

### Stores y Estado Global
- [ ] **TASK-165:** Crear `src/stores/phase-01-store.ts` — store Zustand con: feature activo, document_type activo, lista de features, estado de documentos; acciones: `setActiveFeature`, `setActiveDocType`, `approveDocument`, `addFeature`, `reorderFeatures`

### Tests
- [ ] **TASK-166:** Tests unitarios para `buildKiroPrompt` — verifica prompt correcto para cada tipo de documento con contexto del proyecto (`tests/unit/ai/prompts/phase-01.test.ts`)
- [ ] **TASK-167:** Tests unitarios para truncamiento de contexto — verifica que contextos > 50K tokens se resumen correctamente
- [ ] **TASK-168:** Test de integracion para CRUD de features — crear, editar, reordenar, eliminar (`tests/integration/api/features.test.ts`)
- [ ] **TASK-169:** Test de integracion para flujo de generacion de documentos — chat → generate → approve por cada tipo (`tests/integration/api/kiro-documents.test.ts`)
- [ ] **TASK-170:** Test de integracion para aprobacion de Phase 01 — todos los features aprobados → phase approve → project_phases updated (`tests/integration/api/phase-01-approve.test.ts`)
- [ ] **TASK-171:** Test E2E — flujo completo Phase 01: definir features → generar requirements → aprobar → generar design → aprobar → generar tasks → aprobar → aprobar feature → aprobar Phase 01 (`tests/e2e/phase-01.spec.ts`)
- [ ] **TASK-172:** Test E2E — retomar Phase 01: completar 1 feature, recargar, verificar persistencia de features, documentos y conversaciones
- [ ] **TASK-173:** Test de regresion — verificar que Phase 00 sigue funcionando tras la refactorizacion de componentes compartidos

### Deploy
- [ ] **TASK-174:** Aplicar migraciones 008 y 009 en staging
- [ ] **TASK-175:** Instalar `@dnd-kit/core` + `@dnd-kit/sortable` en el proyecto
- [ ] **TASK-176:** Smoke test en staging: crear proyecto, completar Phase 00, entrar a Phase 01, definir features, generar spec completo de un feature, aprobar
- [ ] **TASK-177:** Verificar rendimiento del contexto acumulativo con 5+ features especificados (token usage y latencia)

---

## Orden de Ejecucion Sugerido

```
Semana 1: TASK-129 → 140  (DB + Refactorizacion + Tipos + Config IA)
Semana 2: TASK-141 → 150  (API Routes completas)
Semana 3: TASK-151 → 165  (Frontend: Layout + Features + Chat + Gates + Store)
Semana 4: TASK-166 → 177  (Tests + Deploy)
```

---

## Definition of Done — Feature 04

- [ ] Al entrar a Phase 01, se muestra resumen de Phase 00 y sugerencias de features del orquestador
- [ ] El usuario puede crear, editar, reordenar y eliminar features
- [ ] Para cada feature, el orquestador guia la generacion de requirements → design → tasks
- [ ] Cada documento se muestra en panel lateral con vista formateada y edicion raw
- [ ] Los documentos siguen el formato KIRO del proyecto (consistente con specs manuales existentes)
- [ ] El gate de aprobacion por documento funciona (requirements → design → tasks en secuencia)
- [ ] Al aprobar los 3 docs de un feature, este se marca como spec completo
- [ ] El gate final de Phase 01 valida todos los features aprobados
- [ ] Al aprobar Phase 01: phase 1 → completed, phase 2 → active, celebracion visual
- [ ] Retomar Phase 01 carga features, documentos y conversaciones correctamente
- [ ] Componentes compartidos de Phase 00 refactorizados y Phase 00 sigue funcionando
- [ ] Tests E2E pasando en staging
