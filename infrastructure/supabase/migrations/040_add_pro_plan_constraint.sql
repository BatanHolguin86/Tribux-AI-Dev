-- 040: Add 'pro' to plan CHECK constraint
-- The Pro plan ($299/mes) was missing from the allowed values

ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_plan_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_plan_check
  CHECK (plan IN ('starter', 'builder', 'pro', 'agency', 'enterprise'));
