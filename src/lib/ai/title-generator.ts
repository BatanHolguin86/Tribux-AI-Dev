import { generateText } from 'ai'
import { defaultModel, AI_CONFIG } from './anthropic'

export async function generateThreadTitle(firstMessage: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: defaultModel,
      prompt: `Generate a short conversation title (max 50 characters, in Spanish) for a conversation that starts with this message. Return ONLY the title, nothing else:\n\n"${firstMessage.slice(0, 200)}"`,
      maxOutputTokens: AI_CONFIG.threadTitle.maxTokens,
      temperature: AI_CONFIG.threadTitle.temperature,
    })

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
