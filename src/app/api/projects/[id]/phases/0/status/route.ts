import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // Get all sections
  const { data: sections } = await supabase
    .from('phase_sections')
    .select('*')
    .eq('project_id', projectId)
    .eq('phase_number', 0)
    .order('created_at', { ascending: true })

  // Get all conversations
  const { data: conversations } = await supabase
    .from('agent_conversations')
    .select('section, messages')
    .eq('project_id', projectId)
    .eq('phase_number', 0)

  // Get all documents
  const { data: documents } = await supabase
    .from('project_documents')
    .select('*')
    .eq('project_id', projectId)
    .eq('phase_number', 0)

  return NextResponse.json({
    sections: sections ?? [],
    conversations: conversations ?? [],
    documents: documents ?? [],
  })
}
