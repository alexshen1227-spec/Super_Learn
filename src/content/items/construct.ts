/**
 * NON-ROUTINE items: build an object that satisfies constraints.
 *
 * Why this file exists. Every other generator in the bank randomises the
 * NUMBERS in a fixed question, so once you have met three variants the method
 * is visible from the shape and nothing further is being solved. That is
 * exactly right for making a procedure automatic and exactly wrong for
 * non-routine problem solving, and no amount of extra volume fixes it.
 *
 * These invert the relationship. The method is trivial to state — "make the
 * mean 7" — and the work is search: there is no shape to recognise, because
 * the learner is building the shape. Every instance is genuinely worked,
 * whatever the seed.
 *
 * THE GENERATOR FINDS ITS OWN WITNESS. Nothing here hand-types an answer key.
 * Each template searches for a solution and ships it as `witness`, which both
 * proves the problem is satisfiable and satisfies the correctness rule that
 * content answers are computed. A construction problem with no solution is
 * worse than a wrong key: the learner searches for something that is not
 * there and concludes the fault is theirs.
 *
 * They also widen what the app can assess at all. Around nine in ten graded
 * checkpoints here are a number or a choice; these take an object the learner
 * invented and still grade it deterministically, offline.
 */
import type { ConstructAnswer, ConstructCheck, ItemTemplate } from '../../domain/types'
import { checkHolds, statOf } from '../../engine/construct'
import { rint } from '../../engine/rng'
import { tpl } from '../lib'

/** Build the spec and assert the witness before it can ever reach a learner. */
function construct(
  what: string,
  slots: { key: string; label: string }[],
  checks: ConstructCheck[],
  witness: Record<string, number>,
  solutionCount?: number,
): ConstructAnswer {
  const spec: ConstructAnswer = { type: 'construct', what, slots, checks, witness, solutionCount }
  // Fail loudly at generation rather than silently shipping an impossible task.
  const bad = checks.filter((c) => !checkHolds(c, witness)).map((c) => c.label)
  if (bad.length) throw new Error(`construct witness fails its own checks: ${bad.join('; ')}`)
  return spec
}

const KEYS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'] as const
const slotsFor = (n: number, name = (i: number) => `Value ${i + 1}`) =>
  Array.from({ length: n }, (_, i) => ({ key: KEYS[i], label: name(i) }))

// ============================================================ math: data sets

/**
 * Five numbers with a stated mean, median and range.
 *
 * The targets are DERIVED from a set the generator builds first, so a solution
 * is guaranteed to exist — and because three summary statistics never pin down
 * five values, many others exist too. Reading a mean off a list is routine;
 * producing a list that has one is not, and it is the direction real
 * statistical reasoning runs in.
 */
