/**
 * Reading a number a learner typed.
 *
 * Extracted so the constructed-answer grader and the ordinary numeric grader
 * cannot drift apart. They did, briefly: `construct` shipped with a stricter
 * parser that rejected "3 1/2" and "50%" — forms the numeric validator has
 * accepted since the beginning. A grader that refuses a correct answer is
 * worse than a lenient one here, because the mastery ladder blocks promotion
 * on unrepaired errors, so a picky parser silently parks a learner on a skill
 * they already have.
 */

/** Parse "3/4", "-2 1/2" (mixed), "0.75", "12", "1,200", "45%", "+5" → number. NaN if unreadable. */
/** NaN unless the value is a real, representable number. */
const finite = (n: number) => (Number.isFinite(n) ? n : NaN)

export function parseNumeric(raw: string): number {
  const s = raw.trim().replace(/,/g, '').replace(/^\+/, '')
  if (!s) return NaN
  // mixed number: "a b/c" (sign on the whole)
  const mixed = /^(-?)\s*(\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(s)
  if (mixed) {
    const sign = mixed[1] === '-' ? -1 : 1
    const whole = Number(mixed[2])
    const n = Number(mixed[3])
    const d = Number(mixed[4])
    if (d === 0) return NaN
    return sign * (whole + n / d)
  }
  const frac = /^(-?\s*\d+(?:\.\d+)?)\s*\/\s*(-?\s*\d+(?:\.\d+)?)$/.exec(s)
  if (frac) {
    const d = Number(frac[2].replace(/\s+/g, ''))
    if (d === 0) return NaN
    return Number(frac[1].replace(/\s+/g, '')) / d
  }
  const plain = /^-?\s*(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.exec(s)
  // Overflow is not a readable number. Without this, 400 nines parses as
  // Infinity, which is finite-looking enough to reach a grader and be marked
  // wrong instead of reported as unreadable.
  if (plain) return finite(Number(s.replace(/\s+/g, '')))
  // percent form "45%" — accepted as the number 45, since prompts specify units
  const pct = /^(-?\s*\d+(?:\.\d+)?)\s*%$/.exec(s)
  if (pct) return Number(pct[1].replace(/\s+/g, ''))
  return NaN
}

/**
 * A richer parse, for CONSTRUCTED answers only.
 *
 * `parseNumeric` above is what grades ordinary numeric questions, and it stays
 * deliberately literal: if a question asks you to work out 12 ÷ 4 + 1, then
 * accepting the string "12/4 + 1" would credit you for typing the question
 * back. That risk is real and the strictness is correct there.
 *
 * A construction has no such risk, because the answer is an object you invent
 * and the prompt cannot contain it. "Give five numbers with mean 7" tells you
 * nothing you could restate. So here the whole point is to accept every way a
 * person might write a value they have worked out — `2^3`, `sqrt(9)`, `½`,
 * `12/4 + 1`, `(3+5)/2` — because the mastery ladder blocks promotion on
 * unrepaired errors, and a grader that rejects a right answer silently parks
 * the learner on a skill they already hold.
 *
 * Deliberately tiny: numbers, + − × ÷, powers, brackets and sqrt. No
 * variables, no other functions, no coercion of things that are not numbers.
 * Returns NaN on anything it does not fully understand rather than guessing.
 */
const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 0.5, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 0.25, '¾': 0.75,
  '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8, '⅙': 1 / 6, '⅚': 5 / 6,
  '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
}

/**
 * Longest input treated as an expression.
 *
 * A grader is a hostile-input surface even with one user: a paste accident is
 * enough. Two thousand open brackets overflowed the stack and took the whole
 * player down with a RangeError, so depth and length are both bounded rather
 * than trusted.
 */
const MAX_EXPRESSION_CHARS = 200
const MAX_DEPTH = 24

export function parseExpression(raw: string): number {
  const plain = parseNumeric(raw)
  if (!Number.isNaN(plain)) return plain

  let s = raw.trim().replace(/,/g, '').replace(/\s+/g, '')
  if (!s || s.length > MAX_EXPRESSION_CHARS) return NaN
  // Typographic operators and unicode fractions become their plain equivalents.
  s = s.replace(/[×·]/g, '*').replace(/[÷]/g, '/').replace(/[−–—]/g, '-').replace(/\*\*/g, '^')
  for (const [glyph, value] of Object.entries(UNICODE_FRACTIONS)) s = s.split(glyph).join(`(${value})`)
  if (!/^[-+*/^().\d]|sqrt/.test(s)) return NaN
  if (!/^(?:sqrt|[-+*/^().\d])+$/.test(s)) return NaN

  let at = 0
  let depth = 0
  const eat = (c: string) => (s[at] === c ? (at++, true) : false)

  // expr := term (('+' | '-') term)*
  const expr = (): number => {
    let v = term()
    for (;;) {
      if (eat('+')) v += term()
      else if (eat('-')) v -= term()
      else return v
    }
  }
  // term := power (('*' | '/') power)*
  const term = (): number => {
    let v = power()
    for (;;) {
      if (eat('*')) v *= power()
      else if (eat('/')) {
        const d = power()
        if (d === 0) return NaN
        v /= d
      } else return v
    }
  }
  // power := unary ('^' power)?   — right-associative, as written by hand
  const power = (): number => {
    const base = unary()
    return eat('^') ? base ** power() : base
  }
  const unary = (): number => {
    if (eat('-')) return -unary()
    if (eat('+')) return unary()
    return atom()
  }
  const atom = (): number => {
    if (s.startsWith('sqrt', at)) {
      at += 4
      if (!eat('(')) return NaN
      if (++depth > MAX_DEPTH) return NaN
      const v = expr()
      depth--
      if (!eat(')')) return NaN
      return v < 0 ? NaN : Math.sqrt(v)
    }
    if (eat('(')) {
      if (++depth > MAX_DEPTH) return NaN
      const v = expr()
      depth--
      return eat(')') ? v : NaN
    }
    const start = at
    while (at < s.length && /[\d.]/.test(s[at])) at++
    if (at === start) return NaN
    const n = Number(s.slice(start, at))
    return Number.isFinite(n) ? n : NaN
  }

  const value = expr()
  // Anything left over means the string was not fully understood. `finite`
  // also rules out an overflow from something like 2^1000000.
  return at === s.length ? finite(value) : NaN
}
