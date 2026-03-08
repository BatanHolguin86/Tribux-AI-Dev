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
