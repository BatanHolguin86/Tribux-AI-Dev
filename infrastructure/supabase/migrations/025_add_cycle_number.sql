-- Add cycle number to projects for IA DLC cycle tracking
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cycle_number integer NOT NULL DEFAULT 1;
