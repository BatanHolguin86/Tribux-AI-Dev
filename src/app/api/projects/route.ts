import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createProjectSchema } from '@/lib/validations/projects'
import { getNextAction } from '@/lib/projects/get-next-action'

const PLAN_LIMITS: Record<string, number> = {
  starter: 1,
  builder: 3,
  agency: 10,
  enterprise: Infinity,
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'active'

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*, project_phases(*)')
    .eq('user_id', user.id)
    .eq('status', status)
    .order('last_activity', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Error al cargar proyectos' }, { status: 500 })
  }

  const enriched = (projects ?? []).map((p) => {
    const phases = p.project_phases ?? []
    const phasesCompleted = phases.filter((ph: { status: string }) => ph.status === 'completed').length
    const activePhaseRow = phases.find((ph: { status: string }) => ph.status === 'active')
    const activePhase = activePhaseRow?.phase_number ?? p.current_phase

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      industry: p.industry,
      status: p.status,
      current_phase: p.current_phase,
      active_phase: activePhase,
      phases_completed: phasesCompleted,
      progress_percentage: Math.round((phasesCompleted / 8) * 100),
      next_action: getNextAction(activePhase),
      last_activity: p.last_activity,
      created_at: p.created_at,
    }
  })

  // Summary
  const { count: totalActive } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'active')

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count: phasesThisWeek } = await supabase
    .from('project_phases')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .gte('completed_at', oneWeekAgo)
    .in(
      'project_id',
      (projects ?? []).map((p) => p.id)
    )

  return NextResponse.json({
    projects: enriched,
    summary: {
      total_active: totalActive ?? 0,
      phases_completed_this_week: phasesThisWeek ?? 0,
    },
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createProjectSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos invalidos', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  // Check plan limit
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = profile?.plan ?? 'starter'
  const limit = PLAN_LIMITS[plan] ?? 1

  const { count: currentCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .neq('status', 'archived')

  if ((currentCount ?? 0) >= limit) {
    return NextResponse.json(
      { error: 'Has alcanzado el limite de proyectos de tu plan', code: 'PLAN_LIMIT_REACHED' },
      { status: 403 }
    )
  }

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      industry: parsed.data.industry ?? null,
      current_phase: 0,
      status: 'active',
    })
    .select('id, name, current_phase')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Error al crear proyecto' }, { status: 500 })
  }

  return NextResponse.json(project, { status: 201 })
}
