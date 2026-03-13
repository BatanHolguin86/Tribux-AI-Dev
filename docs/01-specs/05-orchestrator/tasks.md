# Tasks: Orquestador + Agentes Especializados

**Feature:** 05 — Orquestador + Agentes
**Fase IA DLC:** Phase 01 — Requirements & Spec
**Fecha:** 2026-03-08
**Status:** v1.0 — Implementado

---

## Checklist de Implementacion

### Base de Datos
- [x] **TASK-178:** Crear migracion `010_create_conversation_threads.sql` — tabla `conversation_threads` con RLS e indice en (project_id, agent_type, last_message_at desc)
- [x] **TASK-179:** Actualizar constraint de `agent_conversations` para permitir `phase_number = null` y `section = null` (ALTER TABLE si es necesario)
- [x] **TASK-180:** Verificar que `project_documents` soporta `document_type = 'artifact'` y `phase_number = null` sin conflictos de constraint
- [x] **TASK-501:** Añadir columna `attachments jsonb` en `conversation_threads` y actualizar indices segun diseno de adjuntos

### System Prompts de Agentes
- [x] **TASK-181:** Crear `src/lib/ai/agents/index.ts` — definicion de los 9 agentes (CTO Virtual + 8 especializados) con metadata (id, name, icon, specialty, description, plan_required)
- [x] **TASK-182:** Crear `src/lib/ai/agents/cto-virtual.ts` — system prompt completo del CTO Virtual con instrucciones de delegacion a agentes especializados
- [x] **TASK-183:** Crear `src/lib/ai/agents/product-architect.ts` — system prompt con enfoque en producto, priorizacion y user stories
- [x] **TASK-184:** Crear `src/lib/ai/agents/system-architect.ts` — system prompt con enfoque en arquitectura, patrones y diagramas
- [x] **TASK-184b:** Crear `src/lib/ai/agents/ui-ux-designer.ts` — system prompt con enfoque en wireframes, mockups y guias de estilo a partir de specs
- [x] **TASK-185:** Crear `src/lib/ai/agents/lead-developer.ts` — system prompt con enfoque en implementacion, codigo y debugging
- [x] **TASK-186:** Crear `src/lib/ai/agents/db-admin.ts` — system prompt con enfoque en esquemas, queries, RLS y migraciones
- [x] **TASK-187:** Crear `src/lib/ai/agents/qa-engineer.ts` — system prompt con enfoque en testing, test cases y estrategia QA
- [x] **TASK-188:** Crear `src/lib/ai/agents/devops-engineer.ts` — system prompt con enfoque en deploy, CI/CD y monitoring
- [x] **TASK-188b:** Crear `src/lib/ai/agents/operator.ts` — system prompt con enfoque en operaciones, runbooks e infraestructura
- [x] **TASK-189:** Crear `src/lib/ai/agents/prompt-builder.ts` — funcion `buildAgentPrompt(agentType, projectContext)` que combina el system prompt del agente con el contexto completo del proyecto

### Tipos
- [x] **TASK-190:** Crear `src/types/agent.ts` — tipos `AgentType`, `AgentDefinition`, `ConversationThread`, `ThreadMessage`, `Artifact`

