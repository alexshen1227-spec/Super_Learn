/**
 * Non-routine problem kinds in the AoPS tradition: problems where the method
 * is the discovery — structure exploited instead of procedure executed.
 * Inspired by the problem STYLE of the AoPS Prealgebra/Introduction to Algebra
 * chapters (docs/RESEARCH.md §25); every problem here is original and every
 * answer computed. The style rules borrowed: multi-concept chains, "in
 * disguise" setups, and answers that reward representation over grinding.
 */
import { rint } from '../../engine/rng'
import type { ItemTemplate } from '../../domain/types'
import { cycle, numeric, tpl } from '../lib'

const remainderChain = tpl(
  { id: 'nr-remainder-chain', name: 'Fraction of what remains', skillIds: ['m-nonroutine', 'm-fractions'], bucket: 'math', difficulty: 4, variants: 32, minutes: 3, transfer: true },
  (rng, seed) => {
    const c = cycle(seed, [
      ['an allowance', 'spent', 'on a game', 'on snacks'],
      ['a bag of marbles', 'gave away', 'to a cousin', 'to a friend'],
      ['a jug of lemonade', 'poured', 'at lunch', 'at dinner'],
      ['a roll of ribbon', 'used', 'for one gift', 'for another'],
    ] as const)
    // Build FORWARD from the start so every intermediate is integral:
    // start = unit·a·b makes both fraction steps land on whole numbers.
    const a = cycle(Math.floor(seed / 4), [3, 4] as const) // first spends 1/a
    const b = cycle(Math.floor(seed / 8), [2, 3, 4] as const) // then 1/b of the rest
    const unit = rint(rng, 2, 6)
    const start = unit * a * b
    const afterFirst = (start * (a - 1)) / a
    const final = (afterFirst * (b - 1)) / b
    return {
      title: 'The shrinking remainder',
      prompt: `From ${c[0]}, **1/${a}** was ${c[1]} ${c[2]}, then **1/${b} of what was left** was ${c[1]} ${c[3]}, leaving **${final}**. How much was there at the start?`,
      answer: numeric(start),
      hints: [
        'Work backwards: undo the second spend first.',
        `Before the second spend there was ${final} ÷ (1 − 1/${b}) = ${afterFirst}.`,
        `Worked path: **${start}**.`,
      ],
      explanation: `Backwards: after the first spend, ${c[1].replace(/e$/, '')}ing 1/${b} left ${(b - 1)}/${b} — so the pre-second amount was ${final} × ${b}/${b - 1} = ${afterFirst}. Same move again: ${afterFirst} × ${a}/${a - 1} = **${start}**. The trap is taking both fractions of the ORIGINAL (1/${a} + 1/${b} of it) — the second fraction acted on a smaller world, and honoring that is the entire problem.`,
    }
  },
)

const definedOp = tpl(
  { id: 'nr-defined-op', name: 'An invented operation', skillIds: ['m-nonroutine', 'm-expressions'], bucket: 'math', difficulty: 4, variants: 40, minutes: 2.5 },
  (rng, seed) => {
    const p = rint(rng, 2, 4)
    const q = rint(rng, 1, 5)
    const x = rint(rng, 2, 7)
    const y = rint(rng, 1, 6)
    const solveMode = seed % 2 === 0
    const val = p * x + q * y
    if (!solveMode) {
      return {
        title: 'Evaluate the new symbol',
        prompt: `Define **a ⋄ b = ${p}a + ${q}b**. What is **${x} ⋄ ${y}**?`,
        answer: numeric(val),
        hints: [
          'The definition is a recipe: a is the FIRST number, b the second.',
          `${p}(${x}) + ${q}(${y}).`,
          `Worked path: **${val}**.`,
        ],
        explanation: `${x} ⋄ ${y} = ${p}·${x} + ${q}·${y} = **${val}**. Order matters here — ${y} ⋄ ${x} would be ${p * y + q * x} — because nothing in the definition promises symmetry. Invented operators test whether you read definitions as they are, not as familiar operations dress up.`,
      }
    }
    const target = p * x + q * y
    return {
      title: 'Solve through the symbol',
      prompt: `Define **a ⋄ b = ${p}a + ${q}b**. Solve **n ⋄ ${y} = ${target}** for n.`,
      answer: numeric(x),
      hints: [
        'Unfold the definition, then it is an ordinary equation.',
        `${p}n + ${q}·${y} = ${target}.`,
        `Worked path: n = **${x}**.`,
      ],
      explanation: `Unfolding: ${p}n + ${q * y} = ${target} → ${p}n = ${target - q * y} → n = **${x}**. Every invented-operator problem is two problems stapled together: translate the symbol faithfully (n goes in the FIRST slot), then run algebra you already own. The translation is where the points are lost.`,
    }
  },
)

