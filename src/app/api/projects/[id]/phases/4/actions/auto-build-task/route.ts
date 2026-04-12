import { streamText, generateText, stepCountIs } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, DEFAULT_MODEL_ID, AI_CONFIG } from '@/lib/ai/anthropic'
import { createAgentTools } from '@/lib/ai/agent-tools'
import { LEAD_DEVELOPER_PROMPT } from '@/lib/ai/agents/lead-developer'
import { DB_ADMIN_PROMPT } from '@/lib/ai/agents/db-admin'
import { QA_ENGINEER_PROMPT } from '@/lib/ai/agents/qa-engineer'
import { DEVOPS_ENGINEER_PROMPT } from '@/lib/ai/agents/devops-engineer'
import { SYSTEM_ARCHITECT_PROMPT } from '@/lib/ai/agents/system-architect'
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

    // Create feature branch before agent starts
    const branchName = `feat/${task.task_key.toLowerCase()}`
    if (project.repo_url) {
      const { createBranch } = await import('@/lib/github/commit')
      await createBranch(project.repo_url, branchName)
    }

    // Autonomous build goal
    const buildGoal = `MODO CONSTRUCCION AUTONOMO — Task ${task.task_key}: ${task.title}

Feature: ${featureName}
${task.description ? `Descripcion: ${task.description}` : ''}
${task.acceptance_criteria ? `Criterios de aceptacion:\n${task.acceptance_criteria}` : ''}

TU MISION: Implementar esta task completamente de forma autonoma. Sigue este flujo exacto:

PASO 0 — CONTEXTO (obligatorio antes de escribir codigo):
- Llama a get_knowledge_base con query="${featureName}" para leer decisiones de arquitectura, design docs y decisiones previas de Phase 02
- Llama a get_knowledge_base con query="${task.title}" para leer patrones y bugs corregidos de builds anteriores
- Si hay entradas relevantes, usarlas para guiar tu implementacion (no repetir errores anteriores)

PASO 1 — ENTENDER:
- Llama a read_spec con feature_name="${featureName}" para obtener requirements y design docs KIRO
- Llama a read_design_artifact con screen_name relevante para ver el diseno visual aprobado (wireframes/mockups HTML)
  * Si hay disenos, usa el HTML como referencia para estructura, layout, colores y componentes
  * Replica la jerarquia visual, espaciado y patron de componentes del diseno aprobado
- Llama a list_files (sin directorio) para ver la estructura completa del repo
- Lee 3-5 archivos clave relacionados a esta feature (componentes, API routes, tipos, utilidades)

PASO 2 — IMPLEMENTAR (en feature branch, NO en main):
- TODOS los commits van a branch "feat/${task.task_key.toLowerCase()}"
- Llama a write_files con branch="feat/${task.task_key.toLowerCase()}" e incluye implementacion + tests
   - Archivos de feature: src/components/, src/app/api/, src/lib/, src/hooks/
   - Tests obligatorios:
     * Components → tests/unit/components/Name.test.tsx (React Testing Library)
     * API routes  → tests/unit/api/name.test.ts (Vitest, mock Supabase)
     * Lib/utils   → tests/unit/lib/name.test.ts (Vitest)
     * Hooks       → tests/unit/hooks/useName.test.ts (Vitest + renderHook)
   - Commit message: "feat(${task.task_key}): ${task.title}"
- IMPORTANTE: NUNCA commitear a "main" — siempre branch="feat/${task.task_key.toLowerCase()}"

PASO 2.5 — SELF-REVIEW DE CONVENCIONES (antes de CI):
- Lee CADA archivo que escribiste con read_file
- Verifica SOLO convenciones de codigo (NO arquitectura — eso lo hace el System Architect despues):
  * TypeScript strict: no 'any', tipos explicitos
  * Naming: camelCase, PascalCase, kebab-case
  * Imports: @/ alias
  * React: Server Components por defecto, 'use client' solo si necesario
  * Tests: mock Supabase con vi.mock()
- Si encuentras violaciones, corrige con edit_file ANTES de que CI corra

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

PASO 5 — RESUMEN FINAL:
- Confirma al usuario con un resumen:
  * Branch: feat/${task.task_key.toLowerCase()}
  * Archivos creados/modificados
  * Tests escritos
  * CI status (passed/failed)
  * El codigo esta en la branch, NO en main — el usuario decidira cuando publicarlo

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

          // System Architect code review before creating PR
          let reviewSummary = ''
          try {
            const reviewResult = await generateText({
              model: defaultModel,
              system: SYSTEM_ARCHITECT_PROMPT + `\n\nMODO CODE REVIEW:
Revisa el codigo generado por el agente de build. Evalua:
1. Arquitectura: separacion de responsabilidades, patron correcto
2. Seguridad: RLS, no secrets expuestos, validacion de input
3. Performance: queries innecesarias, renders excesivos
4. Mantenibilidad: nombres claros, sin duplicacion, sin over-engineering
5. Tests: cobertura de happy path + edge cases

Responde en JSON:
{
  "score": 1-10,
  "issues": [{"severity":"critical|warning|suggestion","file":"path","description":"que esta mal y como corregirlo"}],
  "summary": "resumen en 2 lineas"
}
Responde SOLO JSON.`,
              prompt: `Revisa este codigo generado para ${task.task_key}: ${task.title}\n\nResumen del build:\n${text.slice(0, 6000)}`,
              maxOutputTokens: 2048,
              temperature: 0.3,
            })

            const cleaned = reviewResult.text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
            try {
              const review = JSON.parse(cleaned) as { score: number; issues: Array<{ severity: string; file: string; description: string }>; summary: string }
              reviewSummary = `**Code Review (System Architect):** Score ${review.score}/10\n${review.summary}\n${review.issues.length > 0 ? '\nIssues:\n' + review.issues.map((i) => `- [${i.severity}] ${i.file}: ${i.description}`).join('\n') : '\nNo issues found.'}`
            } catch {
              reviewSummary = `**Code Review:** ${cleaned.slice(0, 500)}`
            }

            await recordStreamUsage({ userId: user.id, projectId, eventType: 'action_auto_build_task', model: DEFAULT_MODEL_ID, usage: reviewResult.usage })
          } catch {
            reviewSummary = '_Code review skipped (error)_'
          }

          // UI/UX Designer validates implementation matches wireframes
          let designReview = ''
          try {
            // Check if there are approved design artifacts for this feature
            const { data: designs } = await adminClient
              .from('design_artifacts')
              .select('screen_name, content')
              .eq('project_id', projectId)
              .eq('status', 'approved')
              .limit(3)

            if (designs && designs.length > 0) {
              const designContext = designs
                .map((d) => `Screen: ${d.screen_name}\nHTML:\n${(d.content ?? '').slice(0, 2000)}`)
                .join('\n\n---\n\n')

              const { text: designReviewText, usage: designUsage } = await generateText({
                model: defaultModel,
                system: `Eres el UI/UX Designer revisando si el codigo implementado coincide con los wireframes aprobados.
Compara la estructura, jerarquia visual, y componentes del codigo vs el wireframe HTML.
Responde en 2-3 lineas: que coincide, que no coincide, y sugerencias.`,
                prompt: `Wireframes aprobados:\n${designContext.slice(0, 4000)}\n\nCodigo generado:\n${text.slice(0, 3000)}`,
                maxOutputTokens: 500,
                temperature: 0.3,
              })
              designReview = `\n\n**Design Review (UI/UX Designer):** ${designReviewText.slice(0, 300)}`
              await recordStreamUsage({ userId: user.id, projectId, eventType: 'action_auto_build_task', model: DEFAULT_MODEL_ID, usage: designUsage })
            }
          } catch { /* non-fatal */ }

          // Create Pull Request from feature branch to main (includes review)
          let prUrl: string | undefined
          if (project.repo_url) {
            const { createPullRequest } = await import('@/lib/github/commit')
            const prResult = await createPullRequest(
              project.repo_url,
              branchName,
              `feat(${task.task_key}): ${task.title}`,
              `## ${task.task_key}: ${task.title}\n\n**Feature:** ${featureName}\n\n${reviewSummary}${designReview}\n\n### Cambios\n${text.slice(0, 2000)}\n\n---\n_Auto-generated by Tribux Build Session_`,
            )
            prUrl = prResult.html_url
          }

          await recordActionComplete(
            executionId,
            'success',
            `Auto-built ${task.task_key}: ${task.title}`,
            { taskId, taskKey: task.task_key, branch: branchName, prUrl },
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
