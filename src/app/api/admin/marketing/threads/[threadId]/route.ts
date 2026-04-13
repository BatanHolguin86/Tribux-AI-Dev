import { NextResponse } from 'next/server'
import { requireFinancialAdmin } from '@/lib/admin/require-financial-admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const auth = await requireFinancialAdmin()
  if (!auth.allowed) return NextResponse.json(auth.body, { status: auth.status })

  const { threadId } = await params
  const supabase = await createClient()

  const [threadResult, messagesResult] = await Promise.all([
    supabase
      .from('marketing_chat_threads')
      .select('id, title, mode, created_at, updated_at')
      .eq('id', threadId)
      .single(),
    supabase
      .from('marketing_chat_messages')
      .select('id, role, content, created_at')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true }),
  ])

  if (threadResult.error) {
    return NextResponse.json(
      { error: 'not_found', message: 'Hilo no encontrado.' },
      { status: 404 },
    )
  }

  return NextResponse.json({
    ...threadResult.data,
    messages: messagesResult.data ?? [],
  })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const auth = await requireFinancialAdmin()
  if (!auth.allowed) return NextResponse.json(auth.body, { status: auth.status })

  const { threadId } = await params
  const supabase = await createClient()

  const { error } = await supabase
    .from('marketing_chat_threads')
    .delete()
    .eq('id', threadId)

  if (error) {
    console.error('[Marketing threads] Delete error', error)
    return NextResponse.json({ error: 'db_error', message: 'No se pudo eliminar el hilo.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
