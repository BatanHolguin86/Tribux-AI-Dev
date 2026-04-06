# Design: Orquestador + Agentes Especializados

**Feature:** 05 — Orquestador + Agentes
**Fase IA DLC:** Phase 01 — Requirements & Spec
**Fecha:** 2026-03-08
**Status:** Pendiente aprobacion CEO/CPO

---

## Overview

El modulo de Orquestador + Agentes expone una interfaz de chat libre con 8 agentes IA (CTO Virtual + 7 especializados), cada uno con un system prompt unico y el contexto completo del proyecto inyectado. A diferencia de Phase 00 y 01 (donde el chat es guiado), aqui el usuario hace preguntas abiertas y los agentes responden con formato rico. Se usa Claude claude-sonnet-4-6 via Vercel AI SDK con streaming. Las conversaciones se organizan en hilos por agente y se persisten en `agent_conversations`. Los artifacts (respuestas guardadas) se almacenan como documentos del proyecto.

**Sugerencias proactivas (v1.0):** Al abrir el chat con un agente o la vista de agentes, el sistema puede mostrar sugerencias proactivas (sin que el usuario pregunte) basadas en el estado del proyecto: fase actual, documentos pendientes, siguiente accion recomendada. El CTO Virtual muestra un mensaje inicial con 1–3 sugerencias accionables en hilos vacios. Las sugerencias se generan en servidor con el contexto del proyecto y se muestran como opciones clickeables o texto que el usuario puede enviar como primer mensaje. El usuario puede ignorarlas y escribir libremente.

### Implementacion actual (marzo 2026)

- **UI principal:** El listado de agentes y el chat viven en el tab **Equipo** dentro de `/projects/[id]/phase/00–07` (p. ej. `PhaseTeamPanel`), no en una pagina dedicada permanente.
- **Rutas de compatibilidad:** `/projects/[id]/experts` y `/projects/[id]/agents` **redirigen** a `/projects/[id]/phase/{fase actual}` (mismo comportamiento; enlaces desde `ProjectTools` usan `/experts`).
- **APIs:** Siguen bajo `/api/projects/[id]/agents/...` (threads, chat streaming, suggestions).
- **Persistencia:** Hilos en **`conversation_threads`** (incl. columna **`attachments`** JSONB para archivos en Storage `project-chat`).
- **Planes:** Limites y candados en `src/lib/plans/guards.ts` (Starter vs Builder/Agency; Operator en plan alto).

Ver tambien `docs/ESTADO-DEL-PRODUCTO.md`.

---

## Data Model

### Extension de `agent_conversations` (tabla existente de Feature 03)

Se reutiliza la tabla existente con nuevos valores:

- `phase_number = null` (conversaciones no vinculadas a una fase especifica)
- `section = null`
- `agent_type` = `'cto_virtual'` | `'product_architect'` | `'system_architect'` | `'ui_ux_designer'` | `'lead_developer'` | `'db_admin'` | `'qa_engineer'` | `'devops_engineer'`

### Tabla: `conversation_threads`

```sql
create table conversation_threads (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references projects(id) on delete cascade,
  agent_type       text not null,
  title            text,           -- auto-generado del primer mensaje
  messages         jsonb not null default '[]',
  message_count    integer not null default 0,
  last_message_at  timestamptz default now(),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table conversation_threads enable row level security;

create policy "Users can manage own threads"
  on conversation_threads for all
  using (
    project_id in (select id from projects where user_id = auth.uid())
  );

create index idx_threads_project_agent on conversation_threads(project_id, agent_type, last_message_at desc);
```

### Extension de `project_documents` para Artifacts

Se reutiliza `project_documents` con:

- `document_type = 'artifact'`
- `phase_number = null` (o la fase seleccionada por el usuario al guardar)
- `section` = titulo del artifact

No se requiere migracion adicional — la tabla ya soporta estos valores.

### Supabase Storage — Estructura (extension)

```
bucket: project-documents
  └── projects/
      └── {project_id}/
          ├── discovery/          ← (Feature 03)
          ├── specs/              ← (Feature 04)
          └── artifacts/
              └── {artifact-name}.md
```

---

## Definicion de Agentes

### Tabla de Agentes

