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
