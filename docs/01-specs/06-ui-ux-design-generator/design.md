# Design: Generador de diseños UI/UX

**Feature:** Generador de diseños UI/UX (wireframes y mockups) + hub **Diseño & UX**
**Fase IA DLC:** Phase 02 — Architecture & Design
**Fecha:** 2026-03-08 · revisión hub dos caminos: marzo 2026
**Status:** En evolución — hub y APIs base implementados en código; revisar checklist `tasks.md`

---

## Overview

El generador de diseños UI/UX permite, tras completar Phase 01 (KIRO), producir wireframes y mockups a partir de `design.md` y user flows. Un agente IA dedicado (UI/UX Designer) recibe el contexto del proyecto y de los specs, y genera artefactos visuales que se almacenan en el proyecto y se muestran en una vista dedicada. El usuario puede solicitar generación por pantalla/flujo, refinar con instrucciones en lenguaje natural y marcar diseños como aprobados para desarrollo. Los artefactos se guardan en Supabase Storage; los metadatos y el estado (aprobado, borrador) en PostgreSQL con RLS.

### Hub «Diseño & UX» en la aplicación (marzo 2026)

La vista `/projects/[id]/designs` actúa como **hub** con **dos caminos** explícitos (decisión documentada en **ADR-007**):

| Camino | Nombre en UI | Objetivo | Implementación resumida |
|--------|----------------|----------|-------------------------|
| **A** | Pantallas visuales | Wireframes/mockups **persistidos** en el proyecto | Formulario (pantallas por coma, tipo, refinamiento) → `POST /api/projects/[id]/designs/generate` → lista **Diseños generados** y detalle `/designs/[artifactId]` |
| **B** | Kit de diseño con agente | Style guide, component library, user flows, responsive, petición custom | Tarjetas con orden sugerido 1→6: crean hilo `ui_ux_designer`; primer mensaje compuesto con `getDesignWorkflowContext` (personas, value proposition, proyecto) + guion por herramienta (`src/lib/design/design-tool-workflow.ts`) |

**Navegación:** `ProjectBreadcrumb` refleja si el usuario está en una fase, en Diseño & UX, en detalle de artefacto o en Agentes IA (`/experts`), evitando breadcrumbs engañosos.

**Archivos clave:** `DesignGenerator.tsx`, `DesignChat.tsx`, `ArtifactDetail.tsx`, `design-tool-workflow.ts`, `context-builder.ts`, `ProjectBreadcrumb.tsx`, `ProjectTools.tsx`.

---

## Data Model

### Tabla: `design_artifacts` (Supabase)

Almacena metadatos de cada wireframe o mockup generado. El contenido HTML se guarda en la columna `content` (acceso rápido) y opcionalmente en Storage como respaldo.

```sql
create table design_artifacts (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects(id) on delete cascade,
  type          text not null check (type in ('wireframe', 'mockup_lowfi', 'mockup_highfi')),
  screen_name   text not null,           -- e.g. "Login", "Dashboard principal"
  flow_name     text,                    -- optional, e.g. "Auth flow", "Onboarding"
  storage_path  text not null,           -- path in bucket: projects/{project_id}/designs/{id}.html
  mime_type     text default 'text/html',
  content       text,                    -- HTML content for fast reads (primary source)
  status        text default 'draft' check (status in ('generating', 'draft', 'approved')),
  prompt_used   text,                    -- last prompt/refinement for audit
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_design_artifacts_project on design_artifacts(project_id);
create index idx_design_artifacts_project_type on design_artifacts(project_id, type);

alter table design_artifacts enable row level security;

create policy "Users can manage design artifacts of own projects"
  on design_artifacts for all
  using (
    exists (
      select 1 from projects p
      where p.id = design_artifacts.project_id and p.user_id = auth.uid()
    )
  );
```

### Storage (Supabase Storage)

- **Bucket:** `project-designs` (privado, best-effort — puede no existir en todos los entornos).
- **Path:** `projects/{project_id}/designs/{artifact_id}.html`.
- **Estrategia dual:** El contenido HTML se guarda primero en la columna `content` de la DB (fuente primaria, siempre disponible); el upload a Storage es best-effort como respaldo.
- **Policies:** Solo el `user_id` propietario del proyecto puede leer/escribir en la carpeta de su proyecto.

---

## API Design

Todos los endpoints requieren autenticación (Supabase session). El `project_id` debe pertenecer al usuario.

