import { describe, it, expect } from 'vitest'
import { createProjectSchema, updateProjectSchema } from '@/lib/validations/projects'

describe('createProjectSchema', () => {
  it('accepts valid project', () => {
    const result = createProjectSchema.safeParse({ name: 'My SaaS' })
    expect(result.success).toBe(true)
  })

  it('accepts project with all fields', () => {
    const result = createProjectSchema.safeParse({
      name: 'My SaaS',
      description: 'A SaaS product',
      industry: 'Fintech',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = createProjectSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects name over 100 chars', () => {
    const result = createProjectSchema.safeParse({ name: 'X'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('rejects description over 500 chars', () => {
    const result = createProjectSchema.safeParse({
      name: 'Test',
      description: 'D'.repeat(501),
    })
    expect(result.success).toBe(false)
  })

  it('rejects industry over 50 chars', () => {
    const result = createProjectSchema.safeParse({
      name: 'Test',
      industry: 'I'.repeat(51),
    })
    expect(result.success).toBe(false)
  })
})

describe('updateProjectSchema', () => {
  it('accepts valid status update', () => {
    const result = updateProjectSchema.safeParse({ status: 'paused' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid status', () => {
    const result = updateProjectSchema.safeParse({ status: 'deleted' })
    expect(result.success).toBe(false)
  })

  it('accepts all valid statuses', () => {
    for (const status of ['active', 'paused', 'archived']) {
      const result = updateProjectSchema.safeParse({ status })
      expect(result.success).toBe(true)
    }
  })

  it('accepts empty update', () => {
    const result = updateProjectSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})
