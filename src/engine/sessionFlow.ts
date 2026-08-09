import type { SessionPlan } from '../domain/types'

export type SessionStep =
  | { kind: 'activity'; blockIndex: number; actIndex: number }
  | { kind: 'block'; blockIndex: number; actIndex: 0 }
  | { kind: 'end' }

/** Pure, bounds-checked navigation for the session state machine. */
export function nextSessionStep(plan: SessionPlan, blockIndex: number, actIndex: number): SessionStep {
  const block = plan.blocks[blockIndex]
  if (!block) return { kind: 'end' }
  if (actIndex + 1 < block.activities.length) {
    return { kind: 'activity', blockIndex, actIndex: actIndex + 1 }
  }
  if (blockIndex + 1 < plan.blocks.length) {
    return { kind: 'block', blockIndex: blockIndex + 1, actIndex: 0 }
  }
  return { kind: 'end' }
}
