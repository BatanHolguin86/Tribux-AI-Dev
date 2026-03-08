import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PHASE00_SECTIONS } from '@/lib/ai/prompts/phase-00'
import type { Phase00Section } from '@/types/conversation'

export async function POST(
  _request: Request,
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

  // Verify document exists for this section
  const { data: doc } = await supabase
    .from('project_documents')
    .select('id')
    .eq('project_id', projectId)
    .eq('phase_number', 0)
    .eq('section', section)
    .single()

  if (!doc) {
    return NextResponse.json(
      { error: 'No hay documento generado para esta seccion' },
      { status: 400 }
    )
  }

  // Approve the section
  await supabase
    .from('phase_sections')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('project_id', projectId)
    .eq('phase_number', 0)
    .eq('section', section)

  // Approve the document
  await supabase
    .from('project_documents')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', doc.id)

  // Determine next section
  const currentIndex = PHASE00_SECTIONS.indexOf(section as Phase00Section)
  const nextSection = currentIndex < PHASE00_SECTIONS.length - 1
    ? PHASE00_SECTIONS[currentIndex + 1]
    : null

  return NextResponse.json({
    section,
    status: 'approved',
    next_section: nextSection,
  })
}
