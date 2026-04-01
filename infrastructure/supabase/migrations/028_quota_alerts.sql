-- Tracks quota alert events to avoid duplicate notifications per month.
-- One row per user × alert_type × month.

CREATE TABLE quota_alerts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type   text NOT NULL CHECK (alert_type IN ('warning_80', 'exceeded_100', 'whale_150')),
  plan         text NOT NULL,
  used_usd     numeric(10,4) NOT NULL,
  budget_usd   numeric(10,4) NOT NULL,
  used_pct     numeric(6,2)  NOT NULL,
  month        text NOT NULL,  -- YYYY-MM
  notified_at  timestamptz DEFAULT now(),

  -- One alert per type per user per month
  UNIQUE (user_id, alert_type, month)
);

ALTER TABLE quota_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Financial admins view quota alerts"
  ON quota_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('financial_admin', 'super_admin')
    )
  );

CREATE INDEX idx_quota_alerts_user_month ON quota_alerts(user_id, month);
CREATE INDEX idx_quota_alerts_type      ON quota_alerts(alert_type, month);
