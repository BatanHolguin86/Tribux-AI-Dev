-- 003_create_project_phases.sql

create table project_phases (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  phase_number    integer not null check (phase_number between 0 and 7),
  status          text not null default 'locked'
                  check (status in ('locked', 'active', 'completed')),
  started_at      timestamptz,
  completed_at    timestamptz,
  approved_at     timestamptz,
  approved_by     uuid references auth.users(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(project_id, phase_number)
);

alter table project_phases enable row level security;

create policy "Users can manage phases of own projects"
  on project_phases for all
  using (project_id in (select id from projects where user_id = auth.uid()));

-- Trigger: initialize 8 phases when project is created
create or replace function initialize_project_phases()
returns trigger as $$
declare
  i integer;
begin
  for i in 0..7 loop
    insert into project_phases (project_id, phase_number, status, started_at)
    values (
      new.id,
      i,
      case when i = 0 then 'active' else 'locked' end,
      case when i = 0 then now() else null end
    );
  end loop;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_project_created
  after insert on projects
  for each row execute procedure initialize_project_phases();
