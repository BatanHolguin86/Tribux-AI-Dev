# Design: Auth & Onboarding

**Feature:** 01 — Auth & Onboarding
**Fase IA DLC:** Phase 01 — Requirements & Spec
**Fecha:** 2026-03-05
**Status:** Pendiente aprobacion CEO/CPO

---

## Overview

Implementar autenticacion completa (email + Google OAuth) usando Supabase Auth, y un flujo de onboarding de 4 pasos que introduce al usuario a la metodologia IA DLC, captura su perfil y crea su primer proyecto. El usuario termina el onboarding aterrizado en Phase 00 de su primer proyecto.

---

## Data Model

### Tabla: `user_profiles` (Supabase)

```sql
create table user_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  persona     text check (persona in ('founder', 'pm', 'consultor', 'emprendedor')),
  onboarding_completed boolean default false,
  onboarding_step      integer default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- RLS: el usuario solo puede leer y editar su propio perfil
alter table user_profiles enable row level security;

create policy "Users can view own profile"
  on user_profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on user_profiles for update
  using (auth.uid() = id);
```

### Tabla: `projects`

```sql
create table projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  industry    text,
  current_phase integer default 0,
  status      text default 'active' check (status in ('active', 'paused', 'completed')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- RLS: el usuario solo puede ver y editar sus propios proyectos
alter table projects enable row level security;

create policy "Users can manage own projects"
  on projects for all
  using (auth.uid() = user_id);
```

### Trigger: auto-crear user_profile al registrarse

```sql
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

---

## UI/UX Flow

### Rutas

```
/                    → redirect a /login si no autenticado, /dashboard si autenticado
/login               → formulario login + OAuth
/register            → formulario registro + OAuth
/auth/callback       → callback OAuth de Supabase
/forgot-password     → solicitar reset de contrasena
/auth/reset-password → formulario nueva contrasena (desde link de email)
/onboarding          → flujo de 4 pasos (solo usuarios nuevos)
/dashboard           → destino final post-onboarding
```

### Flujo de Registro → Onboarding → Dashboard

```
[/register]
    │
    ├─ Email + Password ──→ Email de confirmacion ──→ [/login]
    │
    └─ Google OAuth ──→ [/auth/callback] ──→ [/onboarding]
                                                    │
                                        ┌───────────┴───────────────┐
                                        │   ONBOARDING (4 pasos)    │
                                        │                           │
                                        │  Paso 1: Bienvenida       │
                                        │  "Que es AI Squad"        │
                                        │  + vision rapida IA DLC   │
                                        │                           │
                                        │  Paso 2: Tu perfil        │
                                        │  Seleccionar persona:     │
                                        │  Founder / PM /           │
                                        │  Consultor / Emprendedor  │
                                        │                           │
                                        │  Paso 3: Tu primer        │
                                        │  proyecto                 │
                                        │  Nombre + descripcion     │
                                        │  + industria              │
                                        │                           │
                                        │  Paso 4: El camino        │
                                        │  Timeline visual de       │
                                        │  las 8 fases IA DLC       │
                                        │  "Empezamos por Phase 00" │
                                        └───────────┬───────────────┘
                                                    │
                                            [/projects/:id/phase/00]
```

### Componentes UI

**Paginas de Auth** (`/login`, `/register`)
- Layout dividido: lado izquierdo con valor prop de AI Squad, lado derecho con formulario
- Formulario con React Hook Form + validacion Zod
- Boton Google OAuth prominente, separador visual "o continua con"
- Links de navegacion entre login/register y forgot-password
- Estados de loading, error y success claros

**Onboarding** (`/onboarding`)
- Barra de progreso en la parte superior (Paso X de 4)
- Navegacion Atras / Siguiente / Omitir
- Paso 2: cards de seleccion de persona con icono, titulo y descripcion de 1 linea
- Paso 3: formulario minimal — solo nombre es requerido
- Paso 4: timeline horizontal animado de las 8 fases con iconos y nombres

---

## Architecture Decisions

### Supabase Auth (no custom auth)
Supabase maneja tokens JWT, refresh tokens, OAuth flows y email templates. Evita implementar auth desde cero — reduce superficie de ataque y tiempo de desarrollo.

### Server Components para rutas protegidas
La verificacion de sesion se hace en el servidor con `createServerClient` de Supabase. Evita flash de contenido no autenticado y mejora SEO.

### Middleware de Next.js para proteccion de rutas
`middleware.ts` intercepta todas las requests, verifica el token y redirige segun estado de auth. Unico punto de control, facil de mantener.

### Onboarding state en DB (no localStorage)
El progreso del onboarding se persiste en `user_profiles.onboarding_step` — si el usuario cierra el browser a mitad, retoma donde lo dejo. Consistente entre dispositivos.

---

## API Design

Los endpoints de auth los maneja Supabase directamente via su SDK. Los endpoints propios son:

### `POST /api/onboarding/complete`
Marca el onboarding como completado y guarda perfil + primer proyecto.

**Request:**
```json
{
  "persona": "emprendedor",
  "project": {
    "name": "Mi App de Delivery",
    "description": "Conecta restaurantes locales con clientes en zonas rurales",
    "industry": "foodtech"
  }
}
```

**Response 200:**
```json
{
  "profile": { "persona": "emprendedor", "onboarding_completed": true },
  "project": { "id": "uuid", "name": "Mi App de Delivery", "current_phase": 0 }
}
```

**Response 400:**
```json
{ "error": "El nombre del proyecto es requerido", "code": "MISSING_PROJECT_NAME" }
```

### `PATCH /api/onboarding/step`
Actualiza el paso actual del onboarding (para persistencia mid-flow).

**Request:** `{ "step": 2 }`
**Response 200:** `{ "onboarding_step": 2 }`

---

## Dependencies

- `@supabase/ssr` — cliente Supabase para Next.js App Router (server + client)
- `@supabase/supabase-js` — SDK base de Supabase
- `react-hook-form` — manejo de formularios
- `zod` — validacion de schemas
- `@hookform/resolvers` — integracion RHF + Zod
- Resend — emails transaccionales (confirmacion, reset password) via Supabase email templates
