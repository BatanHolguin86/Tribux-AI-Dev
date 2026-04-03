-- 034: Add client_name for project grouping (consultor persona)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_name text;

CREATE INDEX IF NOT EXISTS idx_projects_client_name
  ON projects (user_id, client_name) WHERE client_name IS NOT NULL;
