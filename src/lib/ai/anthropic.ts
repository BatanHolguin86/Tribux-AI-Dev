import { getDefaultModel } from './models'

/** Default LLM model — resolved via AI_PROVIDER (anthropic|openai). */
export const defaultModel = getDefaultModel()

export const AI_CONFIG = {
  chat: { maxOutputTokens: 4096, temperature: 0.7 },
  documentGeneration: { maxOutputTokens: 8192, temperature: 0.5 },
  threadTitle: { maxOutputTokens: 50, temperature: 0.3 },
  featureSuggestions: { maxOutputTokens: 2048, temperature: 0.6 },
  designPrompts: { maxOutputTokens: 8192, temperature: 0.5 },
} as const