const consecutive = tpl(
  { id: 'nr-consecutive', name: 'Consecutive numbers', skillIds: ['m-nonroutine', 'm-lineqmulti'], bucket: 'math', difficulty: 3, variants: 40, minutes: 2.5 },
  (rng, seed) => {
    const odd = seed % 2 === 0
    const k = 3 + 2 * (Math.floor(seed / 2) % 2) // 3 or 5 numbers
    const mid = odd ? 2 * rint(rng, 3, 12) + 1 : rint(rng, 5, 20)
    const step = odd ? 2 : 1
    const nums = Array.from({ length: k }, (_, i) => mid + (i - (k - 1) / 2) * step)
    const sum = nums.reduce((x, y) => x + y, 0)
    const wantLargest = Math.floor(seed / 4) % 2 === 0
    const ans = wantLargest ? nums[nums.length - 1] : nums[0]
    return {
      title: 'Consecutive structure',
      prompt: `${k} consecutive ${odd ? 'ODD numbers' : 'whole numbers'} add to **${sum}**. What is the ${wantLargest ? 'largest' : 'smallest'} of them?`,
      answer: numeric(ans),
      hints: [
        `With an odd count of evenly spaced numbers, the MIDDLE one is the average.`,
        `Middle = ${sum} ÷ ${k} = ${mid}; step ${odd ? 2 : 1} each way.`,
        `Worked path: **${ans}**.`,
      ],
      explanation: `Evenly spaced numbers balance around their middle, so the middle is the average: ${sum}/${k} = ${mid}. Stepping by ${step}: ${nums.join(', ')} — ${wantLargest ? 'largest' : 'smallest'} **${ans}**. That symmetry beats setting up n + (n+${step}) + … every time. One care with odd numbers: consecutive ODDS step by 2, and writing n, n + 1 quietly makes one of them even.`,
    }
  },
)

const minMax = tpl(
  { id: 'nr-minmax', name: 'Push to the extreme', skillIds: ['m-nonroutine', 'm-inequal'], bucket: 'math', difficulty: 5, variants: 32, minutes: 3, calibration: true },
  (rng, seed) => {
    const c = cycle(seed, [
      ['five friends split', 'candies', 'every friend gets at least'],
      ['five prizes divide', 'points', 'every prize is worth at least'],
      ['five shelves hold', 'books', 'every shelf holds at least'],
      ['five jars share', 'buttons', 'every jar has at least'],
    ] as const)
    const minEach = rint(rng, 2, 6)
    const total = rint(rng, 40, 70)
    const distinct = seed % 2 === 0
    // Max one gets total - min for the other four; distinct → others take
    // minEach, minEach+1, minEach+2, minEach+3.
    const othersPlain = 4 * minEach
    const othersDistinct = 4 * minEach + 6
    const ans = distinct ? total - othersDistinct : total - othersPlain
    return {
      title: 'Largest possible share',
      prompt: `${c[0][0].toUpperCase()}${c[0].slice(1)} **${total} ${c[1]}**; ${c[2]} **${minEach}**${distinct ? ', and all five amounts are DIFFERENT whole numbers' : ''}. What is the largest any one can get?`,
      answer: numeric(ans),
      hints: [
        'To maximize one, push everyone else to their minimum.',
        distinct
          ? `Different amounts force the other four to at least ${minEach}, ${minEach + 1}, ${minEach + 2}, ${minEach + 3}.`
          : `The other four take ${minEach} each: ${othersPlain} total.`,
        `Worked path: **${ans}**.`,
      ],
      explanation: distinct
        ? `Minimizing four DISTINCT amounts means ${minEach}, ${minEach + 1}, ${minEach + 2}, ${minEach + 3} — total ${othersDistinct} — leaving **${ans}**. The distinctness clause is the whole problem: without it the answer would be ${total - othersPlain}, and missing that four minimums can't all be equal is exactly the intended trap.`
        : `Maximize one by minimizing the rest: the other four take ${minEach} each (${othersPlain}), leaving **${ans}**. Extremal questions flip the usual instinct — you optimize the target by being as stingy as legality allows everywhere else.`,
    }
  },
)

