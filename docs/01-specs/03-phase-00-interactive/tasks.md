# Tasks: Phase 00 Interactivo — Discovery

**Feature:** 03 — Phase 00 Interactivo
**Fase IA DLC:** Phase 01 — Requirements & Spec
**Fecha:** 2026-03-06
**Status:** v1.0 — Implementado

---

## Checklist de Implementacion

### Base de Datos

- [x] **TASK-081:** Crear migracion `005_create_agent_conversations.sql` — tabla `agent_conversations` con RLS y unique constraint por (project_id, phase_number, section, agent_type)
- [x] **TASK-082:** Crear migracion `006_create_project_documents.sql` — tabla `project_documents` con RLS
- [x] **TASK-083:** Crear migracion `007_create_phase_sections.sql` — tabla `phase_sections` con RLS
- [x] **TASK-084:** Actualizar trigger `on_project_created` para insertar las 5 secciones de Phase 00 en `phase_sections` con status `pending` al crear el proyecto
- [x] **TASK-085:** Crear bucket `project-documents` en Supabase Storage con politica privada (acceso solo via signed URLs del servidor)

### Tipos y Configuracion IA

- [x] **TASK-086:** Instalar dependencias de IA: `ai` (Vercel AI SDK), `@ai-sdk/anthropic`
- [x] **TASK-087:** Crear `src/lib/ai/anthropic.ts` — instancia del proveedor Anthropic con modelo `claude-sonnet-4-6` y configuracion de temperatura
- [x] **TASK-088:** Crear `src/lib/ai/prompts/phase-00.ts` — system prompts para cada una de las 5 secciones del discovery + funcion `buildPhase00Prompt(section, projectContext, userPersona)`
- [x] **TASK-089:** Crear `src/lib/ai/context-builder.ts` — funcion que construye el contexto del proyecto (nombre, descripcion, industria, persona, secciones aprobadas previas) para inyectar en cada prompt
- [x] **TASK-090:** Crear `src/types/conversation.ts` — tipos `Message`, `ConversationRole`, `AgentConversation`, `SectionStatus`, `Phase00Section`
- [x] **TASK-091:** Crear `src/types/document.ts` — tipos `ProjectDocument`, `DocumentType`, `DocumentStatus`

### Backend — API Routes

- [x] **TASK-092:** Crear `POST /api/projects/[id]/phases/0/chat` — recibe mensaje del usuario, construye contexto completo del proyecto, llama a Claude con streaming via Vercel AI SDK, persiste el mensaje del usuario y la respuesta en `agent_conversations`
- [x] **TASK-093:** Crear `POST /api/projects/[id]/phases/0/sections/[section]/generate` — usa el historial completo de la seccion para generar el documento markdown; guarda en Supabase Storage y registra en `project_documents`; responde con streaming
- [x] **TASK-094:** Crear `PATCH /api/projects/[id]/documents/[documentId]` — actualiza contenido del documento (edicion manual); incrementa version; actualiza cache en DB y archivo en Storage
- [x] **TASK-095:** Crear `POST /api/projects/[id]/phases/0/sections/[section]/approve` — cambia status de `phase_sections` a `approved`; desbloquea la siguiente seccion
- [x] **TASK-096:** Crear `POST /api/projects/[id]/phases/0/approve` — valida que las 5 secciones esten aprobadas; cambia `project_phases` phase 0 a `completed` y phase 1 a `active`; actualiza `projects.current_phase` a 1
- [x] **TASK-097:** Crear `GET /api/projects/[id]/phases/0/status` — retorna estado de las 5 secciones y el historial de conversacion de la seccion activa
- [x] **TASK-098:** Crear `src/lib/storage/documents.ts` — helpers para leer/escribir documentos en Supabase Storage (`uploadDocument`, `getDocument`, `getSignedUrl`)

### Frontend — Layout y Pagina

- [x] **TASK-099:** Crear `src/app/(dashboard)/projects/[id]/phase/00/page.tsx` — Server Component que carga el estado de las 5 secciones y la conversacion activa; determina que seccion mostrar al entrar
- [x] **TASK-100:** Crear `src/app/(dashboard)/projects/[id]/phase/00/loading.tsx` — skeleton del split view (dos paneles con lineas de loading)
- [x] **TASK-101:** Crear `src/app/(dashboard)/projects/[id]/layout.tsx` — layout del proyecto con breadcrumb (Proyecto → Phase activa) y TopBar de progreso

### Frontend — Componentes del Chat

- [x] **TASK-102:** Crear `Phase00Layout.tsx` — contenedor del split view 60/40 con resize handle; en mobile cambia a tabs
- [x] **TASK-103:** Crear `SectionNav.tsx` — tabs de las 5 secciones; muestra estado visual (pending/in_progress/completed/approved/locked) con icono y color; tab activa destacada
- [x] **TASK-104:** Crear `ChatPanel.tsx` — panel izquierdo que orquesta `SectionNav`, `ChatHistory`, `ApprovalGate` y `ChatInput`; maneja el estado de la seccion activa
- [x] **TASK-105:** Crear `ChatHistory.tsx` — lista de mensajes con scroll automatico al nuevo mensaje; distingue visualmente mensajes del usuario vs orquestador; muestra timestamps
- [x] **TASK-106:** Crear `ChatMessage.tsx` — burbuja de mensaje con: avatar/icono segun rol, contenido en markdown renderizado (para mensajes del orquestador), tiempo relativo
- [x] **TASK-107:** Crear `ChatInput.tsx` — textarea autoexpandible (1–5 lineas); Enter envia, Shift+Enter nueva linea; boton de envio con estado de loading; boton de stop durante streaming; integrado con `useChat` de Vercel AI SDK
- [x] **TASK-108:** Crear `StreamingIndicator.tsx` — animacion de tres puntos mientras el orquestador genera la respuesta
- [x] **TASK-109:** Crear `ApprovalGate.tsx` — componente que aparece al final del chat cuando el orquestador indica que la seccion esta lista; boton "Aprobar seccion" + input de revision

