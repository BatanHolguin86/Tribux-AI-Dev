-- Add Stripe customer ID to user profiles for portal/subscription management
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer
  ON user_profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
