/**
 * "Prove me wrong": kill a universal claim with a single counterexample.
 *
 * One well-chosen case ends a "for all…" argument, and no number of supporting
 * examples ever establishes one. That asymmetry is the load-bearing idea of
 * `m-proof`, and it transfers straight into the Investigator work on claims
 * and evidence — which is why these items live across both.
 *
 * Every claim here is genuinely FALSE and every stated counterexample is
 * verified by the audit gate in `counterexamples.test.ts`, which re-evaluates
 * each claim against each offered option numerically. A "counterexample" that
 * does not actually break the claim would teach the opposite of the lesson.
 */
import type { ErrorTag, ItemTemplate } from '../../domain/types'
import { cycle, mcqNoted, tpl } from '../lib'

/**
 * Claims are stored with a machine-checkable predicate so the audit can prove
 * the key really is a counterexample and the distractors really are not.
 * `test` returns TRUE when the claim holds for that case — a counterexample is
 * any case where it returns false.
 */
export interface ClaimCase {
  /** How the option reads to the learner. */
  label: string
  /** The numbers behind it, fed to the claim's predicate. */
  values: number[]
}

export interface FalseClaim {
  id: string
  claim: string
  /** True when the claim HOLDS for these values. */
  test: (v: number[]) => boolean
  /** The case that breaks it. */
  counter: ClaimCase
  /** Cases that satisfy the claim — tempting but useless as refutations. */
  supporters: ClaimCase[]
  /** Why the counterexample works, and what the repaired claim would be. */
  why: string
}

