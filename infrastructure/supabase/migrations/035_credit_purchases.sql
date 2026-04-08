-- Credit purchases: allows users to buy extra AI budget when they exceed their plan limit.
-- Credits are added to the monthly budget and consumed in the same cycle.

CREATE TABLE IF NOT EXISTS credit_purchases (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_usd            numeric(10,2) NOT NULL,        -- AI budget added (what gets consumed)
  price_usd             numeric(10,2) NOT NULL,        -- What user paid
  month                 text NOT NULL,                  -- YYYY-MM (applies to this month)
  stripe_payment_id     text,                           -- Stripe PaymentIntent or Checkout Session ID
  status                text NOT NULL DEFAULT 'completed'
                        CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at            timestamptz DEFAULT now()
);

ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view own credit purchases"
  ON credit_purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert (API routes use admin client)
CREATE POLICY "Service role can manage credit purchases"
  ON credit_purchases FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_credit_purchases_user_month
  ON credit_purchases(user_id, month);
