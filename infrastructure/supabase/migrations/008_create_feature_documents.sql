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
