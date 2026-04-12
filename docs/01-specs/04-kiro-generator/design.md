# Design: Generador KIRO — Phase 01 Interactivo

**Feature:** 04 — Generador KIRO (Phase 01)
**Fase IA DLC:** Phase 01 — Requirements & Spec
**Fecha:** 2026-03-08
**Status:** Pendiente aprobacion CEO/CPO

---

## Overview

Phase 01 reutiliza la arquitectura de chat + documento de Phase 00 pero agrega una capa superior: la gestion de features. El usuario primero define la lista de features a especificar, luego para cada feature el orquestador guia la generacion de 3 documentos KIRO (requirements, design, tasks) en secuencia. El orquestador (Claude claude-sonnet-4-6 via Vercel AI SDK) recibe un system prompt especializado para cada tipo de documento, el contexto completo del discovery aprobado y los specs de features previamente aprobados para mantener coherencia.

---

## Data Model

### Tabla: `project_features`

```sql
create table project_features (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects(id) on delete cascade,
  name          text not null,
  description   text,
  display_order integer not null default 0,
  status        text not null default 'pending'
                check (status in ('pending', 'in_progress', 'spec_complete', 'approved')),
  suggested_by  text not null default 'orchestrator'
                check (suggested_by in ('orchestrator', 'user')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(project_id, name)
);

alter table project_features enable row level security;

create policy "Users can manage own features"
  on project_features for all
  using (
    project_id in (select id from projects where user_id = auth.uid())
  );

create index idx_project_features_project on project_features(project_id, display_order);
```

### Tabla: `feature_documents`

```sql
create table feature_documents (
  id            uuid primary key default gen_random_uuid(),
  feature_id    uuid not null references project_features(id) on delete cascade,
  project_id    uuid not null references projects(id) on delete cascade,
  document_type text not null check (document_type in ('requirements', 'design', 'tasks')),
  storage_path  text not null,
  content       text,           -- cache del contenido para lectura rapida
  version       integer not null default 1,
  status        text not null default 'draft' check (status in ('draft', 'approved')),
  approved_at   timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(feature_id, document_type)
);

alter table feature_documents enable row level security;

create policy "Users can manage own feature documents"
  on feature_documents for all
  using (
    project_id in (select id from projects where user_id = auth.uid())
  );
```

### Extension de `agent_conversations` (tabla existente de Feature 03)

Para Phase 01, se reutiliza `agent_conversations` con:

- `phase_number = 1`
- `section` = `feature_{feature_id}_{document_type}` (ej: `feature_abc123_requirements`)
- `agent_type = 'orchestrator'`

No se requiere migracion adicional en esta tabla.

### Supabase Storage — Estructura (extension)

```
bucket: project-documents
  └── projects/
      └── {project_id}/
          ├── discovery/          ← (Feature 03)
          └── specs/
              └── {feature-name}/
                  ├── requirements.md
                  ├── design.md
                  └── tasks.md
```

---

## System Prompts por Tipo de Documento

Cada tipo de documento KIRO tiene un system prompt especializado. Estructura comun:

```
ROL: Eres el CTO Virtual y Orquestador de Tribux.
CONTEXTO DEL PROYECTO: {nombre, descripcion, industria, persona del usuario}
DISCOVERY APROBADO: {resumen de brief, personas, value proposition, metrics, competitive analysis}
SPECS PREVIOS: {resumen de features ya especificados — data models, API patterns, decisiones}
FEATURE ACTIVO: {nombre y descripcion del feature actual}
DOCUMENTO A GENERAR: {requirements | design | tasks}
INSTRUCCIONES:
  - Haz preguntas especificas una a la vez para entender el feature
  - Usa el discovery aprobado como fundamento — no contradigas lo que ya se definio
  - Mantene coherencia con specs de features anteriores (mismas convenciones de naming, mismas tablas base)
  - El stack es: Next.js 16, TypeScript, Supabase, Tailwind, shadcn/ui
  - Genera documentos en espanol (excepto codigo y nombres tecnicos en ingles)
OUTPUT ESPERADO: {estructura del documento segun formato KIRO}
```

