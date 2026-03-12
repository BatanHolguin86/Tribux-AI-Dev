-- 015_add_conversation_attachments.sql

alter table conversation_threads
  add column if not exists attachments jsonb not null default '[]';

create index if not exists idx_threads_attachments
  on conversation_threads using gin (attachments);

