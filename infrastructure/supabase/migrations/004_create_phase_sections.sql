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
