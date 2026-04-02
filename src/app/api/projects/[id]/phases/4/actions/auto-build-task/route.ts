import { streamText, stepCountIs } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, DEFAULT_MODEL_ID, AI_CONFIG } from '@/lib/ai/anthropic'
import { createAgentTools } from '@/lib/ai/agent-tools'
import { LEAD_DEVELOPER_PROMPT } from '@/lib/ai/agents/lead-developer'
import { DB_ADMIN_PROMPT } from '@/lib/ai/agents/db-admin'
import { QA_ENGINEER_PROMPT } from '@/lib/ai/agents/qa-engineer'
import { DEVOPS_ENGINEER_PROMPT } from '@/lib/ai/agents/devops-engineer'
import { recordActionStart, recordActionComplete } from '@/lib/actions/execute'
import { recordStreamUsage } from '@/lib/ai/usage'
import { checkHeavyQuota } from '@/lib/plans/quota'
import { checkRateLimit, getClientIp, ACTION_RATE_LIMIT } from '@/lib/rate-limit'
import type { AgentType } from '@/types/agent'

export const maxDuration = 120

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let executionId = ''

  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    // Quota check — block heavy AI ops if budget exceeded
    const quotaBlock = await checkHeavyQuota(user.id)
    if (quotaBlock) return quotaBlock

    // Accept both messages (from useChat transport) and taskId
    const body = await request.json()
    const taskId: string = body.taskId
    const requestedAgent: AgentType = body.agentType ?? 'lead_developer'

    if (!taskId) {
      return Response.json({ error: 'taskId required' }, { status: 400 })
    }

    // Rate limit
    const ip = getClientIp(request)
    const rateResult = checkRateLimit(`action:${user.id}:${ip}`, ACTION_RATE_LIMIT)
    if (!rateResult.allowed) {
      return Response.json({ error: 'rate_limited' }, { status: 429 })
    }

    // Verify project ownership + load credentials
    const { data: project } = await supabase
      .from('projects')
      .select('id, repo_url, supabase_project_ref, supabase_access_token')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) return Response.json({ error: 'not_found' }, { status: 404 })

    if (!project.repo_url) {
      return Response.json(
        { error: 'no_repo', message: 'El proyecto no tiene repositorio GitHub conectado.' },
        { status: 400 },
      )
    }

    // Load task
    const { data: task } = await supabase
      .from('project_tasks')
      .select('*, project_features(name)')
      .eq('id', taskId)
      .eq('project_id', projectId)
      .single()

    if (!task) return Response.json({ error: 'task_not_found' }, { status: 404 })

    const featureName =
      (task.project_features as unknown as { name: string })?.name ?? 'Unknown Feature'

    // Create tools based on requested agent type
    const agentTools = createAgentTools({
      projectId,
      repoUrl: project.repo_url,
      supabaseProjectRef: project.supabase_project_ref ?? null,
      supabaseAccessToken: project.supabase_access_token ?? null,
      agentType: requestedAgent,
    })

    // Record execution start
    executionId = await recordActionStart(
      projectId,
      4,
      'tasks',
      0,
      `auto-build:${task.task_key}`,
    )

    // Autonomous build goal
    const buildGoal = `MODO CONSTRUCCION AUTONOMO — Task ${task.task_key}: ${task.title}

Feature: ${featureName}
${task.description ? `Descripcion: ${task.description}` : ''}
${task.acceptance_criteria ? `Criterios de aceptacion:\n${task.acceptance_criteria}` : ''}

TU MISION: Implementar esta task completamente de forma autonoma. Sigue este flujo exacto:

PASO 0 — CONTEXTO (obligatorio antes de escribir codigo):
- Llama a get_knowledge_base con query="${featureName} ${task.title}" para leer decisiones previas, patrones y bugs corregidos
- Si hay entradas relevantes, usarlas para guiar tu implementacion (no repetir errores anteriores)

PASO 1 — ENTENDER:
- Llama a read_spec con feature_name="${featureName}" para obtener requirements y design docs KIRO
- Llama a read_design_artifact con screen_name relevante para ver el diseno visual aprobado (wireframes/mockups HTML)
  * Si hay disenos, usa el HTML como referencia para estructura, layout, colores y componentes
  * Replica la jerarquia visual, espaciado y patron de componentes del diseno aprobado
- Llama a list_files (sin directorio) para ver la estructura completa del repo
- Lee 3-5 archivos clave relacionados a esta feature (componentes, API routes, tipos, utilidades)

PASO 2 — IMPLEMENTAR:
- Llama a write_files con TODOS los archivos en un solo commit: implementacion + tests
   - Archivos de feature: src/components/, src/app/api/, src/lib/, src/hooks/
   - Tests obligatorios:
     * Components → tests/unit/components/Name.test.tsx (React Testing Library)
     * API routes  → tests/unit/api/name.test.ts (Vitest, mock Supabase)
     * Lib/utils   → tests/unit/lib/name.test.ts (Vitest)
     * Hooks       → tests/unit/hooks/useName.test.ts (Vitest + renderHook)
   - Commit message: "feat(${task.task_key}): ${task.title}"

PASO 2.5 — SELF-REVIEW (obligatorio antes de verificar CI):
- Lee CADA archivo que acabas de escribir con read_file
- Verifica contra las convenciones del proyecto:
  * TypeScript strict: no 'any', tipos explicitos en props y returns
  * Naming: camelCase variables, PascalCase componentes, kebab-case archivos
  * Imports: rutas con @/ alias, no rutas relativas largas
  * React: Server Components por defecto, 'use client' solo si necesario
  * Supabase: RLS considerado, no exponer service_role en cliente
  * Tests: mock Supabase con vi.mock(), no hardcodear datos de test
- Si encuentras violaciones, corrige con edit_file ANTES de que CI corra
- Esto previene regresiones: es mas barato corregir antes de CI que despues

PASO 3 — VERIFICAR (loop obligatorio, max 3 ciclos):
- Llama a get_ci_status para verificar que CI pasa
- Si CI status es "not_found" (no hay CI configurado), llama trigger_ci para intentar correrlo
- Si CI falla:
  a. Llama get_ci_logs para leer los errores exactos
  b. Lee los archivos afectados con read_file
  c. Corrige con edit_file (NO reescribir todo — solo los errores)
  d. Vuelve a verificar con get_ci_status
  e. Repite hasta max 3 ciclos o hasta que CI pase
- ROLLBACK SI FALLA 3 VECES: si despues de 3 ciclos CI sigue fallando:
  a. Guarda en save_to_memory: "TASK FALLIDA: ${task.task_key} — errores persistentes: [lista de errores]" con category="bugs_fixed"
  b. Informa al usuario: "No pude resolver los errores de CI despues de 3 intentos. Los errores son: [errores]. Revisa manualmente o pide ayuda al equipo."
  c. NO hagas mas commits — deja el codigo en el ultimo estado para revision manual
- Si CI pasa: continua al paso 4

PASO 4 — GUARDAR MEMORIA:
- Llama a save_to_memory con un resumen de:
  - Que se implemento y como
  - Decisiones tecnicas tomadas
  - Cualquier bug encontrado y como se resolvio
  - Patrones especificos del proyecto descubiertos
  - Category: "auto_build"
- Confirma con un resumen final al usuario

REGLAS:
- Lee los archivos existentes ANTES de escribir para seguir los patrones exactos
- Implementa backend Y frontend segun sea necesario
- TypeScript strict, Tailwind CSS, patrones del proyecto
- Tests deben verificar comportamiento real, no solo que el codigo existe
- SIEMPRE lee el knowledge base primero (paso 0) y guarda al final (paso 4)`

    const AGENT_PROMPTS: Record<string, string> = {
      lead_developer: LEAD_DEVELOPER_PROMPT,
      db_admin: DB_ADMIN_PROMPT,
      qa_engineer: QA_ENGINEER_PROMPT,
      devops_engineer: DEVOPS_ENGINEER_PROMPT,
    }

    const result = streamText({
      model: defaultModel,
      system: AGENT_PROMPTS[requestedAgent] ?? LEAD_DEVELOPER_PROMPT,
      messages: [{ role: 'user', content: buildGoal }],
      tools: agentTools,
      stopWhen: stepCountIs(25),
      maxOutputTokens: AI_CONFIG.documentGeneration.maxOutputTokens,
      temperature: AI_CONFIG.documentGeneration.temperature,
      onFinish: async ({ text, usage }) => {
        await recordStreamUsage({ userId: user.id, projectId, eventType: 'action_auto_build_task', model: DEFAULT_MODEL_ID, usage })
        try {
          await supabase
            .from('project_tasks')
            .update({ status: 'review' })
            .eq('id', taskId)
            .eq('project_id', projectId)

          // Save build summary to knowledge base for future sessions
          const adminClient = await import('@/lib/supabase/server').then((m) =>
            m.createAdminClient(),
          )
          await adminClient.from('knowledge_base_entries').insert({
            project_id: projectId,
            title: `Auto-built: ${task.task_key} — ${task.title}`,
            content: `Task ${task.task_key} was auto-built for feature "${featureName}". Summary: ${text.slice(0, 1500)}`,
            summary: `Auto-built ${task.task_key}: ${task.title} (feature: ${featureName})`,
            category: 'agent_memory',
            source_type: 'agent',
            source_id: taskId,
            is_pinned: false,
          })

          await recordActionComplete(
            executionId,
            'success',
            `Auto-built ${task.task_key}: ${task.title}`,
            { taskId, taskKey: task.task_key },
          )
        } catch (e) {
          await recordActionComplete(
            executionId,
            'failed',
            undefined,
            undefined,
            String(e),
          )
        }
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('[auto-build-task] Error:', error)
    if (executionId) {
      await recordActionComplete(
        executionId,
        'failed',
        undefined,
        undefined,
        String(error),
      )
    }
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