### Frontend — Componentes del Documento

- [x] **TASK-110:** Crear `DocumentPanel.tsx` — panel derecho con header, viewer/editor y footer; maneja el toggle entre vista formateada y edicion raw
- [x] **TASK-111:** Crear `DocumentViewer.tsx` — renderiza el markdown del documento con `react-markdown` + `remark-gfm` + syntax highlighting para bloques de codigo
- [x] **TASK-112:** Crear `DocumentEditor.tsx` — textarea de edicion raw con auto-save (debounce 1s) que llama a `PATCH /api/projects/.../documents/...`; indicador de estado "Guardado" / "Guardando..."
- [x] **TASK-113:** Crear `DocumentHeader.tsx` — nombre del documento, numero de version, estado (borrador/aprobado), boton toggle Ver/Editar

### Frontend — Gates y Flujo de Aprobacion

- [x] **TASK-114:** Crear `Phase00FinalGate.tsx` — gate final con lista de las 5 secciones aprobadas, descripcion del siguiente paso (Phase 01) y boton de aprobacion final con dialogo de confirmacion
- [x] **TASK-115:** Implementar animacion de celebracion al aprobar Phase 00 — usar `canvas-confetti` con animacion de 3 segundos antes de redirigir a `/projects/:id/phase/01`
- [x] **TASK-116:** Implementar logica de desbloqueo de secciones en `SectionNav` — cada seccion se activa al aprobar la anterior; las bloqueadas muestran icono de candado y tooltip explicativo

### Stores y Estado Global

- [x] **TASK-117:** Crear `src/stores/phase-00-store.ts` — store Zustand con: seccion activa, estado de cada seccion, documento activo, flag `isGenerating`; acciones: `setActiveSection`, `approveSection`, `setDocument`

### Tests

- [x] **TASK-118:** Tests unitarios para `buildPhase00Prompt` — verifica que cada seccion genera el prompt correcto con el contexto del proyecto (`tests/unit/ai/prompts/`)
- [x] **TASK-119:** Tests unitarios para `context-builder.ts` — verifica truncamiento y formato del contexto inyectado
- [x] **TASK-120:** Test de integracion para `POST /api/projects/[id]/phases/0/chat` — mock de la API de Anthropic, verifica persistencia del mensaje en DB (`tests/integration/api/phase-00-chat.test.ts`)
- [x] **TASK-121:** Test de integracion para el flujo de aprobacion — section approve → phase approve → project_phases updated (`tests/integration/api/phase-00-approve.test.ts`)
- [ ] **TASK-122:** Test E2E — flujo completo Phase 00: entrar → conversar en Problem Statement → generar documento → aprobar seccion → completar las 5 secciones → aprobar Phase 00 → ver Phase 01 desbloqueada (`tests/e2e/phase-00.spec.ts`)
- [ ] **TASK-123:** Test E2E — retomar Phase 00 a mitad: completar 2 secciones, recargar, verificar que el historial y los documentos persisten correctamente

### Alineacion v1.0 KIRO

- [x] **TASK-510:** Revisar `requirements.md` de Phase 00 — v1.0 incluye chat guiado, generacion y aprobacion de documentos, gates, celebracion
- [x] **TASK-511:** Actualizar `design.md` de Phase 00 con el modelo de datos y flujos reales
- [x] **TASK-512:** Completar y ajustar este `tasks.md` para que refleje el estado actual del codigo
- [x] **TASK-513:** Implementar o ajustar en la UI de Phase 00 los gates finales y la redireccion automatica a Phase 01

### Deploy

- [x] **TASK-124:** Agregar variable de entorno `ANTHROPIC_API_KEY` en Vercel (staging y produccion)
- [x] **TASK-125:** Aplicar migraciones 005, 006 y 007 en staging
- [x] **TASK-126:** Crear bucket `project-documents` en Supabase de staging con politicas correctas
- [ ] **TASK-127:** Smoke test en staging: crear proyecto, completar Phase 00 con respuestas reales, verificar documentos en Storage
- [ ] **TASK-128:** Verificar que el streaming funciona correctamente en produccion (Vercel Edge Functions vs Serverless)

---

## Definition of Done — Feature 03

- [x] Al entrar a Phase 00, el orquestador saluda con contexto del proyecto
- [x] Las 5 secciones son navegables con estado visual correcto
- [x] La conversacion con el orquestador funciona con streaming (< 2s primer token)
- [x] Cada seccion genera su documento markdown correspondiente
- [x] Los documentos se muestran en panel lateral con vista formateada y edicion raw
- [x] El auto-save del documento funciona (ediciones manuales persistidas en < 2s)
- [x] El gate de aprobacion por seccion funciona correctamente
- [x] El gate final de Phase 00 valida las 5 secciones aprobadas
- [x] Al aprobar Phase 00: phase 0 → completed, phase 1 → active, animacion de celebracion
- [x] Retomar Phase 00 carga historial y documentos correctamente
- [ ] Tests E2E pasando en staging
- [x] `ANTHROPIC_API_KEY` configurada en Vercel sin exposicion al cliente
