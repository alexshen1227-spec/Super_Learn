/**
 * WRONG ANSWERS MUST FAIL.
 *
 * The audit already proves every construction is solvable and that the app's
 * own witness is accepted. That is one direction. It says nothing about
 * whether a wrong answer is rejected, and the bug that prompted this file was
 * wrong in BOTH directions at once: the force item expressed "the strongest
 * force is exactly N" as `range >= N`, which rejects (15, 14, 13) — correct,
 * absMax 15 — and accepts (10, −8, …) — wrong, absMax 10. A solvability gate
 * cannot see either failure, because the witness happened to satisfy both
 * predicates.
 *
 * So the negatives here are hand-written and encode INTENT, not structure. A
 * generic mutation cannot catch a mis-specified constraint, because it has no
 * idea what the constraint was supposed to say. Each entry below is a
 * statement about the problem a human made and can be wrong about — which is
 * exactly what makes it worth testing.
 *
 * Every negative is built FROM the generated spec, so it runs at every seed
 * rather than against one frozen instance.
 */
import { describe, expect, it } from 'vitest'
import { BUILTIN_TEMPLATES } from '../registry'
import type { ConstructAnswer } from '../../domain/types'
import { checkHolds, serializeConstruct, statOf } from '../../engine/construct'
import { validate } from '../../engine/validate'

const SEEDS = 8

/** A submission that must be rejected, and the reason a human expects that. */
interface Negative {
  why: string
  values: Record<string, number> | null
}
type Builder = (spec: ConstructAnswer) => Negative

const keys = (s: ConstructAnswer) => s.slots.map((x) => x.key)
const w = (s: ConstructAnswer) => ({ ...s.witness })
const vals = (s: ConstructAnswer, v: Record<string, number>) => keys(s).map((k) => v[k])

/**
 * Search for an assignment satisfying every constraint EXCEPT the named one.
 *
 * Used where a targeted negative is easier to find than to write — notably the
 * force item, where the point is an answer that is right about the sum, the
 * distinctness and the non-zero rule and wrong ONLY about the peak magnitude.
 * Deterministic (fixed LCG) so a failure is reproducible rather than a flake.
 */
function violateOnly(spec: ConstructAnswer, targetLabelPart: string, spread = 24): Record<string, number> | null {
  const target = spec.checks.findIndex((c) => c.label.includes(targetLabelPart))
  if (target < 0) return null
  let s = 12345
  const rnd = (n: number) => ((s = (s * 1103515245 + 12345) & 0x7fffffff) % n)
  const ks = keys(spec)
  for (let attempt = 0; attempt < 20000; attempt++) {
    const guess: Record<string, number> = {}
    for (const k of ks) guess[k] = spec.witness[k] + (rnd(2 * spread + 1) - spread)
    const failing = spec.checks.map((c, i) => (checkHolds(c, guess) ? -1 : i)).filter((i) => i >= 0)
    if (failing.length === 1 && failing[0] === target) return guess
  }
  return null
}

/**
 * An assignment that definitely breaks ONE named constraint.
 *
 * Built per constraint kind rather than searched for. The random search above
 * perturbs by whole numbers, so it can never violate "is a whole number" — it
 * reported those constraints as unbreakable when they were merely unreachable
 * by that method, which is a good illustration of why a probe needs a canary.
 */
function breakCheck(spec: ConstructAnswer, i: number): Record<string, number> | null {
  const c = spec.checks[i]
  const v = { ...spec.witness }
  const first = (ks: string[]) => ks.find((k) => k in v)
  switch (c.kind) {
    case 'integer': {
      const k = first(c.of)
      if (!k) return null
      v[k] += 0.5
      return v
    }
    case 'allDifferent': {
      if (c.of.length < 2) return null
      v[c.of[1]] = v[c.of[0]]
      return v
    }
    case 'ordered': {
      if (c.of.length < 2) return null
      ;[v[c.of[0]], v[c.of[1]]] = [v[c.of[1]], v[c.of[0]]]
      return checkHolds(c, v) ? null : v
    }
    case 'digits': {
      const k = first(c.of)
      if (!k) return null
      v[k] = Math.max(...c.digits) + 1000
      return v
    }
    case 'each': {
      const k = first(c.of)
      if (!k) return null
      // Push far in the direction the comparison forbids.
      v[k] = c.cmp === '!=' ? c.value : c.cmp.startsWith('<') ? c.value + 1e6 : c.value - 1e6
      return v
    }
    case 'isStat': {
      v[c.slot] = statOf(c.stat, c.of.map((k) => v[k])) + 1e6
      return v
    }
    default: {
      // stat / linear / bilinear / relate. Direction matters: pushing a value
      // UP cannot break a `>=` constraint, which is how the digit-target
      // product checks first read as unbreakable when they were only being
      // pushed the wrong way. Try both directions and several magnitudes.
      const ks = 'of' in c ? c.of : c.kind === 'linear' ? Object.keys(c.terms) : c.terms.flatMap((t) => [t.a, t.b])
      for (const k of ks) {
        if (!(k in v)) continue
        for (const delta of [1e6, -1e6, 1, -1, 0.5, -0.5]) {
          const trial = { ...spec.witness, [k]: spec.witness[k] + delta }
          if (!checkHolds(c, trial)) return trial
        }
      }
      // A MEDIAN can be immune to every single-value change: with duplicates
      // sitting on the middle, moving one value either side leaves it exactly
      // where it was. That is the resistance property `nr-build-skew` teaches,
      // not a constraint that does nothing — so shift the whole set instead.
      for (const shift of [1000, -1000]) {
        const trial = Object.fromEntries(Object.entries(spec.witness).map(([k, x]) => [k, x + shift]))
        if (!checkHolds(c, trial)) return trial
      }
      return null
    }
  }
}

