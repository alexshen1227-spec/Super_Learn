/**
 * Beyond the middle-school ceiling: high-school and early-college kinds hosted
 * on the existing tree — quadratics in vertex form and by formula, radical
 * arithmetic, rational exponents, series (finite and infinite), permutations
 * and combinations, and logarithms as inverse exponents. Difficulty 4-5 on
 * purpose: this is where the app's ceiling moves up.
 *
 * Same laws as everywhere: original problems, computed answers, distractors
 * that encode real mistakes.
 */
import { rint, rnz } from '../../engine/rng'
import type { ItemTemplate } from '../../domain/types'
import { cycle, numeric, tpl } from '../lib'

const vertexForm = tpl(
  { id: 'quad-vertex', name: 'Read the vertex', skillIds: ['m-quadratic'], bucket: 'math', difficulty: 4, variants: 40, minutes: 2.5 },
  (rng, seed) => {
    const h = rnz(rng, 6)
    const k = rint(rng, -8, 8)
    const a = cycle(seed, [1, 2, -1, 3] as const)
    const askMax = a < 0
    const term = `${a === 1 ? '' : a === -1 ? '−' : a}(x ${h >= 0 ? '− ' + h : '+ ' + Math.abs(h)})²`
    return {
      title: 'Vertex form pays instantly',
      prompt: `For y = ${term} ${k >= 0 ? '+ ' + k : '− ' + Math.abs(k)}, what is the **${askMax ? 'maximum' : 'minimum'} value of y**?`,
      answer: numeric(k),
      hints: [
        'The squared term is never negative — its smallest value is 0.',
        `That happens at x = ${h}, leaving y = ${k}.`,
        `Worked path: **${k}**.`,
      ],
      explanation: `(x ${h >= 0 ? '− ' + h : '+ ' + Math.abs(h)})² ≥ 0 always, so ${a > 0 ? 'the smallest' : 'the largest'} y occurs when the square is exactly 0 — at x = ${h}, giving y = **${k}**. Vertex form's whole job is making the extreme value readable without any calculus: a ${a > 0 ? 'positive' : 'negative'} a opens the parabola ${a > 0 ? 'upward (minimum)' : 'downward (maximum)'}, and (h, k) = (${h}, ${k}) is the turning point. The classic slip is reporting x = ${h} (WHERE it happens) when the question asks the VALUE.`,
    }
  },
)

const quadFormula = tpl(
  { id: 'quad-formula', name: 'The formula, with judgment', skillIds: ['m-quadratic'], bucket: 'math', difficulty: 5, variants: 40, minutes: 3 },
  (rng, seed) => {
    const r1 = rnz(rng, 6)
    let r2 = rnz(rng, 6)
    while (r2 === r1) r2 = rnz(rng, 6)
    const b = -(r1 + r2)
    const cc = r1 * r2
    const askDisc = seed % 2 === 0
    const disc = b * b - 4 * cc
    return askDisc
      ? {
          title: 'Discriminant first',
          prompt: `For x² ${b >= 0 ? '+ ' + b : '− ' + Math.abs(b)}x ${cc >= 0 ? '+ ' + cc : '− ' + Math.abs(cc)} = 0, compute the **discriminant** b² − 4ac.`,
          answer: numeric(disc),
          hints: [
            `Here a = 1, b = ${b}, c = ${cc}.`,
            `${b}² − 4(1)(${cc}).`,
            `Worked path: **${disc}**.`,
          ],
          explanation: `b² − 4ac = ${b * b} − ${4 * cc >= 0 ? 4 * cc : `(${4 * cc})`} = **${disc}** — positive, so two real solutions (they are ${r1} and ${r2}). The discriminant is the formula's advance scout: its SIGN answers "how many real solutions" before any solving, and reading it first is what separates using the formula from being used by it.`,
        }
      : {
          title: 'Larger root',
          prompt: `Solve x² ${b >= 0 ? '+ ' + b : '− ' + Math.abs(b)}x ${cc >= 0 ? '+ ' + cc : '− ' + Math.abs(cc)} = 0 (any method). What is the **larger** solution?`,
          answer: numeric(Math.max(r1, r2)),
          hints: [
            `Two numbers multiply to ${cc} and add to ${-b}.`,
            `They are ${Math.min(r1, r2)} and ${Math.max(r1, r2)}.`,
            `Worked path: **${Math.max(r1, r2)}**.`,
          ],
          explanation: `Factoring beats the formula here: the roots multiply to c = ${cc} and sum to −b = ${-b}, giving ${r1} and ${r2}; the larger is **${Math.max(r1, r2)}**. (The formula lands in the same place: (${-b} ± √${disc})/2.) Method CHOICE is the actual skill — factor when the numbers cooperate, complete the square for vertex information, formula when nothing is clean.`,
        }
  },
)