const dataSet = tpl(
  {
    id: 'nr-build-dataset',
    name: 'Build a data set to order',
    skillIds: ['m-stats'],
    bucket: 'math',
    difficulty: 4,
    variants: 24,
    minutes: 4,
    novelty: 'nonRoutine',
    transfer: true,
  },
  (rng) => {
    // Build a legal sorted set first; the targets then cannot be inconsistent.
    let lo = 0
    let mid = 0
    let hi = 0
    let second = 0
    let fourth = 0
    for (let tries = 0; tries < 400; tries++) {
      lo = rint(rng, 0, 6)
      const range = rint(rng, 8, 16)
      hi = lo + range
      mid = rint(rng, lo + 2, hi - 2)
      second = rint(rng, lo, mid)
      fourth = rint(rng, mid, hi)
      if ((lo + second + mid + fourth + hi) % 5 === 0) break
      // nudge the fourth value to land the sum on a multiple of 5 when possible
      const need = (5 - ((lo + second + mid + hi) % 5)) % 5
      const cand = mid + ((fourth - mid + need) % 5)
      if (cand <= hi) {
        fourth = cand
        break
      }
    }
    const values = [lo, second, mid, fourth, hi]
    const mean = statOf('mean', values)
    const median = statOf('median', values)
    const range = statOf('range', values)
    const of = KEYS.slice(0, 5) as unknown as string[]
    const witness = Object.fromEntries(of.map((k, i) => [k, values[i]]))
    return {
      title: 'Make the statistics come out',
      prompt: `Write down **five whole numbers** whose **mean is ${mean}**, whose **median is ${median}**, and whose **range is ${range}**.\n\nThere is more than one right answer. You need one that works.`,
      answer: construct(
        'five whole numbers',
        slotsFor(5),
        [
          { kind: 'integer', of, label: 'all five are whole numbers' },
          { kind: 'stat', stat: 'mean', of, cmp: '=', value: mean, label: `the mean is ${mean}` },
          { kind: 'stat', stat: 'median', of, cmp: '=', value: median, label: `the median is ${median}` },
          { kind: 'stat', stat: 'range', of, cmp: '=', value: range, label: `the range is ${range}` },
        ],
        witness,
      ),
      hints: [
        'Start with the two you can place directly: the middle value IS the median, and the smallest and largest have to differ by the range.',
        `So put ${median} in the middle, and pick a smallest value — the largest is then forced to be that plus ${range}.`,
        `Three numbers are now fixed and the mean tells you the total: five values averaging ${mean} must sum to ${mean * 5}. Whatever is left over is shared between the remaining two, and they only have to sit either side of the median.`,
      ],
      explanation: `One answer is **${values.join(', ')}** — and it is only one. Three summary statistics cannot pin down five numbers, so a whole family of sets works.\n\nThat is the point of building rather than reading. Computing a mean is a procedure; producing a set that HAS a given mean forces you to hold three constraints at once and see which of them fight. Notice which was tightest: the median fixes one value outright, the range fixes the gap between two more, and only then does the mean decide what is left.`,
      transferBridge:
        'Working backwards from a required summary is what target-setting actually is — "we need a 78% average, so what do the remaining marks have to be" is this problem with the numbers changed.',
    }
  },
)

/**
 * A data set where the mean sits a stated distance above the median.
 *
 * Skew is normally taught as something you observe in a finished picture. This
 * asks the learner to CAUSE it, which is the only way to find out whether they
 * know what does the causing.
 */
const skewSet = tpl(
  {
    id: 'nr-build-skew',
    name: 'Make the mean pull away',
    skillIds: ['m-stats', 'm-variability'],
    bucket: 'math',
    difficulty: 5,
    variants: 12,
    minutes: 5,
    novelty: 'nonRoutine',
    transfer: true,
  },
  (rng) => {
    const gap = rint(rng, 2, 6)
    const cap = 60
    // Search for a witness: five values in range whose mean exceeds median by gap.
    let found: number[] | null = null
    for (let tries = 0; tries < 4000 && !found; tries++) {
      const base = rint(rng, 2, 12)
      const v = [base, base + rint(rng, 0, 2), base + rint(rng, 2, 4), base + rint(rng, 4, 8), 0]
      const med = v[2]
      // last value forced so that mean = median + gap
      const last = 5 * (med + gap) - (v[0] + v[1] + v[2] + v[3])
      v[4] = last
      if (last > v[3] && last <= cap && Number.isInteger(last) && statOf('median', v) === med) found = v
    }
    const values = found ?? [3, 4, 5, 6, 5 * (5 + gap) - 18]
    const of = KEYS.slice(0, 5) as unknown as string[]
    return {
      title: 'Cause the skew',
      prompt: `Write **five whole numbers between 1 and ${cap}** whose **mean is exactly ${gap} more than their median**.\n\nMany sets do this. Find one, then look at what you had to do to get it.`,
      answer: construct(
        'five whole numbers',
        slotsFor(5),
        [
          { kind: 'integer', of, label: 'all five are whole numbers' },
          { kind: 'each', of, cmp: '>=', value: 1, label: 'none is below 1' },
          { kind: 'each', of, cmp: '<=', value: cap, label: `none is above ${cap}` },
          { kind: 'relate', left: 'mean', right: 'median', of, cmp: '=', by: gap, label: `the mean is exactly ${gap} above the median` },
        ],
        Object.fromEntries(of.map((k, i) => [k, values[i]])),
      ),
      hints: [
        'The median only cares about the middle value. The mean cares about all five. So there is a way to move one without moving the other.',
        'Try changing only the LARGEST value. Does the median move? Does the mean?',
        `One route: pick four values close together, then choose the fifth so the total comes out right. With a median of m you need the five to sum to 5(m + ${gap}).`,
      ],
      explanation: `**${values.join(', ')}** is one answer: median ${statOf('median', values)}, mean ${statOf('mean', values)}.\n\nThe move that works is stretching ONE value far out to the right. The median ignores it entirely — it only looks at the middle of the sorted list — while the mean absorbs the whole excess and gets dragged. That is what "the mean is not resistant to outliers" means, felt from the inside rather than read.\n\nThis is also why a country's average income can rise in a year when almost nobody's income rose.`,
      transferBridge:
        'When a report quotes an average, ask what a single extreme value would do to it. If the answer is "a lot", the average is describing that value more than the group.',
    }
  },
)