const NEGATIVES: Record<string, Builder[]> = {
  'nr-build-dataset': [
    (s) => ({
      why: 'five copies of the mean have the right mean but no range and the wrong median',
      values: Object.fromEntries(keys(s).map((k) => [k, statOf('mean', vals(s, s.witness))])),
    }),
    (s) => {
      // Preserve the mean exactly while breaking wholeness — a set that is
      // numerically "right on average" is still not an answer to this question.
      const v = w(s)
      const ks = keys(s)
      v[ks[0]] += 0.5
      v[ks[1]] -= 0.5
      return { why: 'halves that keep the mean but are not whole numbers', values: v }
    },
    (s) => {
      const v = w(s)
      const ks = keys(s)
      const top = ks.reduce((a, b) => (v[a] >= v[b] ? a : b))
      v[top] += 5
      return { why: 'stretching the largest value breaks both the mean and the range', values: v }
    },
  ],
  'nr-build-skew': [
    (s) => ({ why: 'five identical values put the mean ON the median, not above it', values: Object.fromEntries(keys(s).map((k) => [k, 10])) }),
    (s) => {
      const v = w(s)
      v[keys(s)[0]] = 0
      return { why: 'a value of 0 is below the stated floor of 1', values: v }
    },
    (s) => {
      const v = w(s)
      v[keys(s)[0]] = 10_000
      return { why: 'a value far above the stated ceiling', values: v }
    },
  ],
  'nr-digit-target': [
    (s) => {
      const v = w(s)
      const ks = keys(s)
      v[ks[1]] = v[ks[0]]
      return { why: 'the same digit used twice when each may be used at most once', values: v }
    },
    (s) => {
      const v = w(s)
      v[keys(s)[0]] = 0
      return { why: '0 is not in the 1–9 pool', values: v }
    },
    () => ({
      why: 'a legal digit choice whose product misses the search-verified optimum',
      // 1,2,3,4 → 12 × 34 = 408, which is below every target this item generates.
      values: { a: 1, b: 2, c: 3, d: 4 },
    }),
  ],
  'nr-integer-pair': [
    (s) => {
      const v = w(s)
      v[keys(s)[0]] = 0
      return { why: 'A = 0 is below the stated minimum of 1', values: v }
    },
    (s) => {
      const v = w(s)
      v[keys(s)[0]] += 1
      return { why: 'nudging A by one breaks the equation', values: v }
    },
    (s) => {
      // Shift A by half a unit and take B back down by the ratio that keeps the
      // linear equation exact, so ONLY wholeness is broken.
      const lin = s.checks.find((c) => c.kind === 'linear')
      if (lin?.kind !== 'linear') return { why: 'fractional pair', values: null }
      const [ka, kb] = keys(s)
      const v = w(s)
      v[ka] += 0.5
      v[kb] -= (0.5 * lin.terms[ka]) / lin.terms[kb]
      return { why: 'a fractional pair that satisfies the equation but is not whole', values: v }
    },
  ],
  'nr-force-design': [
    // THE regression test. This is the exact shape the range/absMax bug let through.
    (s) => ({
      why: 'right sum, all distinct, none zero — but no force reaches the stated peak',
      values: violateOnly(s, 'strongest single force'),
    }),
    (s) => {
      const v = w(s)
      const ks = keys(s)
      const delta = v[ks[0]] - v[ks[1]]
      v[ks[1]] += delta
      v[ks[2]] -= delta
      return { why: 'two identical forces, when no two may be the same', values: v }
    },
    (s) => {
      const v = w(s)
      const ks = keys(s)
      v[ks[2]] += v[ks[0]]
      v[ks[0]] = 0
      return { why: 'a zero force, with the sum kept correct', values: v }
    },
    (s) => {
      const v = w(s)
      v[keys(s)[0]] += 1
      return { why: 'a net force one newton off', values: v }
    },
  ],
  'nr-lever-design': [
    (s) => {
      const v = w(s)
      v[keys(s)[0]] += 1
      return { why: 'a mass one kilogram off no longer balances', values: v }
    },
    () => ({ why: 'a mass above the stated 12 kg limit', values: { a: 13, b: 1 } }),
    (s) => {
      // Keep the product exactly, break wholeness. Halving the mass and
      // doubling the distance does NOT work: for an even mass that lands on two
      // whole numbers still inside the range, which is a perfectly good answer
      // — the test called it wrong twice before this was noticed.
      const [ka, kb] = keys(s)
      const torque = w(s)[ka] * w(s)[kb]
      const v = w(s)
      v[ka] = v[ka] + 0.5
      v[kb] = torque / v[ka]
      return { why: 'a mass and distance whose product balances but which are not whole numbers', values: v }
    },
  ],
  'nr-schedule-design': [
    (s) => {
      // The last session must be the shortest. Swap it with the longest so the
      // total, the floor and the all-different rule all still hold.
      const v = w(s)
      const ks = keys(s)
      const last = ks[ks.length - 1]
      const longest = ks.reduce((a, b) => (v[a] >= v[b] ? a : b))
      ;[v[last], v[longest]] = [v[longest], v[last]]
      return { why: 'the longest session moved to the last day, which must be the shortest', values: v }
    },
    (s) => {
      // Copy day 1's length onto day 2 and give the difference to day 3, so the
      // total, the floor and "day 4 is shortest" all still hold and ONLY the
      // all-different rule is broken. Parity-independent, unlike averaging.
      const v = w(s)
      const ks = keys(s)
      v[ks[2]] += v[ks[1]] - v[ks[0]]
      v[ks[1]] = v[ks[0]]
      return { why: 'two sessions of equal length, with the total preserved', values: v }
    },
    (s) => {
      const v = w(s)
      v[keys(s)[0]] += 5
      return { why: 'five minutes over the stated total', values: v }
    },
  ],
}

