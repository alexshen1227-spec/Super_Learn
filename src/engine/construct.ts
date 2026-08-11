/**
 * Grading a CONSTRUCTED answer.
 *
 * Everywhere else in this app the learner picks or computes one right value.
 * Here they build an object — a set of numbers, a digit placement, a pair of
 * integers — and it is graded by whether it satisfies the stated constraints.
 * Usually many objects do.
 *
 * Two reasons this format exists, both from criticism the bank could not
 * answer as it stood:
 *
 *  1. A generator cannot produce a non-routine problem, because the method is
 *     recognisable from the question's shape. Construction inverts that: the
 *     method is trivial to state and the work is search. Every instance is
 *     genuinely worked, however many the generator has produced before.
 *  2. Roughly nine in ten graded checkpoints here are a number or a choice,
 *     which put constructed reasoning outside what the app could evaluate.
 *     This is constructed *and* deterministically gradable, with no model,
 *     no server, and no keyword matching pretending to be comprehension.
 *
 * Checks are data, not functions, so a rendered item stays JSON and the audit
 * can re-verify every constraint it will ever show a learner.
 */
import type { ConstructAnswer, ConstructCheck, ConstructCmp, ConstructStat } from '../domain/types'
import { parseExpression } from './parseValue'

/** Learner input travels as a JSON object of slot key → raw string. */
export function serializeConstruct(values: Record<string, string>): string {
  return JSON.stringify(values)
}

export function parseConstruct(raw: string): Record<string, string> | null {
  try {
    const v = JSON.parse(raw)
    if (!v || typeof v !== 'object' || Array.isArray(v)) return null
    const out: Record<string, string> = {}
    for (const [k, x] of Object.entries(v)) {
      if (typeof x !== 'string') return null
      out[k] = x
    }
    return out
  } catch {
    return null
  }
}

const EPS = 1e-9

function cmp(a: number, op: ConstructCmp, b: number, tol = 0): boolean {
  const slack = Math.max(tol, EPS)
  switch (op) {
    case '=':
      return Math.abs(a - b) <= slack
    case '!=':
      return Math.abs(a - b) > slack
    case '<':
      return a < b - EPS
    case '<=':
      return a <= b + slack
    case '>':
      return a > b + EPS
    case '>=':
      return a >= b - slack
  }
}


/** Summary statistics a constraint can be stated over. Total on non-empty input. */
export function statOf(stat: ConstructStat, xs: number[]): number {
  if (!xs.length) return NaN
  const sorted = [...xs].sort((a, b) => a - b)
  const sum = xs.reduce((a, b) => a + b, 0)
  const mean = sum / xs.length
  switch (stat) {
    case 'sum':
      return sum
    case 'mean':
      return mean
    case 'min':
      return sorted[0]
    case 'max':
      return sorted[sorted.length - 1]
    case 'absMax':
      // Largest magnitude regardless of direction. `range` is NOT a substitute:
      // (15, 14, 13) has range 2 and absMax 15, and (10, −8) has range 18 and
      // absMax 10 — so a range test both rejects correct answers and accepts
      // wrong ones. That exact substitution shipped in the force item for the
      // length of one commit.
      return Math.max(...xs.map(Math.abs))
    case 'absMin':
      return Math.min(...xs.map(Math.abs))
    case 'range':
      return sorted[sorted.length - 1] - sorted[0]
    case 'product':
      return xs.reduce((a, b) => a * b, 1)
    case 'distinct':
      return new Set(xs).size
    case 'spread':
      // Mean absolute deviation. Named `spread` because "how spread out" is the
      // question a learner is actually being asked to control.
      return xs.reduce((a, b) => a + Math.abs(b - mean), 0) / xs.length
    case 'median': {
      const mid = sorted.length >> 1
      return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
    }
  }
}

function pick(values: Record<string, number>, keys: string[]): number[] {
  return keys.map((k) => values[k])
}

