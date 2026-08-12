/**
 * Which maths course the app should currently AIM AT.
 *
 * `profile.mathTrack` is a fact the learner stated about their life — "I am in
 * Math 8" — and the app has no business rewriting it. But it was also the only
 * thing steering the maths frontier, and a course is finite. Measured over five
 * simulated years starting from Math 8: the learner retained the whole course
 * inside two years and then spent three more years reviewing it, one exponent
 * template served 688 times with all fifteen of its variants worn out, while
 * ten skills that exist in the app — congruence proofs, coordinate geometry,
 * non-right triangle trigonometry, complex numbers, rational functions,
 * radical equations, trig functions, conics, piecewise functions, statistical
 * inference — were never scheduled once.
 *
 * So: the STATED track is never changed here. What changes is where the tilt
 * points once the stated course is finished. `trackFrontierUnit` already
 * defines "finished" — every unit's skills at `independent` or better — and
 * when that holds, the aim moves to `next`, and keeps moving while it keeps
 * holding. Nothing is dropped; a completed course's skills still come back on
 * their review schedule.
 *
 * The learner is told. `advancedFrom` is non-null exactly when this happened,
 * and the planner puts it in the session rationale, so the app never quietly
 * pretends to be teaching a course the learner did not choose.
 */
import { TRACK_BY_ID, type MathTrack } from '../content/tracks'
import { SKILL_BY_ID } from '../content/skills'
import type { Profile, SkillEvidence } from '../domain/types'

const ORDER = ['unseen', 'introduced', 'guided', 'independent', 'retained', 'transferred']
const rank = (s: string) => Math.max(0, ORDER.indexOf(s))

/** Every skill in the track is at `independent` or above. */
export function trackComplete(track: MathTrack, evidence: Map<string, SkillEvidence>): boolean {
  for (const unit of track.units) {
    for (const id of unit.skillIds) {
      const ev = evidence.get(id)
      if (!ev || rank(ev.state) < rank('independent')) return false
    }
  }
  return true
}

export interface EffectiveTrack {
  /** The course to aim at now. Null when the learner chose none. */
  track: MathTrack | null
  /** The course the learner actually stated, when the aim has moved past it. */
  advancedFrom: MathTrack | null
  /** How many courses the aim has moved on by. */
  steps: number
}

/** Guard against a malformed `next` chain looping or running away. */
const MAX_ADVANCE = 6

export function effectiveTrack(
  profile: Pick<Profile, 'mathTrack'>,
  evidence: Map<string, SkillEvidence>,
): EffectiveTrack {
  const stated = profile.mathTrack ? TRACK_BY_ID.get(profile.mathTrack) ?? null : null
  if (!stated) return { track: null, advancedFrom: null, steps: 0 }

  let track = stated
  let steps = 0
  const seen = new Set<string>([stated.id])
  while (steps < MAX_ADVANCE && track.next && trackComplete(track, evidence)) {
    const next = TRACK_BY_ID.get(track.next)
    if (!next || seen.has(next.id)) break
    seen.add(next.id)
    track = next
    steps += 1
  }
  return { track, advancedFrom: steps > 0 ? stated : null, steps }
}

/**
 * The grade band to aim at, given what has been proved.
 *
 * The same problem in the other dimension: the difficulty cap read the STATED
 * course's ceiling, so a learner who had finished Math 8 was still capped at
 * grade 8 material no matter how much they proved.
 */
export function effectiveTrackCeiling(
  profile: Pick<Profile, 'mathTrack'>,
  evidence: Map<string, SkillEvidence>,
): number | null {
  const { track } = effectiveTrack(profile, evidence)
  if (!track) return null
  const bands = track.units
    .flatMap((u) => u.skillIds)
    .map((id) => SKILL_BY_ID.get(id)?.gradeBand)
    .filter((b): b is number => typeof b === 'number')
  return bands.length ? Math.max(...bands) : null
}