/**
 * Open-middle style digit placement with a search-verified optimum.
 *
 * The generator brute-forces every arrangement, so the target really is the
 * best available and "close enough" is measured, not asserted. No procedure
 * reaches it; you try, see how far off you are, and adjust.
 */
const digitTarget = tpl(
  {
    id: 'nr-digit-target',
    name: 'Closest product',
    skillIds: ['m-nonroutine', 'm-integers'],
    bucket: 'math',
    difficulty: 5,
    variants: 16,
    minutes: 5,
    novelty: 'nonRoutine',
    provenance:
      'Original problems in the "open middle" genre — a fixed frame with blanks the solver fills to hit a target. The genre is widely used in mathematics teaching; no problem text, target or digit set here is taken from any published set.',
  },
  (rng) => {
    const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    const target = rint(rng, 12, 48) * 25 + rint(rng, 0, 24)
    // Exhaustive search over (10a+b) × (10c+d), all digits distinct.
    let best = Infinity
    let bestAt: number[] = []
    let ties = 0
    for (const a of pool)
      for (const b of pool) {
        if (b === a) continue
        for (const c of pool) {
          if (c === a || c === b) continue
          for (const d of pool) {
            if (d === a || d === b || d === c) continue
            const off = Math.abs((10 * a + b) * (10 * c + d) - target)
            if (off < best) {
              best = off
              bestAt = [a, b, c, d]
              ties = 1
            } else if (off === best) ties++
          }
        }
      }
    const of = ['a', 'b', 'c', 'd']
    const product = (10 * bestAt[0] + bestAt[1]) * (10 * bestAt[2] + bestAt[3])
    return {
      title: 'Get as close as you can',
      prompt: `Using four **different** digits from **1–9**, fill in\n\n> ( 10·A + B ) × ( 10·C + D )\n\nso the product is **as close as possible to ${target}**.\n\nThe closest anyone can get is **${best} away**. Find an arrangement that does it.`,
      answer: construct(
        'four different digits',
        [
          { key: 'a', label: 'A' },
          { key: 'b', label: 'B' },
          { key: 'c', label: 'C' },
          { key: 'd', label: 'D' },
        ],
        [
          { kind: 'digits', of, digits: pool, use: 'atMostOnce', label: 'each digit is 1–9 and no digit is repeated' },
          {
            kind: 'bilinear',
            terms: [
              { a: 'a', b: 'c', c: 100 },
              { a: 'a', b: 'd', c: 10 },
              { a: 'b', b: 'c', c: 10 },
              { a: 'b', b: 'd', c: 1 },
            ],
            cmp: '>=',
            value: target - best,
            label: `the product is at least ${target - best}`,
          },
          {
            kind: 'bilinear',
            terms: [
              { a: 'a', b: 'c', c: 100 },
              { a: 'a', b: 'd', c: 10 },
              { a: 'b', b: 'c', c: 10 },
              { a: 'b', b: 'd', c: 1 },
            ],
            cmp: '<=',
            value: target + best,
            label: `the product is at most ${target + best}`,
          },
        ],
        { a: bestAt[0], b: bestAt[1], c: bestAt[2], d: bestAt[3] },
        ties,
      ),
      hints: [
        `Estimate first. Two two-digit numbers multiply to about ${target}, so if they were equal each would be near ${Math.round(Math.sqrt(target))}.`,
        'The tens digits decide almost everything — the units digits only ever move the product by a few dozen. Fix the tens digits first, then tune.',
        `Try tens digits near ${Math.floor(Math.sqrt(target) / 10)} and adjust. The best possible is ${best} away from ${target}.`,
      ],
      explanation: `**${10 * bestAt[0] + bestAt[1]} × ${10 * bestAt[2] + bestAt[3]} = ${product}**, which is ${best} from ${target}. ${ties > 1 ? `There are ${ties} arrangements that tie for best.` : 'That arrangement is unique.'}\n\nEvery arrangement was checked, so ${best} really is the closest reachable — this is not a target someone guessed at.\n\nThe method that works is not multiplication, it is estimation followed by adjustment: get the tens digits roughly right using a square root, then let the units digits close the gap. That two-phase habit — coarse first, then refine — is what makes mental arithmetic fast, and it is invisible if you only ever compute products you were handed.`,
    }
  },
)

