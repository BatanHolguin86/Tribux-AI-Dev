-- 031: External design tool integration (Figma, V0, Lovable)

-- Extend design_artifacts for external sources
ALTER TABLE design_artifacts
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'internal';

-- Add check constraint (separate statement for IF NOT EXISTS compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'design_artifacts_source_check'
  ) THEN
    ALTER TABLE design_artifacts
      ADD CONSTRAINT design_artifacts_source_check
      CHECK (source IN ('internal', 'figma', 'v0', 'lovable'));
  END IF;
END $$;

ALTER TABLE design_artifacts
  ADD COLUMN IF NOT EXISTS external_url text;

ALTER TABLE design_artifacts
  ADD COLUMN IF NOT EXISTS external_id text;

CREATE INDEX IF NOT EXISTS idx_design_artifacts_source
  ON design_artifacts(project_id, source);

-- Add integration tokens to projects (consistent with supabase_access_token pattern)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS figma_token text;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS v0_api_key text;
