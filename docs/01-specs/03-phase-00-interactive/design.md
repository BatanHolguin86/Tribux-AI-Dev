# Design: Phase 00 Interactivo — Discovery

**Feature:** 03 — Phase 00 Interactivo
**Fase IA DLC:** Phase 01 — Requirements & Spec
**Fecha:** 2026-03-06
**Status:** Pendiente aprobacion CEO/CPO

---

## Overview

Phase 00 es una interfaz de chat en dos paneles: izquierda la conversacion con el orquestador, derecha el documento generado para la seccion activa. El orquestador (Claude claude-sonnet-4-6) recibe un system prompt especializado para cada seccion del discovery, el contexto completo del proyecto y el historial de la conversacion. Las respuestas se streaman via Vercel AI SDK. Cada documento generado se almacena en Supabase Storage como archivo markdown y se vincula a `project_documents`.

---

## Data Model

### Tabla: `agent_conversations`

```sql
create table agent_conversations (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects(id) on delete cascade,
  phase_number integer not null,
  section      text,   -- 'problem_statement' | 'personas' | 'value_proposition' | 'metrics' | 'competitive_analysis'
  agent_type   text not null default 'orchestrator',
  messages     jsonb not null default '[]',  -- array de { role, content, created_at }
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique(project_id, phase_number, section, agent_type)
);

alter table agent_conversations enable row level security;

create policy "Users can manage own conversations"
  on agent_conversations for all
  using (
    project_id in (select id from projects where user_id = auth.uid())
  );
```

### Tabla: `project_documents`

```sql
create table project_documents (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects(id) on delete cascade,
  phase_number  integer not null,
  section       text not null,
  document_type text not null,  -- 'brief' | 'personas' | 'value_proposition' | 'metrics' | 'competitive_analysis' | 'requirements' | 'design' | 'tasks'
  storage_path  text not null,  -- path en Supabase Storage: projects/{project_id}/discovery/01-brief.md (o brief.md segun convencion del producto)
  content       text,           -- cache del contenido para lectura rapida (< 50KB)
  version       integer not null default 1,
  status        text not null default 'draft' check (status in ('draft', 'approved')),
  approved_at   timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table project_documents enable row level security;

create policy "Users can manage own documents"
  on project_documents for all
  using (
    project_id in (select id from projects where user_id = auth.uid())
  );
```

### Tabla: `phase_sections`

```sql
create table phase_sections (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects(id) on delete cascade,
  phase_number integer not null,
  section      text not null,
  status       text not null default 'pending'
               check (status in ('pending', 'in_progress', 'completed', 'approved')),
  approved_at  timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique(project_id, phase_number, section)
);

alter table phase_sections enable row level security;

create policy "Users can manage own phase sections"
  on phase_sections for all
  using (
    project_id in (select id from projects where user_id = auth.uid())
  );
```

**Inicializacion de secciones de Phase 00:**
Al crear el proyecto (mismo trigger de Feature 02), se insertan las 5 secciones de Phase 00 con status `pending`.

### Supabase Storage — Estructura

```
bucket: project-documents (private, con RLS via signed URLs)
  └── projects/
      └── {project_id}/
          ├── discovery/
          │   ├── 01-brief.md
          │   ├── 02-personas.md
          │   ├── 03-value-proposition.md
          │   ├── 04-metrics.md
          │   └── 05-competitive-analysis.md
          └── specs/
              └── {feature-name}/
                  ├── requirements.md
                  ├── design.md
                  └── tasks.md
```

---

## System Prompts por Seccion

Cada seccion tiene un system prompt especializado inyectado al orquestador. Estructura comun:

```
ROL: Eres el CTO Virtual y Orquestador de Tribux AI.
CONTEXTO DEL PROYECTO: {nombre, descripcion, industria, perfil del usuario}
SECCION ACTIVA: {nombre de la seccion}
OBJETIVO: {que debe lograr esta seccion}
CONVERSACION PREVIA: {historial de secciones anteriores aprobadas — resumen}
ALCANCE: Tribux AI soporta cualquier tipo de producto — desde interfaces simples hasta productos
  complejos con integraciones, soluciones basadas en IA y agentes autonomos. Adapta tus
  preguntas al tipo de producto que el usuario describe; no restringas por categorias.
INSTRUCCIONES:
  - Usa lenguaje claro, sin jerga tecnica innecesaria
  - Haz una pregunta a la vez; no abrumes con multiples preguntas
  - Cuando tengas suficiente informacion, genera el documento
  - El documento debe estar en espanol (es-LATAM)
  - Si el usuario da respuestas vagas, pide elaboracion especifica
  - Ayuda a priorizar alcance (MVP vs vision) por buenas practicas, no por limitaciones de plataforma
OUTPUT ESPERADO: {estructura del documento a generar}
```

### Mapa de Secciones → Documentos → Prompts

