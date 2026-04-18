-- Migration 037: Update plan_cost_targets for new pricing structure
-- Starter $49, Builder $149, new Pro $299

UPDATE plan_cost_targets SET monthly_ai_budget_usd = 14.70, plan_price_usd = 49.00 WHERE plan = 'starter';
UPDATE plan_cost_targets SET monthly_ai_budget_usd = 44.70, plan_price_usd = 149.00 WHERE plan = 'builder';

INSERT INTO plan_cost_targets (plan, monthly_ai_budget_usd, plan_price_usd, target_margin_pct, overage_multiplier)
VALUES ('pro', 89.70, 299.00, 70.00, 1.50)
ON CONFLICT (plan) DO UPDATE SET monthly_ai_budget_usd = 89.70, plan_price_usd = 299.00;
