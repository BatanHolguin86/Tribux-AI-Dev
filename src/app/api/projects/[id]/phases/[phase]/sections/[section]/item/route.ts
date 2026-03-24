import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { isAllowedSectionForPhase, isChecklistPhase } from '@/lib/phase-checklist-sections'

const bodySchema = z.object({
  itemIndex: z.number().int().min(0).max(99),
  completed: z.boolean(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; phase: string; section: string }> },
) {
  const { id: projectId, phase: phaseParam, section } = await params
  const phase = Number.parseInt(phaseParam, 10)

  if (!Number.isFinite(phase) || !isChecklistPhase(phase)) {
    return NextResponse.json({ error: 'Fase no valida' }, { status: 400 })
  }

  if (!isAllowedSectionForPhase(phase, section)) {
    return NextResponse.json({ error: 'Seccion no valida' }, { status: 400 })
  }

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Body invalido' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: row, error: fetchError } = await supabase
    .from('phase_sections')
    .select('item_states')
    .eq('project_id', projectId)
    .eq('phase_number', phase)
    .eq('section', section)
    .single()

  if (fetchError || !row) {
    return NextResponse.json({ error: 'Seccion no encontrada' }, { status: 404 })
  }

  const prev = (row.item_states as Record<string, boolean> | null) ?? {}
  const next = { ...prev, [String(body.itemIndex)]: body.completed }

  const { error: updateError } = await supabase
    .from('phase_sections')
    .update({ item_states: next })
    .eq('project_id', projectId)
    .eq('phase_number', phase)
    .eq('section', section)

  if (updateError) {
    console.error('[phase section item]', updateError)
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }

  return NextResponse.json({ section, itemIndex: body.itemIndex, completed: body.completed, item_states: next })
}