| ID                  | Nombre            | Icono | Especialidad                                                                | Plan minimo |
| ------------------- | ----------------- | ----- | --------------------------------------------------------------------------- | ----------- |
| `cto_virtual`       | CTO Virtual       | 🧠    | Vision holistica, delegacion, metodologia IA DLC                            | Starter     |
| `product_architect` | Product Architect | 📐    | Producto, priorizacion, scope, user stories                                 | Builder     |
| `system_architect`  | System Architect  | 🏗️    | Arquitectura, patrones, tecnologias, diagramas                              | Builder     |
| `ui_ux_designer`    | UI/UX Designer    | 🎨    | Wireframes, mockups, guias de estilo, consistencia visual a partir de specs | Builder     |
| `lead_developer`    | Lead Developer    | 💻    | Implementacion, codigo, debugging, best practices                           | Builder     |
| `db_admin`          | DB Admin          | 🗄️    | Esquemas, queries, migraciones, RLS, performance                            | Builder     |
| `qa_engineer`       | QA Engineer       | 🧪    | Testing, test cases, QA strategy, regression                                | Builder     |
| `devops_engineer`   | DevOps Engineer   | 🚀    | Deploy, CI/CD, monitoring, infraestructura                                  | Builder     |
| `operator`          | Operator          | 🛠️    | Opera sistemas end-to-end: repos, entornos, CI/CD y deploys reproducibles   | Agency      |

### System Prompts — Estructura Comun

```
ROL: Eres {nombre del agente}, parte del equipo de AI Squad Command Center.
ESPECIALIDAD: {descripcion detallada de expertise y ambito}
CONTEXTO DEL PROYECTO:
  - Nombre: {nombre}
  - Descripcion: {descripcion}
  - Industria: {industria}
  - Fase actual: {phase number y nombre}
  - Persona del usuario: {persona}
DOCUMENTOS DEL PROYECTO:
  - Discovery: {resumen de brief, personas, value prop, metrics, competitive}
  - Specs: {resumen de features especificados con data models y APIs}
  - Artifacts previos: {lista de artifacts guardados}
STACK TECNICO: Next.js 16, TypeScript, Supabase, Tailwind, shadcn/ui, Vercel
INSTRUCCIONES:
  - Responde en espanol; codigo y nombres tecnicos en ingles
  - Usa markdown enriquecido: headers, listas, code blocks con lenguaje, tablas
  - Si la pregunta esta fuera de tu ambito, sugiere al agente apropiado
  - Fundamenta tus recomendaciones en el contexto del proyecto
  - No inventes informacion que no este en el contexto del proyecto
  - Sé directo y accionable — el usuario necesita respuestas, no teoria
FORMATO DE RESPUESTA: {especifico por agente}
```

### Prompts Especificos por Agente

**CTO Virtual:**

- Tiene vision holistica de todas las fases
- Puede recomendar delegar a agentes especializados
- Formato: respuestas ejecutivas con decision + justificacion + siguiente paso

**Product Architect:**

- Enfocado en producto: user stories, priorizacion, scope, roadmap
- Formato: user stories con acceptance criteria, matrices de priorizacion

**System Architect:**

- Enfocado en arquitectura: patrones, flujos, diagramas, trade-offs
- Formato: diagramas ASCII, comparativas de opciones, ADRs

**Lead Developer:**

- Enfocado en codigo: implementacion, snippets, debugging, refactoring
- Formato: code blocks con explicaciones paso a paso

**DB Admin:**

- Enfocado en datos: esquemas SQL, queries, migraciones, indices, RLS
- Formato: SQL con comentarios, diagramas ER simplificados

**QA Engineer:**

- Enfocado en calidad: test cases, estrategia de testing, regression
- Formato: tablas de test cases, checklists de QA

**DevOps Engineer:**

- Enfocado en ops: CI/CD, deploy, monitoring, config, scripts
- Formato: YAML configs, scripts shell, checklists de deploy

**UI/UX Designer:**

- Enfocado en diseño: wireframes, mockups y guías de estilo visuales en HTML + Tailwind CSS a partir de design.md y user flows
- Camino A: genera diseños HTML persistidos via API (`POST /designs/generate`); Camino B: entregables en conversación (style guide, component library, user flows, responsive)
- Formato: bloques HTML renderizables con Tailwind CSS, especificaciones de componentes, iconos SVG inline. Nunca ASCII art

