-- 033: Platform configuration for admin-managed service tokens

CREATE TABLE IF NOT EXISTS platform_config (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider        text NOT NULL UNIQUE CHECK (provider IN ('github', 'supabase', 'vercel')),
  encrypted_token text NOT NULL,
  metadata        jsonb DEFAULT '{}',
  is_connected    boolean DEFAULT false,
  last_tested_at  timestamptz,
  test_result     text,
  updated_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage platform_config"
  ON platform_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin'
    )
  );
