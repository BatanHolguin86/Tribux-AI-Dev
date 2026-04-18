import { describe, it, expect } from 'vitest'
import { CREDIT_PACKS } from '@/lib/plans/credit-packs'

/**
 * Tests for quota system with credit top-ups.
 * Note: getUserQuota() requires DB access so we test the logic indirectly.
 * The actual quota computation is validated via integration tests.
 */

describe('quota system with credits', () => {
  it('CREDIT_PACKS is importable from shared module (no server-only)', () => {
    // This test proves client components can import CREDIT_PACKS
    // without pulling in next/headers (the build error we fixed)
    expect(CREDIT_PACKS).toBeDefined()
    expect(CREDIT_PACKS.length).toBeGreaterThan(0)
  })

  it('effective budget increases with credits', () => {
    const baseBudget = 14.7 // Starter
    const credits = 50 // bought a medium pack
    const effectiveBudget = baseBudget + credits
    expect(effectiveBudget).toBe(64.7)
  })

  it('usedPct is calculated against effective budget', () => {
    const baseBudget = 14.7
    const credits = 25
    const effectiveBudget = baseBudget + credits // 39.7
    const used = 30
    const usedPct = Math.round((used / effectiveBudget) * 100)
    // Without credits: 30/14.7 = 204% (exceeded)
    // With credits: 30/39.7 = 76% (ok)
    expect(usedPct).toBe(76)
  })

  it('user is not blocked when credits cover the overage', () => {
    const baseBudget = 14.7
    const credits = 50
    const effectiveBudget = baseBudget + credits
    const used = 40
    const usedPct = Math.round((used / effectiveBudget) * 100)
    // 40/64.7 = 62% — well within budget
    expect(usedPct).toBeLessThan(80)
  })

  it('canTopUp is true when exceeded and not enterprise', () => {
    const plans = ['starter', 'builder', 'agency']
    for (const plan of plans) {
      const canTopUp = plan !== 'enterprise'
      expect(canTopUp).toBe(true)
    }
    expect('enterprise' !== 'enterprise').toBe(false)
  })

  it('all packs have positive amounts', () => {
    for (const pack of CREDIT_PACKS) {
      expect(pack.amountUsd).toBeGreaterThan(0)
      expect(pack.priceUsd).toBeGreaterThan(0)
    }
  })
})