export const FALSE_CLAIMS: FalseClaim[] = [
  {
    id: 'square-bigger',
    claim: 'Squaring a number always makes it bigger.',
    test: (v) => v[0] * v[0] > v[0],
    counter: { label: 'x = 1/2 — squaring gives 1/4, which is smaller', values: [0.5] },
    supporters: [
      { label: 'x = 3 — squaring gives 9', values: [3] },
      { label: 'x = 10 — squaring gives 100', values: [10] },
      { label: 'x = 7 — squaring gives 49', values: [7] },
    ],
    why: 'Between 0 and 1, squaring SHRINKS a number (and 0 and 1 stay put). The repaired claim: squaring makes a number bigger only when |x| > 1.',
  },
  {
    id: 'sum-two-primes',
    claim: 'The sum of two prime numbers is always even.',
    test: (v) => (v[0] + v[1]) % 2 === 0,
    counter: { label: '2 + 3 = 5, which is odd', values: [2, 3] },
    supporters: [
      { label: '3 + 5 = 8', values: [3, 5] },
      { label: '7 + 11 = 18', values: [7, 11] },
      { label: '13 + 17 = 30', values: [13, 17] },
    ],
    why: '2 is the only even prime, so any pair involving it breaks the parity argument. The repaired claim: the sum of two ODD primes is even.',
  },
  {
    id: 'more-sides-more-area',
    claim: 'If one rectangle has a larger perimeter than another, it has a larger area.',
    // v = [w1, h1, w2, h2]; claim: perimeter1 > perimeter2 implies area1 > area2.
    test: (v) => !(2 * (v[0] + v[1]) > 2 * (v[2] + v[3])) || v[0] * v[1] > v[2] * v[3],
    counter: { label: 'A 1×11 rectangle (perimeter 24, area 11) vs a 5×5 square (perimeter 20, area 25)', values: [1, 11, 5, 5] },
    supporters: [
      { label: 'A 6×6 square (perimeter 24, area 36) vs a 2×3 rectangle (perimeter 10, area 6)', values: [6, 6, 2, 3] },
      { label: 'A 4×5 rectangle (perimeter 18, area 20) vs a 2×2 square (perimeter 8, area 4)', values: [4, 5, 2, 2] },
      { label: 'A 10×2 rectangle (perimeter 24, area 20) vs a 3×3 square (perimeter 12, area 9)', values: [10, 2, 3, 3] },
    ],
    why: 'A long thin rectangle spends its perimeter on length instead of area. Perimeter and area are independent enough that neither one bounds the other.',
  },
  {
    id: 'average-of-averages',
    claim: 'The average of two class averages is the average of all the students.',
    // v = [avgA, nA, avgB, nB]; claim: (avgA+avgB)/2 === combined mean.
    test: (v) => Math.abs((v[0] + v[2]) / 2 - (v[0] * v[1] + v[2] * v[3]) / (v[1] + v[3])) < 1e-9,
    counter: { label: 'A class of 30 averaging 60, and a class of 10 averaging 90', values: [60, 30, 90, 10] },
    supporters: [
      { label: 'A class of 20 averaging 70, and a class of 20 averaging 90', values: [70, 20, 90, 20] },
      { label: 'A class of 15 averaging 80, and a class of 15 averaging 60', values: [80, 15, 60, 15] },
      { label: 'A class of 25 averaging 75, and a class of 25 averaging 85', values: [75, 25, 85, 25] },
    ],
    why: 'Averaging averages only works when the groups are the SAME SIZE — otherwise the bigger group deserves more weight. This is the arithmetic behind a lot of misleading statistics.',
  },
  {
    id: 'divisible-by-parts',
    claim: 'If a number is divisible by 2 and by 4, it is divisible by 8.',
    test: (v) => !(v[0] % 2 === 0 && v[0] % 4 === 0) || v[0] % 8 === 0,
    counter: { label: '12 — divisible by 2 and by 4, but 12 ÷ 8 is not whole', values: [12] },
    supporters: [
      { label: '16 — divisible by 2, 4, and 8', values: [16] },
      { label: '24 — divisible by 2, 4, and 8', values: [24] },
      { label: '40 — divisible by 2, 4, and 8', values: [40] },
    ],
    why: 'Divisibility multiplies only when the factors share nothing: 2 and 4 overlap, so passing both does not add up to 8. The repaired claim works for COPRIME divisors — divisible by 3 and 4 does imply divisible by 12.',
  },
  {
    id: 'longer-means-slower',
    claim: 'If one route takes more time than another, it must be longer.',
    // v = [d1, t1, d2, t2]; claim: t1 > t2 implies d1 > d2.
    test: (v) => !(v[1] > v[3]) || v[0] > v[2],
    counter: { label: 'A 5 km walk taking 60 minutes vs a 40 km drive taking 30 minutes', values: [5, 60, 40, 30] },
    supporters: [
      { label: 'A 20 km drive taking 25 minutes vs a 10 km drive taking 12 minutes', values: [20, 25, 10, 12] },
      { label: 'A 3 km walk taking 35 minutes vs a 1 km walk taking 12 minutes', values: [3, 35, 1, 12] },
      { label: 'A 100 km drive taking 70 minutes vs a 50 km drive taking 35 minutes', values: [100, 70, 50, 35] },
    ],
    why: 'Time is distance divided by SPEED, so a slow short trip can beat a fast long one. Any claim linking two quantities has to account for the third one connecting them.',
  },
  {
    id: 'correlation-direction',
    claim: 'If two things rise together every year, one must be causing the other.',
    // v = [sharedCauseYears]; the claim fails whenever a third factor explains both.
    test: () => false,
    counter: { label: 'Ice-cream sales and swimming-pool visits both rise every summer — heat drives both', values: [1] },
    supporters: [
      { label: 'A car accelerating and its speedometer rising together', values: [2] },
      { label: 'A tap running and a bucket filling', values: [3] },
      { label: 'A switch being flipped and a lamp lighting', values: [4] },
    ],
    why: 'A shared cause produces the same rising pattern with no link between the two things at all. The other cases really are causal — which is the point: correlation is CONSISTENT with causation, it just never establishes it.',
  },
  {
    id: 'bigger-sample-better',
    claim: 'A bigger sample is always a better sample.',
    test: () => false,
    counter: { label: '50,000 responses to a magazine poll its own readers opted into', values: [1] },
    supporters: [
      { label: '600 people chosen at random from the full population', values: [2] },
      { label: '200 randomly selected households from every district', values: [3] },
      { label: '1,000 randomly dialled phone numbers across the country', values: [4] },
    ],
    why: 'Size shrinks random error; it does nothing to BIAS. A huge self-selected sample measures its own volunteers very precisely — famously, a 2.4-million-response poll in 1936 called a US election wrong because of exactly this.',
  },
]