/**
 * Two positive integers satisfying a linear equation — a small Diophantine
 * search. There is a method (the extended Euclidean algorithm) but it is not
 * taught here, and a learner who does not know it must genuinely hunt.
 */
const integerPair = tpl(
  {
    id: 'nr-integer-pair',
    name: 'Find the whole numbers that fit',
    skillIds: ['m-lineq1', 'm-nonroutine'],
    bucket: 'math',
    difficulty: 4,
    variants: 20,
    minutes: 4,
    novelty: 'nonRoutine',
  },
  (rng) => {
    const p = [3, 5, 7, 11, 13][rint(rng, 0, 4)]
    const q = [4, 6, 8, 9, 17][rint(rng, 0, 4)]
    const x0 = rint(rng, 2, 9)
    const y0 = rint(rng, 2, 9)
    const total = p * x0 + q * y0
    // Count every positive solution so the explanation can be exact.
    const sols: [number, number][] = []
    for (let x = 1; x * p < total; x++) {
      const rest = total - p * x
      if (rest > 0 && rest % q === 0) sols.push([x, rest / q])
    }
    const witness = sols[0] ?? [x0, y0]
    return {
      title: 'Only whole numbers allowed',
      prompt: `Find **whole numbers A and B**, both at least 1, with\n\n> **${p}·A + ${q}·B = ${total}**\n\nFractions are not allowed. There is at least one answer.`,
      answer: construct(
        'two whole numbers',
        [
          { key: 'a', label: 'A' },
          { key: 'b', label: 'B' },
        ],
        [
          { kind: 'integer', of: ['a', 'b'], label: 'both are whole numbers' },
          { kind: 'each', of: ['a', 'b'], cmp: '>=', value: 1, label: 'both are at least 1' },
          { kind: 'linear', terms: { a: p, b: q }, cmp: '=', value: total, label: `${p}·A + ${q}·B comes to exactly ${total}` },
        ],
        { a: witness[0], b: witness[1] },
        sols.length,
      ),
      hints: [
        'One equation with two unknowns normally has infinitely many solutions — but "whole numbers, at least 1" cuts that down to a handful.',
        `Work through A = 1, 2, 3, … Each choice fixes what is left for ${q}·B, and you only keep the ones where that leftover divides exactly by ${q}.`,
        `The smallest A that works is ${witness[0]}, which leaves ${total - p * witness[0]} for ${q}·B, giving B = ${witness[1]}.`,
      ],
      explanation: `**A = ${witness[0]}, B = ${witness[1]}** works: ${p}×${witness[0]} + ${q}×${witness[1]} = ${total}. ${sols.length > 1 ? `There are ${sols.length} positive whole-number solutions in total (${sols.slice(0, 4).map(([x, y]) => `${x},${y}`).join(' · ')}${sols.length > 4 ? ' …' : ''}), and any of them is right.` : 'It is the only positive whole-number solution.'}\n\nThe search that works is not algebra, it is systematic trial: step A up by one, and each time ask whether what remains divides exactly. Stepping through possibilities in a fixed order — rather than staring at the equation hoping — is the actual skill, and it is the same one behind making change, splitting a bill into notes, and packing fixed-size boxes.`,
    }
  },
)

