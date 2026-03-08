# Database Schema — AI Squad Command Center

**Phase:** 02 — Architecture & Design
**Fecha:** 2026-03-08
**Status:** Pendiente aprobacion CEO/CPO

---

## Entity Relationship Diagram

```
                        ┌──────────────────┐
                        │   auth.users     │
                        │   (Supabase)     │
                        │                  │
                        │  id (uuid) PK    │
                        │  email           │
                        │  raw_user_meta   │
                        └────────┬─────────┘
                                 │
                    ┌────────────┼────────────┐
                    │ 1:1        │ 1:N        │
                    ▼            │             │
         ┌──────────────────┐   │   ┌──────────────────────┐
         │  user_profiles   │   │   │      projects        │
         │                  │   │   │                      │
         │  id (FK) PK      │   │   │  id (uuid) PK       │
         │  full_name       │   │   │  user_id (FK)        │
         │  persona         │   │   │  name                │
         │  onboarding_*    │   │   │  description         │
         └──────────────────┘   │   │  industry            │
                                │   │  current_phase       │
                                │   │  status              │
                                │   │  last_activity       │
                                │   └────────┬─────────────┘
                                │            │
                    ┌───────────┼────────────┼────────────────────────┐
                    │           │            │                        │
                    ▼           │            ▼                        ▼
      ┌──────────────────┐     │  ┌──────────────────┐  ┌────────────────────────┐
      │ project_phases   │     │  │ phase_sections   │  │  project_features      │
      │                  │     │  │                  │  │                        │
      │  id PK           │     │  │  id PK           │  │  id PK                │
      │  project_id (FK) │     │  │  project_id (FK) │  │  project_id (FK)      │
      │  phase_number    │     │  │  phase_number    │  │  name                 │
      │  status          │     │  │  section         │  │  description          │
      │  started_at      │     │  │  status          │  │  display_order        │
      │  completed_at    │     │  │  approved_at     │  │  status               │
      │  approved_at     │     │  └──────────────────┘  │  suggested_by         │
      └──────────────────┘     │                        └──────────┬─────────────┘
                               │                                   │
                               │                                   │ 1:N
                               │                                   ▼
                               │                        ┌────────────────────────┐
                               │                        │  feature_documents     │
                               │                        │                        │
                               │                        │  id PK                │
                               │                        │  feature_id (FK)      │
                               │                        │  project_id (FK)      │
                               │                        │  document_type        │
                               │                        │  storage_path         │
                               │                        │  content (cache)      │
                               │                        │  version              │
                               │                        │  status               │
                               │                        └────────────────────────┘
                               │
                    ┌──────────┼──────────────────────┐
                    │          │                      │
                    ▼          ▼                      ▼
      ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────────┐
      │ agent_           │  │ project_         │  │ conversation_threads   │
      │ conversations    │  │ documents        │  │                        │
      │                  │  │                  │  │  id PK                │
      │  id PK           │  │  id PK           │  │  project_id (FK)      │
      │  project_id (FK) │  │  project_id (FK) │  │  agent_type           │
      │  phase_number    │  │  phase_number    │  │  title                │
      │  section         │  │  section         │  │  messages (JSONB)     │
      │  agent_type      │  │  document_type   │  │  message_count        │
      │  messages (JSONB)│  │  storage_path    │  │  last_message_at      │
      └──────────────────┘  │  content (cache) │  └────────────────────────┘
                            │  version         │
                            │  status          │
                            └──────────────────┘

                            ┌────────────────────────┐
                            │  design_artifacts      │
                            │                        │
                            │  id PK                │
                            │  project_id (FK)      │
                            │  type                 │
                            │  screen_name          │
                            │  flow_name            │
                            │  storage_path         │
                            │  mime_type            │
                            │  status               │
                            │  prompt_used          │
                            └────────────────────────┘
```

---

## Tablas Completas con DDL

### Migration 001: `user_profiles`

```sql
-- 001_create_user_profiles.sql

create table user_profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  full_name             text,
  persona               text check (persona in ('founder', 'pm', 'consultor', 'emprendedor')),
  plan                  text not null default 'starter'
                        check (plan in ('starter', 'builder', 'agency', 'enterprise')),
  onboarding_completed  boolean default false,
  onboarding_step       integer default 0,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

alter table user_profiles enable row level security;

create policy "Users can view own profile"
  on user_profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on user_profiles for update using (auth.uid() = id);

-- Trigger: auto-create profile on signup
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

### Migration 002: `projects`

```sql
-- 002_create_projects.sql