/** Does one constraint hold? Total, and never throws on a missing slot. */
export function checkHolds(check: ConstructCheck, values: Record<string, number>): boolean {
  const need = (keys: string[]) => keys.every((k) => Number.isFinite(values[k]))
  switch (check.kind) {
    case 'stat': {
      if (!need(check.of)) return false
      return cmp(statOf(check.stat, pick(values, check.of)), check.cmp, check.value, check.tol)
    }
    case 'each':
      return need(check.of) && check.of.every((k) => cmp(values[k], check.cmp, check.value))
    case 'allDifferent': {
      if (!need(check.of)) return false
      return new Set(pick(values, check.of)).size === check.of.length
    }
    case 'ordered': {
      if (!need(check.of)) return false
      const xs = pick(values, check.of)
      return xs.every((v, i) => i === 0 || (check.dir === 'up' ? v > xs[i - 1] + EPS : v < xs[i - 1] - EPS))
    }
    case 'integer':
      return need(check.of) && check.of.every((k) => Number.isInteger(values[k]))
    case 'digits': {
      if (!need(check.of)) return false
      const pool = [...check.digits]
      for (const k of check.of) {
        const at = pool.indexOf(values[k])
        if (at < 0) return false
        pool.splice(at, 1)
      }
      return check.use === 'atMostOnce' || pool.length === 0
    }
    case 'linear': {
      const keys = Object.keys(check.terms)
      if (!need(keys)) return false
      const total = keys.reduce((a, k) => a + check.terms[k] * values[k], 0)
      return cmp(total, check.cmp, check.value, check.tol)
    }
    case 'relate': {
      if (!need(check.of)) return false
      const xs = pick(values, check.of)
      return cmp(statOf(check.left, xs), check.cmp, statOf(check.right, xs) + check.by, check.tol)
    }
    case 'bilinear': {
      const keys = check.terms.flatMap((t) => [t.a, t.b])
      if (!need(keys)) return false
      const total = check.terms.reduce((acc, t) => acc + t.c * values[t.a] * values[t.b], 0)
      return cmp(total, check.cmp, check.value, check.tol)
    }
    case 'isStat': {
      if (!need([check.slot, ...check.of])) return false
      return cmp(values[check.slot], '=', statOf(check.stat, pick(values, check.of)))
    }
  }
}

export interface ConstructVerdict {
  ok: boolean
  /** Share of constraints satisfied — display and diagnosis only, never a rung. */
  score: number
  /** Which checks failed, by index into `spec.checks`. */
  failed: number[]
  formatError?: string
}

/**
 * Grade a submission. A blank or unreadable box is a FORMAT problem, reported
 * as such rather than scored as a wrong answer — the same courtesy the numeric
 * validator extends, and it matters more here because there are several boxes.
 */
export function gradeConstruct(spec: ConstructAnswer, raw: string): ConstructVerdict {
  const given = parseConstruct(raw)
  if (!given) return { ok: false, score: 0, failed: [], formatError: 'Could not read that submission.' }
  const values: Record<string, number> = {}
  const unreadable: string[] = []
  for (const slot of spec.slots) {
    const text = (given[slot.key] ?? '').trim()
    if (!text) {
      unreadable.push(slot.label)
      continue
    }
    const n = parseExpression(text)
    if (Number.isNaN(n)) unreadable.push(slot.label)
    else values[slot.key] = n
  }
  if (unreadable.length)
    return {
      ok: false,
      score: 0,
      failed: [],
      formatError:
        unreadable.length === spec.slots.length
          ? 'Fill in every box before submitting.'
          : `Could not read a number in: ${unreadable.join(', ')}.`,
    }
  const failed = spec.checks.map((c, i) => (checkHolds(c, values) ? -1 : i)).filter((i) => i >= 0)
  return { ok: failed.length === 0, score: (spec.checks.length - failed.length) / spec.checks.length, failed }
}

/**
 * Is the generator's own witness actually a solution?
 *
 * The audit calls this on every construct item at every seed. A construction
 * problem whose constraints cannot all be met is worse than a wrong answer
 * key: the learner searches for something that does not exist and concludes
 * they are the problem.
 */
export function witnessSatisfies(spec: ConstructAnswer): { ok: boolean; failed: number[] } {
  const failed = spec.checks.map((c, i) => (checkHolds(c, spec.witness) ? -1 : i)).filter((i) => i >= 0)
  return { ok: failed.length === 0, failed }
}

/** The witness, serialized the way a learner's submission would be. */
export function witnessResponse(spec: ConstructAnswer): string {
  const out: Record<string, string> = {}
  for (const slot of spec.slots) out[slot.key] = String(spec.witness[slot.key] ?? '')
  return serializeConstruct(out)
}

