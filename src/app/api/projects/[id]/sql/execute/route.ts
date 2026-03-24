import { createClient } from '@/lib/supabase/server'
import { executeSqlOnProject, validateSqlSafety } from '@/lib/supabase/management-api'
import { checkRateLimit, getClientIp, SQL_EXECUTE_RATE_LIMIT } from '@/lib/rate-limit'
import { z } from 'zod'

const executeSchema = z.object({
  sql: z.string().min(1, 'SQL requerido').max(50_000),
  filename: z.string().max(200).optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Rate limit
    const ip = getClientIp(request)
    const rateLimitKey = `sql-execute:${user.id}:${ip}`
    const rateResult = checkRateLimit(rateLimitKey, SQL_EXECUTE_RATE_LIMIT)
    if (!rateResult.allowed) {
      return Response.json(
        { error: 'rate_limited', message: 'Limite de ejecuciones SQL por hora alcanzado (5/hr). Intenta mas tarde.' },
        { status: 429 },
      )
    }

    // Validate project belongs to user and has Supabase credentials
    const { data: project } = await supabase
      .from('projects')
      .select('id, user_id, supabase_project_ref, supabase_access_token')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return Response.json({ error: 'not_found', message: 'Proyecto no encontrado.' }, { status: 404 })
    }

    if (!project.supabase_project_ref || !project.supabase_access_token) {
      return Response.json(
        {
          error: 'no_credentials',
          message: 'El proyecto no tiene credenciales de Supabase configuradas. Configuralas en los ajustes del proyecto.',
        },
        { status: 400 },
      )
    }

    // Validate input
    const body = await request.json()
    const parsed = executeSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { error: 'validation_error', message: parsed.error.issues[0]?.message ?? 'Input invalido.' },
        { status: 400 },
      )
    }

    const { sql } = parsed.data

    // Safety check
    const safety = validateSqlSafety(sql)
    if (!safety.safe) {
      return Response.json(
        { error: 'blocked', message: safety.reason },
        { status: 400 },
      )
    }

    // Execute SQL via Management API
    const result = await executeSqlOnProject(
      project.supabase_project_ref,
      project.supabase_access_token,
      sql,
    )

    if (!result.success) {
      return Response.json(
        { error: 'execution_failed', message: result.error },
        { status: 400 },
      )
    }

    return Response.json({
      success: true,
      rowCount: result.rowCount,
    })
  } catch (error) {
    console.error('[SQL execute] Error', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return Response.json(
      { error: 'sql_execute_failed', message },
      { status: 500 },
    )
  }
}
