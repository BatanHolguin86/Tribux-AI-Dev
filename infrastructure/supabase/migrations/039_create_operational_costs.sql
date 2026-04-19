-- 039: Operational costs managed by admin from backoffice
-- Replaces env vars (COST_SUPABASE_MONTHLY, etc.) with DB-managed values

CREATE TABLE IF NOT EXISTS operational_costs (
  id          text PRIMARY KEY,  -- 'supabase', 'vercel', 'domain', etc.
  label       text NOT NULL,
  description text,
  monthly_usd numeric(10,2) NOT NULL DEFAULT 0,
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE operational_costs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins manage operational costs') THEN
    CREATE POLICY "Admins manage operational costs"
      ON operational_costs FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role IN ('financial_admin', 'super_admin')
        )
      );
  END IF;
END $$;

-- Seed with common services (all $0 by default)
INSERT INTO operational_costs (id, label, description, monthly_usd) VALUES
  ('supabase', 'Supabase', 'Base de datos, auth y storage', 0),
  ('vercel', 'Vercel', 'Hosting y deploy', 0),
  ('domain', 'Dominio', 'Registro de dominio', 0),
  ('sentry', 'Sentry', 'Monitoreo de errores', 0),
  ('resend', 'Resend', 'Emails transaccionales', 0),
  ('anthropic_platform', 'Anthropic', 'Cuota fija plataforma IA', 0)
ON CONFLICT (id) DO NOTHING;
