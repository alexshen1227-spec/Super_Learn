/**
 * Constraint-placement problems: closed beginning, closed end, open middle.
 *
 * Every answer here is an OPTIMUM found by exhaustive search
 * (`engine/constraintPuzzle.ts`), never authored — and the audit re-solves each
 * one across seeds, so a wrong "best" cannot survive a release. That is the
 * same rule the search-verified chess tactics follow, applied to arithmetic.
 *
 * Why these earn their place: the arithmetic is trivial, the SEARCH is not.
 * A learner has to reason about which slot carries the most weight (tens beat
 * ones; a denominator hurts more than a numerator helps), which is genuine
 * structural thinking rather than a procedure to execute.
 */
import type { ItemTemplate } from '../../domain/types'
import { cycle, mcqNoted, numeric, tpl } from '../lib'
import { solveConstraint, type ConstraintPuzzle } from '../../engine/constraintPuzzle'

/** Pools chosen so the optimum is not simply "use the biggest digits". */
const POOLS = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9],
  [2, 3, 4, 5, 6, 7],
  [1, 3, 5, 7, 8, 9],
  [2, 4, 5, 6, 8, 9],
] as const

const biggestSum = tpl(
  {
    id: 'cp-biggest-sum',
    name: 'Place digits for the biggest sum',
    skillIds: ['m-nonroutine', 'm-integers'],
    bucket: 'math',
    difficulty: 3,
    variants: 8,
    minutes: 2.5,
  },
  (_rng, seed) => {
    const digits = [...POOLS[seed % POOLS.length]]
    const wantMax = Math.floor(seed / POOLS.length) % 2 === 0
    const puzzle: ConstraintPuzzle = { kind: 'sum2x2', digits, goal: wantMax ? 'max' : 'min' }
    const { value, ties } = solveConstraint(puzzle)
    return {
      title: wantMax ? 'Biggest possible sum' : 'Smallest possible sum',
      prompt:
        `Using the digits **${digits.join(', ')}** — each at most once — fill the boxes:\n\n` +
        `**□□ + □□**\n\n` +
        `What is the ${wantMax ? 'LARGEST' : 'SMALLEST'} sum you can make?`,
      answer: numeric(value),
      hints: [
        'A digit in the tens place counts ten times; in the ones place, once.',
        wantMax
          ? 'So the two largest digits belong in the two tens places.'
          : 'So the two smallest digits belong in the two tens places.',
        `Worked path: **${value}**.`,
      ],
      explanation:
        `**${value}.** Each tens slot multiplies its digit by 10 and each ones slot by 1, so the sum is ` +
        `10·(tens digits) + 1·(ones digits). To push the total ${wantMax ? 'up' : 'down'} you put your ` +
        `${wantMax ? 'largest' : 'smallest'} two digits where they are worth ten times more. ` +
        `The order WITHIN each pair does not matter — which is why ${ties} different placements tie for best. ` +
        `Noticing that a slot's weight, not the digit's size, is what you are choosing is the whole puzzle.`,
    }
  },
)

const biggestProduct = tpl(
  {
    id: 'cp-biggest-product',
    name: 'Place digits for the biggest product',
    skillIds: ['m-nonroutine', 'm-integers'],
    bucket: 'math',
    difficulty: 5,
    variants: 8,
    minutes: 3,
    calibration: true,
  },
  (_rng, seed) => {
    const digits = [...POOLS[seed % POOLS.length]]
    const wantMax = Math.floor(seed / POOLS.length) % 2 === 0
    const puzzle: ConstraintPuzzle = { kind: 'product2x2', digits, goal: wantMax ? 'max' : 'min' }
    const { value, arrangement } = solveConstraint(puzzle)
    const [p, q, r, s] = arrangement
    const sorted = [...digits].sort((a, b) => b - a)
    // The tempting-but-wrong greedy answer: biggest two digits together.
    const greedy = (10 * sorted[0] + sorted[2]) * (10 * sorted[1] + sorted[3])
    const naive = (10 * sorted[0] + sorted[1]) * (10 * sorted[2] + sorted[3])
    return {
      title: wantMax ? 'Biggest possible product' : 'Smallest possible product',
      prompt:
        `Using the digits **${digits.join(', ')}** — each at most once — fill the boxes:\n\n` +
        `**□□ × □□**\n\n` +
        `What is the ${wantMax ? 'LARGEST' : 'SMALLEST'} product you can make?`,
      answer: numeric(value),
      hints: [
        'The tens places matter most — but which digits pair with which?',
        wantMax
          ? 'Try splitting the two biggest digits across DIFFERENT numbers, then test the two ways of assigning the ones digits.'
          : 'Try the two smallest digits in the tens places, then test both ways of placing the rest.',
        `Worked path: ${10 * p + q} × ${10 * r + s} = **${value}**.`,
      ],
      explanation:
        `**${10 * p + q} × ${10 * r + s} = ${value}.** Products do not behave like sums. ` +
        (wantMax
          ? `Stacking the two biggest digits into ONE number (${10 * sorted[0] + sorted[1]} × ${10 * sorted[2] + sorted[3]} = ${naive}) loses, because a product grows fastest when the two factors are BALANCED — the same reason a square fences more area than a long thin rectangle of equal perimeter. Splitting them gives ${greedy}, and the true optimum is ${value}.`
          : `The smallest product wants the factors as UNBALANCED as the digits allow, which is the mirror image of the same fact. `) +
        ` The reachable lesson: with a fixed total to distribute, balance maximises a product and imbalance minimises it.`,
    }
  },
)

