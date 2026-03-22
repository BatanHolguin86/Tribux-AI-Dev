-- 019_add_design_artifacts_content.sql
-- Add content column to design_artifacts for reliable content storage
-- (Storage bucket may not exist; DB is always available)

alter table design_artifacts add column if not exists content text;
