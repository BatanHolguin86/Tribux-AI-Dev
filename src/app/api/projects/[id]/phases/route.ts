import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PHASE_NAMES } from '@/types/project'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: phases, error } = await supabase
    .from('project_phases')
    .select('*')
    .eq('project_id', id)
    .order('phase_number', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Error al cargar fases' }, { status: 500 })
  }

  const enriched = (phases ?? []).map((ph) => ({
    ...ph,
    name: PHASE_NAMES[ph.phase_number] ?? `Phase ${ph.phase_number}`,
  }))

  return NextResponse.json({ phases: enriched })
}