const closestDifference = tpl(
  {
    id: 'cp-closest-difference',
    name: 'Get as close as you can',
    skillIds: ['m-nonroutine', 'm-integers'],
    bucket: 'math',
    difficulty: 4,
    variants: 12,
    minutes: 3,
  },
  (_rng, seed) => {
    const digits = [...POOLS[seed % POOLS.length]]
    const target = cycle(Math.floor(seed / POOLS.length), [10, 25, 40] as const)
    const puzzle: ConstraintPuzzle = { kind: 'closest-difference', digits, goal: 'target', target }
    const { value, arrangement, ties } = solveConstraint(puzzle)
    const [p, q, r, s] = arrangement
    return {
      title: 'Closest difference',
      prompt:
        `Using the digits **${digits.join(', ')}** — each at most once — fill the boxes:\n\n` +
        `**□□ − □□**\n\n` +
        `Get the result as close as possible to **${target}**. What value do you reach?`,
      answer: numeric(value),
      hints: [
        `You are aiming at ${target}, not at the biggest or smallest answer.`,
        'Pick the tens digits first — their difference sets the rough size, and the ones digits fine-tune it.',
        `Worked path: ${10 * p + q} − ${10 * r + s} = **${value}**.`,
      ],
      explanation:
        `**${10 * p + q} − ${10 * r + s} = ${value}**, which is ${Math.abs(value - target) === 0 ? 'exactly' : `${Math.abs(value - target)} away from`} ${target}. ` +
        `Aiming at a target is a different search from maximising: the tens digits set a coarse range ` +
        `(their difference contributes multiples of ten) and the ones digits adjust within it. ` +
        `${ties > 1 ? `${ties} placements tie here — being close is often reachable more than one way.` : 'Exactly one placement gets this close.'} ` +
        `Working coarse-then-fine is the transferable habit, and it beats trying combinations at random.`,
    }
  },
)

const fractionSum = tpl(
  {
    id: 'cp-fraction-sum',
    name: 'Two fractions, one target',
    skillIds: ['m-nonroutine', 'm-fractions'],
    bucket: 'math',
    difficulty: 5,
    variants: 8,
    minutes: 3.5,
    calibration: true,
  },
  (rng, seed) => {
    // Small pools keep the fraction arithmetic honest and the search tiny.
    const digits = [...([[1, 2, 3, 4, 6, 8], [1, 2, 3, 4, 5, 6], [2, 3, 4, 6, 8, 9], [1, 3, 4, 6, 8, 9]][seed % 4])]
    const wantMax = Math.floor(seed / 4) % 2 === 0
    const puzzle: ConstraintPuzzle = { kind: 'closest-sum', digits, goal: wantMax ? 'max' : 'min' }
    const { value, arrangement } = solveConstraint(puzzle)
    const [p, q, r, s] = arrangement
    const shown = Math.round(value * 1000) / 1000
    const { answer, distractorNotes } = mcqNoted(rng, `${p}/${q} + ${r}/${s}`, [
      [
        `${q}/${p} + ${s}/${r}`,
        wantMax
          ? 'flipping every fraction makes each piece smaller here — a big denominator is what shrinks a fraction'
          : 'flipping every fraction makes each piece larger, the opposite of the goal',
      ],
      [
        `${Math.max(...digits)}/${Math.min(...digits)} + ${p}/${q}`,
        'reuses a digit — each digit may be used at most once across all four boxes',
      ],
      [
        `${p}/${s} + ${r}/${q}`,
        'right digits, swapped denominators — the pairing is exactly what the puzzle is asking you to choose',
      ],
    ])
    return {
      title: wantMax ? 'Largest possible sum of two fractions' : 'Smallest possible sum of two fractions',
      prompt:
        `Using the digits **${digits.join(', ')}** — each at most once — fill the boxes:\n\n` +
        `**□/□ + □/□**\n\n` +
        `Which placement makes the ${wantMax ? 'LARGEST' : 'SMALLEST'} total?`,
      answer,
      distractorNotes,
      hints: [
        'A fraction grows when its top grows OR its bottom shrinks.',
        wantMax
          ? 'So the largest digits want to be numerators and the smallest digits denominators.'
          : 'So the smallest digits want to be numerators and the largest digits denominators.',
        `Worked path: ${p}/${q} + ${r}/${s} ≈ ${shown}.`,
      ],
      explanation:
        `**${p}/${q} + ${r}/${s} ≈ ${shown}.** Numerator and denominator pull in OPPOSITE directions, so a ` +
        `${wantMax ? 'big' : 'small'} digit is worth most on top and a ${wantMax ? 'small' : 'big'} one underneath. ` +
        `The subtlety is that denominators have more leverage than numerators — halving a denominator doubles a ` +
        `fraction, while doubling a numerator only doubles it once — so the extreme digits are best spent on the ` +
        `bottom boxes. Checked by exhaustive search, not by eye.`,
    }
  },
)

export const CONSTRAINT_PUZZLE_TEMPLATES: ItemTemplate[] = [
  biggestSum,
  biggestProduct,
  closestDifference,
  fractionSum,
]
