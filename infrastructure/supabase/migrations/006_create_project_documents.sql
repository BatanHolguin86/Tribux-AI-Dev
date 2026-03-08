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