const radicalSimplify = tpl(
  { id: 'root-simplify', name: 'Pull out the square', skillIds: ['m-roots', 'm-radicals'], bucket: 'math', difficulty: 4, variants: 36, minutes: 2.5 },
  (rng, seed) => {
    const k = cycle(seed, [2, 3, 5, 6, 7, 10] as const)
    const sq = cycle(Math.floor(seed / 6), [2, 3, 4, 5] as const)
    const n = sq * sq * k
    const addMode = seed % 2 === 0 && sq <= 3
    if (addMode) {
      // a√k + b√k with one needing simplification first.
      const a = rint(rng, 1, 4)
      const total = a + sq
      return {
        title: 'Combine the radicals',
        prompt: `Simplify **${a}√${k} + √${n}** into the form c√${k}. What is **c**?`,
        answer: numeric(total),
        hints: [
          `√${n} hides a perfect square: ${n} = ${sq * sq} × ${k}.`,
          `So √${n} = ${sq}√${k}, and like radicals add.`,
          `Worked path: **${total}**.`,
        ],
        explanation: `√${n} = √(${sq * sq}·${k}) = ${sq}√${k}, so ${a}√${k} + ${sq}√${k} = **${total}√${k}**. Radicals add like like-terms — but only AFTER each is fully simplified, which is why √${n} had to confess its perfect-square factor first. Adding the radicands (√${k + n}) is the standard illegal move.`,
      }
    }
    return {
      title: 'Simplest radical form',
      prompt: `Write **√${n}** as a√b with b as small as possible. What is **a**?`,
      answer: numeric(sq),
      hints: [
        `Hunt the largest perfect square inside ${n}.`,
        `${n} = ${sq * sq} × ${k}.`,
        `Worked path: a = **${sq}**.`,
      ],
      explanation: `${n} = ${sq * sq} · ${k}, so √${n} = **${sq}√${k}**. The move is factoring out the largest perfect square — settle for a smaller one and the radical isn't done (√${n} = ${sq === 4 ? '2√' + k * 4 + ' still hides a 4' : 'partially simplified forms still hide squares'}). Simplest radical form is the exact-arithmetic habit that decimal approximations quietly destroy.`,
    }
  },
)

const rationalExponent = tpl(
  { id: 'exp-rational', name: 'Fractional exponents', skillIds: ['m-exponents', 'm-radicals'], bucket: 'math', difficulty: 5, variants: 15, minutes: 2.5 },
  (rng, seed) => {
    const bases: [number, number][] = [[4, 2], [9, 3], [16, 4], [25, 5], [27, 3], [8, 2]]
    const [base, root] = bases[rint(rng, 0, bases.length - 1)]
    const isCube = base === 27 || base === 8
    const num = cycle(seed, [1, 3, 2] as const)
    const val = root ** num
    const notation = `${base}^(${num}/${isCube ? 3 : 2})`
    return {
      title: 'Exponent as a fraction',
      prompt: `Evaluate **${notation}** — that is, ${base} to the power ${num}/${isCube ? 3 : 2}.`,
      answer: numeric(val),
      hints: [
        `The denominator is a root, the numerator a power: (${isCube ? '³√' : '√'}${base})^${num}.`,
        `${isCube ? '³√' : '√'}${base} = ${root}.`,
        `Worked path: ${root}^${num} = **${val}**.`,
      ],
      explanation: `x^(m/n) = (ⁿ√x)^m: root first (${isCube ? '³√' : '√'}${base} = ${root}), then power (${root}^${num} = **${val}**). Root-first keeps every intermediate small. The notation is not decoration — it is what makes the exponent rules (add when multiplying, multiply when raising) keep working beyond whole numbers, which is why it exists at all.`,
    }
  },
)

