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
