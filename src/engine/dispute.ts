/**
 * Challenging the record.
 *
 * Every other correction in this app is the learner changing their answer.
 * This one is the learner saying the GRADE was wrong — and it matters because
 * the record is the product. A bad grade quietly lowers a mastery estimate,
 * shortens the review interval, steps difficulty down, and adds allocation
 * debt to a bucket that did not earn it. Without a way to contest it, the only
 * user of this app has to live with the app being wrong about them.
 *
 * QUARANTINE FIRST, ADJUDICATE LATER. From the moment a dispute is raised the
 * attempt stops counting, before anyone decides who was right. The alternative
 * — leave it counted until resolved — means the contested evidence does its
 * damage during exactly the window when its validity is in doubt, and the
 * learner's only remedy is to hurry. Being wrong in the learner's favour for a
 * few days is cheap; being wrong against them is the thing this app cannot
 * afford.
 *
 * Derived by replay from an append-only log, like everything else here.
 */
import type { AttemptEvent, DisputeEvent, DisputeOutcome } from '../domain/types'

/**
 * How many unresolved disputes before an item stops being served.
 *
 * Two rather than one: a single dispute is often the learner having misread,
 * which is one of the three resolutions and not a fault in the item. Two
 * separate occasions on the same template is a pattern worth acting on before
 * anyone has had time to adjudicate.
 */
export const SUPPRESS_AFTER_UNRESOLVED = 2

export type DisputeStatus = 'open' | DisputeOutcome

/** Latest status per disputed attempt, by replaying the log in order. */
export function disputeStatuses(disputes: readonly DisputeEvent[]): Map<string, DisputeStatus> {
  const out = new Map<string, DisputeStatus>()
  for (const d of [...disputes].sort((a, b) => a.t - b.t)) {
    out.set(d.attemptId, d.kind === 'raised' ? 'open' : d.outcome)
  }
  return out
}

/**
 * Attempts that must not reach any derived number.
 *
 * Open disputes, obviously. But also `item-bug` and `wrong-skill`, which stay
 * excluded permanently: the first says the question was broken, the second
 * says it was measuring something other than what it was filed under, and in
 * neither case does the attempt tell us anything about the skill.
 *
 * `my-error` is the one that comes back. The learner looked again and agrees
 * the grade was right, so the evidence is good and counting it is the honest
 * outcome — including when it counts against them.
 */
export function quarantinedAttemptIds(disputes: readonly DisputeEvent[]): Set<string> {
  const out = new Set<string>()
  for (const [attemptId, status] of disputeStatuses(disputes)) {
    if (status !== 'my-error') out.add(attemptId)
  }
  return out
}

/**
 * The events that may inform mastery, stretch and allocation.
 *
 * One filter applied at the few places evidence is derived, rather than a
 * parameter threaded through every consumer — a rule enforced in one place
 * cannot be forgotten in one of eight.
 */
export function evidenceEvents(events: readonly AttemptEvent[], disputes: readonly DisputeEvent[]): AttemptEvent[] {
  if (!disputes.length) return events as AttemptEvent[]
  const blocked = quarantinedAttemptIds(disputes)
  return blocked.size ? events.filter((e) => !blocked.has(e.id)) : (events as AttemptEvent[])
}

/**
 * Templates to stop serving: repeatedly contested and not yet adjudicated, or
 * confirmed broken.
 *
 * A confirmed `item-bug` suppresses on the FIRST occurrence — the learner has
 * looked at it and said the question itself is wrong, and there is no reason
 * to keep asking it while that stands.
 */
export function suppressedTemplateIds(disputes: readonly DisputeEvent[]): Set<string> {
  const status = disputeStatuses(disputes)
  const openCount = new Map<string, number>()
  const out = new Set<string>()
  for (const d of disputes) {
    const s = status.get(d.attemptId)
    if (s === 'item-bug') out.add(d.templateId)
    if (s === 'open' && d.kind === 'raised') {
      const n = (openCount.get(d.templateId) ?? 0) + 1
      openCount.set(d.templateId, n)
      if (n >= SUPPRESS_AFTER_UNRESOLVED) out.add(d.templateId)
    }
  }
  return out
}

/** Disputes still waiting on the learner to say what happened, oldest first. */
export function openDisputes(disputes: readonly DisputeEvent[]): DisputeEvent[] {
  const status = disputeStatuses(disputes)
  return disputes.filter((d) => d.kind === 'raised' && status.get(d.attemptId) === 'open').sort((a, b) => a.t - b.t)
}

export const OUTCOME_LABEL: Record<DisputeOutcome, string> = {
  'my-error': 'I misread it — the grade was right',
  'item-bug': 'The question or its answer is wrong',
  'wrong-skill': 'Fine question, filed under the wrong skill',
}