### `POST /api/projects/[projectId]/designs/generate`

Solicita la generación de uno o más diseños. La generación puede ser asíncrona; la respuesta confirma la aceptación y devuelve los IDs de artefactos en creación.

**Request:**
```json
{
  "type": "wireframe",
  "screens": ["Login", "Dashboard principal"],
  "refinement": "Layout minimalista, enfatizar CTA principal"
}
```

- `type`: `"wireframe"` | `"mockup_lowfi"` | `"mockup_highfi"`
- `screens`: array de nombres de pantalla (deben existir o inferirse del design.md del proyecto).
- `refinement`: opcional; instrucción en lenguaje natural para el agente.

**Response 202 Accepted:**
```json
{
  "job_id": "uuid",
  "artifacts": [
    { "id": "uuid", "screen_name": "Login", "status": "generating" },
    { "id": "uuid", "screen_name": "Dashboard principal", "status": "generating" }
  }
}
```

**Response 400:** Proyecto sin Phase 01 completada, o `screens` vacío.
**Response 404:** `projectId` no encontrado o sin acceso.

---

### `GET /api/projects/[projectId]/designs`

Lista todos los design artifacts del proyecto.

**Response 200:**
```json
{
  "artifacts": [
    {
      "id": "uuid",
      "type": "wireframe",
      "screen_name": "Login",
      "flow_name": "Auth",
      "storage_path": "projects/xxx/designs/yyy.png",
      "status": "approved",
      "created_at": "2026-03-08T10:00:00Z",
      "thumbnail_url": "/api/projects/xxx/designs/yyy/thumbnail"
    }
  ]
}
```

`thumbnail_url` puede ser un signed URL o un route que sirva la imagen con permisos.

---

### `GET /api/projects/[projectId]/designs/[artifactId]`

Detalle de un artefacto + URL de descarga (signed) del archivo en Storage.

**Response 200:**
```json
{
  "id": "uuid",
  "type": "wireframe",
  "screen_name": "Login",
  "flow_name": "Auth",
  "status": "draft",
  "download_url": "https://...signed...",
  "created_at": "...",
  "updated_at": "..."
}
```

---

### `PATCH /api/projects/[projectId]/designs/[artifactId]`

Actualiza metadatos; principalmente `status` a `approved` o de vuelta a `draft`.

**Request:** `{ "status": "approved" }`  
**Response 200:** Objeto artefacto actualizado.

---

### `POST /api/projects/[projectId]/designs/[artifactId]/refine`

Pide al agente UI/UX Designer que refine el diseño con una nueva instrucción. Regenera el HTML y actualiza `content`, `storage_path` y `prompt_used`.

**Request:** `{ "instruction": "Añadir más espacio entre el formulario y el botón" }`  
**Response 202:** `{ "id": "uuid", "status": "generating" }` (mismo flujo asíncrono que generate).

---

## UI/UX Flow

### Rutas

```
/projects/[id]/phase/02          → Phase 02 (bloque dedicado "Diseño UI/UX" pendiente de integración según tasks)
/projects/[id]/designs           → Hub "Diseño & UX": Camino A (formulario generate) + Camino B (6 herramientas + chat)
/projects/[id]/designs/[artifactId] → Detalle artefacto Camino A + CTA al hub Camino B
/projects/[id]/experts           → Agentes IA (breadcrumb "Agentes IA")
```

La generación **Camino A** se invoca desde el **formulario en la parte superior del hub** (equivalente al flujo “Nuevo diseño” del spec original). Pendiente: modal desde Phase 02 (TASK-016) y disparo automático desde chat (TASK-020).

Invocación prevista adicional:
1. **Vista Phase 02:** botón “Generar wireframes para este proyecto” que abre modal o in-line form (selección de pantallas, tipo, refinamiento opcional).
2. **Chat del agente UI/UX Designer:** el usuario escribe “genera wireframes para Login y Dashboard”; el agente llama al backend (o el backend expone una acción que el orquestador puede invocar) y luego muestra enlaces a los diseños generados.
3. **Hub /designs — Camino B:** abrir una herramienta; no sustituye a Camino A para artefactos guardados en lista.

### Flujo de generación