---

## UI/UX Layout

> **Nota (marzo 2026):** El diagrama siguiente describe el **layout logico** (selector + chat) tal como se incrusta hoy en el tab **Equipo** de la fase. La ruta `/projects/:id/agents` en el navegador redirige a la fase activa; la URL estable del workspace es `/projects/:id/phase/NN`.

### Estructura de Pagina

```
/projects/:id/phase/NN  (tab Equipo — mismo layout que antes en /agents)
├── TopBar
│   ├── Breadcrumb: Proyecto → Agentes
│   └── Boton "Volver a fases del proyecto"
│
├── AgentSelector (sidebar izquierdo, 25%)
│   ├── AgentCard (CTO Virtual) — siempre primero
│   ├── Divider "Agentes Especializados"
│   ├── AgentCard (Product Architect)
│   ├── AgentCard (System Architect)
│   ├── AgentCard (UI/UX Designer)
│   ├── AgentCard (Lead Developer)
│   ├── AgentCard (DB Admin)
│   ├── AgentCard (QA Engineer)
│   └── AgentCard (DevOps Engineer)
│       └── 🔒 (si plan no lo incluye)
│
└── ChatArea (75%)
    ├── AgentHeader
    │   ├── Icono + Nombre del agente activo
    │   ├── Especialidad (1 linea)
    │   └── Boton "Nueva conversacion"
    │
    ├── ThreadSidebar (colapsable, 20% del ChatArea)
    │   ├── ThreadItem (titulo auto-generado, fecha)
    │   ├── ThreadItem...
    │   └── [+ Nueva conversacion]
    │
    └── ChatMain (80% del ChatArea)
        ├── ProactiveSuggestions (v1.0; solo si hilo vacio)
        │   └── 1–3 sugerencias clickeables que envian el texto como primer mensaje
        ├── ChatHistory (mensajes con markdown renderizado)
        └── ChatInput (textarea + enviar + stop)
```

**Sugerencias proactivas (v1.0):** Cuando el usuario abre un hilo sin mensajes (o la vista de agentes por primera vez en la sesion), se muestra un panel/card encima del ChatHistory con 1–3 sugerencias generadas por `GET /api/projects/:id/agents/suggestions`. Cada sugerencia es un boton o card clickeable: al hacer clic, el texto se envia como primer mensaje al agente y el panel se oculta. El usuario puede ignorar y escribir en el ChatInput; el panel puede tener boton "Ocultar" o desaparecer al enviar cualquier mensaje.

### AgentCard — Estados

```
┌──────────────────────────────┐
│ 🧠 CTO Virtual               │
│ Vision holistica del proyecto │
│ ● 3 conversaciones           │
└──────────────────────────────┘
```

- Card normal: clickeable, hover con borde violeta
- Card activa: borde violeta solido, fondo claro
- Card bloqueada (plan): icono de candado, tooltip "Disponible en plan Builder"

### Mensaje del Agente — Acciones

Cada mensaje del agente tiene iconos de accion al hacer hover:

````
┌─────────────────────────────────────────────┐
│ 🧠 CTO Virtual                       12:30  │
│                                             │
│ Para tu proyecto, recomiendo esta           │
│ arquitectura:                               │
│                                             │
│ ```typescript                               │
│ // src/app/api/...                          │
│ ```                                         │
│                                             │
│ Las razones principales son...              │
│                                      [📋] [💾] │
└─────────────────────────────────────────────┘
````

- `📋` Copiar al portapapeles
- `💾` Guardar como artifact

### Save Artifact Modal

```
┌─────────────────────────────────────────────┐
│  Guardar como Artifact                      │
│                                             │
│  Nombre: [Arquitectura recomendada      ]   │
│  Fase:   [▼ Phase 02 — Architecture    ]   │
│                                             │
│  [Cancelar]              [Guardar artifact] │
└─────────────────────────────────────────────┘
```

### Floating Agent Button

Visible en todas las paginas del proyecto (excepto `/agents`):

```
┌──────┐
│ 🤖💬 │  ← Boton flotante esquina inferior derecha
└──────┘
```

Al hacer click, abre un mini-chat drawer con el ultimo agente usado o el CTO Virtual.

