import { NextResponse } from 'next/server'
import { requireFinancialAdmin } from '@/lib/admin/require-financial-admin'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const auth = await requireFinancialAdmin()
  if (!auth.allowed) return NextResponse.json(auth.body, { status: auth.status })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('marketing_chat_threads')
    .select('id, title, mode, created_at, updated_at')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[Marketing threads] List error', error)
    return NextResponse.json({ error: 'db_error', message: 'No se pudieron cargar los hilos.' }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const auth = await requireFinancialAdmin()
  if (!auth.allowed) return NextResponse.json(auth.body, { status: auth.status })

  const body = await request.json()
  const { title, mode = 'brand' } = body as { title?: string; mode?: string }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('marketing_chat_threads')
    .insert({ title: title || null, mode })
    .select('id, title, mode, created_at, updated_at')
    .single()

  if (error) {
    console.error('[Marketing threads] Create error', error)
    return NextResponse.json({ error: 'db_error', message: 'No se pudo crear el hilo.' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
