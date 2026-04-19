import { NextResponse } from 'next/server'
import { requireFinancialAdmin } from '@/lib/admin/require-financial-admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const auth = await requireFinancialAdmin()
  if (!auth.allowed) return NextResponse.json(auth.body, { status: auth.status })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const status = searchParams.get('status')

  const supabase = await createClient()
  let query = supabase
    .from('marketing_artifacts')
    .select('id, thread_id, title, type, content, status, created_at, updated_at')
    .order('updated_at', { ascending: false })

  if (type) query = query.eq('type', type)
  if (status) query = query.eq('status', status)

  const { data, error } = await query

  if (error) {
    console.error('[Marketing artifacts] List error', error)
    return NextResponse.json({ error: 'db_error', message: 'No se pudieron cargar los artefactos.' }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const auth = await requireFinancialAdmin()
  if (!auth.allowed) return NextResponse.json(auth.body, { status: auth.status })

  const body = await request.json()
  const { threadId, title, type, content } = body as {
    threadId?: string
    title: string
    type: string
    content: string
  }

  if (!title?.trim() || !type?.trim() || !content?.trim()) {
    return NextResponse.json(
      { error: 'invalid_request', message: 'Se requiere title, type y content.' },
      { status: 400 },
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('marketing_artifacts')
    .insert({
      thread_id: threadId || null,
      title: title.trim(),
      type,
      content: content.trim(),
    })
    .select('id, thread_id, title, type, content, status, created_at, updated_at')
    .single()

  if (error) {
    console.error('[Marketing artifacts] Create error', error)
    return NextResponse.json({ error: 'db_error', message: 'No se pudo crear el artefacto.' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