### Mobile Layout

En mobile (< 768px):

- AgentSelector se convierte en dropdown selector
- ThreadSidebar se muestra como drawer
- ChatArea ocupa 100% del ancho
- Floating button mantiene posicion

---

## API Design

### `GET /api/projects/:id/agents/suggestions`

Retorna sugerencias proactivas para el contexto actual del proyecto (v1.0). Se usa cuando el usuario abre la vista de agentes o un hilo vacio.

**Query params (opcionales):** `agent_type` — si se especifica, las sugerencias se orientan a ese agente (ej. CTO Virtual).

**Response 200:**

```json
{
  "suggestions": [
    {
      "id": "s1",
      "text": "Tienes Phase 00 aprobada. Considera pedir al Product Architect que priorice las features para Phase 01.",
      "agent_hint": "product_architect"
    },
    {
      "id": "s2",
      "text": "Tu spec de Auth esta completo. ¿Quieres que el System Architect revise la arquitectura de autenticacion?",
      "agent_hint": "system_architect"
    }
  ],
  "context_summary": { "current_phase": 1, "pending_docs": [] }
}
```

Si no hay sugerencias relevantes (proyecto sin contexto suficiente), `suggestions` puede ser `[]`. Las sugerencias se generan con una llamada al LLM (prompt dedicado) que recibe el contexto del proyecto y devuelve 1–3 items accionables.

### `GET /api/projects/:id/agents`

Retorna la lista de agentes disponibles con conteo de threads por agente.

**Response 200:**

```json
{
  "agents": [
    {
      "id": "cto_virtual",
      "name": "CTO Virtual",
      "specialty": "Vision holistica, delegacion, metodologia IA DLC",
      "description": "Tu punto de contacto principal. Conoce todo tu proyecto y te guia en cada decision.",
      "icon": "brain",
      "plan_required": "starter",
      "accessible": true,
      "thread_count": 3
    }
  ]
}
```

### `GET /api/projects/:id/agents/:agentType/threads`

Retorna los hilos de conversacion con un agente.

**Response 200:**

```json
{
  "threads": [
    {
      "id": "uuid",
      "title": "Arquitectura para modulo de pagos",
      "message_count": 12,
      "last_message_at": "2026-03-08T10:30:00Z",
      "preview": "Para el modulo de pagos recomiendo..."
    }
  ]
}
```

### `POST /api/projects/:id/agents/:agentType/threads`

Crea un nuevo hilo de conversacion.

**Request:** `{}` (el titulo se auto-genera del primer mensaje)
**Response 201:** `{ "id": "uuid", "agent_type": "system_architect" }`

### `DELETE /api/projects/:id/agents/:agentType/threads/:threadId`

Elimina un hilo y sus mensajes.

**Response 204:** (no content)

### `POST /api/projects/:id/agents/:agentType/threads/:threadId/chat`

Envia un mensaje al agente y retorna respuesta en streaming.

**Request:**

```json
{
  "message": "¿Que arquitectura recomiendas para el modulo de pagos?"
}
```

**Response:** `text/event-stream`

```
data: {"type":"text","text":"Para tu proyecto "}
data: {"type":"text","text":"de marketplace..."}
data: {"type":"done","message_count":13}
```

### `POST /api/projects/:id/agents/:agentType/threads/:threadId/stop`

Detiene la generacion actual.

**Response 200:** `{ "stopped": true }`

### `POST /api/projects/:id/artifacts`

Guarda un mensaje del agente como artifact.

**Request:**

```json
{
  "name": "Arquitectura de pagos",
  "content": "# Arquitectura de pagos\n\nPara tu proyecto...",
  "phase_number": 2,
  "source_thread_id": "uuid",
  "source_message_index": 5
}
```

**Response 201:** `{ "id": "uuid", "storage_path": "projects/.../artifacts/arquitectura-de-pagos.md" }`

---

## Arquitectura de Componentes

