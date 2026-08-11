/**
 * How high should the app aim?
 *
 * Two places decide this — where placement starts probing, and how far the
 * frontier may reach when placement judged everything strong — and both read
 * `profile.gradeLevel`, the number the learner typed on the first screen.
 *
 * The profile also carries `mathTrack`, chosen deliberately from a named list
 * ("Algebra I (accelerated)") and changeable in Settings. Its own type comment
 * calls it the more precise signal, and until now nothing that decides
 * DIFFICULTY consumed it: it selected WHICH skills were in scope and had no
 * say in how hard they should be.
 *
 * The gap this leaves is not theoretical. A learner in school year 7 taking
 * Algebra I has a track whose skills reach grade band 9, while the reach cap
 * pinned them at `min(gradeBand, 7 + 1) = 8` — so the tie-break could never
 * prefer the most advanced material inside the learner's OWN chosen course,
 * and it bit hardest exactly when the capable-penalty was trying to aim higher.
 *
 * Derived from the track's content rather than a hand-written table, so adding
 * a track cannot forget to update this, and so the number means something
 * checkable: it is the highest grade band the track actually teaches.
 */
import { SKILL_BY_ID } from '../content/skills'
import { TRACK_BY_ID } from '../content/tracks'
import type { Profile } from '../domain/types'

/** Used when a profile carries neither a track nor a stated year. */
export const DEFAULT_GRADE = 8

const trackCache = new Map<string, number>()

/** The highest grade band the track actually teaches, or null if unknown. */
export function trackCeiling(trackId: string | null | undefined): number | null {
  if (!trackId) return null
  const hit = trackCache.get(trackId)
  if (hit !== undefined) return hit
  const track = TRACK_BY_ID.get(trackId)
  if (!track) return null
  const bands = track.units
    .flatMap((u) => u.skillIds)
    .map((id) => SKILL_BY_ID.get(id)?.gradeBand)
    .filter((b): b is number => typeof b === 'number')
  if (!bands.length) return null
  const top = Math.max(...bands)
  trackCache.set(trackId, top)
  return top
}

/**
 * The grade the app should aim at.
 *
 * The chosen track wins when there is one. That is deliberate rather than a
 * maximum of the two signals: a learner in year 11 who picks the Math 6 review
 * track has TOLD the app to work at that level, and overriding them with the
 * year they typed would make the setting decorative.
 */
export function effectiveGrade(profile: Pick<Profile, 'gradeLevel' | 'mathTrack'>): number {
  return trackCeiling(profile.mathTrack) ?? profile.gradeLevel ?? DEFAULT_GRADE
}
