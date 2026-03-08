import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateProjectSchema } from '@/lib/validations/projects'

export async function PATCH(
  request: Request,
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

  const body = await request.json()
  const parsed = updateProjectSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos invalidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { data: project, error } = await supabase
    .from('projects')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Error al actualizar proyecto' }, { status: 500 })
  }

  return NextResponse.json(project)
}
