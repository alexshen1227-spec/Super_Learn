/**
 * Deterministic answer validation.
 *
 * Correctness rules:
 *  - Numeric answers accept equivalent forms: "0.75", "3/4", " .75 ", "75/100".
 *  - Fraction answers accept any equivalent ratio unless lowest terms required.
 *  - Text answers normalize case/whitespace/punctuation-lite.
 *  - Tolerances are explicit per item, never a global fudge factor.
 *
 * Responses are serialized as strings for the event log:
 *  numeric/fraction/text → raw input; mcq → option index; multi → sorted
 *  indexes "0,2"; order → permutation "2,0,1"; classify → per-statement
 *  category "0,1,2"; draft → the written text itself (never graded).
 */
import type { AnswerSpec } from '../domain/types'

export interface Verdict {
  ok: boolean
  /** Deterministic partial credit 0..1 (equals ok?1:0 for all-or-nothing types). */
  score: number
  /** Short note on format problems ("could not read that as a number"). */
  formatError?: string
}

const WRONG: Verdict = { ok: false, score: 0 }

/** Parse "3/4", "-2 1/2" (mixed), "0.75", "12", "1,200" → number. NaN if unreadable. */
export function parseNumeric(raw: string): number {
  const s = raw.trim().replace(/,/g, '')
  if (!s) return NaN
  // mixed number: "a b/c" (sign on the whole)
  const mixed = /^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(s)
  if (mixed) {
    const sign = mixed[1] === '-' ? -1 : 1
    const whole = Number(mixed[2])
    const n = Number(mixed[3])
    const d = Number(mixed[4])
    if (d === 0) return NaN
    return sign * (whole + n / d)
  }
  const frac = /^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/.exec(s)
  if (frac) {
    const d = Number(frac[2])
    if (d === 0) return NaN
    return Number(frac[1]) / d
  }
  const plain = /^-?(?:\d+\.?\d*|\.\d+)(?:[eE]-?\d+)?$/.exec(s)
  if (plain) return Number(s)
  // percent form "45%" — accepted as the number 45, since prompts specify units
  const pct = /^(-?\d+(?:\.\d+)?)\s*%$/.exec(s)
  if (pct) return Number(pct[1])
  return NaN
}

