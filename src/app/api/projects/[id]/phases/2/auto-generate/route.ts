import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import { buildPhase02Context } from '@/lib/ai/context-builder'
import { buildDocumentGenerationPrompt, SECTION_DOC_NAMES } from '@/lib/ai/prompts/phase-02'
import { PHASE02_SECTIONS } from '@/lib/ai/prompts/phase-02'
import type { Phase02Section } from '@/types/conversation'
import { recordAiUsage, estimateTokensFromText } from '@/lib/ai/usage'

export const maxDuration = 300

/**
 * Auto-generates all 4 architecture documents for Founder Mode.
 * Called when a founder enters Phase 02 and documents don't exist yet.
 * Generates sequentially to avoid rate limits.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // Rate limit — expensive operation (4 AI calls)
  const { checkRateLimit, getClientIp, ACTION_RATE_LIMIT } = await import('@/lib/rate-limit')
  const ip = getClientIp(request)
  const rateResult = checkRateLimit(`auto-generate:${user.id}:${ip}`, ACTION_RATE_LIMIT)
  if (!rateResult.allowed) {
    return Response.json({ error: 'rate_limited' }, { status: 429 })
  }

  const adminClient = await createAdminClient()

  // Check which sections already have documents
  const { data: existingDocs } = await adminClient
    .from('project_documents')
    .select('section')
    .eq('project_id', projectId)
    .eq('phase_number', 2)

  const existingSections = new Set((existingDocs ?? []).map((d) => d.section))
  const sectionsToGenerate = PHASE02_SECTIONS.filter((s) => !existingSections.has(s))

  if (sectionsToGenerate.length === 0) {
    return Response.json({ generated: 0, message: 'All documents already exist' })
  }

  const context = await buildPhase02Context(projectId)
  const results: Array<{ section: string; success: boolean }> = []

  for (const sectionKey of sectionsToGenerate) {
    try {
      const systemPrompt = buildDocumentGenerationPrompt(sectionKey as Phase02Section, context)

      const { text, usage } = await generateText({
        model: defaultModel,
        system: systemPrompt,
        prompt: `Genera el documento completo de ${sectionKey.replace(/_/g, ' ')} para este proyecto. Basate en el Discovery aprobado y los specs KIRO. No necesitas conversacion previa — genera directamente el documento completo.`,
        ...AI_CONFIG.documentGeneration,
      })

      const docName = SECTION_DOC_NAMES[sectionKey as Phase02Section]

      // Save document
      await adminClient.from('project_documents').insert({
        project_id: projectId,
        phase_number: 2,
        section: sectionKey,
        document_type: sectionKey,
        storage_path: `projects/${projectId}/architecture/${docName}`,
        content: text,
        version: 1,
        status: 'approved',
        approved_at: new Date().toISOString(),
      })

      // Update phase section
      await adminClient.from('phase_sections').upsert(
        {
          project_id: projectId,
          phase_number: 2,
          section: sectionKey,
          status: 'approved',
          approved_at: new Date().toISOString(),
        },
        { onConflict: 'project_id,phase_number,section' },
      )

      // Record usage
      const inputTokens = usage?.inputTokens ?? estimateTokensFromText(systemPrompt)
      const outputTokens = usage?.outputTokens ?? estimateTokensFromText(text)
      recordAiUsage(supabase, {
        userId: user.id,
        projectId,
        eventType: 'phase02_generate',
        model: defaultModel?.toString?.() ?? undefined,
        inputTokens,
        outputTokens,
      }).catch(() => {})

      results.push({ section: sectionKey, success: true })
    } catch (err) {
      console.error(`[auto-generate] Failed for ${sectionKey}:`, err)
      results.push({ section: sectionKey, success: false })
    }
  }

  return Response.json({
    generated: results.filter((r) => r.success).length,
    total: sectionsToGenerate.length,
    results,
  })
}
