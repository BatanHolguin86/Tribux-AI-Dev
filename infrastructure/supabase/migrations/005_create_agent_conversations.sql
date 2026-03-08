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