// ============================================================ physics

/**
 * Three forces that balance to a required net, under a shape constraint.
 *
 * Physics in this bank was entirely "given the forces, compute the net". This
 * runs the other way, which is the direction a designer works.
 */
const forceDesign = tpl(
  {
    id: 'nr-force-design',
    name: 'Design the force system',
    skillIds: ['p-forces'],
    bucket: 'physics',
    difficulty: 5,
    variants: 18,
    minutes: 5,
    novelty: 'nonRoutine',
    transfer: true,
  },
  (rng) => {
    const net = rint(rng, -6, 6) * 2
    const strongest = rint(rng, 12, 20)
    // Search a witness: three distinct non-zero integers summing to net with
    // largest magnitude exactly `strongest`.
    let w: number[] | null = null
    for (let tries = 0; tries < 3000 && !w; tries++) {
      const f1 = strongest * (rint(rng, 0, 1) ? 1 : -1)
      const f2 = rint(rng, -strongest + 1, strongest - 1)
      const f3 = net - f1 - f2
      const set = [f1, f2, f3]
      if (
        set.every((v) => v !== 0 && Math.abs(v) <= strongest) &&
        new Set(set).size === 3 &&
        Math.max(...set.map(Math.abs)) === strongest
      )
        w = set
    }
    const values = w ?? [strongest, -1, net - strongest + 1]
    const of = ['a', 'b', 'c']
    return {
      title: 'Build the force diagram',
      prompt: `A block on a frictionless floor is pushed by **three horizontal forces**. Right is positive, left is negative.\n\nChoose the three forces so that:\n\n- they add to a net force of **${net} N**\n- **no force is zero**, and no two are the same\n- the **strongest single force has magnitude exactly ${strongest} N**\n\nMore than one design works.`,
      answer: construct(
        'three forces in newtons',
        [
          { key: 'a', label: 'Force 1 (N)' },
          { key: 'b', label: 'Force 2 (N)' },
          { key: 'c', label: 'Force 3 (N)' },
        ],
        [
          { kind: 'integer', of, label: 'all three are whole numbers of newtons' },
          { kind: 'allDifferent', of, label: 'no two forces are the same' },
          { kind: 'stat', stat: 'sum', of, cmp: '=', value: net, label: `they add to ${net} N` },
          { kind: 'each', of, cmp: '!=', value: 0, label: 'none of them is zero' },
          // absMax, not range: "the strongest force is exactly this big" is a
          // statement about magnitudes, and a range test gets it wrong in both
          // directions (15,14,13 has range 2; 10 and −8 has range 18).
          {
            kind: 'stat',
            stat: 'absMax',
            of,
            cmp: '=',
            value: strongest,
            label: `the strongest single force is exactly ${strongest} N, in either direction`,
          },
        ] as ConstructCheck[],
        Object.fromEntries(of.map((k, i) => [k, values[i]])),
      ),
      hints: [
        'Net force is a plain sum once you have committed to a sign convention. Two of the three are free; the third is then forced.',
        `Start by writing down the strongest force, ${strongest} N, and decide which way it points. Pick any second force. The third has to make the total ${net}.`,
        `For example ${values[0]} and ${values[1]} leave ${values[2]}, because ${values[0]} + ${values[1]} + ${values[2]} = ${net}.`,
      ],
      explanation: `**${values.map((v) => `${v} N`).join(', ')}** is one working design: they sum to ${net} N, all differ, none is zero, and the largest is ${strongest} N.\n\nTwo things are worth taking from having built it rather than checked it. First, only ONE of the three forces was ever really free once you fixed the other two — a system with three unknowns and one equation has two degrees of freedom, and you can feel them here. Second, a large force and a small net are completely compatible: a block barely moving can have enormous forces on it, which is why "it is not accelerating" tells you nothing at all about how hard anything is pushing.`,
      transferBridge:
        'Any balance problem has this shape — a budget that must total a figure, a rota that must cover every shift. Fix the constrained items first; the last one is then not a choice.',
    }
  },
)