```
[Usuario en Phase 02 o /designs]
    │
    ├─ "Generar wireframes" → [Modal: seleccionar pantallas desde design.md, opcional refinement]
    │       → POST /designs/generate
    │       → UI muestra "Generando…" y polling o WebSocket para "listo"
    │       → Redirección o actualización de lista en /designs
    │
    ├─ "Refinar diseño" (en detalle de un artefacto) → [Campo: instrucción]
    │       → POST /designs/[id]/refine
    │       → Mismo flujo asíncrono
    │
    └─ "Aprobar para desarrollo" → PATCH /designs/[id] { status: "approved" }
```

### Componentes UI

- **Lista de diseños (`DesignGenerator.tsx`):** cards clickeables con nombre de pantalla, tipo (badge), estado (draft/approved/generating), fecha. Enlace directo a detalle.
- **Detalle (`ArtifactDetail.tsx`):** iframe con sandbox (`allow-scripts`) que renderiza el HTML, controles de dispositivo (Mobile 375px / Tablet 768px / Desktop 1280px), auto-resize de altura, botones Refinar y Aprobar. Input de refinamiento inline.
- **Formulario de generación (inline en hub):** input de pantallas separadas por coma, radio buttons para tipo (wireframe / mockup low-fi / high-fi), textarea opcional de refinamiento. Botón “Generar diseños”.
- **Estado “Generando”:** `status: 'generating'` mientras el LLM procesa; al completar, `status: 'draft'` con contenido HTML visible.

---

## Architecture Decisions

### Generación de diseños — HTML visual (implementado en v1.0)
- **Enfoque:** El LLM genera HTML autocontenido con Tailwind CSS (via CDN) + Google Fonts (Inter). El resultado se renderiza directamente en un iframe con sandbox en la vista de detalle.
- **Tres niveles de fidelidad:** `wireframe` (colores neutros, estructura), `mockup_lowfi` (un color primario + grays, componentes con specs detallados), `mockup_highfi` (paleta completa, micro-interacciones, tipografía refinada — aspecto de producto terminado tipo Figma).
- **Prompts dedicados:** `src/lib/ai/prompts/design-generation.ts` con `TYPE_INSTRUCTIONS` por nivel y regla absoluta de HTML-only (nunca ASCII art, nunca markdown).
- **Token budget:** `maxOutputTokens: 8192` para soportar HTML rico multi-pantalla.
- No se usan APIs de generación de imágenes (DALL·E, Ideogram) — todo es HTML renderizable.

### Almacenamiento — estrategia dual
- **Columna `content` en PostgreSQL** (fuente primaria): acceso rápido, siempre disponible, sin dependencia de bucket.
- **Supabase Storage** (best-effort): upload como respaldo; el bucket `project-designs` puede no existir en todos los entornos.
- **Metadatos en PostgreSQL** con RLS: listado, filtros y permisos coherentes con el resto del producto.

### Agente UI/UX Designer
- **Camino A (generate):** Prompt dedicado HTML-only (`design-generation.ts`). Usa `generateText` (no `streamText`) para garantizar completitud. Guarda contenido en DB + Storage.
- **Camino B (chat/kit):** El agente usa su system prompt (`ui-ux-designer.ts`) que ahora genera HTML visual con Tailwind en bloques de código, nunca ASCII art. Entregables en conversación (style guide, component library, user flows, responsive specs).
- El orquestador delega al UI/UX Designer cuando detecta intención de diseño (keywords: wireframe, mockup, diseño, pantalla, layout).

### Integración con Phase 01
- **Gate relajado:** La generación se permite cuando Phase 01 está `completed` o `active` con al menos un feature en estado `spec_complete`, `approved` o `in_progress`. Si Phase 01 está `locked`, se muestra mensaje “Completa Phase 01 para generar diseños”.
- El usuario introduce pantallas manualmente (separadas por coma), no se parsean automáticamente de `design.md`.

---

## Dependencies

- **Features previas:** Phase 01 (KIRO) completada; proyectos con al menos un `design.md` con UI flow definido. Orquestador y chat con agentes (incl. UI/UX Designer) operativos.
- **Backend:** Supabase (PostgreSQL + Storage), Next.js API Routes.
- **Generación:** SDK del LLM (Anthropic/OpenAI via Vercel AI SDK) con `generateText` para diseños HTML. Sin APIs de generación de imágenes — el HTML se renderiza directamente en iframe.
- **Frontend:** Componentes de lista, detalle con iframe (sandbox, controles de dispositivo mobile/tablet/desktop) y formulario de generación/refinamiento.
