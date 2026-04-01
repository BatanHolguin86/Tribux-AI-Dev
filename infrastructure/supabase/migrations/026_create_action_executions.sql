-- Action execution tracking for automated phase actions
CREATE TABLE action_executions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_number    integer NOT NULL,
  section         text NOT NULL,
  item_index      integer NOT NULL,
  action_name     text NOT NULL,
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','running','success','failed')),
  result_summary  text,
  result_data     jsonb,
  error_message   text,
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE action_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own action executions"
  ON action_executions FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE INDEX idx_action_executions_project
  ON action_executions(project_id, phase_number);
