/**
 * The grader, fuzzed against every template.
 *
 * The grader is the last thing standing between a learner and a false claim
 * about what they know. Everything downstream — the evidence ladder, the coach,
 * the review schedule — trusts its verdict completely, so it has to be
 * unfoolable and it has to never throw.
 *
 * WHAT THIS FOUND. Option indexes were parsed with `Number()`, which is far too
 * generous for a value that selects an answer: `"1e-999"` underflows to 0 and
 * so picked option 0 on 180 templates, and a bare `","` split to `['', '']` →
 * `[0, 0]` → deduped `[0]`, which SCORED a multi-select whose answer was the
 * first option. Neither is reachable from the player, which sends indexes it
 * generated itself — but this is the third appearance of the `Number('') === 0`
 * family in this file's history, and the grader should not depend on its
 * callers behaving. Indexes are now matched against plain digits, not coerced.
 */
import { describe, expect, it } from 'vitest'
import { BUILTIN_TEMPLATES } from '../content/registry'
import { correctResponse, parseNumeric, validate, validatorName } from './validate'
import type { AnswerSpec, RenderedItem } from '../domain/types'

const specsOf = (item: RenderedItem): AnswerSpec[] =>
  item.parts?.length ? item.parts.map((p) => p.answer) : item.answer ? [item.answer] : []

/**
 * Is this string a legitimate way to express the correct answer rather than
 * junk that slipped through? `" 5 "` on a numeric key of 5 is someone typing
 * with spaces, `"1,000"` is a thousands separator the parser accepts on
 * purpose, and `"0"` on a multiple choice is simply the first option.
 */
function equivalentToKey(spec: AnswerSpec, raw: string): boolean {
  const trimmed = raw.trim()
  if (trimmed === '') return false
  switch (spec.type) {
    case 'numeric': {
      // The app's own parser, not Number(): fractions, percents and thousands
      // separators are deliberately accepted forms.
      const n = parseNumeric(trimmed)
      const eps = (spec.tolerance ?? 0) + Math.max(1e-9, Math.abs(spec.answer) * 1e-9)
      return Number.isFinite(n) && Math.abs(n - spec.answer) <= eps
    }
    case 'fraction': {
      const n = parseNumeric(trimmed)
      return Number.isFinite(n) && Math.abs(n - spec.n / spec.d) < 1e-9
    }
    case 'text':
      return spec.accept.some((a) => a.trim().toLowerCase() === trimmed.toLowerCase())
    // Index answers: plain digits are what the player sends. Anything else that
    // coerces into a valid index is exactly what this fuzz is hunting.
    case 'mcq':
    case 'multi':
    case 'order':
    case 'classify':
      return /^[0-9]+(\s*,\s*[0-9]+)*$/.test(trimmed)
    default:
      return false
  }
}

/** Things a real person types, plus things nobody should be able to submit. */
const JUNK = [
  '', ' ', '  \t ', '\n', 'abc', '???', '-', '+', '.', ',', 'NaN', 'Infinity', '-Infinity',
  'null', 'undefined', '[]', '{}', 'true', '0x10', '1e999', '1e-999', '--5', '5--', '1/0', '0/0',
  '1,000', '１２３', '٣', '½', '−5', '‑5', ' 5 ', '5 ', ' 5', '5.', '.5', '00005',
  'Infinity/1', '9'.repeat(400), 'a'.repeat(5000), '<script>alert(1)</script>', '../../etc/passwd',
  '%00', ' ', '�', '999999999999999999999999', '-0',
]

describe('the grader cannot be fooled or crashed', () => {
  it('never throws, never accepts junk, and ignores surrounding whitespace', () => {
    const findings: string[] = []
    const seen = new Set<string>()
    const note = (key: string, msg: string) => {
      if (seen.has(key)) return
      seen.add(key)
      findings.push(msg)
    }

    for (const t of BUILTIN_TEMPLATES) {
      for (const seed of [0, 1, 2, 7, 23]) {
        let item: RenderedItem
        try {
          item = t.generate(seed)
        } catch (e) {
          note(`gen:${t.id}`, `THREW generating ${t.id}@${seed}: ${String(e).slice(0, 120)}`)
          continue
        }
        for (const [i, spec] of specsOf(item).entries()) {
          const where = `${t.id}@${seed} part${i} (${validatorName(spec)})`

          for (const junk of JUNK) {
            let verdict
            try {
              verdict = validate(spec, junk)
            } catch (e) {
              note(`throw:${t.id}:${spec.type}`, `THREW ${where} on ${JSON.stringify(junk).slice(0, 40)}: ${String(e).slice(0, 100)}`)
              continue
            }
            if (typeof verdict.ok !== 'boolean') note(`shape:${t.id}`, `BAD SHAPE ${where}: ok=${String(verdict.ok)}`)
            if (!Number.isFinite(verdict.score) || verdict.score < 0 || verdict.score > 1) {
              note(`score:${t.id}:${spec.type}`, `BAD SCORE ${where} on ${JSON.stringify(junk).slice(0, 30)}: ${verdict.score}`)
            }
            // A draft is ungraded by law; everything else must reject junk.
            if (verdict.ok && spec.type !== 'draft' && !equivalentToKey(spec, junk)) {
              note(`accept:${t.id}:${spec.type}`, `ACCEPTED JUNK ${where}: ${JSON.stringify(junk).slice(0, 40)}`)
            }
          }

          if (spec.type === 'draft') continue

          // The canonical key must pass, and padding must not change a verdict.
          const good = correctResponse(spec)
          const base = validate(spec, good)
          if (!base.ok) note(`key:${t.id}`, `KEY REJECTED ${where}: ${JSON.stringify(good).slice(0, 60)}`)
          for (const padded of [` ${good}`, `${good} `, ` ${good} `, `\t${good}\n`]) {
            let verdict
            try {
              verdict = validate(spec, padded)
            } catch (e) {
              note(`padthrow:${t.id}`, `THREW on a padded key ${where}: ${String(e).slice(0, 90)}`)
              continue
            }
            if (verdict.ok !== base.ok) {
              note(`pad:${t.id}:${spec.type}`, `WHITESPACE CHANGED THE VERDICT ${where}: ${JSON.stringify(padded).slice(0, 40)} → ${verdict.ok}`)
            }
          }
        }
      }
    }

    expect(findings, `grader fuzz findings:\n${findings.join('\n')}`).toEqual([])
  }, 900_000)
})