const proveMeWrong = tpl(
  {
    id: 'ce-prove-me-wrong',
    name: 'Prove the claim wrong',
    skillIds: ['m-proof', 'i-logic'],
    bucket: 'math',
    difficulty: 4,
    variants: 8,
    minutes: 2.5,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, FALSE_CLAIMS)
    const { answer, distractorNotes, distractorTags } = mcqNoted(
      rng,
      c.counter.label,
      // Picking a supporting case to refute a claim is a misunderstanding of
      // what refutation IS, not a slip — so every distractor here is the same
      // cause, and saying so is honest rather than lazy.
      c.supporters
        .slice(0, 3)
        .map((s) => [s.label, 'this case SATISFIES the claim — a supporting example can never refute one', 'concept'] as [string, string, ErrorTag]),
    )
    return {
      title: 'One case is enough',
      prompt: `Someone claims:\n\n**"${c.claim}"**\n\nWhich single case proves them wrong?`,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'You are hunting for ONE case where the claim fails — not for cases where it works.',
        'Check each option against the claim and ask: does this obey it, or break it?',
      ],
      explanation: `**${c.counter.label}** — ${c.why}\n\nThe asymmetry is the lesson: a universal claim needs every case to hold, so ONE failure kills it, while a thousand supporting examples still prove nothing. That is why mathematicians hunt counterexamples first and why "but here are three cases where it works" is never an answer.`,
    }
  },
)

const repairTheClaim = tpl(
  {
    id: 'ce-repair-claim',
    name: 'Fix the broken claim',
    skillIds: ['m-proof', 'i-hypo'],
    bucket: 'math',
    difficulty: 5,
    variants: 4,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, [
      {
        claim: 'Squaring a number always makes it bigger.',
        counter: 'x = 1/2 gives 1/4',
        fix: 'Squaring makes a number bigger exactly when its size is greater than 1',
        bads: [
          ['Squaring makes a number bigger when the number is positive', 'fails at x = 1/2, which is positive and shrinks'],
          ['Squaring always makes a number bigger or equal', 'still false: 1/4 is strictly smaller than 1/2'],
          ['Squaring never changes a number', 'far too strong — it is false for almost every number'],
        ] as [string, string, ErrorTag?][],
      },
      {
        claim: 'The sum of two primes is always even.',
        counter: '2 + 3 = 5',
        fix: 'The sum of two ODD primes is always even',
        bads: [
          ['The sum of two primes is always odd', 'now false in the other direction — 3 + 5 = 8', 'concept'],
          ['The sum of two primes greater than 1 is even', 'every prime is greater than 1, so this changes nothing', 'incomplete'],
          ['Primes are never even', '2 is prime and even — this contradicts a fact rather than repairing the claim', 'concept'],
        ] as [string, string, ErrorTag?][],
      },
      {
        claim: 'If a number is divisible by 2 and by 4, it is divisible by 8.',
        counter: '12 passes both and fails 8',
        fix: 'If a number is divisible by two numbers that share no common factor, it is divisible by their product',
        bads: [
          ['If a number is divisible by 2 and 4, it is divisible by 6', 'still false — 4 itself passes both and fails 6'],
          ['Only even numbers are divisible by 4', 'true but unrelated — it does not repair the broken implication'],
          ['Divisibility rules only work for prime divisors', 'too strong: divisibility by 6 and 12 works fine'],
        ] as [string, string, ErrorTag?][],
      },
      {
        claim: 'The average of two class averages is the average of everyone.',
        counter: 'classes of 30 and 10 with averages 60 and 90',
        fix: 'The average of two class averages equals the overall average exactly when the classes are the same size',
        bads: [
          ['The average of two class averages is always too high', 'it can land either side depending on which class is bigger'],
          ['You should always use the median instead', 'changes the tool rather than repairing the claim'],
          ['Averages of averages work when the averages are close together', 'closeness reduces the error but never makes the rule exact'],
        ] as [string, string, ErrorTag?][],
      },
    ] as const)
    const { answer, distractorNotes, distractorTags } = mcqNoted(rng, c.fix, c.bads.map((b) => [...b] as [string, string, ErrorTag?]))
    return {
      title: 'Repair, do not discard',
      prompt: `The claim **"${c.claim}"** is false — ${c.counter} breaks it.\n\nWhich repaired version is actually TRUE?`,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'A good repair excludes exactly the broken cases and keeps everything else.',
        'Test each candidate against the counterexample first — a repair that still fails it is not a repair.',
      ],
      explanation: `**${c.fix}.** Finding a counterexample is only half the work; the useful half is asking WHY it broke and adding precisely the condition that rules it out. Repairs that are too weak still fail the original counterexample, and repairs that are too strong throw away true cases — the good one sits exactly on the boundary, which is where the real understanding lives.`,
    }
  },
)

export const COUNTEREXAMPLE_TEMPLATES: ItemTemplate[] = [proveMeWrong, repairTheClaim]
