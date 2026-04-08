import { describe, it, expect } from 'vitest'
import { CREDIT_PACKS } from '@/lib/plans/credit-packs'
import type { CreditPack } from '@/lib/plans/credit-packs'

describe('CREDIT_PACKS', () => {
  it('exports exactly 3 packs', () => {
    expect(CREDIT_PACKS).toHaveLength(3)
  })

  it('each pack has required fields', () => {
    for (const pack of CREDIT_PACKS) {
      expect(pack.id).toBeTruthy()
      expect(typeof pack.label).toBe('string')
      expect(pack.amountUsd).toBeGreaterThan(0)
      expect(pack.priceUsd).toBeGreaterThan(0)
    }
  })

  it('packs are ordered by amount ascending', () => {
    for (let i = 1; i < CREDIT_PACKS.length; i++) {
      expect(CREDIT_PACKS[i].amountUsd).toBeGreaterThan(CREDIT_PACKS[i - 1].amountUsd)
    }
  })

  it('pack IDs are unique', () => {
    const ids = CREDIT_PACKS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('contains small, medium, and large packs', () => {
    const ids = CREDIT_PACKS.map((p) => p.id)
    expect(ids).toContain('small')
    expect(ids).toContain('medium')
    expect(ids).toContain('large')
  })

  it('price equals amount (no markup on top-ups)', () => {
    for (const pack of CREDIT_PACKS) {
      expect(pack.priceUsd).toBe(pack.amountUsd)
    }
  })
})
