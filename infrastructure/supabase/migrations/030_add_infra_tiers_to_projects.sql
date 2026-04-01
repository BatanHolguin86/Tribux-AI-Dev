-- 030_add_infra_tiers_to_projects.sql
-- Stores user-configured infrastructure service tiers per project.
-- Used to estimate monthly operating costs (GitHub, Supabase, Vercel, Sentry).
-- This is separate from AI Squad billing — these are costs the user pays to external services.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS infra_tiers jsonb NOT NULL DEFAULT '{}';

COMMENT ON COLUMN projects.infra_tiers IS
  'User-configured infrastructure tiers for cost estimation.
   Keys: github (free|teams|enterprise), supabase (free|pro|teams),
   vercel (hobby|pro|enterprise), sentry (free|team|business).
   Example: {"github":"free","supabase":"pro","vercel":"pro","sentry":"free"}';
