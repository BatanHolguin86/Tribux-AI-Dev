import { anthropic } from '@ai-sdk/anthropic'

export const defaultModel = anthropic('claude-sonnet-4-6')

export const AI_CONFIG = {
  chat: { maxTokens: 4096, temperature: 0.7 },
  documentGeneration: { maxTokens: 8192, temperature: 0.5 },
  threadTitle: { maxTokens: 50, temperature: 0.3 },
  featureSuggestions: { maxTokens: 2048, temperature: 0.6 },
  designPrompts: { maxTokens: 4096, temperature: 0.5 },
} as const
