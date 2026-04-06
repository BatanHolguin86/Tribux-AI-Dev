#!/usr/bin/env node

/**
 * Creates 4 test users for persona testing.
 * Usage: node scripts/create-test-users.mjs
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const USERS = [
  { email: 'camila@test.aisquad.dev', password: 'Test1234!', fullName: 'Camila Torres', persona: 'emprendedor' },
  { email: 'santiago@test.aisquad.dev', password: 'Test1234!', fullName: 'Santiago Reyes', persona: 'founder' },
  { email: 'valentina@test.aisquad.dev', password: 'Test1234!', fullName: 'Valentina Mora', persona: 'pm' },
  { email: 'rodrigo@test.aisquad.dev', password: 'Test1234!', fullName: 'Rodrigo Fuentes', persona: 'consultor' },
]

async function createUser({ email, password, fullName, persona }) {
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    if (authError.message?.includes('already been registered')) {
      console.log(`⚠️  ${email} ya existe — actualizando perfil...`)
      // Get existing user
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const existing = users?.find((u) => u.email === email)
      if (existing) {
        await updateProfile(existing.id, fullName, persona)
        return
      }
      console.error(`❌ ${email}: no se pudo encontrar usuario existente`)
      return
    }
    console.error(`❌ ${email}: ${authError.message}`)
    return
  }

  const userId = authData.user.id
  await updateProfile(userId, fullName, persona)
}

async function updateProfile(userId, fullName, persona) {
  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      id: userId,
      full_name: fullName,
      persona,
      onboarding_completed: true,
      onboarding_step: 4,
      plan: 'enterprise',
      subscription_status: 'active',
    }, { onConflict: 'id' })

  if (error) {
    console.error(`❌ Profile ${fullName}: ${error.message}`)
    return
  }

  console.log(`✅ ${fullName} (${persona}) — listo`)
}

async function main() {
  console.log('🚀 Creando 4 usuarios de prueba...\n')

  for (const user of USERS) {
    await createUser(user)
  }

  console.log('\n📋 Credenciales:')
  console.log('┌─────────────┬──────────────────────────────┬────────────┬──────────────┐')
  console.log('│ Persona     │ Email                        │ Password   │ Perfil       │')
  console.log('├─────────────┼──────────────────────────────┼────────────┼──────────────┤')
  for (const u of USERS) {
    console.log(`│ ${u.fullName.padEnd(11)} │ ${u.email.padEnd(28)} │ ${u.password.padEnd(10)} │ ${u.persona.padEnd(12)} │`)
  }
  console.log('└─────────────┴──────────────────────────────┴────────────┴──────────────┘')
  console.log('\n✅ Todos los usuarios creados con plan Enterprise y onboarding completado.')
}

main().catch(console.error)
