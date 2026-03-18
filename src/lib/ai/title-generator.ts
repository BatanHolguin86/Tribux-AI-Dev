import { generateText } from 'ai'
import { defaultModel, AI_CONFIG } from './anthropic'
import { recordAiUsage, estimateTokensFromText } from './usage'
import type { SupabaseClient } from '@supabase/supabase-js'

type TitleTrackingOptions = {
  supabase: SupabaseClient
  userId: string
  projectId?: string
}

export async function generateThreadTitle(
  firstMessage: string,
  tracking?: TitleTrackingOptions,
): Promise<string> {
  try {
    const prompt = `Generate a short conversation title (max 50 characters, in Spanish) for a conversation that starts with this message. Return ONLY the title, nothing else:\n\n"${firstMessage.slice(0, 200)}"`
    const { text, usage } = await generateText({
      model: defaultModel,
      prompt,
      maxOutputTokens: AI_CONFIG.threadTitle.maxOutputTokens,
      temperature: AI_CONFIG.threadTitle.temperature,
    })

    // Record AI usage for financial backoffice
    if (tracking) {
      const inputTokens = usage?.inputTokens ?? estimateTokensFromText(prompt)
      const outputTokens = usage?.outputTokens ?? estimateTokensFromText(text)
      recordAiUsage(tracking.supabase, {
        userId: tracking.userId,
        projectId: tracking.projectId,
        eventType: 'thread_title',
        model: defaultModel?.toString?.() ?? undefined,
        inputTokens,
        outputTokens,
      }).catch(() => {})
    }

    const title = text.trim().replace(/^["']|["']$/g, '')
    return title || fallbackTitle()
  } catch {
    return fallbackTitle()
  }
}

function fallbackTitle(): string {
  const now = new Date()
  return `Conversacion ${now.toLocaleDateString('es-LA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
}
