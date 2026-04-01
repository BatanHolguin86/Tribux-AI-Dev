import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, DEFAULT_MODEL_ID } from '@/lib/ai/anthropic'
import { getGitHubRepoContext } from '@/lib/github/repo-context'
import { checkHeavyQuota } from '@/lib/plans/quota'
import { checkRateLimit, getClientIp, ACTION_RATE_LIMIT } from '@/lib/rate-limit'
import { recordStreamUsage } from '@/lib/ai/usage'

export const maxDuration = 60

const ANALYZE_SYSTEM = `You are a senior developer planning the implementation of a task.

Given the task details and codebase context, produce a concise BUILD PLAN.
Do NOT write any code. Only the plan.

Use this exact format:

## Files to Create
- path/to/file.tsx — purpose in one sentence

## Files to Modify
- path/to/existing.ts — what specific changes are needed

## Tests to Add
- tests/unit/.../Name.test.ts — what behavior will be tested

## Approach
2-3 sentences describing the technical strategy and key decisions.

Reference actual paths from the repo tree. Be specific and concise.`

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // Quota check — block heavy AI ops if budget exceeded
  const quotaBlock = await checkHeavyQuota(user.id)
  if (quotaBlock) return quotaBlock

  const body = await request.json()
  const taskId: string = body.taskId
  if (!taskId) return Response.json({ error: 'taskId required' }, { status: 400 })

  const ip = getClientIp(request)
  if (!checkRateLimit(`action:${user.id}:${ip}`, ACTION_RATE_LIMIT).allowed) {
    return Response.json({ error: 'rate_limited' }, { status: 429 })
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id, repo_url')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project?.repo_url) return Response.json({ error: 'no_repo' }, { status: 400 })

  const { data: task } = await supabase
    .from('project_tasks')
    .select('*, project_features(name)')
    .eq('id', taskId)
    .eq('project_id', projectId)
    .single()

  if (!task) return Response.json({ error: 'task_not_found' }, { status: 404 })

  const featureName =
    (task.project_features as unknown as { name: string })?.name ?? 'Unknown Feature'

  // Load feature specs
  let requirements = ''
  let design = ''
  if (task.feature_id) {
    const { data: docs } = await supabase
      .from('feature_documents')
      .select('document_type, content')
      .eq('project_id', projectId)
      .eq('feature_id', task.feature_id)
      .in('document_type', ['requirements', 'design'])
    for (const doc of docs ?? []) {
      if (doc.document_type === 'requirements') requirements = doc.content ?? ''
      if (doc.document_type === 'design') design = doc.content ?? ''
    }
  }

  // Repo tree for context
  const repoCtx = await getGitHubRepoContext(project.repo_url)
  const tree = repoCtx?.tree?.slice(0, 3000) ?? 'No repo tree available'

  const userMessage = `Task: ${task.task_key} — ${task.title}
Feature: ${featureName}
${task.description ? `Description: ${task.description}` : ''}
${task.acceptance_criteria ? `Acceptance Criteria:\n${task.acceptance_criteria}` : ''}

Requirements:
${requirements.slice(0, 2000) || 'N/A'}

Design:
${design.slice(0, 2000) || 'N/A'}

Repository Tree:
${tree}`

  const result = streamText({
    model: defaultModel,
    system: ANALYZE_SYSTEM,
    messages: [{ role: 'user', content: userMessage }],
    maxOutputTokens: 800,
    temperature: 0.3,
    onFinish: async ({ usage }) => {
      await recordStreamUsage({ userId: user.id, projectId, eventType: 'action_analyze_task', model: DEFAULT_MODEL_ID, usage })
    },
  })

  return result.toTextStreamResponse()
}