const symmetric = tpl(
  { id: 'nr-symmetric', name: 'Use the pair, skip the solve', skillIds: ['m-nonroutine', 'm-polys'], bucket: 'math', difficulty: 5, variants: 36, minutes: 3, transfer: true },
  (rng, seed) => {
    const x = rint(rng, 2, 9)
    const y = rint(rng, 1, x - 1 > 0 ? x - 1 : 1)
    const S = x + y
    const D = x - y
    const P = x * y
    const mode = cycle(seed, ['squares-diff', 'squares-sum'] as const)
    if (mode === 'squares-diff') {
      return {
        title: 'x² − y² without x or y',
        prompt: `Two numbers satisfy **x + y = ${S}** and **x − y = ${D}**. Find **x² − y²** — no need to find x and y.`,
        answer: numeric(S * D),
        hints: [
          'x² − y² factors.',
          `(x + y)(x − y) = ${S} × ${D}.`,
          `Worked path: **${S * D}**.`,
        ],
        explanation: `x² − y² = (x + y)(x − y) = ${S} × ${D} = **${S * D}**. The factoring identity turns two givens directly into the target — solving for x = ${x} and y = ${y} first gets the same place with three times the arithmetic and three times the chances to slip. Recognizing "the target factors into what I hold" is the AoPS reflex this trains.`,
      }
    }
    return {
      title: 'x² + y² from sum and product',
      prompt: `Two numbers satisfy **x + y = ${S}** and **xy = ${P}**. Find **x² + y²**.`,
      answer: numeric(S * S - 2 * P),
      hints: [
        'Square the sum and see what appears.',
        `(x + y)² = x² + 2xy + y², so x² + y² = ${S}² − 2·${P}.`,
        `Worked path: **${S * S - 2 * P}**.`,
      ],
      explanation: `(x + y)² = x² + 2xy + y² — so x² + y² = ${S}² − 2(${P}) = ${S * S} − ${2 * P} = **${S * S - 2 * P}**. The near-universal error is (x + y)² = x² + y², which forgets the cross term 2xy = ${2 * P} — precisely the piece this identity is built around.`,
    }
  },
)

const avgSpeed = tpl(
  { id: 'nr-avg-speed', name: 'The round-trip illusion', skillIds: ['m-nonroutine', 'm-ratio'], bucket: 'math', difficulty: 5, variants: 24, minutes: 3, calibration: true },
  (rng, seed) => {
    // Harmonic-mean-friendly pairs (distance divides both speeds cleanly).
    const pairs: [number, number, number][] = [
      [4, 12, 12], [3, 6, 6], [6, 12, 12], [4, 6, 12], [6, 30, 30], [10, 15, 30],
    ]
    const [v1, v2, dBase] = pairs[rint(rng, 0, pairs.length - 1)]
    const d = dBase * rint(rng, 1, 3)
    const t1 = d / v1
    const t2 = d / v2
    const avg = (2 * d) / (t1 + t2)
    const naive = (v1 + v2) / 2
    const c = cycle(seed, [
      ['cycles to a lake and back', 'km/h'],
      ['jogs to a bridge and back', 'km/h'],
      ['rows upstream to a dock and back', 'km/h'],
      ['walks to school and back', 'km/h'],
    ] as const)
    return {
      title: 'Average speed, honestly',
      prompt: `Someone ${c[0]} — **${d} km each way** — going at **${v1} ${c[1]}** and returning at **${v2} ${c[1]}**. What is the average speed for the whole trip, in ${c[1]}?`,
      answer: numeric(avg),
      hints: [
        `Average speed = total distance ÷ total time — never the average of the speeds.`,
        `Times: ${d}/${v1} = ${t1} h out, ${d}/${v2} = ${t2} h back.`,
        `Worked path: ${2 * d} ÷ ${t1 + t2} = **${avg}**.`,
      ],
      explanation: `Total distance ${2 * d} km; total time ${t1} + ${t2} = ${t1 + t2} h; average = **${avg} ${c[1]}** — not the tempting ${naive}. The slow leg eats MORE time, so it drags the average below the midpoint, always. Averaging the speeds is probably the most reliable wrong answer in all of rate problems, which makes catching it a genuinely transferable habit.`,
    }
  },
)

