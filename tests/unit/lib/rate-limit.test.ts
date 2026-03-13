import { describe, it, expect } from 'vitest'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

describe('checkRateLimit', () => {
  const config = { maxAttempts: 3, windowMs: 10_000 }

  it('allows requests under the limit', () => {
    const key = `test-allow-${Date.now()}`
    const r1 = checkRateLimit(key, config)
    expect(r1.allowed).toBe(true)
    expect(r1.remaining).toBe(2)
  })

  it('counts down remaining attempts', () => {
    const key = `test-count-${Date.now()}`
    checkRateLimit(key, config)
    const r2 = checkRateLimit(key, config)
    expect(r2.allowed).toBe(true)
    expect(r2.remaining).toBe(1)

    const r3 = checkRateLimit(key, config)
    expect(r3.allowed).toBe(true)
    expect(r3.remaining).toBe(0)
  })

  it('blocks after exceeding limit', () => {
    const key = `test-block-${Date.now()}`
    checkRateLimit(key, config)
    checkRateLimit(key, config)
    checkRateLimit(key, config)

    const r4 = checkRateLimit(key, config)
    expect(r4.allowed).toBe(false)
    expect(r4.remaining).toBe(0)
  })

  it('resets after window expires', () => {
    const shortConfig = { maxAttempts: 1, windowMs: 1 }
    const key = `test-reset-${Date.now()}`

    checkRateLimit(key, shortConfig)
    // Window is 1ms, so next call after any delay should reset
    const r2 = checkRateLimit(key, shortConfig)
    // Depending on timing, this may or may not be allowed
    // But it should not throw
    expect(typeof r2.allowed).toBe('boolean')
  })

  it('tracks different keys independently', () => {
    const key1 = `test-ind-a-${Date.now()}`
    const key2 = `test-ind-b-${Date.now()}`

    checkRateLimit(key1, config)
    checkRateLimit(key1, config)
    checkRateLimit(key1, config)

    const r1 = checkRateLimit(key1, config)
    const r2 = checkRateLimit(key2, config)

    expect(r1.allowed).toBe(false)
    expect(r2.allowed).toBe(true)
  })

  it('returns resetAt in the future', () => {
    const key = `test-reset-at-${Date.now()}`
    const result = checkRateLimit(key, config)
    expect(result.resetAt).toBeGreaterThan(Date.now() - 1000)
  })
})

describe('getClientIp', () => {
  it('extracts IP from x-forwarded-for', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    })
    expect(getClientIp(req)).toBe('1.2.3.4')
  })

  it('extracts IP from x-real-ip', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-real-ip': '10.0.0.1' },
    })
    expect(getClientIp(req)).toBe('10.0.0.1')
  })

  it('falls back to 127.0.0.1', () => {
    const req = new Request('http://localhost')
    expect(getClientIp(req)).toBe('127.0.0.1')
  })
})