```
src/app/(dashboard)/projects/[id]/agents/
├── page.tsx                          ← Server Component (carga agentes y threads)
├── loading.tsx                       ← Skeleton con sidebar de agentes
└── error.tsx

src/components/agents/
├── AgentsLayout.tsx                  ← Layout con AgentSelector + ChatArea
├── AgentSelector.tsx                 ← Sidebar de agentes (client)
│   └── AgentCard.tsx                ← Card individual con icono, nombre, especialidad
├── AgentHeader.tsx                   ← Header del chat con info del agente activo
├── ThreadSidebar.tsx                 ← Lista de hilos del agente activo
│   └── ThreadItem.tsx               ← Item de hilo con titulo y fecha
├── AgentChat.tsx                     ← Wrapper del chat para agentes
│   ├── (reutiliza ChatHistory, ChatMessage, ChatInput de shared/)
│   ├── ProactiveSuggestions.tsx     ← Panel/card de sugerencias proactivas (hilo vacio; v1.0)
│   └── MessageActions.tsx           ← Botones de copiar y guardar artifact
├── SaveArtifactModal.tsx             ← Modal para guardar respuesta como artifact
└── FloatingAgentButton.tsx           ← Boton flotante visible en todas las fases
```

### Reutilizacion de Componentes Compartidos

Se reutilizan de `src/components/shared/chat/`:

- `ChatHistory.tsx`, `ChatMessage.tsx`, `ChatInput.tsx`, `StreamingIndicator.tsx`

`ChatMessage.tsx` se extiende con un slot para `MessageActions` (copiar, guardar) via render prop o children.

### Flujo de Chat con Agente

```typescript
// src/app/api/projects/[id]/agents/[agentType]/threads/[threadId]/chat/route.ts
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

export async function POST(req: Request) {
  const { message } = await req.json()

  const thread = await getThread(threadId)
  const projectContext = await buildFullProjectContext(projectId)
  const agentPrompt = getAgentSystemPrompt(agentType, projectContext)

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: agentPrompt,
    messages: [...thread.messages, { role: 'user', content: message }],
    maxTokens: 4096,
    onFinish: async (response) => {
      await appendMessageToThread(threadId, { role: 'user', content: message })
      await appendMessageToThread(threadId, { role: 'assistant', content: response.text })
      if (thread.message_count === 0) {
        await generateThreadTitle(threadId, message)
      }
    },
  })

  return result.toDataStreamResponse()
}
```

### Auto-generacion de Titulo del Hilo

El titulo se genera automaticamente despues del primer intercambio:

```typescript
async function generateThreadTitle(threadId: string, firstMessage: string) {
  const title = await generateText({
    model: anthropic('claude-sonnet-4-6'),
    prompt: `Generate a short title (max 50 chars, in Spanish) for a conversation that starts with: "${firstMessage.slice(0, 200)}"`,
    maxTokens: 50,
  })
  await updateThreadTitle(threadId, title.text)
}
```

---

## Architecture Decisions

### `conversation_threads` en lugar de reutilizar `agent_conversations`

`agent_conversations` esta disenada para Phase 00/01 con unique constraint por (project, phase, section, agent). Para el chat libre necesitamos multiples hilos por agente, sin seccion ni fase fija. Una tabla separada es mas limpia y permite indices optimizados para la lista de hilos.

### Contexto completo del proyecto en cada llamada

Cada llamada al agente incluye el contexto completo del proyecto (discovery + specs + artifacts). Esto es mas costoso en tokens pero garantiza que el agente siempre este actualizado. Se implementa truncamiento progresivo: primero resumir artifacts, luego specs antiguos, finalmente discovery.

### Titulo auto-generado del hilo

Evita pedirle al usuario que nombre cada conversacion. Se genera despues del primer intercambio con una llamada rapida al LLM (< 50 tokens). Si falla, se usa un fallback basado en el timestamp.

### Floating Agent Button

Permite acceso rapido al chat sin navegar fuera de la fase actual. Abre un mini-drawer (no fullscreen) para consultas rapidas. Para conversaciones largas, el usuario navega a `/agents`.

### Artifacts como `project_documents`

Se reutiliza la tabla existente para evitar crear otra entidad. El `document_type = 'artifact'` los distingue. Aparecen en el sidebar de documentos del proyecto como seccion separada.

---

## Dependencies

- Hereda todas las dependencias de Features 03 y 04
- `react-textarea-autosize` — textarea que crece con el contenido del input (si no esta ya incluido)
- No se requieren dependencias nuevas significativas — el stack de chat ya esta establecido