### Mapa de Documentos → Preguntas Clave

| Documento         | Preguntas clave del orquestador                                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requirements.md` | ¿Que necesita hacer el usuario con este feature? ¿Cuales son los casos borde? ¿Que no debe incluir esta version? ¿Hay restricciones de seguridad o performance? |
| `design.md`       | ¿Que datos necesita almacenar? ¿Como se ve la UI (pantallas, flujo)? ¿Que endpoints necesitas? ¿Como se conecta con los features anteriores?                    |
| `tasks.md`        | Basado en requirements y design aprobados: descomposicion automatica en tasks atomicas con estimacion                                                           |

---

## UI/UX Layout

### Estructura de Pagina

```
/projects/:id/phase/01
├── TopBar
│   ├── Breadcrumb: Proyecto → Phase 01: Requirements & Spec
│   ├── Progress: "2 de 5 features especificados"
│   └── Boton "Ver documentos del proyecto"
│
├── DiscoverySummary (colapsable)
│   └── Resumen compacto de Phase 00 (brief, personas, value prop)
│
├── FeatureList (sidebar izquierdo o panel superior en mobile)
│   ├── FeatureItem (nombre, estado, 3 indicadores de doc)
│   ├── FeatureItem...
│   ├── [+ Agregar feature]
│   └── [Reordenar]
│
└── Main (split view, igual que Phase 00)
    ├── Panel Izquierdo — Conversacion (60%)
    │   ├── DocumentTypeNav (tabs: Requirements | Design | Tasks)
    │   ├── ChatHistory
    │   ├── ApprovalGate
    │   └── ChatInput
    │
    └── Panel Derecho — Documento (40%)
        ├── DocumentHeader
        ├── DocumentViewer | DocumentEditor
        └── DocumentFooter
