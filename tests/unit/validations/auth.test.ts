import { describe, it, expect } from 'vitest'
import { registerSchema, loginSchema, forgotPasswordSchema, onboardingCompleteSchema } from '@/lib/validations/auth'

describe('registerSchema', () => {
  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'secure123',
      full_name: 'John Doe',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'not-an-email',
      password: 'secure123',
      full_name: 'John',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short password', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'short1',
      full_name: 'John',
    })
    expect(result.success).toBe(false)
  })

  it('rejects password without number', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'nothingbutalpha',
      full_name: 'John',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty full_name', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'secure123',
      full_name: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects full_name over 100 chars', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'secure123',
      full_name: 'A'.repeat(101),
    })
    expect(result.success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('accepts valid login', () => {
    const result = loginSchema.safeParse({
      email: 'user@test.com',
      password: 'any',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'user@test.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'a@b.com' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'bad' })
    expect(result.success).toBe(false)
  })
})

describe('onboardingCompleteSchema', () => {
  it('accepts valid onboarding data', () => {
    const result = onboardingCompleteSchema.safeParse({
      persona: 'founder',
      project: { name: 'My App' },
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid persona', () => {
    const result = onboardingCompleteSchema.safeParse({
      persona: 'invalid_role',
      project: { name: 'My App' },
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty project name', () => {
    const result = onboardingCompleteSchema.safeParse({
      persona: 'founder',
      project: { name: '' },
    })
    expect(result.success).toBe(false)
  })

  it('accepts all valid personas', () => {
    for (const persona of ['founder', 'pm', 'consultor', 'emprendedor']) {
      const result = onboardingCompleteSchema.safeParse({
        persona,
        project: { name: 'Test' },
      })
      expect(result.success).toBe(true)
    }
  })
})