| Seccion                | Documento generado           | Preguntas clave del orquestador                                                                                             |
| ---------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `problem_statement`    | `01-brief.md`                | ¿Que problema resuelves? ¿Para quien? ¿Como lo resuelven hoy? ¿Por que es urgente?                                          |
| `personas`             | `02-personas.md`             | ¿Quien es tu usuario ideal? ¿Que hace en su dia a dia? ¿Que le frustra? ¿Que logro busca?                                   |
| `value_proposition`    | `03-value-proposition.md`    | ¿Que hace tu producto que los demas no? ¿Cual es el momento "aha"? ¿Como describes tu producto en una oracion?              |
| `metrics`              | `04-metrics.md`              | ¿Como sabras que tuviste exito en 6 meses? ¿Cual es el norte que quieres medir? ¿Cuantos usuarios/ingresos en Mes 3, 6, 12? |
| `competitive_analysis` | `05-competitive-analysis.md` | ¿Quien mas resuelve este problema hoy? ¿Por que tu usuario elegiria tu producto sobre esos? ¿Cual es tu ventaja real?       |

---

## UI/UX Layout

### Estructura de Pagina

```
/projects/:id/phase/00
├── TopBar
│   ├── Breadcrumb: Proyecto → Phase 00: Discovery
│   ├── Progress: "3 de 5 secciones completadas"
│   └── Boton "Ver todos los documentos"
│
└── Main (split view)
    ├── Panel Izquierdo — Conversacion (60%)
    │   ├── SectionNav (tabs horizontales: 5 secciones con estado)
    │   ├── ChatHistory (mensajes del orquestador y del usuario)
    │   ├── ApprovalGate (aparece al completar la seccion)
    │   └── ChatInput (textarea + boton enviar)
    │
    └── Panel Derecho — Documento (40%)
        ├── DocumentHeader (nombre del doc + estado + boton editar)
        ├── DocumentViewer (markdown renderizado) | DocumentEditor (textarea raw)
        └── DocumentFooter (version + ultima actualizacion)
```

### SectionNav — Estados Visuales

```
[ ✓ Problem Statement ] [ ✓ Personas ] [ ▶ Value Prop ] [ ○ Metrics ] [ 🔒 Competitive ]
```

- `✓` Verde — seccion aprobada
- `▶` Violeta + pulse — seccion activa en progreso
- `○` Gris claro — seccion pendiente (accesible para navegar si anterior esta aprobada)
- `🔒` Gris — seccion bloqueada (solo se desbloquea al aprobar la anterior)

### ApprovalGate Component

Aparece al final del chat cuando el orquestador declara la seccion lista:

```
┌─────────────────────────────────────────────┐
│  El documento esta listo para tu revision.  │
│                                             │
│  Revisa el panel derecho y cuando estes     │
│  conforme:                                  │
│                                             │
│  [✓ Aprobar esta seccion]                   │
│                                             │
│  o escribe aqui si quieres cambiar algo:    │
│  ┌─────────────────────────────────────┐   │
│  │ Agrega mas detalle sobre...         │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Phase 00 Final Gate

Aparece cuando las 5 secciones estan aprobadas:

```
┌─────────────────────────────────────────────┐
│  🎉 Phase 00 completada                     │
│                                             │
│  Has aprobado los 5 documentos del          │
│  discovery:                                 │
│  ✓ Problem Statement                        │
│  ✓ User Personas                            │
│  ✓ Value Proposition                        │
│  ✓ Success Metrics                          │
│  ✓ Competitive Analysis                     │
│                                             │
│  Al aprobar, Phase 01 (Requirements &       │
│  Spec) se desbloqueara automaticamente.     │
│                                             │
│  [Aprobar Phase 00 y avanzar →]             │
└─────────────────────────────────────────────┘
```

### Mobile Layout

En mobile (< 768px), el split view se convierte en tabs:

- Tab "Conversacion" — muestra el chat
- Tab "Documento" — muestra el documento de la seccion activa

---

## API Design

### `POST /api/projects/:id/phases/0/chat`

Envia un mensaje al orquestador y retorna la respuesta en streaming.

**Request:**

```json
{
  "section": "problem_statement",
  "message": "Quiero resolver el problema de...",
  "conversation_id": "uuid" // opcional, para continuar conversacion existente
}
```

**Response:** `text/event-stream` (Server-Sent Events via Vercel AI SDK)

```
data: {"type":"text","text":"Entendido. Para profundizar..."}
data: {"type":"text","text":" en el problema..."}
data: {"type":"done","conversation_id":"uuid"}
```

**Headers:** `Content-Type: text/event-stream`, `X-Conversation-Id: uuid`

### `POST /api/projects/:id/phases/0/sections/:section/generate`

Dispara la generacion del documento para una seccion. El orquestador usa el historial completo de la seccion para generar el markdown.

**Request:** `{}` (usa la conversacion existente en DB)

**Response:** `text/event-stream` — streaming del documento generado

```
data: {"type":"document_chunk","content":"# Brief\n\n## Problem Statement\n\n"}
data: {"type":"document_done","document_id":"uuid","storage_path":"projects/.../01-brief.md"}
```

### `PATCH /api/projects/:id/documents/:document_id`

Actualiza el contenido de un documento (edicion manual del usuario).

**Request:** `{ "content": "# Brief\n\n## Problem...(editado)" }`
**Response 200:** `{ "document_id": "uuid", "version": 2, "updated_at": "..." }`

### `POST /api/projects/:id/phases/0/sections/:section/approve`

Aprueba una seccion del discovery.

**Request:** `{}` (la seccion debe tener documento con status `draft`)
**Response 200:** `{ "section": "problem_statement", "status": "approved", "next_section": "personas" }`

### `POST /api/projects/:id/phases/0/approve`

Aprueba Phase 00 completo. Requiere que las 5 secciones esten en status `approved`.

**Request:** `{}`
**Response 200:** `{ "phase": 0, "status": "completed", "next_phase": 1, "unlocked": true }`
**Response 400:** `{ "error": "Faltan secciones por aprobar", "pending": ["metrics", "competitive_analysis"] }`

---

## Arquitectura de Componentes

```
src/app/(dashboard)/projects/[id]/phase/00/
├── page.tsx                          ← Server Component (carga contexto inicial)
├── loading.tsx                       ← Skeleton del split view
└── error.tsx

