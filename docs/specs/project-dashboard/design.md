# Design: Project Dashboard

**Feature:** 02 — Project Dashboard
**Fase IA DLC:** Phase 01 — Requirements & Spec
**Fecha:** 2026-03-06
**Status:** Pendiente aprobacion CEO/CPO

---

## Overview

El Project Dashboard es una pagina SSR (Server Component) que carga los proyectos del usuario desde Supabase en el servidor, entregando HTML ya renderizado para maximo performance. La interactividad (busqueda, filtros, modals, expand de tarjetas) se maneja en Client Components aislados. El layout principal es un grid de tarjetas con un header de resumen global.

---

## Data Model

### Tablas involucradas

**`projects`** (ya definida en Feature 01)
```sql
id            uuid primary key
user_id       uuid references auth.users
name          text not null
description   text
industry      text
current_phase integer default 0
status        text default 'active' -- 'active' | 'paused' | 'archived'
last_activity timestamptz default now()
created_at    timestamptz default now()
updated_at    timestamptz default now()
```

**`project_phases`** (nueva tabla)
```sql
create table project_phases (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects(id) on delete cascade,
  phase_number  integer not null check (phase_number between 0 and 7),
  status        text not null default 'locked'
                check (status in ('locked', 'active', 'completed')),
  started_at    timestamptz,
  completed_at  timestamptz,
  approved_at   timestamptz,
  approved_by   uuid references auth.users(id),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(project_id, phase_number)
);

alter table project_phases enable row level security;

create policy "Users can manage phases of own projects"
  on project_phases for all
  using (
    project_id in (
      select id from projects where user_id = auth.uid()
    )
  );
```

**Migracion:** Al crear un proyecto, se auto-insertan 8 filas en `project_phases` (phases 0–7), todas con status `locked` excepto la fase 0 que inicia en `active`.

```sql
create or replace function initialize_project_phases()
returns trigger as $$
declare
  i integer;
begin
  for i in 0..7 loop
    insert into project_phases (project_id, phase_number, status)
    values (
      new.id,
      i,
      case when i = 0 then 'active' else 'locked' end
    );
  end loop;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_project_created
  after insert on projects
  for each row execute procedure initialize_project_phases();
```

### Query principal del dashboard

```sql
-- Proyectos con progreso calculado y fase activa
select
  p.id,
  p.name,
  p.description,
  p.industry,
  p.status,
  p.last_activity,
  p.current_phase,
  count(pp.id) filter (where pp.status = 'completed') as phases_completed,
  (
    select pp2.phase_number
    from project_phases pp2
    where pp2.project_id = p.id and pp2.status = 'active'
    limit 1
  ) as active_phase
from projects p
left join project_phases pp on pp.project_id = p.id
where p.user_id = auth.uid()
  and p.status = 'active'  -- parametrizable
group by p.id
order by p.last_activity desc;
```

---

## UI/UX Layout

### Estructura de Pagina

```
/dashboard
├── Header global (nav: logo, cuenta, logout)
└── Main content
    ├── Dashboard Header
    │   ├── Titulo: "Tus proyectos"
    │   ├── Stats bar: "X proyectos activos · X fases completadas esta semana"
    │   └── CTA: boton "Nuevo proyecto"
    ├── Toolbar
    │   ├── Search input (busqueda en tiempo real)
    │   └── Tabs: "Activos" | "Archivados"
    └── Projects Grid
        ├── ProjectCard (x N)
        └── EmptyState (si no hay proyectos)
```

### Componente: ProjectCard

```
┌─────────────────────────────────────────┐
│  [industry tag]              [⋮ menu]   │
│                                          │
│  Nombre del Proyecto                     │
│  Descripcion breve (1 linea truncada)    │
│                                          │
│  Phase activa: Discovery & Ideation      │
│  ████████░░░░░░░░  37%                  │
│                                          │
│  [fase 0][fase 1][fase 2]...            │  ← mini timeline (iconos)
│                                          │
│  Siguiente: Aprobar Problem Statement    │
│                                          │
│  Hace 2 dias          [Continuar →]     │
└─────────────────────────────────────────┘
```

**Estados de fase en mini timeline:**
- Completada: icono check, color verde (`text-green-600`)
- Activa: icono play, color primario (`text-violet-600`), animacion pulse
- Bloqueada: icono lock, color gris (`text-gray-300`)

### Componente: ProjectCard — Estado Expandido

Al hacer click en el icono expand, la tarjeta crece verticalmente mostrando:

```
┌─────────────────────────────────────────┐
│  ... (contenido base de la tarjeta)      │
│                                          │
│  ─────── Timeline completo ───────────  │
│  ✓ Phase 00  Discovery          Aprobada │
│  ▶ Phase 01  Requirements       Activa  │
│  🔒 Phase 02  Architecture      Bloqueada│
│  🔒 Phase 03  Environment Setup  Bloqueada│
│  🔒 Phase 04  Core Development   Bloqueada│
│  🔒 Phase 05  Testing & QA       Bloqueada│
│  🔒 Phase 06  Launch             Bloqueada│
│  🔒 Phase 07  Iteration          Bloqueada│
└─────────────────────────────────────────┘
```

### Modal: Crear Proyecto

```
┌─────────────────────────────────────────┐
│  Nuevo proyecto                    [×]  │
│                                          │
│  Nombre *                                │
│  ┌─────────────────────────────────┐    │
│  │ Mi plataforma de delivery       │    │
│  └─────────────────────────────────┘    │
│                                          │
│  Descripcion (opcional)                  │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                          │
│  Industria                               │
│  ┌─────────────────────────────────┐    │
│  │ Foodtech                      ▼ │    │
│  └─────────────────────────────────┘    │
│                                          │
│  [Cancelar]         [Crear proyecto →]  │
└─────────────────────────────────────────┘
```