create table projects (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  description     text,
  industry        text,
  current_phase   integer default 0,
  status          text default 'active'
                  check (status in ('active', 'paused', 'archived', 'completed')),
  last_activity   timestamptz default now(),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table projects enable row level security;

create policy "Users can manage own projects"
  on projects for all using (auth.uid() = user_id);

create index idx_projects_user_status on projects(user_id, status);
create index idx_projects_user_activity on projects(user_id, last_activity desc);
```

### Migration 003: `project_phases`

```sql
-- 003_create_project_phases.sql

create table project_phases (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  phase_number    integer not null check (phase_number between 0 and 7),
  status          text not null default 'locked'
                  check (status in ('locked', 'active', 'completed')),
  started_at      timestamptz,
  completed_at    timestamptz,
  approved_at     timestamptz,
  approved_by     uuid references auth.users(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(project_id, phase_number)
);

alter table project_phases enable row level security;

create policy "Users can manage phases of own projects"
  on project_phases for all
  using (project_id in (select id from projects where user_id = auth.uid()));

-- Trigger: initialize 8 phases when project is created
create or replace function initialize_project_phases()
returns trigger as $$
declare
  i integer;
begin
  for i in 0..7 loop
    insert into project_phases (project_id, phase_number, status, started_at)
    values (
      new.id,
      i,
      case when i = 0 then 'active' else 'locked' end,
      case when i = 0 then now() else null end
    );
  end loop;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_project_created
  after insert on projects
  for each row execute procedure initialize_project_phases();
```

### Migration 004: `phase_sections`

```sql
-- 004_create_phase_sections.sql

create table phase_sections (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  phase_number    integer not null,
  section         text not null,
  status          text not null default 'pending'
                  check (status in ('pending', 'in_progress', 'completed', 'approved')),
  approved_at     timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(project_id, phase_number, section)
);

alter table phase_sections enable row level security;

create policy "Users can manage own phase sections"
  on phase_sections for all
  using (project_id in (select id from projects where user_id = auth.uid()));

create index idx_phase_sections_project_phase
  on phase_sections(project_id, phase_number);
```

### Migration 005: `agent_conversations`

```sql
-- 005_create_agent_conversations.sql

create table agent_conversations (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  phase_number    integer,                    -- null for free agent chats
  section         text,                       -- null for free agent chats
  agent_type      text not null default 'orchestrator',
  messages        jsonb not null default '[]', -- [{role, content, created_at}]
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(project_id, phase_number, section, agent_type)
);

alter table agent_conversations enable row level security;

create policy "Users can manage own conversations"
  on agent_conversations for all
  using (project_id in (select id from projects where user_id = auth.uid()));

create index idx_conversations_project_phase
  on agent_conversations(project_id, phase_number, section);
```

### Migration 006: `project_documents`

```sql
-- 006_create_project_documents.sql

create table project_documents (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  phase_number    integer,                    -- null for artifacts
  section         text,
  document_type   text not null,              -- 'brief' | 'personas' | ... | 'artifact'
  storage_path    text not null,
  content         text,                       -- cache for fast reads (< 50KB)
  version         integer not null default 1,
  status          text not null default 'draft'
                  check (status in ('draft', 'approved')),
  approved_at     timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table project_documents enable row level security;

create policy "Users can manage own documents"
  on project_documents for all
  using (project_id in (select id from projects where user_id = auth.uid()));

create index idx_documents_project_phase
  on project_documents(project_id, phase_number, document_type);
```

### Migration 007: `project_features`

```sql
-- 007_create_project_features.sql

create table project_features (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  name            text not null,
  description     text,
  display_order   integer not null default 0,
  status          text not null default 'pending'
                  check (status in ('pending', 'in_progress', 'spec_complete', 'approved')),
  suggested_by    text not null default 'orchestrator'
                  check (suggested_by in ('orchestrator', 'user')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(project_id, name)
);

alter table project_features enable row level security;

create policy "Users can manage own features"
  on project_features for all
  using (project_id in (select id from projects where user_id = auth.uid()));

create index idx_features_project_order
  on project_features(project_id, display_order);
```

### Migration 008: `feature_documents`

```sql
-- 008_create_feature_documents.sql

create table feature_documents (
  id              uuid primary key default gen_random_uuid(),
  feature_id      uuid not null references project_features(id) on delete cascade,
  project_id      uuid not null references projects(id) on delete cascade,
  document_type   text not null
                  check (document_type in ('requirements', 'design', 'tasks')),
  storage_path    text not null,
  content         text,                       -- cache
  version         integer not null default 1,
  status          text not null default 'draft'
                  check (status in ('draft', 'approved')),
  approved_at     timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(feature_id, document_type)
);

alter table feature_documents enable row level security;

create policy "Users can manage own feature documents"
  on feature_documents for all
  using (project_id in (select id from projects where user_id = auth.uid()));
```

### Migration 009: `conversation_threads`

```sql
-- 009_create_conversation_threads.sql

create table conversation_threads (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  agent_type      text not null,
  title           text,                       -- auto-generated from first message
  messages        jsonb not null default '[]',
  message_count   integer not null default 0,
  last_message_at timestamptz default now(),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table conversation_threads enable row level security;

create policy "Users can manage own threads"
  on conversation_threads for all
  using (project_id in (select id from projects where user_id = auth.uid()));

create index idx_threads_project_agent
  on conversation_threads(project_id, agent_type, last_message_at desc);
```

### Migration 010: `design_artifacts`

```sql
-- 010_create_design_artifacts.sql

create table design_artifacts (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  type            text not null
                  check (type in ('wireframe', 'mockup_lowfi', 'mockup_highfi')),
  screen_name     text not null,
  flow_name       text,
  storage_path    text not null,
  mime_type       text default 'image/png',
  status          text default 'draft'
                  check (status in ('generating', 'draft', 'approved')),
  prompt_used     text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table design_artifacts enable row level security;

create policy "Users can manage design artifacts of own projects"
  on design_artifacts for all
  using (
    exists (
      select 1 from projects p
      where p.id = design_artifacts.project_id and p.user_id = auth.uid()
    )
  );

create index idx_design_artifacts_project
  on design_artifacts(project_id);
create index idx_design_artifacts_project_type
  on design_artifacts(project_id, type);
```

### Migration 011: `updated_at` Triggers

```sql
-- 011_create_updated_at_triggers.sql

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to all tables with updated_at
create trigger set_updated_at before update on user_profiles
  for each row execute procedure update_updated_at();
create trigger set_updated_at before update on projects
  for each row execute procedure update_updated_at();
create trigger set_updated_at before update on project_phases
  for each row execute procedure update_updated_at();
create trigger set_updated_at before update on phase_sections
  for each row execute procedure update_updated_at();
create trigger set_updated_at before update on agent_conversations
  for each row execute procedure update_updated_at();
create trigger set_updated_at before update on project_documents
  for each row execute procedure update_updated_at();
create trigger set_updated_at before update on project_features
  for each row execute procedure update_updated_at();
create trigger set_updated_at before update on feature_documents
  for each row execute procedure update_updated_at();
create trigger set_updated_at before update on conversation_threads
  for each row execute procedure update_updated_at();
create trigger set_updated_at before update on design_artifacts
  for each row execute procedure update_updated_at();
```

---

## Supabase Storage — Buckets

| Bucket | Visibilidad | Uso | RLS |
|--------|-------------|-----|-----|
| `project-documents` | Private | Markdown docs (discovery, specs, artifacts) | Via signed URLs del servidor |
| `project-designs` | Private | Wireframes y mockups (PNG/SVG) | Via signed URLs del servidor |

### Estructura de archivos en Storage

```
project-documents/
└── projects/
    └── {project_id}/
        ├── discovery/
        │   ├── brief.md
        │   ├── personas.md
        │   ├── value-proposition.md
        │   ├── metrics.md
        │   └── competitive-analysis.md
        ├── specs/
        │   └── {feature-name}/
        │       ├── requirements.md
        │       ├── design.md
        │       └── tasks.md
        └── artifacts/
            └── {artifact-name}.md

project-designs/
└── {project_id}/
    └── {artifact_id}.{ext}   (png, svg)
```

---

## Resumen de Tablas

| # | Tabla | Migration | Rows estimadas/usuario | Indices |
|---|-------|-----------|----------------------|---------|
| 1 | `user_profiles` | 001 | 1 | PK |
| 2 | `projects` | 002 | 1–5 | user+status, user+activity |
| 3 | `project_phases` | 003 | 8 per project | project+phase (unique) |
| 4 | `phase_sections` | 004 | 5–20 per project | project+phase |
| 5 | `agent_conversations` | 005 | 10–30 per project | project+phase+section |
| 6 | `project_documents` | 006 | 10–30 per project | project+phase+type |
| 7 | `project_features` | 007 | 3–10 per project | project+order |
| 8 | `feature_documents` | 008 | 3 per feature | feature+type (unique) |
| 9 | `conversation_threads` | 009 | 5–20 per project | project+agent+last_msg |
| 10 | `design_artifacts` | 010 | 5–30 per project | project, project+type |
