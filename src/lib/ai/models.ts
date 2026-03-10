/**
 * Provider abstraction layer for LLM models.
 * Allows switching between Anthropic, OpenAI, etc. via AI_PROVIDER env.
 *
 * @see docs/02-architecture/decisions/ADR-006-provider-abstraction.md
 */

import { anthropic } from '@ai-sdk/anthropic'
import type { LanguageModel } from 'ai'

const PROVIDER = (process.env.AI_PROVIDER ?? 'anthropic').toLowerCase()

export function getDefaultModel(): LanguageModel {
  switch (PROVIDER) {
    case 'anthropic':
      return anthropic('claude-sonnet-4-6')
    case 'openai':
      throw new Error(
        'AI_PROVIDER=openai requires: pnpm add @ai-sdk/openai and OPENAI_API_KEY. ' +
          'Using anthropic for now. See ADR-006.'
      )
    default:
      return anthropic('claude-sonnet-4-6')
  }
}

export function getProviderName(): string {
  return PROVIDER
}
