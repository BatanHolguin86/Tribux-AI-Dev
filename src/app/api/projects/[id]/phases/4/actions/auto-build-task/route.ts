import { streamText, stepCountIs } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, DEFAULT_MODEL_ID, AI_CONFIG } from '@/lib/ai/anthropic'
import { createAgentTools } from '@/lib/ai/agent-tools'
import { LEAD_DEVELOPER_PROMPT } from '@/lib/ai/agents/lead-developer'
import { recordActionStart, recordActionComplete } from '@/lib/actions/execute'
import { recordStreamUsage } from '@/lib/ai/usage'
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

    // Accept both messages (from useChat transport) and taskId
    const body = await request.json()
    const taskId: string = body.taskId

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

    // Create lead_developer tools (read + write access)
    const agentTools = createAgentTools({
      projectId,
      repoUrl: project.repo_url,
      supabaseProjectRef: project.supabase_project_ref ?? null,
      supabaseAccessToken: project.supabase_access_token ?? null,
      agentType: 'lead_developer' as AgentType,
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

1. Llama a read_spec con feature_name="${featureName}" para obtener requirements y design docs KIRO
2. Llama a list_files (sin directorio) para ver la estructura completa del repo
3. Lee 3-5 archivos clave relacionados a esta feature (componentes, API routes, tipos, utilidades)
4. Llama a write_files con TODOS los archivos en un solo commit: implementacion + tests
   - Archivos de feature: src/components/, src/app/api/, src/lib/, src/hooks/
   - Tests obligatorios:
     * Components → tests/unit/components/Name.test.tsx (React Testing Library)
     * API routes  → tests/unit/api/name.test.ts (Vitest, mock Supabase)
     * Lib/utils   → tests/unit/lib/name.test.ts (Vitest)
     * Hooks       → tests/unit/hooks/useName.test.ts (Vitest + renderHook)
   - Commit message: "feat(${task.task_key}): ${task.title}"
5. Confirma con un resumen: archivos creados, tests escritos, que se verifica
6. Llama a get_ci_status para verificar que el codigo + tests pasan CI
7. Si CI falla, llama get_ci_logs, usa edit_file para corregir los errores especificos, reverifica

REGLAS:
- Lee los archivos existentes ANTES de escribir para seguir los patrones exactos
- Implementa backend Y frontend segun sea necesario
- TypeScript strict, Tailwind CSS, patrones del proyecto
- Tests deben verificar comportamiento real, no solo que el codigo existe`

    const result = streamText({
      model: defaultModel,
      system: LEAD_DEVELOPER_PROMPT,
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
