import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { KIRO_DOC_TYPES } from '@/lib/ai/prompts/phase-01'
import type { KiroDocumentType } from '@/types/feature'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; featureId: string; docType: string }> }
) {
  const { id: projectId, featureId, docType } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const docTypeKey = docType as KiroDocumentType

  // Verify document exists
  const { data: doc } = await supabase
    .from('feature_documents')
    .select('id')
    .eq('feature_id', featureId)
    .eq('document_type', docTypeKey)
    .single()

  if (!doc) {
    return NextResponse.json({ error: 'No hay documento para aprobar' }, { status: 400 })
  }

  // Approve doc
  await supabase
    .from('feature_documents')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', doc.id)

  // Check if all 3 docs are approved
  const { data: allDocs } = await supabase
    .from('feature_documents')
    .select('document_type, status')
    .eq('feature_id', featureId)

  const approvedDocs = (allDocs ?? []).filter((d) => d.status === 'approved')
  if (approvedDocs.length === 3) {
    await supabase
      .from('project_features')
      .update({ status: 'spec_complete' })
      .eq('id', featureId)
  }

  // Determine next doc
  const currentIdx = KIRO_DOC_TYPES.indexOf(docTypeKey)
  const nextDoc = currentIdx < KIRO_DOC_TYPES.length - 1 ? KIRO_DOC_TYPES[currentIdx + 1] : null

  return NextResponse.json({
    document_type: docTypeKey,
    status: 'approved',
    next_document: nextDoc,
    feature_complete: approvedDocs.length === 3,
  })
}
