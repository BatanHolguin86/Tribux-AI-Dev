import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { onboardingCompleteSchema } from '@/lib/validations/auth'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = onboardingCompleteSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos invalidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { persona, project } = parsed.data

  // Update user profile with persona and mark onboarding complete
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      persona,
      onboarding_completed: true,
      onboarding_step: 5,
    })
    .eq('id', user.id)

  if (profileError) {
    return NextResponse.json(
      { error: 'Error al actualizar perfil' },
      { status: 500 }
    )
  }

  // Create the first project
  const { data: newProject, error: projectError } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: project.name,
      description: project.description ?? null,
      industry: project.industry ?? null,
      repo_url: project.repo_url ?? null,
      supabase_project_ref: project.supabase_project_ref ?? null,
      supabase_access_token: project.supabase_access_token ?? null,
      current_phase: 0,
      status: 'active',
    })
    .select('id')
    .single()

  if (projectError) {
    return NextResponse.json(
      { error: 'Error al crear proyecto' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    project_id: newProject.id,
    redirect_to: `/projects/${newProject.id}/phase/00`,
  })
}