const arithSeries = tpl(
  { id: 'seq-series-sum', name: 'Sum the whole run', skillIds: ['m-sequences', 'm-nonroutine'], bucket: 'math', difficulty: 5, variants: 9, minutes: 3 },
  (rng, seed) => {
    const gauss = seed % 2 === 0
    if (gauss) {
      const n = cycle(Math.floor(seed / 2), [20, 40, 50, 100] as const)
      const total = (n * (n + 1)) / 2
      return {
        title: 'Pair the ends',
        prompt: `Compute **1 + 2 + 3 + … + ${n}** without adding one by one.`,
        answer: numeric(total),
        hints: [
          `Pair first with last: 1 + ${n}, 2 + ${n - 1}, … each pair sums to ${n + 1}.`,
          `${n / 2} pairs of ${n + 1}.`,
          `Worked path: **${total}**.`,
        ],
        explanation: `Pairing ends gives ${n / 2} pairs each summing to ${n + 1}: total ${n}·${n + 1}/2 = **${total}**. This is the identity n(n+1)/2, and the pairing argument is worth more than the formula — it works on any evenly spaced run and rebuilds the formula whenever memory drops it. The common slip is n²/2, which forgets the +1 the pairing makes visible.`,
      }
    }
    const a1 = rint(rng, 2, 8)
    const d = rint(rng, 2, 5)
    const n = cycle(Math.floor(seed / 2), [10, 12, 15, 20] as const)
    const last = a1 + (n - 1) * d
    const total = (n * (a1 + last)) / 2
    return {
      title: 'Arithmetic series',
      prompt: `A theater's rows hold ${a1}, ${a1 + d}, ${a1 + 2 * d}, … seats, one more row each time, for **${n} rows**. How many seats in all?`,
      answer: numeric(total),
      hints: [
        `Last row: ${a1} + ${n - 1}·${d} = ${last}.`,
        `Sum = (count) × (first + last)/2.`,
        `Worked path: ${n} × ${(a1 + last) / 2} = **${total}**.`,
      ],
      explanation: `Last row holds ${last}; the sum of an evenly spaced run is count × average of the ends: ${n} × (${a1} + ${last})/2 = **${total}**. Note which question this is — the TOTAL, not the last row's ${last} — mixing the two is the standard word-problem miss. The average-of-ends shortcut is the pairing argument wearing work clothes.`,
    }
  },
)

const geoSeries = tpl(
  { id: 'seq-geo-sum', name: 'The halving tower', skillIds: ['m-sequences', 'm-exponential'], bucket: 'math', difficulty: 5, variants: 11, minutes: 3, transfer: true },
  (rng, seed) => {
    const finite = seed % 2 === 0
    if (finite) {
      const a = cycle(Math.floor(seed / 2), [2, 3, 5] as const)
      const n = rint(rng, 4, 6)
      const total = a * (2 ** n - 1)
      return {
        title: 'Doubling, summed',
        prompt: `A chain of shares starts with **${a}** people, and each round the number of NEW sharers doubles: ${a}, ${a * 2}, ${a * 4}, … After **${n} rounds**, how many people have shared in total?`,
        answer: numeric(total),
        hints: [
          `The rounds give a·(1 + 2 + 4 + … + 2^${n - 1}).`,
          `1 + 2 + … + 2^${n - 1} = 2^${n} − 1.`,
          `Worked path: ${a} × ${2 ** n - 1} = **${total}**.`,
        ],
        explanation: `Doubling sums have a lovely closure: 1 + 2 + 4 + … + 2^${n - 1} = 2^${n} − 1 (each new term is one more than everything before it combined). So the total is ${a}(2^${n} − 1) = **${total}** — nearly double the LAST round alone (${a * 2 ** (n - 1)}), which is the geometric-growth signature: the final term outweighs the entire history behind it.`,
      }
    }
    const num = cycle(Math.floor(seed / 2), [1, 3] as const)
    return {
      title: 'Infinitely many pieces, finite total',
      prompt: `Walk half of a ${num === 1 ? '1 km' : '3 km'} path, then half of what remains, then half of THAT remainder, forever. What total distance do you approach, in km?`,
      answer: numeric(num),
      hints: [
        'Track what REMAINS instead of what is walked.',
        'Each step halves the remainder, so the remainder shrinks toward 0.',
        `Worked path: **${num}**.`,
      ],
      explanation: `After each step, exactly half the previous remainder is left: it shrinks ${num}/2, ${num}/4, ${num}/8, … toward 0, so the walked distance approaches the full **${num} km**. Infinitely many positive pieces, finite total — ${num === 1 ? '1/2 + 1/4 + 1/8 + … = 1' : 'the halves of 3 sum to 3'} — because the pieces shrink fast enough. This is the doorstep of limits, and the honest resolution of "you can never finish": you finish in the limit.`,
    }
  },
)

