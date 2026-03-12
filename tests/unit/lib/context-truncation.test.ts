/**
 * TASK-167: Unit tests for context truncation — contextos > 50K tokens are truncated correctly.
 */
import { describe, it, expect } from 'vitest'
import {
  truncateText,
  applyProgressiveTruncation,
} from '@/lib/ai/context-builder'

describe('truncateText', () => {
  it('returns text as-is when under limit', () => {
    const text = 'short'
    expect(truncateText(text, 100)).toBe(text)
  })

  it('truncates and appends suffix when over limit', () => {
    const text = 'a'.repeat(200)
    const result = truncateText(text, 50)
    expect(result).toHaveLength(50 + '\n...[truncado]'.length)
    expect(result.endsWith('\n...[truncado]')).toBe(true)
    expect(result.slice(0, 50)).toBe('a'.repeat(50))
  })

  it('exactly at limit returns as-is', () => {
    const text = 'a'.repeat(50)
    expect(truncateText(text, 50)).toBe(text)
  })
})

describe('applyProgressiveTruncation', () => {
  it('returns inputs unchanged when total under maxTotal', () => {
    const discovery = 'd'.repeat(10_000)
    const specs = 's'.repeat(20_000)
    const artifacts = 'a'.repeat(5_000)
    const out = applyProgressiveTruncation(discovery, specs, artifacts, 200_000)
    expect(out.discoveryDocs).toBe(discovery)
    expect(out.featureSpecs).toBe(specs)
    expect(out.artifacts).toBe(artifacts)
  })

  it('truncates when total exceeds maxTotal', () => {
    const discovery = 'd'.repeat(100_000)
    const specs = 's'.repeat(150_000)
    const artifacts = 'a'.repeat(50_000)
    const out = applyProgressiveTruncation(discovery, specs, artifacts, 200_000)
    expect(out.discoveryDocs.endsWith('\n...[truncado]')).toBe(true)
    expect(out.discoveryDocs.length).toBeLessThanOrEqual(40_000 + 20)
    expect(out.featureSpecs.endsWith('\n...[truncado]')).toBe(true)
    expect(out.featureSpecs.length).toBeLessThanOrEqual(80_000 + 20)
    expect(out.artifacts.endsWith('\n...[truncado]')).toBe(true)
    expect(out.artifacts.length).toBeLessThanOrEqual(20_000 + 20)
  })

  it('uses default maxTotal ~200k when not provided', () => {
    const discovery = 'd'.repeat(300_000)
    const specs = ''
    const artifacts = ''
    const out = applyProgressiveTruncation(discovery, specs, artifacts)
    expect(out.discoveryDocs.endsWith('\n...[truncado]')).toBe(true)
    expect(out.discoveryDocs.length).toBe(40_000 + '\n...[truncado]'.length)
  })
})
