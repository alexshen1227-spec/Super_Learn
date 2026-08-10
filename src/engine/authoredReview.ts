/**
 * When to hand a learner's own problem back to them, and when to offer them
 * the chance to write one.
 *
 * Both decisions live here rather than in the summary screen so they can be
 * stated as rules and tested without a DOM — the same reason `aggregateParts`
 * and `resumePhase` live in `activity.ts`.
 */
import type { AuthoredProblem } from '../domain/types'

const DAY = 86_400_000

/**
 * How long a problem must sit before it is worth re-reading. HEURISTIC.
 *
 * The point of the review is reading your own question COLD — after you have
 * forgotten which numbers you picked and why. Handed back at the end of the
 * session you wrote it in, you would still be holding the whole thing in your
 * head and would simply agree with yourself, which measures nothing and
 * teaches nothing. Three days is chosen to be long enough to lose the details
 * and short enough that the loop still closes; no study fixes it.
 */
export const COLD_READ_DAYS = 3

/** How often the app offers to let you write one, counted in finished sessions. */
export const INVITE_EVERY_SESSIONS = 7

/**
 * The single problem worth re-reading now, oldest first, or null.
 *
 * One at a time on purpose. A list of six waiting to be judged is a chore, and
 * a chore at the end of a session is exactly the kind of obligation the
 * founding brief refuses to manufacture.
 */
export function dueForColdRead(authored: readonly AuthoredProblem[], now: number): AuthoredProblem | null {
  const ready = authored
    .filter((a) => a.sensible === null && now - a.t >= COLD_READ_DAYS * DAY)
    .sort((a, b) => a.t - b.t)
  return ready[0] ?? null
}

/** Everything still waiting, for an honest count where one is worth showing. */
export function coldReadBacklog(authored: readonly AuthoredProblem[], now: number): number {
  return authored.filter((a) => a.sensible === null && now - a.t >= COLD_READ_DAYS * DAY).length
}

/**
 * Whether to offer writing a problem at the end of this session.
 *
 * Keyed to the count of FINISHED SESSIONS rather than to a stored "last asked"
 * timestamp. That is deliberate: a cadence tied to compliance turns declining
 * into something the app reacts to, and the offer would start behaving like a
 * nag. Every seventh session, take it or leave it, and leaving it costs
 * nothing and is not recorded.
 *
 * Two suppressions, both about not asking for more while something is owed:
 * never when a problem is already waiting to be re-read, and never when one
 * was written in the last week.
 */
export function shouldInviteCreator(opts: {
  sessionCount: number
  authored: readonly AuthoredProblem[]
  now: number
}): boolean {
  const { sessionCount, authored, now } = opts
  if (sessionCount <= 0 || sessionCount % INVITE_EVERY_SESSIONS !== 0) return false
  if (dueForColdRead(authored, now)) return false
  const newest = authored.reduce((max, a) => Math.max(max, a.t), 0)
  if (newest > 0 && now - newest < 7 * DAY) return false
  return true
}
