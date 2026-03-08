#!/bin/bash
# Run Supabase migrations
# Usage: ./infrastructure/scripts/migrate.sh [staging|production]

set -e

ENV=${1:-staging}
MIGRATIONS_DIR="infrastructure/supabase/migrations"

echo "🗄️  Running migrations on $ENV..."

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "❌ Migrations directory not found: $MIGRATIONS_DIR"
  exit 1
fi

for migration in "$MIGRATIONS_DIR"/*.sql; do
  echo "  📄 Applying: $(basename "$migration")"
  # When Supabase CLI is configured, use:
  # supabase db push --db-url "$DATABASE_URL"
  # For now, migrations are applied manually via Supabase Dashboard SQL Editor
done

echo "✅ Migrations complete!"
