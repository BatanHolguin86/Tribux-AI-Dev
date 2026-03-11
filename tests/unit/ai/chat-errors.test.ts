import { describe, it, expect } from 'vitest'
import { isCreditsError, formatChatErrorResponse, CREDITS_ERROR_CODE } from '@/lib/ai/chat-errors'

describe('isCreditsError', () => {
  it('detects credit balance message', () => {
    expect(isCreditsError(new Error('Your credit balance is too low'))).toBe(true)
  })

  it('detects credits keyword', () => {
    expect(isCreditsError(new Error('Insufficient credits'))).toBe(true)
  })

  it('detects insufficient keyword', () => {
    expect(isCreditsError(new Error('Insufficient funds to process'))).toBe(true)
  })

  it('returns false for unrelated errors', () => {
    expect(isCreditsError(new Error('Network timeout'))).toBe(false)
  })

  it('handles string errors', () => {
    expect(isCreditsError('credit balance is zero')).toBe(true)
  })

  it('handles non-error objects with responseBody', () => {
    const err = { message: 'API error', responseBody: 'credits exhausted' }
    expect(isCreditsError(err)).toBe(true)
  })

  it('detects credits in response body', () => {
    const err = { message: 'API error', responseBody: '{"error":"credit balance too low"}' }
    expect(isCreditsError(err)).toBe(true)
  })
})

describe('formatChatErrorResponse', () => {
  it('returns 402 for credits errors', () => {
    const result = formatChatErrorResponse(new Error('Insufficient credits'))
    expect(result.status).toBe(402)
    expect(result.body.code).toBe(CREDITS_ERROR_CODE)
  })

  it('returns 500 for generic errors', () => {
    const result = formatChatErrorResponse(new Error('Something went wrong'))
    expect(result.status).toBe(500)
    expect(result.body.error).toBe('Something went wrong')
  })

  it('handles non-Error objects', () => {
    const result = formatChatErrorResponse('string error')
    expect(result.status).toBe(500)
    expect(result.body.message).toBeTruthy()
  })
})
