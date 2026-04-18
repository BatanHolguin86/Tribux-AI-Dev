import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', appUrl), { status: 302 })
}

// Handle GET (browser follows redirect with GET after form POST)
export async function GET() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', appUrl), { status: 302 })
}
