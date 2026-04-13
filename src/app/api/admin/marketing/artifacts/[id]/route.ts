import { NextResponse } from 'next/server'
import { requireFinancialAdmin } from '@/lib/admin/require-financial-admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireFinancialAdmin()
  if (!auth.allowed) return NextResponse.json(auth.body, { status: auth.status })

  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('marketing_artifacts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json(
      { error: 'not_found', message: 'Artefacto no encontrado.' },
      { status: 404 },
    )
  }

  return NextResponse.json(data)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireFinancialAdmin()
  if (!auth.allowed) return NextResponse.json(auth.body, { status: auth.status })

  const { id } = await params
  const body = await request.json()
  const { title, content, status } = body as {
    title?: string
    content?: string
    status?: string
  }

  const updates: Record<string, string> = { updated_at: new Date().toISOString() }
  if (title !== undefined) updates.title = title
  if (content !== undefined) updates.content = content
  if (status !== undefined) updates.status = status

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('marketing_artifacts')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('[Marketing artifacts] Update error', error)
    return NextResponse.json(
      { error: 'db_error', message: 'No se pudo actualizar el artefacto.' },
      { status: 500 },
    )
  }

  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireFinancialAdmin()
  if (!auth.allowed) return NextResponse.json(auth.body, { status: auth.status })

  const { id } = await params
  const supabase = await createClient()

  const { error } = await supabase
    .from('marketing_artifacts')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[Marketing artifacts] Delete error', error)
    return NextResponse.json(
      { error: 'db_error', message: 'No se pudo eliminar el artefacto.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