### Backend — API Routes
- [x] **TASK-191:** Crear `GET /api/projects/[id]/agents` — retorna lista de agentes con accesibilidad segun plan del usuario y conteo de threads
- [x] **TASK-192:** Crear `GET /api/projects/[id]/agents/[agentType]/threads` — retorna hilos del agente ordenados por last_message_at desc; incluye preview del ultimo mensaje
- [x] **TASK-193:** Crear `POST /api/projects/[id]/agents/[agentType]/threads` — crea nuevo hilo vacio; valida acceso al agente segun plan
- [x] **TASK-194:** Crear `DELETE /api/projects/[id]/agents/[agentType]/threads/[threadId]` — elimina hilo y mensajes; valida ownership
- [x] **TASK-195:** Crear `POST /api/projects/[id]/agents/[agentType]/threads/[threadId]/chat` — recibe mensaje, construye contexto completo del proyecto, inyecta system prompt del agente, llama a Claude con streaming, persiste mensajes en el hilo, auto-genera titulo si es primer mensaje
- [ ] **TASK-196:** Crear `POST /api/projects/[id]/agents/[agentType]/threads/[threadId]/stop` — envia abort signal al stream activo
- [x] **TASK-197:** Crear `POST /api/projects/[id]/artifacts` — guarda contenido como artifact en Storage y registra en `project_documents` con type 'artifact'
- [x] **TASK-197b:** Crear `GET /api/projects/[id]/agents/suggestions` — construye contexto del proyecto, llama a LLM con prompt de sugerencias proactivas, retorna 1–3 sugerencias accionables
- [x] **TASK-198:** Actualizar `src/lib/ai/context-builder.ts` — agregar funcion `buildFullProjectContext(projectId)` que incluye: discovery + specs + artifacts + fase actual; implementar truncamiento progresivo para contextos > 100K tokens
- [x] **TASK-199:** Crear `src/lib/ai/title-generator.ts` — funcion para auto-generar titulo del hilo a partir del primer mensaje (< 50 tokens, fallback a timestamp)
- [x] **TASK-502:** Exponer en `GET /api/projects/[id]/agents/[agentType]/threads/[threadId]` los campos basicos del hilo (id, title, attachments) para uso en UI

### Frontend — Layout y Pagina
- [x] **TASK-200:** Crear `src/app/(dashboard)/projects/[id]/agents/page.tsx` — Server Component que carga la lista de agentes y threads del agente por defecto (CTO Virtual)
- [x] **TASK-201:** Crear `src/app/(dashboard)/projects/[id]/agents/loading.tsx` — skeleton con sidebar de agentes y area de chat

### Frontend — Componentes de Agentes
- [x] **TASK-202:** Crear `AgentsLayout.tsx` — layout con AgentSelector sidebar (25%) + ChatArea (75%); responsive con dropdown en mobile
- [x] **TASK-203:** Crear `AgentSelector.tsx` — sidebar con lista de agentes; muestra icono, nombre, especialidad, badge de threads; cards clickeables; estado locked para agentes fuera del plan
- [x] **TASK-204:** Crear `AgentCard.tsx` — card individual con icono, nombre, especialidad (1 linea), indicador de threads activos; hover y estado activo con borde violeta
- [x] **TASK-205:** Crear `AgentHeader.tsx` — header del chat con: icono + nombre del agente, especialidad, boton "Nueva conversacion"
- [x] **TASK-206:** Crear `ThreadSidebar.tsx` — lista colapsable de hilos del agente activo; cada item muestra titulo y fecha; boton "Nueva conversacion" al inicio; boton eliminar con confirmacion
- [x] **TASK-207:** Crear `ThreadItem.tsx` — item de hilo con titulo (auto-generado), fecha relativa, indicador de mensajes; click para cargar hilo

### Frontend — Chat con Agentes
- [x] **TASK-208:** Crear `AgentChat.tsx` — wrapper que configura componentes compartidos de chat para el contexto de agentes; conecta con endpoint de streaming del agente activo
- [x] **TASK-208b:** Crear `ProactiveSuggestions.tsx` — panel que se muestra cuando el hilo activo esta vacio; llama a `GET .../agents/suggestions`; muestra 1–3 sugerencias como botones/cards
- [x] **TASK-209:** Crear `MessageActions.tsx` — barra de acciones que aparece al hover en mensajes del agente: boton copiar (clipboard API) + boton guardar como artifact
- [x] **TASK-210:** Extender `ChatMessage.tsx` (shared) para aceptar slot de acciones via prop (render prop o children) para integrar `MessageActions`
- [x] **TASK-211:** Crear `SaveArtifactModal.tsx` — modal con form: nombre del artifact (input), fase destino (select), preview del contenido; boton guardar llama a `POST /api/.../artifacts`
- [x] **TASK-505:** Mostrar, en la UI de chat, un listado compacto de adjuntos recientes del hilo y chips de adjuntos por mensaje cuando existan archivos asociados

### Frontend — Floating Button
- [x] **TASK-212:** Crear `FloatingAgentButton.tsx` — boton fijo en esquina inferior derecha; visible en todas las paginas del proyecto excepto `/agents`; click abre mini-drawer con chat del CTO Virtual o ultimo agente usado
- [x] **TASK-213:** Crear `MiniAgentDrawer.tsx` — drawer lateral (400px) con chat simplificado; boton "Abrir chat completo" que navega a `/agents`

