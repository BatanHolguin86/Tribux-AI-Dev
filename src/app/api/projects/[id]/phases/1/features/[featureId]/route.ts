import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateFeatureSchema } from '@/lib/validations/features'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; featureId: string }> }
) {
  const { featureId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  const parsed = updateFeatureSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('project_features')
    .update(parsed.data)
    .eq('id', featureId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; featureId: string }> }
) {
  const { featureId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Check status
  const { data: feature } = await supabase
    .from('project_features')
    .select('status')
    .eq('id', featureId)
    .single()

  if (feature?.status !== 'pending') {
    return NextResponse.json(
      { error: 'No se puede eliminar un feature con documentos en progreso' },
      { status: 400 }
    )
  }

  await supabase.from('project_features').delete().eq('id', featureId)
  return new Response(null, { status: 204 })
}