function constructItems() {
  const out: { id: string; seed: number; spec: ConstructAnswer }[] = []
  for (const t of BUILTIN_TEMPLATES) {
    for (let seed = 0; seed < Math.min(SEEDS, Math.max(1, t.variants)); seed++) {
      const item = t.generate(seed)
      for (const part of item.parts ?? [{ answer: item.answer }]) {
        const a = part.answer ?? item.answer
        if (a?.type === 'construct') out.push({ id: t.id, seed, spec: a })
      }
    }
  }
  return out
}

describe('constructed answers reject wrong answers, not just accept right ones', () => {
  const items = constructItems()

  it('there is something to test', () => {
    expect(items.length).toBeGreaterThan(0)
  })

  it('every construct template carries hand-written negatives', () => {
    // A coverage gate, so a new construction cannot ship with only a
    // solvability check — which is the state that let the force bug through.
    const missing = [...new Set(items.map((i) => i.id))].filter((id) => !NEGATIVES[id]?.length)
    expect(missing, `construct templates with no wrong-answer test: ${missing.join(', ')}`).toEqual([])
  })

  it('the intended solution is accepted at every seed', () => {
    const bad: string[] = []
    for (const { id, seed, spec } of items) {
      const sub = serializeConstruct(Object.fromEntries(spec.slots.map((s) => [s.key, String(spec.witness[s.key])])))
      if (!validate(spec, sub).ok) bad.push(`${id} seed ${seed}`)
    }
    expect(bad, `the app's own answer was rejected: ${bad.join(', ')}`).toEqual([])
  })

  it('every known-wrong answer is rejected at every seed', () => {
    const accepted: string[] = []
    const unbuilt: string[] = []
    for (const { id, seed, spec } of items) {
      for (const build of NEGATIVES[id] ?? []) {
        const neg = build(spec)
        if (!neg.values) {
          unbuilt.push(`${id} seed ${seed}: could not build "${neg.why}"`)
          continue
        }
        const sub = serializeConstruct(Object.fromEntries(Object.entries(neg.values).map(([k, v]) => [k, String(v)])))
        if (validate(spec, sub).ok) accepted.push(`${id} seed ${seed} ACCEPTED a wrong answer — ${neg.why}`)
      }
    }
    expect(accepted, accepted.join('; ')).toEqual([])
    // A negative that cannot be constructed is not a pass. It means the search
    // failed or the item changed shape, and either way nothing was verified.
    expect(unbuilt, `negatives that could not be built: ${unbuilt.join('; ')}`).toEqual([])
  })

  it('every single constraint can actually be broken', () => {
    // A constraint nothing can violate is decoration on the checklist the
    // learner reads. Built per kind rather than searched for, because the
    // whole-number rules are unreachable by a whole-number search.
    const unbreakable: string[] = []
    const missed: string[] = []
    for (const { id, seed, spec } of items) {
      for (const [i, c] of spec.checks.entries()) {
        const broken = breakCheck(spec, i)
        if (!broken) {
          unbreakable.push(`${id} seed ${seed}: "${c.label}"`)
          continue
        }
        if (checkHolds(c, broken)) {
          unbreakable.push(`${id} seed ${seed}: "${c.label}" survived being broken`)
          continue
        }
        const sub = serializeConstruct(Object.fromEntries(Object.entries(broken).map(([k, x]) => [k, String(x)])))
        if (validate(spec, sub).ok) missed.push(`${id} seed ${seed}: grader accepted a submission violating "${c.label}"`)
      }
    }
    expect(unbreakable, `constraints that cannot be violated: ${unbreakable.join('; ')}`).toEqual([])
    expect(missed, missed.join('; ')).toEqual([])
  })
})

