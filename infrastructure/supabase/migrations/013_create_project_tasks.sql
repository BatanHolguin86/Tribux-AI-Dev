-- 013_create_project_tasks.sql
-- Tasks extracted from KIRO specs for Phase 04 Kanban board

create table project_tasks (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  feature_id      uuid references project_features(id) on delete set null,
  task_key        text not null,          -- TASK-001, TASK-002, etc.
  title           text not null,
  category        text,                   -- Setup, Backend, Frontend, Tests, etc.
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

create index idx_tasks_project_status on project_tasks(project_id, status);
create index idx_tasks_project_feature on project_tasks(project_id, feature_id);

create trigger set_updated_at before update on project_tasks
  for each row execute procedure update_updated_at();