export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKC')
    .replace(/['’`´]/g, "'")
    .replace(/[.,;:!?"()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function gcd(a: number, b: number): number {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) [a, b] = [b, a % b]
  return a || 1
}

function parseIndexList(raw: string): number[] | null {
  const t = raw.trim()
  if (t === '') return []
  const parts = t.split(',').map((p) => Number(p.trim()))
  if (parts.some((n) => !Number.isInteger(n) || n < 0)) return null
  return parts
}

export function validate(spec: AnswerSpec, raw: string): Verdict {
  switch (spec.type) {
    case 'numeric': {
      const v = parseNumeric(raw)
      if (Number.isNaN(v)) return { ...WRONG, formatError: 'Could not read that as a number.' }
      const tol = spec.tolerance ?? 0
      // Guard float dust on exact answers entered as fractions (e.g. 1/3).
      const eps = tol > 0 ? tol : Math.max(1e-9, Math.abs(spec.answer) * 1e-9)
      return Math.abs(v - spec.answer) <= eps ? { ok: true, score: 1 } : WRONG
    }
    case 'fraction': {
      const s = raw.trim()
      const m = /^(-?\d+)\s*\/\s*(-?\d+)$/.exec(s)
      let n: number, d: number
      if (m) {
        n = Number(m[1])
        d = Number(m[2])
        if (d === 0) return { ...WRONG, formatError: 'Denominator cannot be 0.' }
      } else {
        const whole = /^-?\d+$/.exec(s)
        if (!whole) return { ...WRONG, formatError: 'Write a fraction like 3/4 (or a whole number).' }
        n = Number(s)
        d = 1
      }
      // normalize sign to numerator
      if (d < 0) {
        n = -n
        d = -d
      }
      const equivalent = n * spec.d === spec.n * d
      if (!equivalent) return WRONG
      if (spec.requireLowest && gcd(n, d) !== 1)
        return { ...WRONG, formatError: 'Correct value — now reduce it to lowest terms.' }
      return { ok: true, score: 1 }
    }
    case 'text': {
      const norm = normalizeText(raw)
      if (!norm) return { ...WRONG, formatError: 'Type an answer first.' }
      return spec.accept.some((a) => normalizeText(a) === norm) ? { ok: true, score: 1 } : WRONG
    }
    case 'mcq': {
      // Number('') is 0 — a blank must never grade as "picked option 0".
      if (raw.trim() === '') return WRONG
      const i = Number(raw)
      if (!Number.isInteger(i) || i < 0 || i >= spec.options.length) return WRONG
      return i === spec.correct ? { ok: true, score: 1 } : WRONG
    }
    case 'multi': {
      const picks = parseIndexList(raw)
      if (!picks) return WRONG
      const want = [...spec.correct].sort((a, b) => a - b).join(',')
      const got = [...new Set(picks)].sort((a, b) => a - b).join(',')
      return want === got ? { ok: true, score: 1 } : WRONG
    }
    case 'order': {
      const perm = parseIndexList(raw)
      if (!perm || perm.length !== spec.correct.length) return WRONG
      return perm.every((v, i) => v === spec.correct[i]) ? { ok: true, score: 1 } : WRONG
    }
    case 'classify': {
      const picks = parseIndexList(raw)
      if (!picks || picks.length !== spec.statements.length) return WRONG
      const right = picks.filter((p, i) => p === spec.statements[i].category).length
      const score = right / spec.statements.length
      return { ok: score === 1, score }
    }
    case 'steps': {
      const given = parseSteps(raw)
      if (!given) return { ...WRONG, formatError: 'Fill in every step before submitting.' }
      let right = 0
      for (const [i, step] of spec.steps.entries()) {
        if (validate(step.answer, given[i] ?? '').ok) right++
      }
      const score = right / spec.steps.length
      // All-or-nothing for `ok`: a chain with a broken link did not reach the
      // answer, however many early steps were right. `score` carries the
      // partial credit for display and diagnosis only.
      return { ok: right === spec.steps.length, score }
    }
    case 'draft':
      // A draft is never graded. `ok` here means "accepted, move on" — callers
      // must log it as correct: null / score: null so the mastery replay sees
      // exposure and nothing more.
      return { ok: true, score: 0 }
  }
}

/**
 * Step responses travel as a JSON string array so a learner's own text can
 * never collide with a separator character.
 */
export function serializeSteps(values: string[]): string {
  return JSON.stringify(values)
}

function parseSteps(raw: string): string[] | null {
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) && v.every((x) => typeof x === 'string') ? v : null
  } catch {
    return null
  }
}

/**
 * Index of the FIRST broken link, or null if the chain holds. This is what
 * turns a wrong answer into a diagnosis: the earliest failure is the one that
 * explains everything after it.
 */
export function firstFailedStep(spec: Extract<AnswerSpec, { type: 'steps' }>, raw: string): number | null {
  const given = parseSteps(raw) ?? []
  for (const [i, step] of spec.steps.entries()) {
    if (!validate(step.answer, given[i] ?? '').ok) return i
  }
  return null
}

/** Human-readable form of the correct answer, for repair screens. */
export function describeAnswer(spec: AnswerSpec): string {
  switch (spec.type) {
    case 'numeric':
      return `${spec.answer}${spec.unit ? ' ' + spec.unit : ''}`
    case 'fraction':
      return `${spec.n}/${spec.d}`
    case 'text':
      return spec.accept[0]
    case 'mcq':
      return spec.options[spec.correct]
    case 'multi':
      return spec.correct.map((i) => spec.options[i]).join('; ')
    case 'order':
      return spec.correct.map((i) => spec.options[i]).join(' → ')
    case 'classify':
      return spec.statements.map((s) => `${s.text} → ${spec.categories[s.category]}`).join('; ')
    case 'steps':
      return spec.steps.map((st) => `${st.label}: ${describeAnswer(st.answer)}`).join('  →  ')
    case 'draft':
      return spec.model
  }
}

/**
 * Human-readable form of what the LEARNER submitted, for the repair screen.
 * Choice answers are serialized as indexes, and showing "Your answer: 2" back
 * to someone who just picked a sentence is useless at exactly the moment they
 * need to see their own reasoning.
 */
export function describeResponse(spec: AnswerSpec, raw: string): string {
  // Number('') is 0 — a blank must never read back as "you picked option 0",
  // the same trap the mcq validator guards against.
  if (raw.trim() === '') return raw
  const indexes = parseIndexList(raw)
  switch (spec.type) {
    case 'mcq': {
      const i = Number(raw)
      return Number.isInteger(i) && i >= 0 && i < spec.options.length ? spec.options[i] : raw
    }
    case 'multi':
    case 'order': {
      if (!indexes?.length) return raw
      const picked = indexes.filter((i) => i >= 0 && i < spec.options.length).map((i) => spec.options[i])
      return picked.length ? picked.join(spec.type === 'order' ? ' → ' : '; ') : raw
    }
    case 'classify': {
      if (!indexes?.length) return raw
      return indexes
        .map((c, i) => `${spec.statements[i]?.text ?? `#${i + 1}`} → ${spec.categories[c] ?? '?'}`)
        .join('; ')
    }
    case 'steps': {
      const given = parseSteps(raw)
      if (!given) return raw
      return spec.steps.map((st, i) => `${st.label}: ${given[i] ?? '—'}`).join('; ')
    }
    default:
      return raw
  }
}

/** Validator name recorded on events (audit trail for how grading happened). */
export function validatorName(spec: AnswerSpec): string {
  return spec.type
}

/**
 * Serialize the canonical correct response for a spec — used by the content
 * audit (every item must accept its own answer) and the sample-data builder.
 */
export function correctResponse(spec: AnswerSpec): string {
  switch (spec.type) {
    case 'numeric':
      return String(spec.answer)
    case 'fraction':
      return `${spec.n}/${spec.d}`
    case 'text':
      return spec.accept[0]
    case 'mcq':
      return String(spec.correct)
    case 'multi':
      return [...spec.correct].sort((a, b) => a - b).join(',')
    case 'order':
      return spec.correct.join(',')
    case 'classify':
      return spec.statements.map((s) => s.category).join(',')
    case 'steps':
      return serializeSteps(spec.steps.map((st) => correctResponse(st.answer)))
    case 'draft':
      // A draft has no "correct" text. The audit treats drafts as ungraded and
      // never asserts a verdict on them; this keeps the function total.
      return spec.model
  }
}

/** A deliberately wrong response for negative audit tests. */
export function wrongResponse(spec: AnswerSpec): string {
  switch (spec.type) {
    case 'numeric':
      return String(spec.answer + Math.max(1, Math.abs(spec.answer) * 0.5 + (spec.tolerance ?? 0) * 4 + 1))
    case 'fraction':
      // (n+1)/d is never equivalent to n/d (cross products differ by d ≠ 0).
      return `${spec.n + 1}/${spec.d}`
    case 'text':
      return 'zz-not-the-answer-zz'
    case 'mcq':
      return String((spec.correct + 1) % spec.options.length)
    case 'multi': {
      const not = spec.options.map((_, i) => i).filter((i) => !spec.correct.includes(i))
      return not.length ? String(not[0]) : spec.correct.slice(0, spec.correct.length - 1).join(',')
    }
    case 'order': {
      const swapped = [...spec.correct]
      ;[swapped[0], swapped[1]] = [swapped[1], swapped[0]]
      return swapped.join(',')
    }
    case 'classify':
      return spec.statements.map((s) => (s.category + 1) % spec.categories.length).join(',')
    case 'steps':
      // Break the FIRST link only: the rest stay correct, which is exactly the
      // partial-chain shape the diagnosis has to handle.
      return serializeSteps(spec.steps.map((st, i) => (i === 0 ? wrongResponse(st.answer) : correctResponse(st.answer))))
    case 'draft':
      return '' // a draft cannot be wrong; the audit skips the negative case
  }
}
