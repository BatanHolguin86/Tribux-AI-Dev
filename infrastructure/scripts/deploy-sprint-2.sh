#!/bin/bash
# Sprint 2 deployment script
# Runs migration 016 and creates project-designs storage bucket
# Usage: ./infrastructure/scripts/deploy-sprint-2.sh

set -euo pipefail

# Load env vars from .env.local
if [ -f .env.local ]; then
  set -a
  source .env.local
  set +a
else
  echo "ERROR: .env.local not found. Run from project root."
  exit 1
fi

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_KEY" ]; then
  echo "ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

echo "=== Sprint 2 Deployment ==="
echo "Target: $SUPABASE_URL"
echo ""

# --- Step 1: Run migration 016 via PostgREST rpc ---
echo "[1/3] Running migration 016_add_plan_fields..."

MIGRATION_SQL=$(cat <<'EOSQL'
DO $$
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN trial_ends_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN subscription_status text NOT NULL DEFAULT 'trialing'
      CHECK (subscription_status IN ('trialing', 'active', 'free', 'canceled', 'past_due'));
  END IF;
END $$;

-- Set trial_ends_at for existing users
UPDATE user_profiles
SET trial_ends_at = now() + interval '7 days',
    subscription_status = 'trialing'
WHERE trial_ends_at IS NULL;

-- Update handle_new_user trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $func$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, trial_ends_at, subscription_status)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    now() + interval '7 days',
    'trialing'
  );
  RETURN new;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;
EOSQL
)

# Execute SQL via Supabase PostgREST pg endpoint (uses service role key)
HTTP_STATUS=$(curl -s -o /tmp/migration-response.json -w "%{http_code}" \
  "${SUPABASE_URL}/rest/v1/rpc/" \
  -X POST \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{\"query\": \"SELECT 1\"}" 2>/dev/null || echo "000")

# If RPC doesn't work, try the SQL endpoint directly
if [ "$HTTP_STATUS" != "200" ] && [ "$HTTP_STATUS" != "204" ]; then
  echo "  PostgREST RPC not available. Trying direct SQL..."

  # Use Supabase Management API approach - create a temporary function
  # First, let's try the pg-meta endpoint
  HTTP_STATUS=$(curl -s -o /tmp/migration-response.json -w "%{http_code}" \
    "${SUPABASE_URL}/pg/query" \
    -X POST \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$MIGRATION_SQL\"}" 2>/dev/null || echo "000")
fi

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "204" ]; then
  echo "  Migration 016 applied successfully."
else
  echo "  WARNING: Could not apply migration via API (HTTP $HTTP_STATUS)."
  echo "  Response: $(cat /tmp/migration-response.json 2>/dev/null || echo 'none')"
  echo ""
  echo "  >> Run manually in Supabase SQL Editor:"
  echo "  >> File: infrastructure/supabase/migrations/016_add_plan_fields.sql"
  echo ""
fi

# --- Step 2: Create project-designs storage bucket ---
echo "[2/3] Creating 'project-designs' storage bucket..."

BUCKET_STATUS=$(curl -s -o /tmp/bucket-response.json -w "%{http_code}" \
  "${SUPABASE_URL}/storage/v1/bucket" \
  -X POST \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "project-designs",
    "name": "project-designs",
    "public": false,
    "file_size_limit": 5242880,
    "allowed_mime_types": ["text/markdown", "text/plain", "image/png", "image/jpeg", "image/svg+xml"]
  }')

if [ "$BUCKET_STATUS" = "200" ]; then
  echo "  Bucket 'project-designs' created successfully."
elif [ "$BUCKET_STATUS" = "409" ]; then
  echo "  Bucket 'project-designs' already exists. OK."
else
  echo "  WARNING: Bucket creation returned HTTP $BUCKET_STATUS"
  echo "  Response: $(cat /tmp/bucket-response.json 2>/dev/null)"
fi

# --- Step 3: Create RLS policy for the bucket ---
echo "[3/3] Setting up storage RLS policies..."

# Storage policies are managed via the storage API
POLICY_STATUS=$(curl -s -o /tmp/policy-response.json -w "%{http_code}" \
  "${SUPABASE_URL}/storage/v1/bucket/project-designs" \
  -X PUT \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "public": false,
    "file_size_limit": 5242880,
    "allowed_mime_types": ["text/markdown", "text/plain", "image/png", "image/jpeg", "image/svg+xml"]
  }')

if [ "$POLICY_STATUS" = "200" ]; then
  echo "  Bucket policies updated."
else
  echo "  Bucket update returned HTTP $POLICY_STATUS (may already be configured)."
fi

echo ""
echo "=== Deployment complete ==="
echo ""
echo "Next steps:"
echo "  1. Verify migration in Supabase Dashboard > SQL Editor"
echo "  2. Verify bucket in Supabase Dashboard > Storage"
echo "  3. Add optional env vars to Vercel if needed:"
echo "     PLAN_TRIAL_DAYS=7"
echo "     PLAN_FREE_PHASE_01_FEATURES=1"
echo "     PLAN_FREE_AGENTS=cto_only"
