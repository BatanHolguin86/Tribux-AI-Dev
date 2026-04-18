import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { defaultModel } from '@/lib/ai/anthropic'
import { buildAutoFixPrompt } from '@/lib/ai/prompts/auto-fix-agent'
import { commitMultipleFiles, createBranch, createPullRequest } from '@/lib/github/commit'
import { fetchFileContent, fetchDirectoryListing } from '@/lib/github/file-content'
import { recordActionStart, recordActionComplete } from '@/lib/actions/execute'
import { recordStreamUsage } from '@/lib/ai/usage'

export const maxDuration = 60

type AutoFixInput = {
  errorMessage: string
  stackTrace?: string
  affectedUrl?: string
}

/**
 * POST /api/projects/[id]/phases/6/actions/auto-fix
 * Autonomous bug fix: analyze error → find affected code → generate fix → create PR
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: project } = await supabase
    .from('projects')
    .select('id, repo_url, user_id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project?.repo_url) {
    return Response.json({ error: 'No hay repositorio configurado.' }, { status: 400 })
  }

  const body: AutoFixInput = await request.json()

  if (!body.errorMessage?.trim()) {
    return Response.json({ error: 'errorMessage requerido.' }, { status: 400 })
  }

  let executionId = ''
  try {
    executionId = await recordActionStart(projectId, 6, 'deploy_production', 0, 'auto-fix')
  } catch { /* non-fatal */ }

  try {
    // Step 1: Get repo structure
    const repoTree = await fetchDirectoryListing(project.repo_url!, 'src')
    const repoStructure = (repoTree ?? []).join('\n')

    // Step 2: Find related files from stack trace
    const relatedFiles: Array<{ path: string; content: string }> = []

    if (body.stackTrace) {
      // Extract file paths from stack trace
      const pathMatches = body.stackTrace.match(/src\/[^\s:)]+/g) ?? []
      const uniquePaths = [...new Set(pathMatches)].slice(0, 3)

      for (const filePath of uniquePaths) {
        const content = await fetchFileContent(project.repo_url!, filePath)
        if (content) {
          relatedFiles.push({ path: filePath, content })
        }
      }
    }

    // Step 3: Generate fix with AI
    const prompt = buildAutoFixPrompt({
      errorMessage: body.errorMessage,
      stackTrace: body.stackTrace,
      affectedUrl: body.affectedUrl,
      repoStructure,
      relatedFiles,
    })

    const { text, usage } = await generateText({
      model: defaultModel,
      prompt,
      maxOutputTokens: 2048,
      temperature: 0.2,
    })

    await recordStreamUsage({
      userId: user.id,
      projectId,
      eventType: 'action_auto_build_task',
      model: null,
      usage: { inputTokens: usage?.inputTokens, outputTokens: usage?.outputTokens },
    })

    // Step 4: Parse the fix
    const cleaned = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
    let fix: {
      analysis: string
      file: string
      fix: { old_snippet: string; new_snippet: string }
      commit_message: string
      severity: string
      confidence: string
    }

    try {
      fix = JSON.parse(cleaned)
    } catch {
      if (executionId) await recordActionComplete(executionId, 'failed', undefined, undefined, 'AI no genero JSON valido')
      return Response.json({
        success: false,
        error: 'El agente no pudo generar un fix estructurado.',
        analysis: text,
      })
    }

    // Step 5: Create branch + commit + PR
    const branchName = `fix/auto-${Date.now()}`
    await createBranch(project.repo_url, branchName)

    // Get current file content to apply edit
    const currentContent = await fetchFileContent(project.repo_url!, fix.file)
    if (!currentContent) {
      if (executionId) await recordActionComplete(executionId, 'failed', undefined, undefined, `Archivo ${fix.file} no encontrado`)
      return Response.json({ success: false, error: `Archivo ${fix.file} no encontrado en el repo.`, analysis: fix.analysis })
    }

    const newContent = currentContent.replace(fix.fix.old_snippet, fix.fix.new_snippet)

    if (newContent === currentContent) {
      if (executionId) await recordActionComplete(executionId, 'failed', undefined, undefined, 'El snippet no se encontro en el archivo')
      return Response.json({ success: false, error: 'No se pudo aplicar el fix (snippet no encontrado en el archivo).', analysis: fix.analysis })
    }

    await commitMultipleFiles(
      project.repo_url,
      [{ path: fix.file, content: newContent }],
      fix.commit_message,
      branchName,
    )

    const pr = await createPullRequest(
      project.repo_url,
      branchName,
      fix.commit_message,
      `## Auto-fix generado por Tribux AI\n\n**Error:** ${body.errorMessage}\n\n**Analisis:** ${fix.analysis}\n\n**Severidad:** ${fix.severity}\n**Confianza:** ${fix.confidence}\n\n**Archivo:** \`${fix.file}\`\n\n---\n_Generado automaticamente por el agente Auto-Fix de Tribux AI_`,
    )

    if (executionId) {
      await recordActionComplete(executionId, 'success', fix.commit_message, {
        file: fix.file,
        branch: branchName,
        prUrl: pr.html_url,
        severity: fix.severity,
        confidence: fix.confidence,
      })
    }

    return Response.json({
      success: true,
      analysis: fix.analysis,
      file: fix.file,
      branch: branchName,
      prUrl: pr.html_url,
      severity: fix.severity,
      confidence: fix.confidence,
      commitMessage: fix.commit_message,
    })
  } catch (error) {
    console.error('[auto-fix] Error:', error)
    if (executionId) await recordActionComplete(executionId, 'failed', undefined, undefined, String(error))
    return Response.json({ error: 'Error al generar el fix.' }, { status: 500 })
  }
}
