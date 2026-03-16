import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: artifacts, error } = await supabase
    .from('design_artifacts')
    .select('id, type, screen_name, flow_name, status, mime_type, created_at, updated_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Designs list] Error', error)
    return NextResponse.json({ error: 'Error al cargar disenos' }, { status: 500 })
  }

  return NextResponse.json({ artifacts: artifacts ?? [] })
}
