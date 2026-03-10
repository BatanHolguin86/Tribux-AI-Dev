import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; section: string }> }
) {
  const { id: projectId, section } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { status } = await request.json()

  if (status !== 'pending' && status !== 'completed') {
    return NextResponse.json({ error: 'Status invalido' }, { status: 400 })
  }

  await supabase
    .from('phase_sections')
    .update({
      status,
      approved_at: status === 'completed' ? new Date().toISOString() : null,
    })
    .eq('project_id', projectId)
    .eq('phase_number', 6)
    .eq('section', section)

  return NextResponse.json({ section, status })
}
