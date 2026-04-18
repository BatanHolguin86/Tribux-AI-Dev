import { describe, it, expect } from 'vitest'

/**
 * Overage billing logic tests.
 * Tests the calculation logic without DB dependency.
 */

describe('overage calculation logic', () => {
  const MULTIPLIER = 1.5

  it('calculates overage when usage exceeds budget', () => {
    const budget = 44.7
    const used = 60
    const overage = used - budget // 15.30
    const charge = Math.round(overage * MULTIPLIER * 10000) / 10000

    expect(overage).toBeCloseTo(15.3, 2)
    expect(charge).toBeCloseTo(22.95, 2)
  })

  it('returns zero overage when within budget', () => {
    const budget = 44.7
    const used = 30
    const overage = Math.max(0, used - budget)

    expect(overage).toBe(0)
  })

  it('applies 1.5x multiplier correctly', () => {
    const overage = 10
    const charge = overage * MULTIPLIER
    expect(charge).toBe(15)
  })

  it('handles per-plan budgets correctly', () => {
    const budgets: Record<string, number> = {
      starter: 14.7,
      builder: 44.7,
      pro: 89.7,
      agency: 209.7,
      enterprise: 500,
    }

    // Starter user exceeds by $5
    const starterOverage = Math.max(0, 19.7 - budgets.starter)
    expect(starterOverage).toBeCloseTo(5, 1)

    // Builder user within budget
    const builderOverage = Math.max(0, 30 - budgets.builder)
    expect(builderOverage).toBe(0)

    // Agency user exceeds by $50
    const agencyOverage = Math.max(0, 259.7 - budgets.agency)
    expect(agencyOverage).toBeCloseTo(50, 1)
  })

  it('rounds charge to 4 decimal places', () => {
    const overage = 1.111111
    const charge = Math.round(overage * MULTIPLIER * 10000) / 10000
    expect(String(charge).split('.')[1]?.length ?? 0).toBeLessThanOrEqual(4)
  })
})