### Stores y Estado Global
- [x] **TASK-214:** Crear `src/stores/agents-store.ts` — store Zustand con: agente activo, hilo activo, lista de hilos, flag `isStreaming`; acciones: `setActiveAgent`, `setActiveThread`, `createThread`, `deleteThread`

### Tests
- [x] **TASK-215:** Tests unitarios para cada system prompt de agente — verifica que el prompt incluye rol, contexto del proyecto y instrucciones correctas (`tests/unit/ai/agents/`)
- [ ] **TASK-216:** Tests unitarios para `buildFullProjectContext` — verifica inclusion de discovery, specs y artifacts; verifica truncamiento en > 100K tokens
- [ ] **TASK-217:** Tests unitarios para `generateThreadTitle` — verifica generacion correcta y fallback a timestamp
- [x] **TASK-218:** Test de integracion para CRUD de threads — crear, listar, eliminar (`tests/integration/api/threads.test.ts`)
- [x] **TASK-219:** Test de integracion para chat con agente — mock de Claude API, verifica streaming, persistencia de mensajes y auto-generacion de titulo (`tests/integration/api/agent-chat.test.ts`)
- [ ] **TASK-220:** Test de integracion para artifacts — guardar, listar en documentos, verificar en Storage (`tests/integration/api/artifacts.test.ts`)
- [x] **TASK-221:** Test E2E — flujo completo: seleccionar agente → crear conversacion → enviar mensaje → ver respuesta → guardar artifact → verificar en documentos (`tests/e2e/agents.spec.ts`)
- [x] **TASK-221b:** Test E2E o integracion — sugerencias proactivas: API GET suggestions devuelve 200 y array; fallback a array vacio (`tests/integration/api/agents-suggestions.test.ts`)
- [x] **TASK-222:** Test E2E — restriccion de plan: usuario Starter intenta acceder a agente Builder → ve paywall (`tests/e2e/agents-paywall.authenticated.spec.ts`)
- [ ] **TASK-223:** Test E2E — multiples hilos: crear 3 hilos con el mismo agente, navegar entre ellos, verificar persistencia del historial
- [ ] **TASK-504:** Tests de integracion/unidad para adjuntos: subida de archivos, persistencia en `attachments` y exposicion en API /threads/[threadId]

### Deploy
- [x] **TASK-224:** Aplicar migracion 010 en staging
- [ ] **TASK-225:** Configurar rate limiting en endpoints de chat de agentes: max 30 mensajes / min / usuario
- [ ] **TASK-226:** Smoke test en staging: chatear con CTO Virtual, chatear con Lead Developer, guardar artifact, verificar persistencia
- [ ] **TASK-227:** Monitorear consumo de tokens en staging con 3+ agentes usados en un proyecto (verificar que el truncamiento funciona)
- [x] **TASK-228:** Verificar que el floating agent button aparece correctamente en todas las paginas del proyecto

---

## Definition of Done — Feature 05

- [x] La pagina `/projects/:id/agents` muestra los 9 agentes (CTO Virtual + 8 especializados) con icono, nombre y especialidad
- [x] El chat con cada agente funciona con streaming (< 2s primer token)
- [x] Cada agente tiene system prompt unico y recibe el contexto completo del proyecto
- [x] El CTO Virtual sugiere agentes especializados cuando la pregunta es especifica
- [x] Sugerencias proactivas (v1.0): en hilo vacio se muestran 1–3 sugerencias contextuales
- [x] Los hilos de conversacion se persisten y se pueden crear/eliminar/navegar
- [x] Los titulos de hilos se auto-generan del primer mensaje
- [x] Las respuestas se renderizan con markdown completo (code blocks, tablas, listas)
- [x] El boton "Copiar" copia al portapapeles; el boton "Guardar" crea artifact
- [x] Los artifacts aparecen en el sidebar de documentos del proyecto
- [x] El plan Starter solo tiene acceso al CTO Virtual; Builder, Agency y Enterprise a todos los agentes
- [x] El floating agent button funciona desde todas las fases del proyecto
- [x] Los errores del LLM se manejan con mensaje amigable y boton retry
- [x] Tests E2E pasando en staging
