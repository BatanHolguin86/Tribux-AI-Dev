-- Add Supabase integration fields to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS supabase_project_ref text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS supabase_access_token text;

-- Index for lookup
CREATE INDEX IF NOT EXISTS idx_projects_supabase_ref
  ON projects (supabase_project_ref) WHERE supabase_project_ref IS NOT NULL;
