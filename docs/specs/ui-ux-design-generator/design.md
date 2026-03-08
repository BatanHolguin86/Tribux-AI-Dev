# Design: Generador de diseños UI/UX

**Feature:** Generador de diseños UI/UX (wireframes y mockups)
**Fase IA DLC:** Phase 02 — Architecture & Design
**Fecha:** 2026-03-08
**Status:** Pendiente aprobacion CEO/CPO

---

## Overview

El generador de diseños UI/UX permite, tras completar Phase 01 (KIRO), producir wireframes y mockups a partir de `design.md` y user flows. Un agente IA dedicado (UI/UX Designer) recibe el contexto del proyecto y de los specs, y genera artefactos visuales que se almacenan en el proyecto y se muestran en una vista dedicada. El usuario puede solicitar generación por pantalla/flujo, refinar con instrucciones en lenguaje natural y marcar diseños como aprobados para desarrollo. Los artefactos se guardan en Supabase Storage; los metadatos y el estado (aprobado, borrador) en PostgreSQL con RLS.

---

## Data Model

### Tabla: `design_artifacts` (Supabase)

Almacena metadatos de cada wireframe o mockup generado. El archivo binario (PNG/SVG) vive en Storage.

```sql
create table design_artifacts (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects(id) on delete cascade,
  type          text not null check (type in ('wireframe', 'mockup_lowfi', 'mockup_highfi')),
  screen_name   text not null,           -- e.g. "Login", "Dashboard principal"
  flow_name     text,                    -- optional, e.g. "Auth flow", "Onboarding"
  storage_path  text not null,           -- path in bucket: projects/{project_id}/designs/{id}.png
  mime_type     text default 'image/png',
  status        text default 'draft' check (status in ('draft', 'approved')),
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

- **Bucket:** `project-designs` (privado).
- **Path:** `{project_id}/{artifact_id}.{ext}` (ej. `abc-123/def-456.png`).
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

Pide al agente UI/UX Designer que refine el diseño con una nueva instrucción. Regenera la imagen y actualiza `storage_path` y `prompt_used`.

**Request:** `{ "instruction": "Añadir más espacio entre el formulario y el botón" }`  
**Response 202:** `{ "id": "uuid", "status": "generating" }` (mismo flujo asíncrono que generate).

---

## UI/UX Flow

### Rutas

```
/projects/[id]/phase/02          → Phase 02 incluye bloque "Diseño UI/UX"
/projects/[id]/designs           → Vista lista de diseños (wireframes + mockups)
/projects/[id]/designs/[artifactId] → Detalle + preview + descarga + "Aprobar para desarrollo"
```

La generación se puede invocar desde:
1. **Vista Phase 02:** botón “Generar wireframes para este proyecto” que abre modal o in-line form (selección de pantallas, tipo, refinamiento opcional).
2. **Chat del agente UI/UX Designer:** el usuario escribe “genera wireframes para Login y Dashboard”; el agente llama al backend (o el backend expone una acción que el orquestador puede invocar) y luego muestra enlaces a los diseños generados.
3. **Vista /designs:** botón “Nuevo diseño” que lleva al mismo flujo (selección de pantallas y tipo).

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

- **Lista de diseños:** cards o tabla con miniatura, nombre de pantalla, tipo, estado (draft/approved), fecha. Acciones: ver, refinar, aprobar, descargar.
- **Detalle:** imagen a tamaño completo, metadatos, botones Refinar, Aprobar, Descargar.
- **Modal/Form de generación:** selector de pantallas (checkboxes o multi-select basado en design.md), tipo (wireframe / mockup low-fi / high-fi), campo opcional de refinamiento. Botón “Generar”.
- **Estado “Generando”:** spinner o skeleton en la fila/card del artefacto; cuando el job termina, se actualiza la miniatura y el enlace al archivo.

---

## Architecture Decisions

### Generación de imágenes
- **Opción A (recomendada para MVP):** LLM genera descripción estructurada o HTML/SVG del wireframe; un servicio (Edge/Serverless) renderiza a PNG (p. ej. Puppeteer/Playwright en headless o librería SVG-to-PNG). Evita coste por imagen de DALL·E/Ideogram y control total del layout.
- **Opción B:** LLM + API de generación de imágenes (DALL·E, Ideogram, etc.) para mockups. Mayor calidad visual pero coste y cuota por uso; aplicar rate limiting por proyecto.
- En v1 se puede implementar solo wireframes vía LLM + SVG/HTML → PNG; mockups low-fi como siguiente paso o con Opción B limitada.

### Almacenamiento
- **Metadatos en PostgreSQL** con RLS: listado, filtros y permisos coherentes con el resto del producto.
- **Archivos en Supabase Storage** en bucket privado; signed URLs para vista y descarga con expiración corta (ej. 1 hora).

### Agente UI/UX Designer
- Mismo patrón que el resto de agentes: tipo de agente en la tabla de conversaciones, system prompt que incluye “eres un diseñador UI/UX; genera wireframes/mockups a partir de design.md y user flows”. Puede invocar la API interna de generación (POST /designs/generate) cuando el usuario pide “genera wireframes para…”.
- El orquestador delega al UI/UX Designer cuando detecta intención de diseño (keywords: wireframe, mockup, diseño, pantalla, layout).

### Integración con Phase 01
- Para saber “qué pantallas existen”, el backend lee el `design.md` del proyecto (o los specs en `docs/specs/`) y extrae la sección “UI flow” / lista de pantallas. Si no existe, no se muestra el botón de generación y se muestra mensaje “Completa Phase 01 para generar diseños”.

---

## Dependencies

- **Features previas:** Phase 01 (KIRO) completada; proyectos con al menos un `design.md` con UI flow definido. Orquestador y chat con agentes (incl. UI/UX Designer) operativos.
- **Backend:** Supabase (PostgreSQL + Storage), Next.js API Routes.
- **Generación:** SDK del LLM ya usado en el producto (OpenAI/Anthropic/etc.) para el agente; opcionalmente API de generación de imágenes o librería de renderizado SVG/HTML a PNG.
- **Frontend:** Componentes de lista, detalle, modal y formulario ya usados en el proyecto; posible uso de componente de galería o grid de imágenes.
