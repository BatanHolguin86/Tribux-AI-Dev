-- Golden Record: expected AI cost budget per plan per user per month.
-- Target: AI tokens cost <= 30% of plan revenue (70% gross margin goal).
-- Starter  $149 × 30% = $44.70 / Builder $299 × 30% = $89.70 / Agency $699 × 30% = $209.70

CREATE TABLE plan_cost_targets (
  plan                      text PRIMARY KEY,
  monthly_ai_budget_usd     numeric(10,2) NOT NULL,  -- max acceptable AI cost per user/month
  plan_price_usd            numeric(10,2) NOT NULL,  -- current list price
  target_margin_pct         numeric(5,2)  NOT NULL,  -- target gross margin %
  notes                     text,
  updated_at                timestamptz DEFAULT now()
);

INSERT INTO plan_cost_targets (plan, monthly_ai_budget_usd, plan_price_usd, target_margin_pct, notes) VALUES
  ('starter',    44.70,  149.00, 70.00, 'Starter: light usage, 1 project, Phases 00-01'),
  ('builder',    89.70,  299.00, 70.00, 'Builder: 3 projects, full phases, auto-build enabled'),
  ('agency',    209.70,  699.00, 70.00, 'Agency: 10 projects, heavy AI usage expected'),
  ('enterprise',500.00,    0.00, 70.00, 'Enterprise: custom pricing, high estimate');

-- Admin can read/update cost targets (no RLS needed — admin-only table)
ALTER TABLE plan_cost_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Financial admins manage cost targets"
  ON plan_cost_targets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('financial_admin', 'super_admin')
    )
  );