const combinations = tpl(
  { id: 'count-combinations', name: 'Order matters, or not', skillIds: ['m-counting'], bucket: 'math', difficulty: 4, variants: 32, minutes: 3 },
  (rng, seed) => {
    const ordered = seed % 2 === 0
    const n = rint(rng, 5, 8)
    const k = ordered ? cycle(Math.floor(seed / 2), [2, 3] as const) : 2
    if (ordered) {
      const val = k === 2 ? n * (n - 1) : n * (n - 1) * (n - 2)
      const c = cycle(seed, [
        ['club members', 'president and vice-president', 'president, vice-president, and secretary'],
        ['runners', 'gold and silver', 'gold, silver, and bronze'],
        ['photos', 'first and second position on the shelf', 'first, second, and third position'],
      ] as const)
      return {
        title: 'Distinct roles',
        prompt: `From **${n} ${c[0]}**, choose ${k === 2 ? c[1] : c[2]}. How many ways?`,
        answer: numeric(val),
        hints: [
          'Fill the roles one at a time; each pick shrinks the pool.',
          `${n} choices, then ${n - 1}${k === 3 ? `, then ${n - 2}` : ''}.`,
          `Worked path: **${val}**.`,
        ],
        explanation: `Roles are DISTINCT, so order matters: ${n} × ${n - 1}${k === 3 ? ` × ${n - 2}` : ''} = **${val}**. Swapping who holds which title produces a different outcome, so no dividing. The whole subject is this one question — does swapping count as new? — asked before any multiplying starts.`,
      }
    }
    const val = (n * (n - 1)) / 2
    const c = cycle(Math.floor(seed / 2), [
      ['people at a meeting', 'handshakes happen, one per pair'],
      ['teams in a league', 'games are needed so every pair meets once'],
      ['flavors', 'two-scoop combinations exist (different flavors, order irrelevant)'],
    ] as const)
    return {
      title: 'Unordered pairs',
      prompt: `With **${n} ${c[0]}**, how many ${c[1]}?`,
      answer: numeric(val),
      hints: [
        `Count ordered pairs first: ${n} × ${n - 1}.`,
        'Each unordered pair got counted twice — divide by 2.',
        `Worked path: **${val}**.`,
      ],
      explanation: `${n} × ${n - 1} counts every pair TWICE (A-with-B and B-with-A are the same handshake), so divide: ${n * (n - 1)}/2 = **${val}**. The ÷2 is not a formula quirk — it is the exact size of the double-counting, and knowing WHY it is 2 is what lets the idea scale to triples (÷6) later.`,
    }
  },
)

const logIntro = tpl(
  { id: 'exp-log', name: 'The exponent finder', skillIds: ['m-exponential', 'm-logarithms'], bucket: 'math', difficulty: 5, variants: 13, minutes: 2.5 },
  (rng, seed) => {
    const evalMode = seed % 2 === 0
    const pairs: [number, number][] = [[2, 5], [2, 6], [3, 3], [3, 4], [10, 3], [5, 3], [2, 8], [10, 4]]
    const [base, e] = pairs[rint(rng, 0, pairs.length - 1)]
    const val = base ** e
    if (evalMode) {
      return {
        title: 'Undo the exponent',
        prompt: `**log${base === 10 ? '₁₀' : base === 2 ? '₂' : '₃₋'.replace('₋', '')}(${val})** asks one question: ${base} raised to WHAT gives ${val}? Answer it.`,
        answer: numeric(e),
        hints: [
          `Count factors: ${base}, ${base * base}, ${base ** 3}, …`,
          `${base}^? = ${val}.`,
          `Worked path: **${e}**.`,
        ],
        explanation: `${base}^${e} = ${val}, so the answer is **${e}**. A logarithm is nothing more than an exponent with the question turned around — "what power?" instead of "what result?". Holding onto that translation is worth more than any log rule, because every rule is an exponent rule read backwards.`,
      }
    }
    const doubles = e
    const start = cycle(Math.floor(seed / 2), [100, 250, 500] as const)
    return {
      title: 'How many doublings?',
      prompt: `A colony of **${start}** cells doubles every hour. After how many hours does it FIRST reach ${start * val} cells?`,
      answer: numeric(doubles),
      hints: [
        `You need ${start} × 2^t = ${start * val}, i.e. 2^t = ${val}.`,
        `Count doublings: ${base === 2 ? `2, 4, 8, …` : 'double repeatedly'}.`,
        `Worked path: **${doubles}**.`,
      ],
      explanation: `2^t = ${val} → t = **${doubles}** hours. Solving for the EXPONENT is exactly what logarithms are for — this one you can do by counting doublings, and log₂ is just the name for that count when the numbers stop being friendly. Every "how long until it reaches…" question about exponential growth is secretly a logarithm.`,
    }
  },
)

export const BEYOND_CORE_TEMPLATES: ItemTemplate[] = [
  vertexForm,
  quadFormula,
  radicalSimplify,
  rationalExponent,
  arithSeries,
  geoSeries,
  combinations,
  logIntro,
]
