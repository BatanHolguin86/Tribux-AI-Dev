import { describe, it, expect } from 'vitest'
import { CREDIT_PACKS } from '@/lib/plans/credit-packs'
import type { CreditPack } from '@/lib/plans/credit-packs'

describe('CREDIT_PACKS pricing logic', () => {
  it('all packs maintain 1:1 price to amount ratio (no markup)', () => {
    for (const pack of CREDIT_PACKS) {
      expect(pack.priceUsd / pack.amountUsd).toBe(1)
    }
  })

  it('small pack is $25', () => {
    const small = CREDIT_PACKS.find((p) => p.id === 'small')!
    expect(small.amountUsd).toBe(25)
    expect(small.priceUsd).toBe(25)
  })

  it('medium pack is $50', () => {
    const medium = CREDIT_PACKS.find((p) => p.id === 'medium')!
    expect(medium.amountUsd).toBe(50)
  })

  it('large pack is $100', () => {
    const large = CREDIT_PACKS.find((p) => p.id === 'large')!
    expect(large.amountUsd).toBe(100)
  })

  it('labels are in Spanish', () => {
    for (const pack of CREDIT_PACKS) {
      expect(pack.label).toContain('$')
      expect(pack.label).toContain('de IA')
    }
  })

  it('packs are CreditPack type', () => {
    const pack: CreditPack = CREDIT_PACKS[0]
    expect(pack.id).toBeTruthy()
    expect(typeof pack.label).toBe('string')
    expect(typeof pack.amountUsd).toBe('number')
    expect(typeof pack.priceUsd).toBe('number')
  })
})