/**
 * Lever balance. Bilinear (mass × distance), so no amount of adding will do it.
 */
const leverDesign = tpl(
  {
    id: 'nr-lever-design',
    name: 'Balance the beam',
    skillIds: ['p-forces'],
    bucket: 'physics',
    difficulty: 4,
    variants: 16,
    minutes: 4,
    novelty: 'nonRoutine',
  },
  (rng) => {
    const leftMass = rint(rng, 2, 9)
    const leftDist = rint(rng, 2, 9)
    const torque = leftMass * leftDist
    // Every whole-number way to balance it on the other side, within reach.
    const sols: [number, number][] = []
    for (let m = 1; m <= 12; m++) if (torque % m === 0 && torque / m <= 12) sols.push([m, torque / m])
    const w = sols[Math.min(sols.length - 1, rint(rng, 0, Math.max(0, sols.length - 1)))] ?? [leftMass, leftDist]
    return {
      title: 'Make it balance',
      prompt: `A beam pivots at its centre. A **${leftMass} kg** mass sits **${leftDist} m** to the LEFT of the pivot.\n\nPlace **one mass on the right** so the beam balances. Both the mass and its distance must be **whole numbers from 1 to 12**.`,
      answer: construct(
        'a mass and a distance',
        [
          { key: 'a', label: 'Mass (kg)' },
          { key: 'b', label: 'Distance (m)' },
        ],
        [
          { kind: 'integer', of: ['a', 'b'], label: 'both are whole numbers' },
          { kind: 'each', of: ['a', 'b'], cmp: '>=', value: 1, label: 'both are at least 1' },
          { kind: 'each', of: ['a', 'b'], cmp: '<=', value: 12, label: 'neither is more than 12' },
          {
            kind: 'bilinear',
            terms: [{ a: 'a', b: 'b', c: 1 }],
            cmp: '=',
            value: torque,
            label: `mass × distance comes to ${torque} kg·m, matching the left side`,
          },
        ],
        { a: w[0], b: w[1] },
        sols.length,
      ),
      hints: [
        'A beam balances when the turning effects match, and the turning effect of a mass is mass times its distance from the pivot.',
        `The left side gives ${leftMass} × ${leftDist} = ${torque}. The right side has to come to the same number.`,
        `So you need two whole numbers between 1 and 12 whose product is ${torque}. ${w[0]} and ${w[1]} is one pair.`,
      ],
      explanation: `**${w[0]} kg at ${w[1]} m** balances it: ${w[0]} × ${w[1]} = ${torque}, the same as ${leftMass} × ${leftDist} on the left.${sols.length > 1 ? ` There are ${sols.length} whole-number pairs that work — heavy-and-close and light-and-far are equally correct.` : ''}\n\nThe reason there are several answers is the whole idea: it is the PRODUCT that balances, not the mass. A small mass far out does the same job as a large mass close in, which is why a child can see-saw against an adult by sliding backwards, and why a long spanner loosens a bolt that a short one will not.`,
    }
  },
)

// ============================================================ meta

/**
 * Design a revision schedule under real constraints.
 *
 * Meta Lab had NO top-difficulty content at all. It also had nothing where the
 * learner applies a spacing principle rather than identifying it, which is the
 * gap that matters: recognising "spacing beats massing" in a multiple choice
 * is not the same as producing a spaced plan when the hours are limited.
 */
