-- Add GitHub repository URL field to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS repo_url text;

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_projects_repo_url ON projects (repo_url) WHERE repo_url IS NOT NULL;
