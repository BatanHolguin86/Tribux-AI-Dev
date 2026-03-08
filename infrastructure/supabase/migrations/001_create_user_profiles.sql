-- 001_create_user_profiles.sql

create table user_profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  full_name             text,
  persona               text check (persona in ('founder', 'pm', 'consultor', 'emprendedor')),
  plan                  text not null default 'starter'
                        check (plan in ('starter', 'builder', 'agency', 'enterprise')),
  onboarding_completed  boolean default false,
  onboarding_step       integer default 0,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

alter table user_profiles enable row level security;

create policy "Users can view own profile"
  on user_profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on user_profiles for update using (auth.uid() = id);

-- Trigger: auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