const workTogether = tpl(
  { id: 'nr-work-rates', name: 'Working together', skillIds: ['m-nonroutine', 'm-fractions'], bucket: 'math', difficulty: 4, variants: 24, minutes: 3, transfer: true },
  (rng, seed) => {
    // t = ab/(a+b); choose pairs with integer result.
    const pairs: [number, number][] = [[3, 6], [4, 12], [6, 12], [5, 20], [10, 15], [6, 30], [4, 4], [8, 8]]
    const [a, b] = pairs[rint(rng, 0, pairs.length - 1)]
    const t = (a * b) / (a + b)
    const c = cycle(seed, [
      ['paint the fence', 'Painter A', 'Painter B', 'hours'],
      ['stuff the envelopes', 'Sam', 'Riley', 'minutes'],
      ['fill the pool', 'the wide hose', 'the narrow hose', 'hours'],
      ['shelve the returns', 'the morning clerk', 'the evening clerk', 'minutes'],
    ] as const)
    return {
      title: 'Combine the rates',
      prompt: `${c[1]} can ${c[0]} alone in **${a} ${c[3]}**; ${c[2]} alone takes **${b} ${c[3]}**. Working together at those rates, how many ${c[3]} does the job take?`,
      answer: numeric(t),
      hints: [
        'Add RATES (jobs per hour), never times.',
        `Together: 1/${a} + 1/${b} of the job per ${c[3].replace(/s$/, '')}.`,
        `Worked path: **${t}**.`,
      ],
      explanation: `Rates add: 1/${a} + 1/${b} = ${a + b}/${a * b} of the job per ${c[3].replace(/s$/, '')}, so the job takes ${a * b}/${a + b} = **${t} ${c[3]}**. Two sanity anchors: together must beat the FASTER worker alone (${t} < ${Math.min(a, b)} ✓), and "add the times" fails that check instantly — ${a} + ${b} would mean cooperating made things slower.`,
    }
  },
)

const digitStructure = tpl(
  { id: 'nr-digit-structure', name: 'Digits as algebra', skillIds: ['m-nonroutine', 'm-expressions'], bucket: 'math', difficulty: 4, variants: 36, minutes: 3 },
  (rng, seed) => {
    const t = rint(rng, 2, 9)
    let u = rint(rng, 1, 9)
    while (u === t) u = (u % 9) + 1
    const n = 10 * t + u
    const rev = 10 * u + t
    const mode = seed % 2 === 0
    if (mode) {
      return {
        title: 'Reverse and subtract',
        prompt: `A two-digit number has tens digit **${t}** and units digit **${u}**. Subtract the reversed number from it. What do you get?`,
        answer: numeric(n - rev),
        hints: [
          'Write the number as 10·(tens) + (units).',
          `${n} − ${rev} = (10·${t} + ${u}) − (10·${u} + ${t}).`,
          `Worked path: **${n - rev}**.`,
        ],
        explanation: `(10t + u) − (10u + t) = 9t − 9u = 9(t − u) = 9(${t} − ${u}) = **${n - rev}**. Reversal differences are ALWAYS multiples of 9 — the algebra shows why in one line, which is the real lesson: writing a number as 10t + u turns digit puzzles into ordinary algebra.`,
      }
    }
    const sum = t + u
    return {
      title: 'Find the number',
      prompt: `A two-digit number's digits add to **${sum}**, and reversing it ${rev > n ? 'increases' : 'decreases'} it by **${Math.abs(rev - n)}**. What is the original number?`,
      answer: numeric(n),
      hints: [
        'Let the number be 10t + u. The reversal changes it by 9(u − t).',
        `So u − t = ${(rev - n) / 9} and t + u = ${sum}.`,
        `Worked path: **${n}**.`,
      ],
      explanation: `Two facts, two unknowns: t + u = ${sum} and 9(u − t) = ${rev - n} → u − t = ${(rev - n) / 9}. Adding the little system: 2u = ${sum + (rev - n) / 9}, so u = ${u}, t = ${t}, number **${n}**. Digit conditions are a system of equations wearing a costume — and the 9(u − t) fact, once derived, is reusable forever.`,
    }
  },
)

export const NON_ROUTINE_TEMPLATES: ItemTemplate[] = [
  remainderChain,
  definedOp,
  consecutive,
  minMax,
  symmetric,
  avgSpeed,
  workTogether,
  digitStructure,
]