const schedule = tpl(
  {
    id: 'nr-schedule-design',
    name: 'Design the revision week',
    skillIds: ['x-method', 'x-focus'],
    bucket: 'meta',
    difficulty: 5,
    variants: 14,
    minutes: 5,
    novelty: 'nonRoutine',
    transfer: true,
  },
  (rng) => {
    const total = rint(rng, 4, 8) * 30
    const sessions = 4
    const floor = 20
    // Search a witness: four session lengths, decreasing is NOT required, but
    // the last must be the shortest and no two may match.
    let w: number[] | null = null
    for (let tries = 0; tries < 4000 && !w; tries++) {
      const last = rint(rng, floor, Math.floor(total / sessions) - 1)
      const a = rint(rng, last + 5, last + 60)
      const b = rint(rng, last + 5, last + 60)
      const c = total - last - a - b
      const set = [a, b, c, last]
      if (
        c > last &&
        new Set(set).size === 4 &&
        set.every((v) => v >= floor && Number.isInteger(v)) &&
        Math.min(...set) === last
      )
        w = set
    }
    const values = w ?? [total - 3 * floor - 3, floor + 2, floor + 1, floor]
    const of = ['a', 'b', 'c', 'd']
    return {
      title: 'Spend the hours well',
      prompt: `You have **${total} minutes** of revision left before an exam, and you have decided to split it across **four separate sessions on four different days**.\n\nChoose how long each session runs so that:\n\n- the four add up to exactly **${total} minutes**\n- **no session is under ${floor} minutes** — below that the setup cost eats the session\n- **no two sessions are the same length**, so you are not running on autopilot\n- the **last session is the shortest**, because it is the one closest to the exam and it should be a check, not new ground\n\nMore than one plan satisfies all four.`,
      answer: construct(
        'four session lengths in minutes',
        [
          { key: 'a', label: 'Day 1' },
          { key: 'b', label: 'Day 2' },
          { key: 'c', label: 'Day 3' },
          { key: 'd', label: 'Day 4' },
        ],
        [
          { kind: 'integer', of, label: 'all four are whole numbers of minutes' },
          { kind: 'stat', stat: 'sum', of, cmp: '=', value: total, label: `they total exactly ${total} minutes` },
          { kind: 'each', of, cmp: '>=', value: floor, label: `none is under ${floor} minutes` },
          { kind: 'allDifferent', of, label: 'no two sessions are the same length' },
          { kind: 'isStat', slot: 'd', stat: 'min', of, label: 'day 4 is the shortest of the four' },
        ],
        Object.fromEntries(of.map((k, i) => [k, values[i]])),
      ),
      hints: [
        'Deal with the hardest constraint first. Which one rules out the most plans?',
        `The floor does: four sessions at ${floor} minutes already spends ${4 * floor}, so only ${total - 4 * floor} minutes are actually free to distribute.`,
        `Give every day ${floor} to start with, then share the remaining ${total - 4 * floor} minutes out across the first three — making sure day 4 keeps the smallest total and no two match.`,
      ],
      explanation: `**${values.map((v, i) => `Day ${i + 1}: ${v} min`).join(' · ')}** is one workable plan.\n\nThe useful move is noticing that ${4 * floor} of your ${total} minutes were never yours to allocate — the minimum-session rule spends them before you start, and only ${total - 4 * floor} were actually free. Finding the constraint that eats most of the space, and solving that one first, is most of what planning is.\n\nOn the content of the rule itself: four separate days beats one long block for retention, and that is one of the better-supported findings in the whole of learning research. The tapering final session is NOT well supported — it is a judgement about fatigue and about what a session near an exam is for, and you should treat it as this app's opinion rather than a finding.`,
      transferBridge:
        'Budgets, rotas and project plans all work this way: find the constraint that consumes the most freedom, satisfy it first, and spend what remains.',
    }
  },
)

export const CONSTRUCT_TEMPLATES: ItemTemplate[] = [dataSet, skewSet, digitTarget, integerPair, forceDesign, leverDesign, schedule]
