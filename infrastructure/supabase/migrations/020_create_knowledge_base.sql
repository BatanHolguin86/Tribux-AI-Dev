-- 020_create_knowledge_base.sql
-- Knowledge base entries for project documentation library

create table knowledge_base_entries (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  category        text not null
                  check (category in ('documentos', 'decisiones', 'guias', 'artefactos', 'notas')),
  title           text not null,
  summary         text,
  content         text,
  source_type     text
                  check (source_type in ('project_document', 'feature_document', 'design_artifact') or source_type is null),
  source_id       uuid,
  phase_number    integer,
  tags            text[] default '{}',
  is_pinned       boolean default false,
  search_vector   tsvector,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table knowledge_base_entries enable row level security;

create policy "Users can manage own KB entries"
  on knowledge_base_entries for all
  using (project_id in (select id from projects where user_id = auth.uid()));

-- Indexes
create index idx_kb_project_category on knowledge_base_entries(project_id, category);
create index idx_kb_project_pinned on knowledge_base_entries(project_id, is_pinned desc, updated_at desc);
create index idx_kb_source on knowledge_base_entries(source_type, source_id);
create index idx_kb_search on knowledge_base_entries using gin(search_vector);

-- Unique constraint: one KB entry per source document
create unique index idx_kb_source_unique on knowledge_base_entries(source_type, source_id) where source_type is not null;

-- Auto-update search_vector on insert/update
create or replace function kb_update_search_vector()
returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('spanish', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(new.summary, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(new.content, '')), 'C');
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_kb_search_vector
  before insert or update of title, summary, content
  on knowledge_base_entries
  for each row execute function kb_update_search_vector();

-- Auto-index project_documents when approved
create or replace function kb_auto_index_project_document()
returns trigger as $$
begin
  if new.status = 'approved' and (old.status is null or old.status <> 'approved') then
    insert into knowledge_base_entries (
      project_id, category, title, summary, content,
      source_type, source_id, phase_number
    )
    values (
      new.project_id,
      case
        when new.section in ('architecture_decisions') then 'decisiones'
        when new.section in ('system_architecture', 'database_design', 'api_design') then 'guias'
        else 'documentos'
      end,
      coalesce(new.section, 'documento'),
      left(new.content, 200),
      new.content,
      'project_document',
      new.id,
      new.phase_number
    )
    on conflict (source_type, source_id) where source_type is not null
    do update set content = excluded.content, summary = excluded.summary;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_kb_auto_index_project_doc
  after insert or update of status
  on project_documents
  for each row execute function kb_auto_index_project_document();

-- Auto-index feature_documents when approved
create or replace function kb_auto_index_feature_document()
returns trigger as $$
begin
  if new.status = 'approved' and (old.status is null or old.status <> 'approved') then
    insert into knowledge_base_entries (
      project_id, category, title, summary, content,
      source_type, source_id, phase_number
    )
    values (
      new.project_id,
      case
        when new.document_type = 'design' then 'guias'
        when new.document_type = 'tasks' then 'documentos'
        else 'documentos'
      end,
      new.document_type || ' — ' || coalesce(
        (select name from project_features where id = new.feature_id),
        'Feature'
      ),
      left(new.content, 200),
      new.content,
      'feature_document',
      new.id,
      1
    )
    on conflict (source_type, source_id) where source_type is not null
    do update set content = excluded.content, summary = excluded.summary;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_kb_auto_index_feature_doc
  after insert or update of status
  on feature_documents
  for each row execute function kb_auto_index_feature_document();
