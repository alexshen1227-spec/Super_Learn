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

/**
 * A specific question family that is due — not just "this skill needs work"
 * but "THIS kind of problem does".
 *
 * A skill spans many families (m-percent has ten). With only a skill-level
 * schedule, answering an easy family satisfied the review and pushed the
 * interval out, so a family you had actually failed could go untested for
 * months while the skill read Retained. This is what lets the planner ask for
 * the one that broke.
 */
export interface DueForm {
  skillId: string
  templateId: string
  dueAt: number
  overdueDays: number
  /** 'lapsed' = your last attempt at this family was wrong. */
  reason: 'lapsed' | 'interval'
}

/**
 * Due families, most urgent first, capped.
 *
 * The cap matters: per-family scheduling multiplies due items roughly
 * five-fold, and an uncapped queue would turn every warm-up into an
 * ever-growing backlog — the exact nagging the app is built to avoid. Families
 * never attempted have no schedule and never appear here, so a skill with
 * thirty families cannot flood the queue on day one.
 */
export function dueForms(
  evidence: Map<string, SkillEvidence>,
  now: number,
  cap = 12,
): DueForm[] {
  const out: DueForm[] = []
  for (const ev of evidence.values()) {
    // Below guided there is nothing to re-test yet; that is new learning.
    if (stateRank(ev.state) < stateRank('guided')) continue
    for (const form of ev.forms) {
      if (form.due === null || form.due > now) continue
      out.push({
        skillId: ev.skillId,
        templateId: form.templateId,
        dueAt: form.due,
        overdueDays: Math.floor((now - form.due) / 86_400_000),
        reason: form.lastOutcomeCorrect === false ? 'lapsed' : 'interval',
      })
    }
  }
  // Families you actually got wrong come first, then the most overdue.
  return out
    .sort((a, b) => {
      const pri = (f: DueForm) => (f.reason === 'lapsed' ? 0 : 1)
      return pri(a) - pri(b) || a.dueAt - b.dueAt
    })
    .slice(0, cap)
}

/**
 * How many SKILLS have anything waiting — the skill-level schedule OR any
 * question family's. The Today count used `dueReviews` alone, which is
 * skill-level only, so a learner could read "0 due" while the next warm-up
 * was already planning two lapsed families through `dueForms`. One count,
 * taken the way the planner actually serves.
 */
export function dueSkillCount(evidence: Map<string, SkillEvidence>, now: number): number {
  const ids = new Set(dueReviews(evidence, now).map((d) => d.skillId))
  for (const f of dueForms(evidence, now, 999)) ids.add(f.skillId)
  return ids.size
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
