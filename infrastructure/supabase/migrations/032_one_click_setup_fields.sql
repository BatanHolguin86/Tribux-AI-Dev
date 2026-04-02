-- 032: Add fields for One-Click Setup (Vercel project + Supabase extended)

ALTER TABLE projects ADD COLUMN IF NOT EXISTS vercel_project_id text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS vercel_project_url text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS supabase_api_url text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS supabase_anon_key text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS supabase_db_password text;
