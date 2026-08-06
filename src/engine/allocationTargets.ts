/** Exact 100% allocation math with a hard per-bucket floor. */
import { BUCKETS, MIN_ALLOCATION_PERCENT, type BucketId } from '../domain/types'

const IDS = BUCKETS.map((bucket) => bucket.id)

function asRecord(values: number[]): Record<BucketId, number> {
  return Object.fromEntries(IDS.map((id, index) => [id, values[index]])) as Record<BucketId, number>
}

/** Round non-negative shares to an exact integer total by largest remainder. */
function exactIntegers(shares: number[], total: number): number[] {
  const out = shares.map((share) => Math.floor(share))
  let left = total - out.reduce((sum, value) => sum + value, 0)
  const order = shares
    .map((share, index) => ({ index, remainder: share - Math.floor(share) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
  for (let i = 0; i < left; i++) out[order[i % order.length].index]++
  return out
}

/**
 * Normalize arbitrary imported/legacy weights into real integer percentages.
 * Low shares are pinned at the floor; the rest keep their relative ratio.
 */
export function normalizeAllocationPercentages(
  input: Partial<Record<BucketId, number>>,
): Record<BucketId, number> {
  const raw = IDS.map((id) => {
    const value = input[id]
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0
  })
  if (raw.every((value) => Number.isInteger(value) && value >= MIN_ALLOCATION_PERCENT) && raw.reduce((a, b) => a + b, 0) === 100) {
    return asRecord(raw)
  }

  const shares = new Array<number>(IDS.length).fill(0)
  let open = IDS.map((_, index) => index)
  let remaining = 100
  while (open.length) {
    const weight = open.reduce((sum, index) => sum + raw[index], 0)
    const provisional = open.map((index) => ({
      index,
      share: weight > 0 ? (raw[index] / weight) * remaining : remaining / open.length,
    }))
    const below = provisional.filter(({ share }) => share < MIN_ALLOCATION_PERCENT)
    if (!below.length) {
      for (const { index, share } of provisional) shares[index] = share
      break
    }
    for (const { index } of below) shares[index] = MIN_ALLOCATION_PERCENT
    const fixed = new Set(below.map(({ index }) => index))
    open = open.filter((index) => !fixed.has(index))
    remaining -= below.length * MIN_ALLOCATION_PERCENT
  }

  const integer = shares.map((share) => Math.max(MIN_ALLOCATION_PERCENT, Math.floor(share)))
  let left = 100 - integer.reduce((sum, value) => sum + value, 0)
  const order = shares
    .map((share, index) => ({ index, remainder: share - Math.floor(share) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
  for (let i = 0; i < left; i++) integer[order[i % order.length].index]++
  return asRecord(integer)
}

/** Change one real percentage and proportionally rebalance all other surplus. */
export function rebalanceAllocationPercentage(
  input: Record<BucketId, number>,
  changed: BucketId,
  requested: number,
): Record<BucketId, number> {
  const current = normalizeAllocationPercentages(input)
  const max = 100 - MIN_ALLOCATION_PERCENT * (IDS.length - 1)
  const target = Math.max(MIN_ALLOCATION_PERCENT, Math.min(max, Math.round(requested)))
  const others = IDS.filter((id) => id !== changed)
  const flexible = 100 - target - MIN_ALLOCATION_PERCENT * others.length
  const surplusWeights = others.map((id) => Math.max(0, current[id] - MIN_ALLOCATION_PERCENT))
  const surplusTotal = surplusWeights.reduce((sum, value) => sum + value, 0)
  const distributed = exactIntegers(
    surplusWeights.map((weight) => MIN_ALLOCATION_PERCENT + (surplusTotal ? (weight / surplusTotal) * flexible : flexible / others.length)),
    100 - target,
  )
  return {
    ...current,
    ...Object.fromEntries(others.map((id, index) => [id, distributed[index]])),
    [changed]: target,
  }
}
