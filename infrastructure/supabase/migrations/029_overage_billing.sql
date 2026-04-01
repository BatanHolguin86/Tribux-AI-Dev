-- Solution 3: Metered Overage Billing
-- Tracks monthly AI overage charges per user and Stripe billing status.

-- 1. Add overage multiplier to plan_cost_targets
--    e.g. 1.50 = we charge 1.5× the raw AI cost for usage above budget
ALTER TABLE plan_cost_targets
  ADD COLUMN IF NOT EXISTS overage_multiplier numeric(4,2) NOT NULL DEFAULT 1.50;

UPDATE plan_cost_targets SET overage_multiplier = 1.50;

-- 2. Overage ledger: one row per user per month when they exceed their budget
CREATE TABLE overage_ledger (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month                 text NOT NULL,           -- YYYY-MM
  plan                  text NOT NULL,
  budget_usd            numeric(10,4) NOT NULL,
  used_usd              numeric(10,4) NOT NULL,
  overage_usd           numeric(10,4) NOT NULL,  -- used_usd - budget_usd
  overage_multiplier    numeric(4,2)  NOT NULL DEFAULT 1.50,
  charge_usd            numeric(10,4) NOT NULL,  -- overage_usd * overage_multiplier
  stripe_invoice_item_id text,
  stripe_invoice_id     text,
  status                text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'billed', 'waived', 'error')),
  error_message         text,
  billed_at             timestamptz,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),

  -- One record per user per month
  UNIQUE (user_id, month)
);

ALTER TABLE overage_ledger ENABLE ROW LEVEL SECURITY;

-- Only financial and super admins can manage the ledger
CREATE POLICY "Financial admins manage overage ledger"
  ON overage_ledger FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('financial_admin', 'super_admin')
    )
  );

CREATE INDEX idx_overage_ledger_user_month ON overage_ledger(user_id, month);
CREATE INDEX idx_overage_ledger_status     ON overage_ledger(status, month);