```

### FeatureList — Estados Visuales

```
[ ✓ Auth & Onboarding     ] [R✓] [D✓] [T✓]
[ ▶ Project Dashboard      ] [R✓] [D▶] [T○]
[ ○ Phase 00 Interactive   ] [R○] [D○] [T○]
[ ○ KIRO Generator         ] [R○] [D○] [T○]
[ + Agregar feature...     ]
```

- `✓` Verde — feature con spec completo (3 docs aprobados)
- `▶` Violeta — feature activo en progreso
- `○` Gris — feature pendiente
- `[R]` `[D]` `[T]` — indicadores de requirements/design/tasks con su propio estado

### DocumentTypeNav — Tabs por Documento

```
[ ✓ Requirements ] [ ▶ Design ] [ 🔒 Tasks ]
```

- `✓` Aprobado
- `▶` Activo (en generacion/edicion)
- `○` Pendiente (desbloqueado)
- `🔒` Bloqueado (requiere aprobar el anterior)

Secuencia obligatoria: Requirements → Design → Tasks

### Phase 01 Final Gate

```
┌─────────────────────────────────────────────┐
│  🎉 Phase 01 completada                     │
│                                             │
│  Has especificado 5 features:               │
│  ✓ Auth & Onboarding (3 docs)              │
│  ✓ Project Dashboard (3 docs)              │
│  ✓ Phase 00 Interactive (3 docs)           │
│  ✓ KIRO Generator (3 docs)                 │
│  ✓ Orchestrator & Agents (3 docs)          │
│                                             │
│  Total: 15 documentos KIRO aprobados        │
│                                             │
│  Al aprobar, Phase 02 (Architecture &       │
│  Design) se desbloqueara automaticamente.   │
│                                             │
│  [Aprobar Phase 01 y avanzar →]             │
└─────────────────────────────────────────────┘
```

### Mobile Layout

En mobile (< 768px):

- FeatureList se convierte en un dropdown/selector
- El split view se convierte en tabs (Conversacion | Documento)
- DocumentTypeNav se muestra como selector en la parte superior del chat

---

## API Design

### `GET /api/projects/:id/phases/1/features`

Retorna la lista de features del proyecto con estado de cada documento.

**Response 200:**

```json
{
  "features": [
    {
      "id": "uuid",
      "name": "Auth & Onboarding",
      "description": "Registro, login y onboarding de 4 pasos",
      "display_order": 0,
      "status": "approved",
      "documents": {
        "requirements": { "id": "uuid", "status": "approved", "version": 2 },
        "design": { "id": "uuid", "status": "approved", "version": 1 },
        "tasks": { "id": "uuid", "status": "approved", "version": 1 }
      }
    }
  ],
  "phase_status": "in_progress",
  "features_completed": 2,
  "features_total": 5
}
```

### `POST /api/projects/:id/phases/1/features`

Crea un nuevo feature en la lista.

**Request:**

```json
{
  "name": "Payment Integration",
  "description": "Integracion con Stripe para subscripciones"
}
```

**Response 201:** `{ "id": "uuid", "name": "...", "display_order": 5 }`

### `PATCH /api/projects/:id/phases/1/features/:featureId`

Actualiza nombre, descripcion u orden de un feature.

**Request:** `{ "name": "New Name", "display_order": 2 }`
**Response 200:** `{ "id": "uuid", "name": "New Name", ... }`

### `DELETE /api/projects/:id/phases/1/features/:featureId`

Elimina un feature y sus documentos asociados. Solo si status es `pending`.

**Response 204:** (no content)
**Response 400:** `{ "error": "No se puede eliminar un feature con documentos aprobados" }`

### `POST /api/projects/:id/phases/1/features/:featureId/suggest`

Pide al orquestador que sugiera features basados en el discovery aprobado.

**Response 200:** `text/event-stream` — streaming de la sugerencia

```
data: {"type":"suggestions","features":[{"name":"Auth & Onboarding","description":"...","priority":1},...]}
data: {"type":"done"}
```

### `POST /api/projects/:id/phases/1/features/:featureId/chat`

Envia mensaje al orquestador para generar un documento especifico.

**Request:**

```json
{
  "document_type": "requirements",
  "message": "Los usuarios deben poder...",
  "conversation_id": "uuid"
}
```

**Response:** `text/event-stream` (Server-Sent Events)

### `POST /api/projects/:id/phases/1/features/:featureId/documents/:docType/generate`

Genera el documento KIRO basado en la conversacion.

**Request:** `{}`
**Response:** `text/event-stream` — streaming del documento

```
data: {"type":"document_chunk","content":"# Requirements: Auth & Onboarding\n\n"}
data: {"type":"document_done","document_id":"uuid","storage_path":"projects/.../requirements.md"}
```

### `PATCH /api/projects/:id/phases/1/features/:featureId/documents/:docType`

Actualiza contenido de un documento (edicion manual).

**Request:** `{ "content": "# Requirements...(editado)" }`
**Response 200:** `{ "document_id": "uuid", "version": 2 }`

### `POST /api/projects/:id/phases/1/features/:featureId/documents/:docType/approve`

Aprueba un documento individual. Ejecuta validacion de coherencia contra specs anteriores antes de aprobar.

**Request:** `{}`
**Response 200:** `{ "document_type": "requirements", "status": "approved", "next_document": "design" }`
**Response 400** (inconsistencias detectadas): `{ "error": "Inconsistencias de coherencia", "inconsistencies": [{ "type": "duplicate_table", "message": "...", "suggestion": "..." }] }`

### `POST /api/projects/:id/phases/1/approve`

Aprueba Phase 01 completo. Requiere todos los features con status `approved`.

**Request:** `{}`
**Response 200:** `{ "phase": 1, "status": "completed", "next_phase": 2, "unlocked": true }`
**Response 400:** `{ "error": "Faltan features por aprobar", "pending": ["KIRO Generator", "Orchestrator"] }`

---

## Arquitectura de Componentes

```
src/app/(dashboard)/projects/[id]/phase/01/
├── page.tsx                          ← Server Component (carga features y estado)
├── loading.tsx                       ← Skeleton con sidebar de features
└── error.tsx

