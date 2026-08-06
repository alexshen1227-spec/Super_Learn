import { describe, expect, it } from 'vitest'
import { BUCKETS, DEFAULT_ALLOCATIONS, MIN_ALLOCATION_PERCENT } from '../domain/types'
import { normalizeAllocationPercentages, rebalanceAllocationPercentage } from './allocationTargets'

describe('exact allocation percentages', () => {
  it('ships defaults that total 100 and honor the 5% floor', () => {
    expect(Object.values(DEFAULT_ALLOCATIONS).reduce((sum, value) => sum + value, 0)).toBe(100)
    expect(Object.values(DEFAULT_ALLOCATIONS).every((value) => value >= MIN_ALLOCATION_PERCENT)).toBe(true)
  })

  it('migrates legacy weights into a valid real percentage mix', () => {
    const legacy = Object.fromEntries(BUCKETS.map((bucket) => [bucket.id, bucket.id === 'math' ? 32 : 13]))
    const normalized = normalizeAllocationPercentages(legacy)
    expect(Object.values(normalized).reduce((sum, value) => sum + value, 0)).toBe(100)
    expect(Object.values(normalized).every((value) => value >= 5)).toBe(true)
  })

  it('rebalances other surplus while preserving the requested share and every floor', () => {
    const changed = rebalanceAllocationPercentage(DEFAULT_ALLOCATIONS, 'observer', 20)
    expect(changed.observer).toBe(20)
    expect(Object.values(changed).reduce((sum, value) => sum + value, 0)).toBe(100)
    expect(Object.values(changed).every((value) => value >= 5)).toBe(true)
  })
})
