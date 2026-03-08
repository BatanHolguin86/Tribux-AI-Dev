import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createFeatureSchema } from '@/lib/validations/features'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: features } = await supabase
    .from('project_features')
    .select('*, feature_documents(*)')
    .eq('project_id', projectId)
    .order('display_order', { ascending: true })

  const enriched = (features ?? []).map((f) => {
    const docs = f.feature_documents ?? []
    const docMap: Record<string, { id: string; status: string; version: number } | null> = {
      requirements: null,
      design: null,
      tasks: null,
    }
    for (const d of docs) {
      docMap[d.document_type] = { id: d.id, status: d.status, version: d.version }
    }
    return {
      id: f.id,
      name: f.name,
      description: f.description,
      display_order: f.display_order,
      status: f.status,
      suggested_by: f.suggested_by,
      documents: docMap,
    }
  })

  const completed = enriched.filter((f) => f.status === 'approved').length

  return NextResponse.json({
    features: enriched,
    phase_status: completed === enriched.length && enriched.length > 0 ? 'ready' : 'in_progress',
    features_completed: completed,
    features_total: enriched.length,
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  const parsed = createFeatureSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos invalidos', details: parsed.error.flatten() }, { status: 400 })
  }

  // Get next display_order
  const { count } = await supabase
    .from('project_features')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)

  const { data: feature, error } = await supabase
    .from('project_features')
    .insert({
      project_id: projectId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      display_order: count ?? 0,
      suggested_by: 'user',
    })
    .select('id, name, display_order')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ya existe un feature con ese nombre' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error al crear feature' }, { status: 500 })
  }

  return NextResponse.json(feature, { status: 201 })
}
