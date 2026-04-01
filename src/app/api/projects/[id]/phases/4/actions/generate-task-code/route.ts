import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, DEFAULT_MODEL_ID, AI_CONFIG } from '@/lib/ai/anthropic'
import { getGitHubRepoContext, formatRepoContext } from '@/lib/github/repo-context'
import { fetchMultipleFiles } from '@/lib/github/file-content'
import { extractCodeFiles } from '@/lib/ai/code-extractor'
import { recordActionStart, recordActionComplete } from '@/lib/actions/execute'
import { recordStreamUsage } from '@/lib/ai/usage'
import { generateTaskCodePrompt } from '@/lib/ai/prompts/action-prompts'
import { checkRateLimit, getClientIp, ACTION_RATE_LIMIT } from '@/lib/rate-limit'

export const maxDuration = 60

/**
 * Selects relevant source files from the repo tree based on the task context.
 * Picks files that are likely related to the task's feature area.
 */
function selectRelevantFiles(tree: string, taskTitle: string, featureName: string): string[] {
  if (!tree) return []

  const allFiles = tree.split('\n').filter(Boolean)
  const keywords = [
    ...taskTitle.toLowerCase().split(/[\s\-_/]+/),
    ...featureName.toLowerCase().split(/[\s\-_/]+/),
  ].filter((k) => k.length > 2)

  // Always include key config/layout files
  const alwaysInclude = [
    'src/app/layout.tsx',
    'src/lib/supabase/client.ts',
    'src/lib/supabase/server.ts',
    'src/middleware.ts',
    'package.json',
    'tsconfig.json',
    'tailwind.config.ts',
  ]

  const picked = new Set<string>()

  // Include always-relevant files that exist
  for (const f of alwaysInclude) {
    if (allFiles.includes(f)) picked.add(f)
  }

  // Score and pick related source files
  const scored = allFiles
    .filter((f) => f.startsWith('src/') && /\.(ts|tsx|css)$/.test(f))
    .map((f) => {
      const lower = f.toLowerCase()
      let score = 0
      for (const kw of keywords) {
        if (lower.includes(kw)) score += 2
      }
      // Boost component/lib/app files
      if (lower.includes('component')) score += 1
      if (lower.includes('lib/')) score += 1
      if (lower.includes('app/api/')) score += 1
      return { path: f, score }
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)

  for (const s of scored) {
    picked.add(s.path)
  }

  // Cap at 15 files to avoid exceeding token limits
  return Array.from(picked).slice(0, 15)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let executionId = ''

  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    // 1. Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // 2. Get taskId from body
    const { taskId } = await request.json()
    if (!taskId) {
      return Response.json(
        { error: 'validation_error', message: 'taskId es requerido.' },
        { status: 400 },
      )
    }

    // 3. Verify project belongs to user and get repo_url
    const { data: project } = await supabase
      .from('projects')
      .select('id, repo_url, user_id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return Response.json(
        { error: 'not_found', message: 'Proyecto no encontrado.' },
        { status: 404 },
      )
    }

    if (!project.repo_url) {
      return Response.json(
        { error: 'no_repo', message: 'El proyecto no tiene repositorio GitHub conectado.' },
        { status: 400 },
      )
    }

    // 4. Load task from project_tasks
    const { data: task } = await supabase
      .from('project_tasks')
      .select('*, project_features(name)')
      .eq('id', taskId)
      .eq('project_id', projectId)
      .single()

    if (!task) {
      return Response.json(
        { error: 'not_found', message: 'Task no encontrada.' },
        { status: 404 },
      )
    }

    const featureName = (task.project_features as unknown as { name: string })?.name ?? 'Unknown Feature'

    // 5. Rate limit
    const ip = getClientIp(request)
    const rateLimitKey = `action:${user.id}:${ip}`
    const rateResult = checkRateLimit(rateLimitKey, ACTION_RATE_LIMIT)
    if (!rateResult.allowed) {
      return Response.json(
        { error: 'rate_limited', message: 'Limite de acciones por hora alcanzado. Intenta mas tarde.' },
        { status: 429 },
      )
    }

    // 6. Load feature specs (requirements.md, design.md from feature_documents)
    let requirements = ''
    let design = ''

    if (task.feature_id) {
      const { data: featureDocs } = await supabase
        .from('feature_documents')
        .select('document_type, content')
        .eq('project_id', projectId)
        .eq('feature_id', task.feature_id)
        .in('document_type', ['requirements', 'design'])

      for (const doc of featureDocs ?? []) {
        if (doc.document_type === 'requirements') requirements = doc.content ?? ''
        if (doc.document_type === 'design') design = doc.content ?? ''
      }
    }

    // 7. Build repo context via getGitHubRepoContext
    const repoCtx = await getGitHubRepoContext(project.repo_url)
    const repoContext = formatRepoContext(repoCtx)

    // 8. Fetch relevant source files from repo
    const relevantPaths = selectRelevantFiles(repoCtx.tree, task.title, featureName)
    const existingFiles = await fetchMultipleFiles(project.repo_url, relevantPaths)
    const existingCode = Object.entries(existingFiles)
      .map(([path, content]) => `### ${path}\n\`\`\`\n${content}\n\`\`\``)
      .join('\n\n')

    // 9. Record action start
    executionId = await recordActionStart(
      projectId,
      4,
      'tasks',
      0,
      `generate-task-code:${task.task_key}`,
    )

    // 10. Build prompt and stream
    const systemPrompt = generateTaskCodePrompt({
      taskTitle: task.title,
      taskKey: task.task_key,
      featureName,
      requirements,
      design,
      repoContext,
      existingCode,
    })

    const result = streamText({
      model: defaultModel,
      system: systemPrompt,
      messages: [
        {
          role: 'user' as const,
          content: `Implement task ${task.task_key}: ${task.title}. Generate all necessary files with filepath annotations.`,
        },
      ],
      ...AI_CONFIG.documentGeneration,
      onFinish: async ({ text, usage }) => {
        await recordStreamUsage({ userId: user.id, projectId, eventType: 'action_generate_task_code', model: DEFAULT_MODEL_ID, usage })
        try {
          // Extract files to record what was generated (commit happens via commit-task-files endpoint)
          const extractedFiles = extractCodeFiles(text)
          if (extractedFiles.length === 0) {
            await recordActionComplete(executionId, 'failed', undefined, undefined, 'No files extracted from AI output')
            return
          }
          await recordActionComplete(
            executionId,
            'success',
            `Generated ${extractedFiles.length} files for ${task.task_key} (pending commit)`,
            { taskId, taskKey: task.task_key, files: extractedFiles.map((f) => f.path) },
          )
        } catch (error) {
          console.error('[generate-task-code] Post-stream error:', error)
          const message = error instanceof Error ? error.message : 'Error desconocido'
          await recordActionComplete(executionId, 'failed', undefined, undefined, message)
        }
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[generate-task-code] Error:', error)
    if (executionId) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      await recordActionComplete(executionId, 'failed', undefined, undefined, message)
    }
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return Response.json(
      { error: 'action_failed', message },
      { status: 500 },
    )
  }
}
