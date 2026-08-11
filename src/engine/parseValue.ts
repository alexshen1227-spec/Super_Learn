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
  if (plain) return Number(s.replace(/\s+/g, ''))
  // percent form "45%" — accepted as the number 45, since prompts specify units
  const pct = /^(-?\s*\d+(?:\.\d+)?)\s*%$/.exec(s)
  if (pct) return Number(pct[1].replace(/\s+/g, ''))
  return NaN
}
