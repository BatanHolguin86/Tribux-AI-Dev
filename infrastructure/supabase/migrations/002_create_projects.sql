-- 002_create_projects.sql

create table projects (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  description     text,
  industry        text,
  current_phase   integer default 0,
  status          text default 'active'
                  check (status in ('active', 'paused', 'archived', 'completed')),
  last_activity   timestamptz default now(),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table projects enable row level security;

create policy "Users can manage own projects"
  on projects for all using (auth.uid() = user_id);

create index idx_projects_user_status on projects(user_id, status);
create index idx_projects_user_activity on projects(user_id, last_activity desc);
