import { describe, it, expect } from 'vitest'
import { createFeatureSchema, updateFeatureSchema } from '@/lib/validations/features'

describe('createFeatureSchema', () => {
  it('accepts valid feature', () => {
    const result = createFeatureSchema.safeParse({ name: 'Auth Flow' })
    expect(result.success).toBe(true)
  })

  it('accepts feature with description', () => {
    const result = createFeatureSchema.safeParse({
      name: 'Auth Flow',
      description: 'User authentication with email and OAuth',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = createFeatureSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects name over 100 chars', () => {
    const result = createFeatureSchema.safeParse({ name: 'A'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('rejects description over 500 chars', () => {
    const result = createFeatureSchema.safeParse({
      name: 'Test',
      description: 'D'.repeat(501),
    })
    expect(result.success).toBe(false)
  })
})

describe('updateFeatureSchema', () => {
  it('accepts partial update with name', () => {
    const result = updateFeatureSchema.safeParse({ name: 'New Name' })
    expect(result.success).toBe(true)
  })

  it('accepts partial update with display_order', () => {
    const result = updateFeatureSchema.safeParse({ display_order: 3 })
    expect(result.success).toBe(true)
  })

  it('rejects negative display_order', () => {
    const result = updateFeatureSchema.safeParse({ display_order: -1 })
    expect(result.success).toBe(false)
  })

  it('rejects non-integer display_order', () => {
    const result = updateFeatureSchema.safeParse({ display_order: 1.5 })
    expect(result.success).toBe(false)
  })

  it('accepts empty update (all optional)', () => {
    const result = updateFeatureSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})
