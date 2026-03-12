import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; agentType: string; threadId: string }> },
) {
  const { threadId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data, error } = await supabase
    .from('conversation_threads')
    .select('id, title, attachments')
    .eq('id', threadId)
    .single()

  if (error) {
    return NextResponse.json(
      {
        error: 'thread_error',
        message: 'No se pudo cargar el hilo.',
      },
      { status: 500 },
    )
  }

  if (!data) {
    return NextResponse.json(
      {
        error: 'thread_not_found',
        message: 'Hilo no encontrado.',
      },
      { status: 404 },
    )
  }

  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; agentType: string; threadId: string }> },
) {
  const { threadId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { error } = await supabase
    .from('conversation_threads')
    .delete()
    .eq('id', threadId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
