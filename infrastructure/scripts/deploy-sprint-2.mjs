#!/usr/bin/env node
/**
 * Sprint 2 deployment script
 * 1. Runs migration 016 (adds plan fields to user_profiles)
 * 2. Creates project-designs storage bucket
 *
 * Usage: node infrastructure/scripts/deploy-sprint-2.mjs
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'

// Load .env.local
const envPath = '.env.local'
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx)
      const val = trimmed.slice(eqIdx + 1)
      process.env[key] = val
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

console.log('=== Sprint 2 Deployment ===')
console.log(`Target: ${SUPABASE_URL}\n`)

// --- Step 1: Run migration 016 ---
console.log('[1/3] Running migration 016_add_plan_fields...')

try {
  // Check if columns already exist by trying to select them
  const { data: profiles, error: checkError } = await supabase
    .from('user_profiles')
    .select('trial_ends_at, subscription_status')
    .limit(1)

  if (checkError && checkError.message.includes('trial_ends_at')) {
    // Columns don't exist — need to run migration
    console.log('  Columns not found. Migration needs to be applied.')
    console.log('  >> Run this SQL in Supabase Dashboard > SQL Editor:')
    console.log('  >> File: infrastructure/supabase/migrations/016_add_plan_fields.sql')
    console.log('')
  } else if (!checkError) {
    console.log('  Columns already exist. Migration already applied.')

    // Ensure existing users have trial_ends_at set
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        subscription_status: 'trialing',
      })
      .is('trial_ends_at', null)

    if (updateError) {
      console.log(`  Warning: Could not update existing users: ${updateError.message}`)
    } else {
      console.log('  Existing users updated with trial period.')
    }
  } else {
    console.log(`  Check error: ${checkError.message}`)
    console.log('  >> Run migration manually in Supabase Dashboard > SQL Editor')
    console.log('  >> File: infrastructure/supabase/migrations/016_add_plan_fields.sql')
  }
} catch (err) {
  console.log(`  Error: ${err.message}`)
  console.log('  >> Run migration manually in Supabase Dashboard > SQL Editor')
}

// --- Step 2: Create project-designs storage bucket ---
console.log('[2/3] Creating project-designs storage bucket...')

try {
  const { data: existingBuckets } = await supabase.storage.listBuckets()
  const bucketExists = existingBuckets?.some(b => b.id === 'project-designs')

  if (bucketExists) {
    console.log('  Bucket already exists. Updating config...')
    const { error } = await supabase.storage.updateBucket('project-designs', {
      public: false,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['text/markdown', 'text/plain', 'image/png', 'image/jpeg', 'image/svg+xml'],
    })
    if (error) console.log(`  Update warning: ${error.message}`)
    else console.log('  Bucket config updated.')
  } else {
    const { error } = await supabase.storage.createBucket('project-designs', {
      public: false,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ['text/markdown', 'text/plain', 'image/png', 'image/jpeg', 'image/svg+xml'],
    })
    if (error) console.log(`  Error creating bucket: ${error.message}`)
    else console.log('  Bucket created successfully.')
  }
} catch (err) {
  console.log(`  Error: ${err.message}`)
}

// --- Step 3: Verify setup ---
console.log('[3/3] Verifying setup...')

const { data: buckets } = await supabase.storage.listBuckets()
const designsBucket = buckets?.find(b => b.id === 'project-designs')
console.log(`  Storage bucket 'project-designs': ${designsBucket ? 'OK' : 'MISSING'}`)

const { data: testProfile, error: profileError } = await supabase
  .from('user_profiles')
  .select('id, trial_ends_at, subscription_status')
  .limit(1)
  .single()

if (profileError) {
  console.log(`  user_profiles check: ${profileError.message}`)
} else if (testProfile?.trial_ends_at !== undefined) {
  console.log(`  user_profiles.trial_ends_at: OK`)
  console.log(`  user_profiles.subscription_status: OK`)
} else {
  console.log('  user_profiles new columns: NOT FOUND — run migration manually')
}

console.log('\n=== Deployment complete ===\n')
