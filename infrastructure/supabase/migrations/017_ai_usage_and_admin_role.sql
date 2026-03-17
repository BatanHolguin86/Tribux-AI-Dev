-- 017_ai_usage_and_admin_role.sql
-- Tabla de eventos de uso de IA por usuario/proyecto para control financiero y backoffice.
-- Rol de administrador financiero en user_profiles para acceso al backoffice.

-- Rol de usuario (para control de acceso al backoffice)
alter table user_profiles
  add column if not exists role text not null default 'user'
    check (role in ('user', 'financial_admin', 'super_admin'));

comment on column user_profiles.role is 'user: cliente; financial_admin: backoffice costos; super_admin: acceso total';

-- Tabla de eventos de uso de IA (costes por cliente)
create table if not exists ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  event_type text not null,
  model text,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  estimated_cost_usd numeric(12, 6) not null default 0,
  created_at timestamptz default now()
);

comment on table ai_usage_events is 'Registro de uso de IA por usuario/proyecto para control financiero y precios enterprise';
comment on column ai_usage_events.event_type is 'agent_chat, phase00_chat, phase00_generate, phase01_chat, phase01_generate, phase02_chat, phase02_generate, design_generate, design_refine, thread_title, suggestions';

create index if not exists idx_ai_usage_events_user_id on ai_usage_events(user_id);
create index if not exists idx_ai_usage_events_created_at on ai_usage_events(created_at);
create index if not exists idx_ai_usage_events_user_created on ai_usage_events(user_id, created_at desc);
create index if not exists idx_ai_usage_events_project_id on ai_usage_events(project_id) where project_id is not null;

alter table ai_usage_events enable row level security;

-- Solo financial_admin y super_admin pueden leer toda la tabla (via service role o policy con role)
create policy "Financial admins can read all ai_usage_events"
  on ai_usage_events for select
  using (
    exists (
      select 1 from user_profiles up
      where up.id = auth.uid()
      and up.role in ('financial_admin', 'super_admin')
    )
  );

-- La API inserta en nombre del usuario autenticado (user_id = auth.uid())
create policy "Users can insert own usage via API"
  on ai_usage_events for insert
  with check (auth.uid() = user_id);

-- Permiso para que financial_admin pueda leer todos los perfiles (listado de clientes en backoffice)
create policy "Financial admins can read all user_profiles"
  on user_profiles for select
  using (
    exists (
      select 1 from user_profiles up
      where up.id = auth.uid()
      and up.role in ('financial_admin', 'super_admin')
    )
  );

-- Para dar acceso al backoffice a un usuario, ejecutar (reemplazar USER_ID por el uuid del usuario):
-- update user_profiles set role = 'financial_admin' where id = 'USER_ID';