---

## Rutas

```
/dashboard                    → vista principal (proyectos activos)
/dashboard?tab=archived       → vista de archivados
/dashboard?search=query       → busqueda persistida en URL
/projects/new                 → alternativa URL para crear (redirige a /dashboard con modal abierto)
/projects/:id                 → redirige a /projects/:id/phase/:current_phase
```

---

## API Design

### `GET /api/projects`
Retorna proyectos del usuario autenticado con progreso calculado.

**Query params:** `status=active|archived` (default: `active`)

**Response 200:**
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "Mi App de Delivery",
      "description": "Conecta restaurantes...",
      "industry": "foodtech",
      "status": "active",
      "current_phase": 1,
      "active_phase": 1,
      "phases_completed": 1,
      "progress_percentage": 12,
      "next_action": "Aprueba el spec de Auth & Onboarding",
      "last_activity": "2026-03-04T10:30:00Z"
    }
  ],
  "summary": {
    "total_active": 2,
    "phases_completed_this_week": 3
  }
}
```

### `POST /api/projects`
Crea un nuevo proyecto e inicializa sus 8 fases (via trigger en DB).

**Request:**
```json
{
  "name": "Mi App de Delivery",
  "description": "Descripcion opcional",
  "industry": "foodtech"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "name": "Mi App de Delivery",
  "current_phase": 0
}
```

**Response 400:** `{ "error": "El nombre del proyecto es requerido", "code": "MISSING_NAME" }`
**Response 403:** `{ "error": "Has alcanzado el limite de proyectos de tu plan", "code": "PLAN_LIMIT_REACHED" }`

### `PATCH /api/projects/:id`
Actualiza nombre, descripcion o estado (archivar/restaurar).

**Request:** `{ "name": "Nuevo nombre" }` | `{ "status": "archived" }`
**Response 200:** proyecto actualizado

### `GET /api/projects/:id/phases`
Retorna el estado de las 8 fases de un proyecto.

**Response 200:**
```json
{
  "phases": [
    { "phase_number": 0, "name": "Discovery & Ideation", "status": "completed", "completed_at": "..." },
    { "phase_number": 1, "name": "Requirements & Spec", "status": "active", "started_at": "..." },
    { "phase_number": 2, "name": "Architecture & Design", "status": "locked" },
    ...
  ]
}
```

---

## Arquitectura de Componentes

```
src/app/(dashboard)/dashboard/
├── page.tsx                        ← Server Component (fetcha proyectos en servidor)
├── loading.tsx                     ← Skeleton loader
└── error.tsx                       ← Error boundary

src/components/dashboard/
├── DashboardHeader.tsx             ← Stats bar + CTA "Nuevo proyecto" (client)
├── ProjectsGrid.tsx                ← Grid container con search/filter (client)
├── ProjectCard.tsx                 ← Tarjeta individual de proyecto (client)
├── ProjectCardExpanded.tsx         ← Timeline expandido dentro de la tarjeta
├── CreateProjectModal.tsx          ← Modal de creacion con formulario (client)
├── EditProjectModal.tsx            ← Modal de edicion inline (client)
├── ArchiveConfirmDialog.tsx        ← Dialogo de confirmacion de archivo (client)
├── PhaseTimeline.tsx               ← Timeline visual de 8 fases (reutilizable)
├── ProgressBar.tsx                 ← Barra de progreso con porcentaje
├── IndustryTag.tsx                 ← Tag de industria con color
└── EmptyState.tsx                  ← Estado vacio con ilustracion y CTA
```

**Patron de data fetching:**
- `dashboard/page.tsx` (Server Component) hace el fetch inicial de proyectos con `createServerClient` de Supabase — los datos llegan pre-renderizados
- `ProjectsGrid` (Client Component) recibe los proyectos como props y maneja busqueda/filtros en memoria (no re-fetch)
- Mutaciones (crear, archivar, editar) usan Route Handlers y actualizan el estado local del Client Component con `useOptimistic` de React para feedback instantaneo

---

## Architecture Decisions

### SSR para el dashboard inicial
Los proyectos se cargan en el Server Component para evitar loading states y mejorar el LCP. La busqueda y filtros operan sobre los datos ya en memoria — no se hacen peticiones adicionales al servidor al filtrar.

### `useOptimistic` para mutaciones
Al archivar o editar un proyecto, la UI se actualiza inmediatamente (optimistic update) mientras la peticion al servidor se procesa en background. Si falla, se revierte con un toast de error.

### Trigger en DB para inicializar fases
Las 8 filas de `project_phases` se crean via trigger en PostgreSQL al insertar un proyecto — garantiza consistencia incluso si la API falla despues de crear el proyecto.

### Progreso calculado en el servidor
El `progress_percentage` se calcula en la query SQL, no en el cliente — unica fuente de verdad y sin logica duplicada.

---

## Dependencies

- Hereda todas las dependencias de Feature 01 (Supabase, RHF, Zod)
- `@radix-ui/react-dialog` — modals (via shadcn/ui)
- `@radix-ui/react-tabs` — tabs Activos/Archivados (via shadcn/ui)
- `@radix-ui/react-dropdown-menu` — menu de opciones de tarjeta (via shadcn/ui)
- `react` 19 `useOptimistic` — feedback optimista en mutaciones