src/components/phase-00/
├── Phase00Layout.tsx                 ← Split view container (client)
├── SectionNav.tsx                    ← Tabs de las 5 secciones con estado
├── ChatPanel.tsx                     ← Panel izquierdo completo (client)
│   ├── ChatHistory.tsx               ← Lista de mensajes con scroll automatico
│   ├── ChatMessage.tsx               ← Burbuja de mensaje (user | assistant)
│   ├── ChatInput.tsx                 ← Textarea + boton + manejo de streaming
│   ├── StreamingIndicator.tsx        ← Animacion mientras el orquestador responde
│   └── ApprovalGate.tsx              ← Gate de aprobacion por seccion
├── DocumentPanel.tsx                 ← Panel derecho completo (client)
│   ├── DocumentViewer.tsx            ← Markdown renderizado (react-markdown)
│   ├── DocumentEditor.tsx            ← Textarea raw con auto-save
│   └── DocumentHeader.tsx            ← Nombre, version, estado, toggle view/edit
└── Phase00FinalGate.tsx              ← Gate de aprobacion final con resumen
```

### Flujo de Streaming (Vercel AI SDK)

```typescript
// src/app/api/projects/[id]/phases/0/chat/route.ts
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

export async function POST(req: Request) {
  const { section, message, conversationHistory } = await req.json()

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: buildSystemPrompt(section, projectContext),
    messages: [...conversationHistory, { role: 'user', content: message }],
    maxTokens: 4096,
  })

  return result.toDataStreamResponse()
}
```

```typescript
// En el cliente — ChatInput.tsx
import { useChat } from 'ai/react'

const { messages, input, handleSubmit, isLoading, stop } = useChat({
  api: `/api/projects/${projectId}/phases/0/chat`,
  body: { section, conversation_id: conversationId },
  onFinish: (message) => {
    persistMessageToSupabase(message)
    checkIfSectionComplete(message)
  },
})
```

---

## Architecture Decisions

### Vercel AI SDK `useChat` para el cliente

Maneja streaming, historial de mensajes en memoria, estado de loading y abort — sin necesidad de implementar SSE manualmente.

### Persistencia del historial en Supabase (JSONB)

Los mensajes se almacenan como array JSONB en `agent_conversations.messages`. Rapido de leer/escribir, suficiente para el volumen esperado (< 100 mensajes por seccion). Si el historial crece, se puede comprimir con un resumen antes de enviar al modelo.

### Documentos en Supabase Storage (no en DB)

Los markdowns pueden ser grandes (5–20KB). Almacenarlos en Storage evita inflar la DB y permite servir el contenido con URLs firmadas. Se mantiene un cache del contenido en `project_documents.content` para lecturas rapidas (< 50KB).

### Generacion de documento separada del chat

La generacion del documento es una llamada separada al LLM (`/generate` endpoint) que usa todo el historial de la seccion como contexto. Esto permite regenerar el documento si el usuario no esta conforme, sin afectar el historial de la conversacion.

### Secciones bloqueadas secuencialmente

Cada seccion se desbloquea al aprobar la anterior — garantiza que el discovery sea coherente y que el usuario no salte pasos criticos.

---

## Dependencies

- `ai` (Vercel AI SDK) — streaming, `useChat`, `streamText`
- `@ai-sdk/anthropic` — proveedor Anthropic para Vercel AI SDK
- `react-markdown` — renderizado de markdown en el DocumentViewer
- `react-syntax-highlighter` — syntax highlighting en bloques de codigo dentro de documentos
- `remark-gfm` — soporte de GitHub Flavored Markdown (tablas, checkboxes)
- Hereda todas las dependencias de Features 01 y 02
