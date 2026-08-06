/**
 * Review scheduling queries over derived evidence.
 * The interval ladder itself lives in mastery.ts (it is part of replay);
 * this module answers "what is due, and when is the next thing due?"
 */
import type { SkillEvidence } from '../domain/types'
import { stateRank } from './mastery'

export interface DueReview {
  skillId: string
  dueAt: number
  overdueDays: number
  reason: 'interval' | 'misconception' | 'struggling'
}

export function dueReviews(evidence: Map<string, SkillEvidence>, now: number): DueReview[] {
  const out: DueReview[] = []
  for (const ev of evidence.values()) {
    if (ev.blockedByMisconception) {
      out.push({ skillId: ev.skillId, dueAt: now, overdueDays: 0, reason: 'misconception' })
    } else if (ev.recentMisses >= 2) {
      out.push({ skillId: ev.skillId, dueAt: now, overdueDays: 0, reason: 'struggling' })
    } else if (
      ev.review !== null &&
      ev.review.due <= now &&
      stateRank(ev.state) >= stateRank('independent')
    ) {
      out.push({
        skillId: ev.skillId,
        dueAt: ev.review.due,
        overdueDays: Math.floor((now - ev.review.due) / 86_400_000),
        reason: 'interval',
      })
    }
  }
  // Misconceptions first, then most overdue.
  return out.sort((a, b) => {
    const pri = (r: DueReview) => (r.reason === 'misconception' ? 0 : r.reason === 'struggling' ? 1 : 2)
    return pri(a) - pri(b) || a.dueAt - b.dueAt
  })
}

/** Next future review, for "next review in N days" copy. Null if none scheduled. */
export function nextReviewAt(evidence: Map<string, SkillEvidence>, now: number): number | null {
  let next: number | null = null
  for (const ev of evidence.values()) {
    if (ev.review !== null && ev.review.due > now) {
      if (next === null || ev.review.due < next) next = ev.review.due
    }
  }
  return next
}

/** Review burden: count of items due in the next N days (for Progress). */
export function reviewBurden(
  evidence: Map<string, SkillEvidence>,
  now: number,
  days: number,
): number {
  const horizon = now + days * 86_400_000
  let n = 0
  for (const ev of evidence.values()) {
    if (ev.review !== null && ev.review.due <= horizon) n++
  }
  return n
}
