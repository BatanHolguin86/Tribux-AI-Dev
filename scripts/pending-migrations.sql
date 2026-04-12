-- ============================================================
-- PENDING MIGRATIONS — Tribux
-- ⚠️  Preferir aplicar los archivos numerados en orden desde:
--     infrastructure/supabase/migrations/
--     Este script puede quedar desfasado respecto a esa carpeta.
-- Apply in Supabase Dashboard > SQL Editor (solo si operas sin CLI)
-- ============================================================

-- ============================================================
-- 013: Create project_tasks table (Phase 04 Kanban)
-- ============================================================

create table if not exists project_tasks (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  feature_id      uuid references project_features(id) on delete set null,
  task_key        text not null,
  title           text not null,
  category        text,
  status          text not null default 'todo'
                  check (status in ('todo', 'in_progress', 'review', 'done')),
  display_order   integer not null default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table project_tasks enable row level security;

create policy "Users can manage tasks of own projects"
  on project_tasks for all
  using (project_id in (select id from projects where user_id = auth.uid()));

create index if not exists idx_tasks_project_status on project_tasks(project_id, status);
create index if not exists idx_tasks_project_feature on project_tasks(project_id, feature_id);

create trigger set_updated_at before update on project_tasks
  for each row execute procedure update_updated_at();

-- ============================================================
-- 014: Fix user_profiles RLS (add INSERT + DELETE policies)
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'user_profiles' and policyname = 'Users can insert own profile'
  ) then
    create policy "Users can insert own profile"
      on user_profiles for insert
      with check (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'user_profiles' and policyname = 'Users can delete own profile'
  ) then
    create policy "Users can delete own profile"
      on user_profiles for delete
      using (auth.uid() = id);
  end if;
end $$;

-- ============================================================
-- 021: Per-item checklist state on phase_sections
-- ============================================================

alter table phase_sections
  add column if not exists item_states jsonb not null default '{}'::jsonb;

comment on column phase_sections.item_states is 'Per-item checklist progress: keys are string indices "0","1", values boolean';

-- ============================================================
-- Verification: check all tables have RLS enabled
-- ============================================================

select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'user_profiles', 'projects', 'project_phases', 'phase_sections',
    'agent_conversations', 'project_documents', 'project_features',
    'feature_documents', 'conversation_threads', 'design_artifacts',
    'project_tasks'
  )
order by tablename;
