#!/usr/bin/env node
/**
 * Sets user_profiles.plan = 'enterprise' and subscription_status = 'active'
 * for a test user (local/staging). Requires Supabase service role.
 *
 * Usage:
 *   pnpm run plan:enterprise you@email.com
 *   pnpm run plan:enterprise -- --uuid=<user-uuid>
 *
 * Loads .env.local from project root (same vars as Next.js).
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const envPath = resolve(root, '.env.local')

function loadDotEnv() {
  if (!existsSync(envPath)) return
  const raw = readFileSync(envPath, 'utf8')
  for (const line of raw.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    const k = t.slice(0, i).trim()
    let v = t.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    if (process.env[k] === undefined) process.env[k] = v
  }
}

loadDotEnv()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const args = process.argv.slice(2)
const uuidArg = args.find((a) => a.startsWith('--uuid='))
const email = args.filter((a) => !a.startsWith('--'))[0]

async function main() {
  if (!url || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (.env.local).')
    process.exit(1)
  }

  let userId = null

  if (uuidArg) {
    userId = uuidArg.replace('--uuid=', '').trim()
    if (!userId) {
      console.error('Invalid --uuid=')
      process.exit(1)
    }
  } else if (email) {
    const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    let page = 1
    const perPage = 1000
    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
      if (error) {
        console.error('auth.admin.listUsers:', error.message)
        process.exit(1)
      }
      const u = data.users.find((x) => x.email?.toLowerCase() === email.toLowerCase())
      if (u) {
        userId = u.id
        break
      }
      if (data.users.length < perPage) break
      page += 1
    }
    if (!userId) {
      console.error(`No user found with email: ${email}`)
      process.exit(1)
    }
  } else {
    console.error('Usage: pnpm run plan:enterprise <email>')
    console.error('   or: pnpm run plan:enterprise -- --uuid=<auth-user-uuid>')
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

  const { data: row, error: selErr } = await supabase.from('user_profiles').select('id, plan').eq('id', userId).maybeSingle()

  if (selErr) {
    console.error('user_profiles select:', selErr.message)
    process.exit(1)
  }
  if (!row) {
    console.error(`No row in user_profiles for id ${userId}. Complete onboarding first.`)
    process.exit(1)
  }

  const { error: updErr } = await supabase
    .from('user_profiles')
    .update({
      plan: 'enterprise',
      subscription_status: 'active',
    })
    .eq('id', userId)

  if (updErr) {
    console.error('user_profiles update:', updErr.message)
    process.exit(1)
  }

  console.log('OK — user_profiles updated:')
  console.log('  id:', userId)
  console.log('  plan: enterprise (was', row.plan + ')')
  console.log('  subscription_status: active')
  console.log('\nCierra sesion y vuelve a entrar si la app cachea el plan en el cliente.')
}

main()
  