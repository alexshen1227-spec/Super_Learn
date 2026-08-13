/**
 * If-then plans: when to ask for one, and when to follow up.
 *
 * The mechanism (RESEARCH.md §20b) is that naming a concrete cue and the move
 * it should trigger narrows the gap between knowing a thing and doing it. The
 * work happens when the plan is FORMED, which is why this never builds a log
 * to revisit — the learner said outright they would not read one, and a log
 * nobody opens is a feature that only looks good in a changelog.
 *
 * Nothing here touches evidence. Plans and their outcomes are self-reported;
 * they never reach `deriveEvidence`, never schedule a review, and never move a
 * rung. Keep it that way.
 */
import type { AppState, FieldPlan, SkillEvidence } from '../domain/types'
import { stateRank } from './mastery'

const DAY = 86_400_000

/** Paths only. Academic skills are already tested by school and by the app. */
const PATH_BUCKETS: ReadonlySet<string> = new Set(['observer', 'investigator', 'strategist', 'insight'])

/** Long enough that a recurring situation has plausibly come round. */
export const FOLLOW_UP_AFTER_DAYS = 14

/**
 * A skill worth planning for: a Path skill that has reached Retained (so the
 * idea is actually held, not just met) and has no plan yet.
 *
 * Retained rather than Independent on purpose — asking someone to carry a
 * technique into their week before it survives a delay is asking them to
 * rehearse something they will not have when the moment comes.
 */
export function planCandidate(
  state: AppState,
  evidence: Map<string, SkillEvidence>,
  bucketOf: (skillId: string) => string | undefined,
): string | null {
  /*
   * ONE OPEN PLAN AT A TIME.
   *
   * This used to exclude only skills that ALREADY had a plan, and the caller
   * suppressed new ones only once a follow-up fell DUE — which is fourteen days
   * later. In that window a learner could be handed a fresh plan for a
   * different skill every single session, quietly accumulating a dozen open
   * intentions nobody was tracking.
   *
   * That is not a cosmetic pile-up, it is the mechanism failing. The 642-test
   * meta-analysis (Sheeran, Listrom & Gollwitzer 2024) finds one plan at
   * d = .41, two at .30, and THREE at d = .07 — the benefit is essentially gone
   * by the third. Handing out more of them makes the feature worse, not weaker.
   *
   * So: while any plan is still awaiting its follow-up, there is no candidate.
   */
  const openPlan = state.plans.some((p) => p.askedAt === null)
  if (openPlan) return null
  const planned = new Set(state.plans.map((p) => p.skillId))
  let best: { skillId: string; at: number } | null = null
  for (const ev of evidence.values()) {
    if (planned.has(ev.skillId)) continue
    if (stateRank(ev.state) < stateRank('retained')) continue
    const bucket = bucketOf(ev.skillId)
    if (!bucket || !PATH_BUCKETS.has(bucket)) continue
    const at = ev.retainedAt ?? 0
    // Oldest first: the one that has been usable the longest.
    if (!best || at < best.at) best = { skillId: ev.skillId, at }
  }
  return best ? best.skillId : null
}

/**
 * A plan old enough to ask about, never asked before. One at a time — this is
 * a single question at the end of a session, not an interview.
 */
export function planNeedingFollowUp(state: AppState, now: number): FieldPlan | null {
  const due = state.plans
    .filter((p) => p.askedAt === null && now - p.t >= FOLLOW_UP_AFTER_DAYS * DAY)
    .sort((a, b) => a.t - b.t)
  return due[0] ?? null
}

/** Split "if X, then Y" into its two halves for display. Never graded. */
export function describePlan(plan: FieldPlan): string {
  return `If ${plan.cue}, then ${plan.action}.`
}
