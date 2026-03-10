/**
 * Provider abstraction layer for LLM models.
 * Allows switching between Anthropic, OpenAI, etc. via AI_PROVIDER env.
 *
 * @see docs/02-architecture/decisions/ADR-006-provider-abstraction.md
 */

import { anthropic } from '@ai-sdk/anthropic'
import type { LanguageModelV1 } from 'ai'

const PROVIDER = (process.env.AI_PROVIDER ?? 'anthropic').toLowerCase()

export function getDefaultModel(): LanguageModelV1 {
  switch (PROVIDER) {
    case 'anthropic':
      return anthropic('claude-sonnet-4-6')
    case 'openai': {
      // Lazy load to avoid bundling OpenAI SDK when not used
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { openai } = require('@ai-sdk/openai')
      return openai('gpt-4o')
    }
    default:
      return anthropic('claude-sonnet-4-6')
  }
}

export function getProviderName(): string {
  return PROVIDER
}
