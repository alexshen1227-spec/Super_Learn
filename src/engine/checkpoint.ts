/**
 * Unit checkpoints — a cumulative, unit-scoped retrieval check.
 *
 * Inspired by Khan Academy's Mastery Challenges, which spread a short mixed
 * quiz across skills the learner has already worked on and spend TWO questions
 * per skill so a single lucky or unlucky answer does not decide anything. That
 * two-question rule is the part worth taking: it is a small hypothesis test
 * rather than a coin flip, and it lines up exactly with this app's existing
 * "two unaided successes on distinct forms" rule for independence.
 *
 * What is deliberately NOT taken: the points economy (50/80/100 mastery
 * points). This app has an evidence ladder with meanings attached to each rung;
 * a parallel score would be a second, weaker progress story competing with it.
 *
 * Nothing new is stored. Eligibility is derived, and spacing does the
 * throttling: a unit becomes checkpoint-ready when enough of its skills are
 * owned AND retrieval has come due for several of them. Clear the checkpoint
 * and it goes quiet until the intervals bring those skills round again.
 */
import type { AppState, SkillEvidence, SkillNode } from '../domain/types'
import type { ContentIndex } from './content-index'
import { evidenceFor, stateRank } from './mastery'
import { COURSES } from '../content/skills'

export interface UnitCheckpoint {
  unitId: string
  unitName: string
  courseName: string
  /** Skills in this unit the learner already owns. */
  ownedSkillIds: string[]
  /** Owned skills whose retrieval is currently due — what the check targets. */
  dueSkillIds: string[]
}

/** A unit is worth checking once it is genuinely a unit to the learner. */
const MIN_OWNED = 3
const MIN_DUE = 2

/**
 * The unit most worth a cumulative check right now, or null.
 *
 * Returns null freely — a checkpoint offered when nothing is due would be
 * busywork dressed as rigour, and the app's whole posture is that it should
 * say nothing rather than invent a reason to practise.
 */
export function findUnitCheckpoint(
  index: ContentIndex,
  evidence: Map<string, SkillEvidence>,
  now: number,
): UnitCheckpoint | null {
  let best: UnitCheckpoint | null = null
  for (const course of COURSES) {
    for (const unit of course.units) {
      const owned: string[] = []
      const due: string[] = []
      for (const skillId of unit.skillIds) {
        const ev = evidenceFor(evidence, skillId)
        if (stateRank(ev.state) < stateRank('independent')) continue
        if (!(index.bySkill.get(skillId) ?? []).length) continue
        owned.push(skillId)
        const skillDue = ev.review !== null && ev.review.due <= now
        const formDue = ev.forms.some((f) => f.due !== null && f.due <= now)
        if (skillDue || formDue || ev.needsReview) due.push(skillId)
      }
      if (owned.length < MIN_OWNED || due.length < MIN_DUE) continue
      // Prefer the unit with the most owed retrieval — that is where a
      // cumulative check is most likely to find something real.
      if (!best || due.length > best.dueSkillIds.length) {
        best = {
          unitId: unit.id,
          unitName: unit.name,
          courseName: course.name,
          ownedSkillIds: owned,
          dueSkillIds: due,
        }
      }
    }
  }
  return best
}

/** Skills a checkpoint should cover, due ones first, capped at three. */
export function checkpointSkills(cp: UnitCheckpoint, limit = 3): string[] {
  const rest = cp.ownedSkillIds.filter((id) => !cp.dueSkillIds.includes(id))
  return [...cp.dueSkillIds, ...rest].slice(0, limit)
}

/** The unit a skill belongs to, for labelling. */
export function unitOf(skill: SkillNode): { unitId: string; unitName: string } | null {
  for (const course of COURSES) {
    for (const unit of course.units) {
      if (unit.skillIds.includes(skill.id)) return { unitId: unit.id, unitName: unit.name }
    }
  }
  return null
}

/** Whether a checkpoint is worth offering at all, given the learner's state. */
export function checkpointAvailable(
  state: AppState,
  index: ContentIndex,
  evidence: Map<string, SkillEvidence>,
  now: number,
): UnitCheckpoint | null {
  // Below a few sessions there is no cumulative history to check.
  if (state.sessions.length < 3) return null
  return findUnitCheckpoint(index, evidence, now)
}
