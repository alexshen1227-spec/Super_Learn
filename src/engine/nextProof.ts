import type { ItemTemplate, SkillEvidence } from '../domain/types'
import { formsRequired, RETENTION_GAP_MS, stateRank } from './mastery'

export interface NextProof {
  title: string
  detail: string
  available: boolean
}

/** Plain-language description of the smallest honest piece of evidence needed next. */
export function nextProofForSkill(
  evidence: SkillEvidence,
  bucket: string | null,
  templates: readonly ItemTemplate[],
  now = Date.now(),
): NextProof {
  if (evidence.blockedByMisconception) {
    return {
      title: 'Repair the confident miss',
      detail: 'Solve one fresh question correctly on the first try without a hint. That clears the promotion block.',
      available: templates.length > 0,
    }
  }

  const needed = Math.max(0, formsRequired(bucket) - evidence.independentForms.length)
  if (stateRank(evidence.state) < stateRank('independent')) {
    if (evidence.attempts === 0) {
      return {
        title: 'Try the skill once',
        detail: 'A first question gives the app real evidence. It will not call one attempt mastery.',
        available: templates.length > 0,
      }
    }
    return {
      title: `Show ${needed} more question ${needed === 1 ? 'family' : 'families'}`,
      detail: 'Answer each correctly on the first try without hints. Different numbers in the same kind of question count as one family.',
      available: templates.length > evidence.independentForms.length,
    }
  }

  if (evidence.retainedAt === null) {
    const readyAt = (evidence.lastCorrectAt ?? now) + RETENTION_GAP_MS
    if (readyAt > now) {
      const hours = Math.ceil((readyAt - now) / 3_600_000)
      return {
        title: 'Let time do its job',
        detail: `A delayed check becomes meaningful in about ${hours} hour${hours === 1 ? '' : 's'}. A correct no-hint answer then can show retention.`,
        available: false,
      }
    }
    return {
      title: 'Pass a delayed check',
      detail: 'Solve a fresh question correctly on the first try without hints. Enough time has passed for this to test memory, not short-term repetition.',
      available: templates.length > 0,
    }
  }

  if (evidence.transferredAt === null) {
    const hasTransfer = templates.some((template) => template.transfer)
    return hasTransfer
      ? {
          title: 'Use it in unfamiliar clothing',
          detail: 'Solve a transfer question correctly on the first try without hints. It must differ in more than just the numbers.',
          available: true,
        }
      : {
          title: 'Retained is the honest ceiling for now',
          detail: 'This question bank does not yet contain a sufficiently different transfer task for this skill, so the app will not overclaim.',
          available: false,
        }
  }

  return {
    title: 'Transfer shown',
    detail: 'You have produced the strongest evidence this app can currently measure. Future reviews keep that claim honest.',
    available: true,
  }
}
