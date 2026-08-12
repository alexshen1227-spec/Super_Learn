/**
 * Has the learner finished what this app teaches?
 *
 * A curriculum is finite, and simulation says how finite: at an hour a day,
 * every one of the 150 skills is owned by year two and every one has cleared
 * the strict fourteen-day retention bar. Years three, four and five hold almost
 * nothing new — 951 question families met in year one, then 18, 6, 1, 0.
 *
 * That is completion, not failure, and the app's answer to it was silence. It
 * carried on serving reviews and never said the ground had run out. Silence
 * here is the same defect as a progress bar that keeps moving: it lets a
 * learner assume there is more coming when there is not, and it hides the
 * moment when the honest advice is "practise to keep this, and go and use it".
 *
 * So this derives the state and says it plainly. Nothing is celebrated, nothing
 * is unlocked, and the numbers stay the same numbers — the only new thing is
 * the app admitting where the edge is.
 *
 * It refuses to exist while the picture is thin, like everything else here: a
 * learner who has met a third of the bank cannot be told they are near the end
 * of it, however high their proved-of-met ratio looks.
 */
import type { AttemptEvent, DisputeEvent, SkillNode } from '../domain/types'
import { northStar } from './northStar'

/** Below this share of the whole skill list, the question is not yet askable. */
const MIN_MET_SHARE = 0.6
/** Share of ALL skills that must be durable before the app says it is done. */
const DONE_SHARE = 0.95
/** Share at which it is worth saying the end is in sight, without claiming it. */
const NEARLY_SHARE = 0.8

export type CurriculumStage = 'early' | 'most-of-the-way' | 'complete'

export interface CurriculumEnd {
  stage: CurriculumStage
  /** Skills proved to the strict fourteen-day bar. */
  durable: number
  /** Skills the learner has met at all. */
  met: number
  /** Every skill the app teaches. */
  total: number
  /** Still unmet — the honest count of what is left. */
  remaining: number
}

export function curriculumEnd(
  events: readonly AttemptEvent[],
  disputes: readonly DisputeEvent[],
  skills: readonly SkillNode[],
  now: number,
): CurriculumEnd {
  const total = skills.length
  const met = new Set<string>()
  for (const e of events) {
    if (e.mode === 'placement') continue
    for (const id of e.skillIds) met.add(id)
  }
  const durable = northStar(events, disputes, now).durable.length
  const remaining = Math.max(0, total - met.size)

  let stage: CurriculumStage = 'early'
  if (total > 0 && met.size / total >= MIN_MET_SHARE) {
    if (durable / total >= DONE_SHARE) stage = 'complete'
    else if (durable / total >= NEARLY_SHARE) stage = 'most-of-the-way'
  }
  return { stage, durable, met: met.size, total, remaining }
}
