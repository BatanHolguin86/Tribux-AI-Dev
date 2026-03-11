/**
 * Apply migration 013 — Create project_tasks table
 * Run with: npx tsx scripts/apply-migration-013.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 * Uses the Supabase Management API to execute SQL
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

async function checkTableExists(): Promise<boolean> {
  const { data, error } = await supabase
    .from('project_tasks')
    .select('id')
    .limit(1)

  // PGRST205 = table not found
  if (error?.code === 'PGRST205' || error?.code === '42P01') return false
  if (error && !error.code?.startsWith('PGRST')) {
    console.error('Unexpected error checking table:', error)
    return false
  }
  return true
}

async function applyMigration() {
  console.log('Checking if project_tasks table exists...')

  const exists = await checkTableExists()
  if (exists) {
    console.log('Table project_tasks already exists. Migration already applied.')
    return
  }

  console.log('Table does not exist. Applying migration 013...')
  console.log('')
  console.log('NOTE: The Supabase JS client cannot execute raw DDL (CREATE TABLE).')
  console.log('You need to apply this SQL manually in the Supabase Dashboard:')
  console.log('')
  console.log('  1. Go to https://supabase.com/dashboard/project/xsvnzhnpbgkbuqgvplcf/sql')
  console.log('  2. Paste the SQL from: infrastructure/supabase/migrations/013_create_project_tasks.sql')
  console.log('  3. Click "Run"')
  console.log('')
  console.log('SQL to apply:')
  console.log('─'.repeat(60))

  const fs = await import('fs')
  const path = await import('path')
  const sqlPath = path.join(__dirname, '..', 'infrastructure', 'supabase', 'migrations', '013_create_project_tasks.sql')
  const sql = fs.readFileSync(sqlPath, 'utf-8')
  console.log(sql)
  console.log('─'.repeat(60))
}

applyMigration().catch(console.error)