describe('right answers are accepted, not just wrong ones rejected', () => {
  const items = constructItems()

  /**
   * Search for assignments that satisfy every constraint, other than the
   * generator's own witness.
   *
   * Deterministic. Tries the witness perturbed in small ways first, then a
   * wider random sweep, because most alternative solutions sit close to a
   * known one and a purely random search over five slots finds nothing.
   */
  function otherSolutions(spec: ConstructAnswer, want: number): Record<string, number>[] {
    const keys = spec.slots.map((s) => s.key)
    const found: Record<string, number>[] = []
    const seen = new Set<string>()
    let st = 987654321
    const rnd = (n: number) => ((st = (st * 1103515245 + 12345) & 0x7fffffff) % n)
    const consider = (v: Record<string, number>) => {
      if (found.length >= want) return
      if (!spec.checks.every((c) => checkHolds(c, v))) return
      const key = keys.map((k) => v[k]).join(',')
      if (seen.has(key) || key === keys.map((k) => spec.witness[k]).join(',')) return
      seen.add(key)
      found.push(v)
    }
    // Swaps and small nudges around the witness.
    for (let i = 0; i < keys.length && found.length < want; i++) {
      for (let j = i + 1; j < keys.length && found.length < want; j++) {
        const v = { ...spec.witness }
        ;[v[keys[i]], v[keys[j]]] = [v[keys[j]], v[keys[i]]]
        consider(v)
      }
    }
    for (let tries = 0; tries < 40000 && found.length < want; tries++) {
      const v = { ...spec.witness }
      const howMany = 1 + rnd(Math.min(3, keys.length))
      for (let k = 0; k < howMany; k++) v[keys[rnd(keys.length)]] += rnd(25) - 12
      consider(v)
    }
    return found
  }

  it('every construction really does have more than one answer', () => {
    // The player tells the learner "More than one answer works. Any set of
    // values meeting every condition is correct." A seed with a UNIQUE
    // solution makes that a lie, and is the signature of a constraint set that
    // is too strict — the failure mode no other gate here can see, because
    // every other test only asks whether wrong answers are refused.
    const unique: string[] = []
    for (const { id, seed, spec } of items) {
      // `solutionCount` is authoritative where the generator counted by
      // exhaustive search; the local search below is a fallback and is weak on
      // structured constraints — it could not find the second solution to a
      // linear equation, which needs a coordinated move along the lattice
      // rather than an independent nudge per slot.
      const known = spec.solutionCount
      if (known !== undefined) {
        if (known < 2) unique.push(`${id} seed ${seed} (generator counted ${known})`)
        continue
      }
      if (!otherSolutions(spec, 1).length) unique.push(`${id} seed ${seed}`)
    }
    expect(unique, `constructions with only one possible answer: ${unique.join('; ')}`).toEqual([])
  })

  it('every alternative answer the search finds is actually accepted', () => {
    // Guards the gap between `checkHolds` and the real grading path — parsing,
    // serialising, the validator entry point. A constraint could hold while
    // the submission that expresses it is still refused.
    const rejected: string[] = []
    for (const { id, seed, spec } of items) {
      for (const alt of otherSolutions(spec, 4)) {
        const sub = serializeConstruct(Object.fromEntries(Object.entries(alt).map(([k, v]) => [k, String(v)])))
        if (!validate(spec, sub).ok) rejected.push(`${id} seed ${seed}`)
      }
    }
    expect(rejected, `valid answers the grader refused: ${rejected.join('; ')}`).toEqual([])
  })
})
