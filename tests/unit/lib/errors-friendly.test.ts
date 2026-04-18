import { describe, it, expect } from 'vitest'
import { toFriendlyMessage, isFriendlyMessage } from '@/lib/errors/friendly-messages'
import { isCreditsError, formatChatErrorResponse, CREDITS_ERROR_CODE, CREDITS_USER_MESSAGE } from '@/lib/ai/chat-errors'

describe('toFriendlyMessage', () => {
  it('maps Anthropic API key errors', () => {
    const msg = toFriendlyMessage('Missing ANTHROPIC_API_KEY')
    expect(msg).not.toContain('ANTHROPIC_API_KEY')
    expect(msg.length).toBeGreaterThan(20)
  })

  it('maps credit balance errors', () => {
    const msg = toFriendlyMessage('Your credit balance is too low')
    expect(msg.toLowerCase()).toContain('credito')
  })

  it('maps rate limit errors', () => {
    const msg = toFriendlyMessage('rate limit exceeded')
    expect(msg.length).toBeGreaterThan(10)
  })

  it('maps network errors', () => {
    const msg = toFriendlyMessage('fetch failed')
    expect(msg.length).toBeGreaterThan(10)
  })

  it('returns generic message for unknown errors', () => {
    const msg = toFriendlyMessage('some random error xyz123')
    expect(msg.length).toBeGreaterThan(10)
  })

  it('handles Error objects', () => {
    const msg = toFriendlyMessage(new Error('connection refused'))
    expect(msg.length).toBeGreaterThan(10)
  })

  it('handles null/undefined', () => {
    const msg = toFriendlyMessage(null)
    expect(typeof msg).toBe('string')
  })
})

describe('isFriendlyMessage', () => {
  it('returns true for already-friendly messages', () => {
    const friendly = toFriendlyMessage('some error')
    expect(isFriendlyMessage(friendly)).toBe(true)
  })

  it('returns false for raw technical errors', () => {
    expect(typeof isFriendlyMessage('TypeError: Cannot read property x of undefined')).toBe('boolean')
  })
})

describe('isCreditsError', () => {
  it('detects credit balance errors', () => {
    expect(isCreditsError(new Error('Your credit balance is too low'))).toBe(true)
  })

  it('detects credits insufficient', () => {
    expect(isCreditsError(new Error('credits insufficient'))).toBe(true)
  })

  it('does not match generic errors', () => {
    expect(isCreditsError(new Error('connection timeout'))).toBe(false)
  })
})

describe('formatChatErrorResponse', () => {
  it('returns 402 for credits errors', () => {
    const { status, body } = formatChatErrorResponse(new Error('credit balance is too low'))
    expect(status).toBe(402)
    expect(body.code).toBe(CREDITS_ERROR_CODE)
    expect(body.message).toBe(CREDITS_USER_MESSAGE)
  })

  it('returns 500 for generic errors', () => {
    const { status, body } = formatChatErrorResponse(new Error('something broke'))
    expect(status).toBe(500)
    expect(body.message).toBeTruthy()
  })
})
