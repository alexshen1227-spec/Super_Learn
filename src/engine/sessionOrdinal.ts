/**
 * How many sessions this learner has completed, EVER.
 *
 * The planner runs two things on a cadence: the retention "explain it back"
 * exit every third session, and the authentic applied-work day every fourth.
 * Both counted with `state.sessions.length` — and that list is capped at the
 * most recent 2000 records, so it stops growing and freezes at 2000.
 *
 * The failure is silent and permanent. `2000 % 3 === 2` is true forever, so
 * the explain-back exit fires on EVERY session from then on; `2000 % 4 === 0`
 * is never 3, so applied work stops being scheduled at all. Measured in a
 * five-year simulation at three sessions a day: one 4-minute retention check
 * served 4,138 times, Meta Lab at 19.4% of all study against a ~5% target, and
 * Human Insight squeezed to 2.0%.
 *
 * Events are the append-only record and are never truncated, so counting the
 * distinct sessions they belong to gives a number that only ever goes up.
 * Placement is excluded because it is routing, not a study session.
 */
import type { AppState, AttemptEvent } from '../domain/types'

export function sessionOrdinal(state: Pick<AppState, 'events' | 'sessions'>): number {
  const ids = new Set<string>()
  for (const e of state.events as readonly AttemptEvent[]) {
    if (e.mode === 'placement') continue
    if (e.sessionId) ids.add(e.sessionId)
  }
  // `sessions` still wins while it is the larger number: a restored export can
  // carry session records whose events were trimmed by the importer, and a
  // cadence that jumps BACKWARDS would repeat work the learner already did.
  return Math.max(ids.size, state.sessions.length)
}