src/components/phase-01/
├── Phase01Layout.tsx                 ← Layout con FeatureList + split view
├── DiscoverySummary.tsx              ← Panel colapsable con resumen de Phase 00
├── FeatureList.tsx                   ← Sidebar con lista de features (client)
│   ├── FeatureItem.tsx              ← Item individual con indicadores de docs
│   └── AddFeatureForm.tsx           ← Modal/form para agregar feature
├── FeatureSuggestions.tsx            ← Card con sugerencias del orquestador
├── DocumentTypeNav.tsx              ← Tabs requirements/design/tasks con estado
├── KiroChat.tsx                     ← Reutiliza ChatPanel de Phase 00 con config para Phase 01
└── Phase01FinalGate.tsx             ← Gate final con resumen de features y docs
```

### Reutilizacion de Componentes de Phase 00

Los siguientes componentes de `src/components/phase-00/` se reutilizan directamente:

- `ChatHistory.tsx`, `ChatMessage.tsx`, `ChatInput.tsx`, `StreamingIndicator.tsx`
- `DocumentPanel.tsx`, `DocumentViewer.tsx`, `DocumentEditor.tsx`, `DocumentHeader.tsx`
- `ApprovalGate.tsx` (con props configurables para texto del boton)

Se extraen a `src/components/shared/chat/` y `src/components/shared/document/` para evitar duplicacion.

### Flujo de Generacion

```typescript
// src/app/api/projects/[id]/phases/1/features/[featureId]/chat/route.ts
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

export async function POST(req: Request) {
  const { document_type, message, conversationHistory } = await req.json()

  const projectContext = await buildProjectContext(projectId)
  const discoveryDocs = await getApprovedDiscoveryDocs(projectId)
  const previousSpecs = await getApprovedFeatureSpecs(projectId, featureId)

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: buildKiroPrompt(document_type, projectContext, discoveryDocs, previousSpecs),
    messages: [...conversationHistory, { role: 'user', content: message }],
    maxTokens: 8192, // specs mas largos que discovery docs
  })

  return result.toDataStreamResponse()
}
```

---

## Architecture Decisions

### Secuencia obligatoria Requirements → Design → Tasks

El design necesita los requirements aprobados como input; las tasks necesitan requirements + design. Esta secuencia garantiza coherencia y evita retrabajos.

### `project_features` como tabla separada (no `phase_sections`)

Los features son una entidad de negocio con lifecycle propio (nombre, orden, estado compuesto). Usar `phase_sections` forzaria un modelo plano. `project_features` con `feature_documents` ofrece mas flexibilidad y consultas mas claras.

### Contexto IA acumulativo

Cada llamada al orquestador en Phase 01 incluye: discovery completo + specs de features anteriores. Esto garantiza coherencia tecnica entre features pero incrementa el consumo de tokens. Se implementa truncamiento inteligente cuando el contexto supera 50K tokens (resumen automatico de specs anteriores).

### Reutilizacion de componentes de chat

Los componentes de chat y documento de Phase 00 se refactorizan a `shared/` para reutilizacion. Esto reduce duplicacion pero requiere que los componentes acepten configuracion via props (textos, endpoints, callbacks).

### Task numbering global por proyecto

Los TASK-IDs no reinician por feature — son globales al proyecto. Esto evita conflictos y facilita referencia cruzada entre features.

### Validacion automatica de coherencia (v1.0)

Al aprobar un documento (design.md o requirements.md), el sistema ejecuta validaciones programaticas comparando con specs de features anteriores:

- **Data model:** tablas duplicadas con nombres distintos (ej. `users` vs `user`), columnas que referencian entidades inexistentes
- **Convenciones:** snake_case para tablas/columnas, plural para tablas
- Las inconsistencias se muestran en la UI antes de aprobar; el usuario puede corregir o forzar aprobacion con confirmacion

---

## Dependencies

- Hereda todas las dependencias de Feature 03 (Vercel AI SDK, react-markdown, etc.)
- `@dnd-kit/core` + `@dnd-kit/sortable` — drag & drop para reordenar features en la lista
- Refactorizacion de componentes compartidos de Phase 00 a `src/components/shared/`
