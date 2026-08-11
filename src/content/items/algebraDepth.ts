/**
 * Algebra depth — the academic spine, widened.
 *
 * Three things this strand adds that the base bank was thin on:
 *  1. EASIER on-ramps, so a learner who is not yet fluent has somewhere to
 *     stand before the multi-step work.
 *  2. HARDER ceilings — non-routine items where the method has to be chosen.
 *  3. TRAP items: problems that look routine and are not. Their distractors
 *     are the intuitive-but-wrong answers (the sign that did not flip, the
 *     square that got distributed), so picking one names the misconception
 *     instead of just scoring zero.
 *
 * Every answer is computed from the generated values.
 */
import type { ItemTemplate } from '../../domain/types'
import { pick, rint, rnz } from '../../engine/rng'
import { mcq, numeric, tpl } from '../lib'

/** Signed term like "+ 7" / "− 7", for readable equation strings. */
const sgn = (v: number) => (v >= 0 ? `+ ${v}` : `− ${-v}`)

// ================================================================ on-ramps

const substituteSigned = tpl(
  { id: 'alg-substitute-signed', name: 'Substitute a negative', skillIds: ['m-expressions'], bucket: 'math', difficulty: 1, variants: 56, minutes: 1.5 },
  (rng) => {
    const a = rint(rng, 2, 9)
    const b = rnz(rng, 9)
    const x = -rint(rng, 2, 8)
    const value = a * x + b
    return {
      title: 'Substitute carefully',
      prompt: `Evaluate **${a}x ${sgn(b)}** when **x = ${x}**.`,
      answer: numeric(value),
      hints: [
        'Write the substitution with brackets first: it stops the sign from getting lost.',
        `${a}(${x}) ${sgn(b)}`,
        `${a} × ${x} = ${a * x}, then ${a * x} ${sgn(b)} = **${value}**.`,
      ],
      explanation: `Substituting with brackets, ${a}(${x}) ${sgn(b)} = ${a * x} ${sgn(b)} = **${value}**. Brackets are not decoration here — writing ${a}${x} without them is where the sign usually disappears.`,
      commonErrors: { slip: `Dropping the negative gives ${a * Math.abs(x) + b}. The bracket habit prevents it.` },
    }
  },
)

const oneStepInverse = tpl(
  { id: 'alg-one-step-inverse', name: 'Undo one operation', skillIds: ['m-lineq1'], bucket: 'math', difficulty: 1, variants: 40, minutes: 1.5 },
  (rng) => {
    const kind = pick(rng, ['add', 'multiply', 'divide'] as const)
    const x = rnz(rng, 12)
    const k = rint(rng, 2, 9)
    const eq = kind === 'add' ? `x ${sgn(k)} = ${x + k}` : kind === 'multiply' ? `${k}x = ${k * x}` : `x / ${k} = ${x}`
    const answer = x
    const undo = kind === 'add' ? `subtract ${k} from both sides` : kind === 'multiply' ? `divide both sides by ${k}` : `multiply both sides by ${k}`
    return {
      title: 'One move to x',
      prompt: `Solve for x:  **${eq}**`,
      answer: numeric(answer),
      hints: [
        'Ask what was done TO x, then do the opposite to both sides.',
        `Here you should ${undo}.`,
        `That gives x = **${answer}**.`,
      ],
      explanation: `To isolate x, ${undo}, giving **x = ${answer}**. Check by putting it back: the equation has to stay balanced, and substituting is free error-detection you should never skip.`,
    }
  },
)

// ================================================================ traps

const inequalityFlip = tpl(
  { id: 'alg-inequality-flip', name: 'The sign that flips', skillIds: ['m-inequal'], bucket: 'math', difficulty: 3, variants: 40, minutes: 2, calibration: true },
  (rng) => {
    // Always a NEGATIVE coefficient: this item exists to train the flip.
    const a = -rint(rng, 2, 8)
    const x = rnz(rng, 9)
    const c = a * x
    const dir = pick(rng, ['<', '>'] as const)
    const flipped = dir === '<' ? '>' : '<'
    const correct = `x ${flipped} ${x}`
    return {
      title: 'Divide by a negative',
      prompt: `Solve for x:  **${a}x ${dir} ${c}**`,
      answer: mcq(rng, correct, [
        `x ${dir} ${x}`,
        `x ${flipped} ${-x}`,
        `x ${dir} ${-x}`,
      ]),
      hints: [
        'Isolate x the usual way — but watch what you divide by.',
        `Dividing both sides by ${a} means dividing by a NEGATIVE number.`,
        `Test it: multiply 2 ${dir} 3 by −1 and the true statement becomes −2 ${flipped} −3. So the answer is **${correct}**.`,
      ],
      explanation: `Dividing both sides by ${a} flips the inequality: **${correct}**.\n\nWhy it flips is worth holding onto rather than memorising: multiplying by a negative reflects every number across zero, and reflection reverses order. 2 < 3, but −2 > −3.\n\nSanity check any inequality answer by testing one number from your region in the ORIGINAL inequality.`,
      commonErrors: {
        concept: `Keeping the direction gives x ${dir} ${x} — the single most common inequality error, and it looks completely reasonable until you test a value.`,
      },
    }
  },
)

const solutionCount = tpl(
  { id: 'alg-solution-count', name: 'One, none, or all?', skillIds: ['m-lineqmulti'], bucket: 'math', difficulty: 4, variants: 36, minutes: 2.5, calibration: true },
  (rng, seed) => {
    const kind = (['one', 'none', 'all'] as const)[seed % 3]
    const a = rint(rng, 2, 7)
    const b = rnz(rng, 8)
    const shift = rint(rng, 1, 6)
    let left: string
    let right: string
    let correct: string
    if (kind === 'one') {
      const a2 = a + rint(rng, 1, 4)
      left = `${a}x ${sgn(b)}`
      right = `${a2}x ${sgn(b - shift)}`
      correct = 'Exactly one solution'
    } else if (kind === 'none') {
      left = `${a}x ${sgn(b)}`
      right = `${a}x ${sgn(b + shift)}`
      correct = 'No solution'
    } else {
      left = `${a}x ${sgn(b)}`
      right = `${a}x ${sgn(b)}`
      correct = 'Infinitely many solutions'
    }
    return {
      title: 'How many solutions?',
      prompt: `How many solutions does this equation have?\n\n**${left} = ${right}**`,
      answer: mcq(rng, correct, [
        'Exactly one solution',
        'No solution',
        'Infinitely many solutions',
      ]),
      hints: [
        'Collect the x-terms on one side and the numbers on the other, then look at what is left.',
        'If the x-terms cancel, you are left with a claim about numbers only — and it is either true or false.',
        kind === 'one'
          ? 'The x-terms do not cancel, so x is pinned to a single value.'
          : kind === 'none'
            ? 'The x-terms cancel and leave a false statement, so nothing can satisfy it.'
            : 'The x-terms cancel and leave a true statement, so every x works.',
      ],
      explanation:
        kind === 'one'
          ? `The coefficients of x differ, so subtracting leaves a non-zero multiple of x equal to a number: **exactly one solution**.`
          : kind === 'none'
            ? `Subtracting ${a}x from both sides leaves ${b} = ${b + shift} — a false statement with no x in it. **No solution**: the two sides never meet.`
            : `Both sides are the identical expression, so subtracting leaves 0 = 0 — true for every x. **Infinitely many solutions**.\n\nThese are the same equation written twice.`,
      commonErrors: {
        concept: 'Assuming every equation has exactly one answer. When the x-terms cancel, the leftover numeric statement decides: false means none, true means all.',
      },
    }
  },
)

const squareOfSum = tpl(
  { id: 'alg-square-of-sum', name: 'Squaring a sum', skillIds: ['m-polys'], bucket: 'math', difficulty: 3, variants: 4, minutes: 2, calibration: true },
  (rng) => {
    const a = rint(rng, 2, 9)
    const correct = `x² + ${2 * a}x + ${a * a}`
    return {
      title: 'Expand it properly',
      prompt: `Expand:  **(x + ${a})²**`,
      answer: mcq(rng, correct, [
        `x² + ${a * a}`,
        `x² + ${a}x + ${a * a}`,
        `x² + ${2 * a}x + ${2 * a}`,
      ]),
      hints: [
        'A square is the expression multiplied by itself — write it out as two brackets before expanding.',
        `(x + ${a})(x + ${a}): every term in the first bracket meets every term in the second.`,
        `x·x + x·${a} + ${a}·x + ${a}·${a} = **${correct}**.`,
      ],
      explanation: `(x + ${a})² means (x + ${a})(x + ${a}) = x² + ${a}x + ${a}x + ${a * a} = **${correct}**.\n\nThe famous wrong answer is x² + ${a * a}: squaring distributed across the plus sign. It is wrong because squaring is repeated multiplication, and multiplication does not distribute over the terms of its own bracket that way.\n\nQuick check with numbers: at x = 1, (1 + ${a})² = ${(1 + a) ** 2}, while 1 + ${a * a} = ${1 + a * a}. Substituting one value catches this instantly.`,
      commonErrors: {
        concept: `x² + ${a * a} is the classic error — "square each bit". The missing ${2 * a}x is the two cross-terms.`,
      },
    }
  },
)

const factorableOrNot = tpl(
  { id: 'alg-difference-squares', name: 'Difference of squares — or not', skillIds: ['m-polys'], bucket: 'math', difficulty: 4, variants: 12, minutes: 2.5, calibration: true },
  (rng, seed) => {
    const a = rint(rng, 2, 9)
    const isDifference = seed % 2 === 0
    const expr = isDifference ? `x² − ${a * a}` : `x² + ${a * a}`
    const correct = isDifference
      ? `(x + ${a})(x − ${a})`
      : `It does not factor over the real numbers`
    return {
      title: 'Factor if you can',
      prompt: `Factor completely:  **${expr}**`,
      answer: mcq(rng, correct, [
        isDifference ? `(x + ${a})(x + ${a})` : `(x + ${a})(x + ${a})`,
        isDifference ? `(x − ${a})(x − ${a})` : `(x + ${a})(x − ${a})`,
        isDifference ? `It does not factor over the real numbers` : `(x − ${a})(x − ${a})`,
      ]),
      hints: [
        'Check the sign between the two squares before reaching for a pattern.',
        'a² − b² = (a + b)(a − b). There is no matching real factorisation for a² + b².',
        isDifference
          ? `This is a difference, so it factors: **${correct}**.`
          : `This is a SUM of squares, so over the reals **${correct.toLowerCase()}**.`,
      ],
      explanation: isDifference
        ? `${expr} = **(x + ${a})(x − ${a})**. Expanding back: the cross terms +${a}x and −${a}x cancel, which is exactly why the pattern works.`
        : `${expr} is a **sum** of squares, and it does not factor over the real numbers.\n\nThis is the trap: the expression looks one character away from the difference-of-squares pattern, so it feels factorable. Check by expanding (x + ${a})(x − ${a}) — you get x² − ${a * a}, not x² + ${a * a}.\n\nRecognising that a standard pattern does NOT apply is as much a skill as applying one.`,
      commonErrors: {
        strategy: 'Pattern-matching on shape rather than on the sign. The minus is the whole pattern; with a plus there is nothing to apply.',
      },
    }
  },
)

const exponentRules = tpl(
  { id: 'alg-exponent-confuse', name: 'Multiply or raise?', skillIds: ['m-exponents'], bucket: 'math', difficulty: 3, variants: 34, minutes: 2, calibration: true },
  (rng, seed) => {
    const m = rint(rng, 2, 6)
    const n = rint(rng, 2, 6)
    const isProduct = seed % 2 === 0
    const expr = isProduct ? `x^${m} · x^${n}` : `(x^${m})^${n}`
    const right = isProduct ? m + n : m * n
    const wrong = isProduct ? m * n : m + n
    return {
      title: 'Which rule applies?',
      prompt: `Simplify:  **${expr}**`,
      answer: mcq(rng, `x^${right}`, [
        `x^${wrong}`,
        `x^${m}`,
        `${isProduct ? m + n : m * n}x`,
      ]),
      hints: [
        'Do not reach for a rule — write out what the notation actually counts.',
        isProduct
          ? `x^${m} is ${m} copies of x, and x^${n} is ${n} more copies. Multiplying puts them side by side.`
          : `(x^${m})^${n} means ${n} copies of a block that already holds ${m} copies.`,
        `That gives **x^${right}**.`,
      ],
      explanation: isProduct
        ? `Multiplying same-base powers ADDS exponents: ${m} copies beside ${n} copies is ${right} copies, so **x^${right}**.`
        : `A power of a power MULTIPLIES exponents: ${n} blocks of ${m} copies each is ${right} copies, so **x^${right}**.`,
      commonErrors: {
        concept: `The other rule gives x^${wrong}. Both rules are just counting factors — deriving them from "how many copies?" beats memorising which is which.`,
      },
    }
  },
)

// ================================================================ core skills

const slopeTwoPoints = tpl(
  { id: 'alg-slope-points', name: 'Slope from two points', skillIds: ['m-linear'], bucket: 'math', difficulty: 2, variants: 46, minutes: 2 },
  (rng) => {
    const x1 = rnz(rng, 6)
    const run = rint(rng, 1, 5)
    const x2 = x1 + run
    const slope = rnz(rng, 4)
    const y1 = rnz(rng, 8)
    const y2 = y1 + slope * run
    return {
      title: 'Rise over run',
      prompt: `Find the slope of the line through **(${x1}, ${y1})** and **(${x2}, ${y2})**.`,
      answer: numeric(slope),
      hints: [
        'Slope = change in y ÷ change in x.',
        `Subtract in the SAME order both times: (${y2} − ${y1}) ÷ (${x2} − ${x1}).`,
        `${y2 - y1} ÷ ${run} = **${slope}**.`,
      ],
      explanation: `(${y2} − ${y1}) ÷ (${x2} − ${x1}) = ${y2 - y1} ÷ ${run} = **${slope}**.\n\nThe order rule matters more than the formula: if you subtract y one way and x the other, you get the right size with the wrong sign. Slope is a rate — how much y changes per single step in x.`,
      commonErrors: {
        slip: 'Subtracting in opposite orders flips the sign. Pick a point to be "first" and stay with it for both subtractions.',
      },
    }
  },
)

const slopeSpecial = tpl(
  { id: 'alg-slope-special', name: 'Flat or vertical?', skillIds: ['m-linear'], bucket: 'math', difficulty: 4, variants: 20, minutes: 2, calibration: true },
  (rng, seed) => {
    const vertical = seed % 2 === 0
    const a = rnz(rng, 7)
    const b = rnz(rng, 7)
    const c = b + rint(rng, 1, 6)
    const p1 = vertical ? `(${a}, ${b})` : `(${b}, ${a})`
    const p2 = vertical ? `(${a}, ${c})` : `(${c}, ${a})`
    const correct = vertical ? 'The slope here is undefined' : 'The slope is 0'
    return {
      title: 'The two special lines',
      prompt: `What is the slope of the line through **${p1}** and **${p2}**?`,
      answer: mcq(rng, correct, [
        vertical ? 'The slope is 0' : 'The slope here is undefined',
        'The slope is 1: the points differ by one step',
        'There is no line through the two points',
      ]),
      hints: [
        'Write the fraction (change in y) ÷ (change in x) before deciding anything.',
        vertical ? 'The x-coordinates are identical, so the run is zero.' : 'The y-coordinates are identical, so the rise is zero.',
        vertical
          ? 'Dividing by zero is undefined — the line is vertical.'
          : 'Zero divided by a non-zero number is 0 — the line is horizontal.',
      ],
      explanation: vertical
        ? `Both points have x = ${a}, so the run is 0 and the slope is ${(c - b)}/0 — **undefined**. The line is vertical.\n\n"Undefined" and "zero" are opposite situations that get swapped constantly. Zero slope means flat: y never changes. Undefined means vertical: x never changes, and you cannot divide by that zero.`
        : `Both points have y = ${a}, so the rise is 0 and the slope is 0/${c - b} = **0**. The line is horizontal.\n\nZero on top is fine — it just means y never changes. Zero on the BOTTOM is the undefined case, and mixing the two up is the usual error here.`,
      commonErrors: {
        concept: 'Swapping zero slope with undefined slope. Ask which coordinate is stuck: stuck y means flat (0), stuck x means vertical (undefined).',
      },
    }
  },
)

const systemSubstitution = tpl(
  { id: 'alg-system-solve', name: 'Solve the system', skillIds: ['m-systems'], bucket: 'math', difficulty: 3, variants: 40, minutes: 3 },
  (rng) => {
    const x = rnz(rng, 6)
    const y = rnz(rng, 6)
    const a = rint(rng, 1, 4)
    const b = rint(rng, 1, 4)
    const c = rint(rng, 1, 4)
    const d = -rint(rng, 1, 4)
    const e1 = a * x + b * y
    const e2 = c * x + d * y
    return {
      title: 'Two equations, two unknowns',
      prompt: `Solve the system for x:\n\n**${a}x + ${b}y = ${e1}**\n**${c}x ${sgn(d)}y = ${e2}**`,
      answer: numeric(x),
      hints: [
        'Eliminate one letter: scale the equations so one variable cancels when you add or subtract.',
        `Multiply the first by ${c} and the second by ${a} — then the x-terms match and subtract away, leaving y.`,
        `Solving gives y = ${y}, and substituting back gives x = **${x}**.`,
      ],
      explanation: `The solution is **x = ${x}** (with y = ${y}). Check both equations: ${a}(${x}) + ${b}(${y}) = ${e1} ✓ and ${c}(${x}) ${sgn(d)}(${y}) = ${e2} ✓.\n\nChecking BOTH equations matters: a value can satisfy one and fail the other, and only the pair that works in both is the solution — that is what "solution of a system" means geometrically, the single crossing point.`,
    }
  },
)

const functionNotation = tpl(
  { id: 'alg-function-compose', name: 'Function of a function', skillIds: ['m-functions'], bucket: 'math', difficulty: 4, variants: 40, minutes: 2.5, calibration: true },
  (rng) => {
    const a = rint(rng, 2, 5)
    const b = rnz(rng, 6)
    const c = rint(rng, 2, 4)
    const d = rnz(rng, 5)
    const input = rnz(rng, 4)
    const gVal = c * input + d
    const fgVal = a * gVal + b
    const wrongOrder = c * (a * input + b) + d
    return {
      title: 'Inside first',
      prompt: `Given **f(x) = ${a}x ${sgn(b)}** and **g(x) = ${c}x ${sgn(d)}**, what is **f(g(${input}))**?`,
      answer: numeric(fgVal),
      hints: [
        'Work from the inside out: the inner function runs first.',
        `g(${input}) = ${c}(${input}) ${sgn(d)} = ${gVal}.`,
        `Then f(${gVal}) = ${a}(${gVal}) ${sgn(b)} = **${fgVal}**.`,
      ],
      explanation: `g(${input}) = ${gVal}, then f(${gVal}) = **${fgVal}**.\n\nOrder is the whole point: doing it the other way round gives ${wrongOrder}, a different number. f(g(x)) and g(f(x)) are genuinely different machines, so the brackets are instructions, not decoration.`,
      commonErrors: {
        strategy: `Applying f first gives ${wrongOrder}. Read outward from the innermost bracket, the same way you would run nested instructions.`,
      },
    }
  },
)

const quadraticFactor = tpl(
  { id: 'alg-quadratic-roots', name: 'Solve by factoring', skillIds: ['m-quadratic'], bucket: 'math', difficulty: 4, variants: 28, minutes: 3 },
  (rng) => {
    const r1 = rnz(rng, 7)
    const r2 = rnz(rng, 7)
    const sum = r1 + r2
    const prod = r1 * r2
    const smaller = Math.min(r1, r2)
    return {
      title: 'Both answers',
      prompt: `Solve:  **x² ${sgn(-sum)}x ${sgn(prod)} = 0**\n\nEnter the **smaller** root.`,
      answer: numeric(smaller),
      hints: [
        'Look for two numbers that multiply to the constant and add to the x-coefficient.',
        `You need a pair with product ${prod} and sum ${sum}.`,
        `That pair is ${r1} and ${r2}, so the roots are ${r1} and ${r2}; the smaller is **${smaller}**.`,
      ],
      explanation: `Factoring gives (x ${sgn(-r1)})(x ${sgn(-r2)}) = 0, so x = ${r1} or x = ${r2}. The smaller is **${smaller}**.\n\nThe step doing the work is the zero-product property: a product is zero only when a factor is zero. That is why factoring solves equations at all, and why the equation must be set equal to 0 first — factoring something equal to 7 tells you nothing.`,
      commonErrors: {
        concept: 'Reporting only one root. A quadratic normally has two, and stopping at the first one loses half the answer.',
      },
    }
  },
)

const growthCompare = tpl(
  { id: 'alg-growth-compare', name: 'Linear or exponential?', skillIds: ['m-exponential'], bucket: 'math', difficulty: 4, variants: 24, minutes: 3, transfer: true, calibration: true },
  (rng) => {
    const start = rint(rng, 2, 6)
    const step = rint(rng, 3, 8)
    const factor = 2
    const weeks = rint(rng, 4, 7)
    const linear = start + step * weeks
    const exponential = start * factor ** weeks
    const crossover = exponential > linear
    return {
      title: 'Which plan wins?',
      prompt: `Plan A starts at **${start}** and adds **${step} each week**.\nPlan B starts at **${start}** and **doubles each week**.\n\nAfter **${weeks} weeks**, which is larger, and by how much?`,
      answer: mcq(
        rng,
        crossover
          ? `Plan B, at ${exponential} against ${linear} — a difference of ${exponential - linear}`
          : `Plan A, at ${linear} against ${exponential} — a difference of ${linear - exponential}`,
        [
          crossover
            ? `Plan A, at ${linear} against ${exponential} — a difference of ${linear - exponential}`
            : `Plan B, at ${exponential} against ${linear} — a difference of ${exponential - linear}`,
          `They finish level, because both plans started from the same value of ${start}`,
          `Plan A, because adding ${step} every week beats doubling from a start as small as ${start}`,
        ],
      ),
      hints: [
        'Compute both. Doubling repeatedly is multiplication, not addition.',
        `Plan A: ${start} + ${step}×${weeks} = ${linear}. Plan B: ${start} × 2^${weeks} = ${exponential}.`,
        `${crossover ? 'Plan B' : 'Plan A'} is ahead at week ${weeks}.`,
      ],
      explanation: `Plan A reaches ${start} + ${step}×${weeks} = **${linear}**. Plan B reaches ${start} × 2^${weeks} = **${exponential}**. ${crossover ? 'Plan B' : 'Plan A'} wins here.\n\nThe thing worth internalising is that this depends entirely on the time horizon. Exponential growth starts slower and looks unimpressive early — then crosses and never looks back. Judging a doubling process by its first few steps is how people underestimate compounding, epidemics, and interest alike.`,
      commonErrors: {
        concept: 'Assuming exponential always wins. Over a short horizon with a small starting value, steady addition can genuinely be ahead — the crossover point is the real question.',
      },
    }
  },
)

const wordToEquation = tpl(
  { id: 'alg-word-equation', name: 'Story to equation', skillIds: ['m-wordeq'], bucket: 'math', difficulty: 3, variants: 28, minutes: 2.5 },
  (rng) => {
    const flat = rint(rng, 4, 15)
    const rate = rint(rng, 2, 9)
    const units = rint(rng, 3, 12)
    const total = flat + rate * units
    return {
      title: 'Name the repeating part',
      prompt: `A service charges a **$${flat} joining fee** plus **$${rate} per session**. A member paid **$${total}** in total.\n\nHow many sessions did they attend?`,
      answer: numeric(units),
      hints: [
        'One charge happens once; the other repeats. Only the repeating one gets multiplied by the unknown.',
        `${flat} + ${rate}s = ${total}`,
        `${rate}s = ${total - flat}, so s = **${units}**.`,
      ],
      explanation: `${flat} + ${rate}s = ${total} → ${rate}s = ${total - flat} → s = **${units}**.\n\nThe translation step is the difficult one, not the algebra. Ask of every number: does this happen once, or once per thing? The once-per-thing number is the coefficient, and the one-off is the constant.`,
      commonErrors: {
        representation: `Multiplying the joining fee by the sessions gives a much larger total. The fee is paid once no matter how many sessions follow.`,
      },
    }
  },
)

const fractionCoefficient = tpl(
  { id: 'alg-fraction-coefficient', name: 'Fractional coefficient', skillIds: ['m-lineqmulti'], bucket: 'math', difficulty: 3, variants: 18, minutes: 2.5 },
  (rng) => {
    const d = rint(rng, 2, 6)
    const n = rint(rng, 1, d - 1 || 1)
    const x = d * rnz(rng, 5)
    const rhs = (n * x) / d
    return {
      title: 'Undo a fraction',
      prompt: `Solve for x:  **(${n}/${d})x = ${rhs}**`,
      answer: numeric(x),
      hints: [
        'Dividing by a fraction is multiplying by its reciprocal.',
        `Multiply both sides by ${d}/${n}.`,
        `${rhs} × ${d}/${n} = **${x}**.`,
      ],
      explanation: `Multiplying both sides by the reciprocal ${d}/${n} gives x = ${rhs} × ${d}/${n} = **${x}**.\n\nA fractional coefficient is not a special case needing a new method — it is the same "undo by the inverse operation" move, and the inverse of multiplying by ${n}/${d} is multiplying by ${d}/${n}.`,
    }
  },
)

const rateFromGraph = tpl(
  { id: 'alg-interpret-slope', name: 'What does the slope mean?', skillIds: ['m-linfunc'], bucket: 'math', difficulty: 3, variants: 24, minutes: 2.5, transfer: true },
  (rng) => {
    const b = rint(rng, 5, 40)
    const m = rint(rng, 2, 12)
    const ctx = pick(rng, [
      { y: 'litres of water in a tank', x: 'minutes', unit: 'litres per minute' },
      { y: 'dollars saved', x: 'weeks', unit: 'dollars per week' },
      { y: 'pages read', x: 'days', unit: 'pages per day' },
    ] as const)
    return {
      title: 'Read the rate',
      prompt: `A relationship is modelled by **y = ${m}x + ${b}**, where y is ${ctx.y} and x is ${ctx.x}.\n\nWhat does the **${m}** tell you?`,
      answer: mcq(rng, `The amount changes by ${m} ${ctx.unit}`, [
        // Same clipped register as the key. The rate reading used to be the
        // shortest option every single time, which reads as the answer.
        `The starting amount is ${m}`,
        `The total reaches ${m} at the end`,
        `The amount ends up ${m} times its starting size`,
      ]),
      hints: [
        'In y = mx + b, one number is a starting value and the other is a rate of change.',
        `The number attached to x scales with ${ctx.x}, so it is a per-${ctx.x.replace(/s$/, '')} rate.`,
        `So ${m} means ${m} ${ctx.unit}, and ${b} is the starting amount.`,
      ],
      explanation: `**${m} ${ctx.unit}.** In y = mx + b the coefficient of x is the rate — how much y moves for each single step in x — while ${b} is the value already there at x = 0.\n\nReading the slope as a rate with units attached is what turns an equation into a claim about the world, and it is also the fastest way to catch a nonsense model: if the units do not make sense, the equation does not either.`,
    }
  },
)

const extraneousCheck = tpl(
  { id: 'alg-check-solution', name: 'Does it actually work?', skillIds: ['m-lineqmulti', 'm-proof'], bucket: 'math', difficulty: 5, variants: 20, minutes: 3, calibration: true },
  (rng) => {
    const a = rint(rng, 2, 6)
    const b = rnz(rng, 7)
    const x = rnz(rng, 6)
    const rhs = a * x + b
    const wrongX = x + pick(rng, [1, -1, 2, -2] as const)
    const lhsAtWrong = a * wrongX + b
    return {
      title: 'Check before you commit',
      prompt: `Someone solves **${a}x ${sgn(b)} = ${rhs}** and reports **x = ${wrongX}**.\n\nWithout solving it yourself, how can you tell whether they are right?`,
      answer: mcq(
        rng,
        `Substitute ${wrongX}: it gives ${lhsAtWrong}, not ${rhs}, so the answer is wrong`,
        [
          `Substitute ${wrongX}: it gives ${rhs} exactly, so the answer is right`,
          `Re-solve the equation from the start, because substituting cannot detect an error`,
          `Check that ${wrongX} has the same sign as ${rhs}, which is what a correct root requires`,
        ],
      ),
      hints: [
        'A proposed solution is a claim you can test directly, without redoing anyone\'s work.',
        `Put ${wrongX} into the left side and see whether you land on ${rhs}.`,
        `${a}(${wrongX}) ${sgn(b)} = ${lhsAtWrong}, and ${lhsAtWrong} ≠ ${rhs}.`,
      ],
      explanation: `Substituting gives ${a}(${wrongX}) ${sgn(b)} = **${lhsAtWrong}**, but the equation needs ${rhs}. So x = ${wrongX} is wrong — and you established that without solving anything.\n\nThis asymmetry is worth having: CHECKING an answer is nearly always cheaper than finding one. It also matters later, where squaring both sides or clearing denominators can create extraneous solutions that satisfy the rearranged equation but not the original. Substitution into the ORIGINAL is the only test that catches those.`,
    }
  },
)

const inequalityRegion = tpl(
  { id: 'alg-inequality-test', name: 'Test the region', skillIds: ['m-inequal'], bucket: 'math', difficulty: 2, variants: 30, minutes: 2 },
  (rng) => {
    const a = rint(rng, 2, 6)
    const b = rnz(rng, 8)
    const bound = rnz(rng, 6)
    const c = a * bound + b
    const testValue = bound + rint(rng, 1, 4)
    const holds = a * testValue + b > c
    return {
      title: 'Does this value satisfy it?',
      prompt: `Does **x = ${testValue}** satisfy  **${a}x ${sgn(b)} > ${c}** ?`,
      answer: mcq(rng, holds ? `Yes — it gives ${a * testValue + b}, which is greater than ${c}` : `No — it gives ${a * testValue + b}, which is not greater than ${c}`, [
        holds ? `No — it gives ${a * testValue + b}, which is not greater than ${c}` : `Yes — it gives ${a * testValue + b}, which is greater than ${c}`,
        `It cannot be decided without first solving the inequality for x`,
        `Only if ${testValue} is positive, since the direction depends on the sign`,
      ]),
      hints: [
        'You do not need to solve anything — just substitute and compare.',
        `${a}(${testValue}) ${sgn(b)} = ${a * testValue + b}.`,
        `Compare ${a * testValue + b} with ${c}.`,
      ],
      explanation: `${a}(${testValue}) ${sgn(b)} = ${a * testValue + b}, and ${a * testValue + b} ${holds ? '>' : '≤'} ${c}, so the answer is **${holds ? 'yes' : 'no'}**.\n\nTesting a single value is the cheapest tool in algebra. Use it to check a solved inequality too: pick any number from your answer region and confirm it works in the original.`,
    }
  },
)

const ratioEquation = tpl(
  { id: 'alg-proportion-solve', name: 'Solve the proportion', skillIds: ['m-proportion'], bucket: 'math', difficulty: 2, variants: 38, minutes: 2 },
  (rng) => {
    const k = rint(rng, 2, 9)
    const a = rint(rng, 2, 9)
    const b = rint(rng, 2, 9)
    const c = a * k
    const answer = b * k
    return {
      title: 'Scale it up',
      prompt: `Solve for x:  **${a} / ${b} = ${c} / x**`,
      answer: numeric(answer),
      hints: [
        'Find the scale factor between the two numerators before cross-multiplying.',
        `${a} × ${k} = ${c}, so the whole ratio scaled by ${k}.`,
        `${b} × ${k} = **${answer}**.`,
      ],
      explanation: `The numerator scaled from ${a} to ${c}, a factor of ${k}, so the denominator scales the same way: ${b} × ${k} = **${answer}**.\n\nSeeing the scale factor is faster and more meaningful than cross-multiplying — cross-multiplication is that same reasoning compressed into a rule, which is why it works.`,
    }
  },
)

const literalEquation = tpl(
  { id: 'alg-rearrange-formula', name: 'Rearrange the formula', skillIds: ['m-lineqmulti', 'm-model'], bucket: 'math', difficulty: 4, variants: 6, minutes: 2.5 },
  (rng, seed) => {
    const forms = [
      { formula: 'A = ½bh', target: 'h', correct: 'h = 2A / b', wrong: ['h = A / (2b)', 'h = 2A · b', 'h = b / (2A)'] },
      { formula: 'P = 2l + 2w', target: 'w', correct: 'w = (P − 2l) / 2', wrong: ['w = P / 2 − 2l', 'w = (P − l) / 2', 'w = P − 2l'] },
      { formula: 'd = rt', target: 't', correct: 't = d / r', wrong: ['t = r / d', 't = d · r', 't = d − r'] },
      { formula: 'C = 2πr', target: 'r', correct: 'r = C / (2π)', wrong: ['r = 2πC', 'r = C / π − 2', 'r = 2C / π'] },
      { formula: 'y = mx + b', target: 'x', correct: 'x = (y − b) / m', wrong: ['x = y / m − b', 'x = (y − m) / b', 'x = y − b / m'] },
      { formula: 'V = lwh', target: 'h', correct: 'h = V / (lw)', wrong: ['h = V / l · w', 'h = lw / V', 'h = V − lw'] },
    ] as const
    const f = forms[seed % forms.length]
    return {
      title: 'Isolate the letter',
      prompt: `Rearrange **${f.formula}** to make **${f.target}** the subject.`,
      answer: mcq(rng, f.correct, [...f.wrong]),
      hints: [
        'Treat every other letter as if it were a number and undo operations in reverse order.',
        `What is being done to ${f.target}? Undo exactly that, on both sides.`,
        `The result is **${f.correct}**.`,
      ],
      explanation: `**${f.correct}**.\n\nRearranging a formula is the same skill as solving an equation — the only difference is that the "numbers" are letters, so you cannot simplify at the end. Watch the bracket in particular: dividing by a product means dividing by the WHOLE product, which is the difference between the right answer and the tempting one beside it.`,
      commonErrors: {
        representation: 'Dividing by only part of a product, or subtracting a term that was multiplied. Undo the operations in the reverse order they were applied.',
      },
    }
  },
)

const combineNegative = tpl(
  { id: 'alg-distribute-negative', name: 'Distribute the minus', skillIds: ['m-expressions'], bucket: 'math', difficulty: 2, variants: 40, minutes: 2, calibration: true },
  (rng) => {
    const a = rint(rng, 2, 9)
    const b = rint(rng, 2, 9)
    const c = rint(rng, 2, 9)
    const xCo = a - c
    const konst = -b
    const correct = `${xCo}x ${sgn(konst)}`.replace('1x', 'x')
    return {
      title: 'Subtract a whole bracket',
      prompt: `Simplify:  **${a}x − (${c}x + ${b})**`,
      answer: mcq(rng, correct, [
        `${xCo}x + ${b}`,
        `${a - c}x ${sgn(b)}`.replace('1x', 'x') === correct ? `${a + c}x ${sgn(-b)}` : `${a - c}x ${sgn(b)}`,
        `${a - c - b}x`,
      ]),
      hints: [
        'The minus applies to EVERY term inside the bracket, not just the first.',
        `Rewrite it as ${a}x − ${c}x − ${b}.`,
        `That gives **${correct}**.`,
      ],
      explanation: `The subtraction distributes across the whole bracket: ${a}x − ${c}x − ${b} = **${correct}**.\n\nThe classic error is subtracting only the first term and leaving +${b} behind. A reliable habit: rewrite subtraction of a bracket as adding −1 times the bracket, so the sign change is explicit rather than remembered.`,
      commonErrors: {
        slip: `Leaving the constant positive gives ${xCo}x + ${b}. The minus belongs to every term inside.`,
      },
    }
  },
)

const inverseProportion = tpl(
  { id: 'alg-fraction-equation', name: 'Equation with a fraction', skillIds: ['m-lineqmulti'], bucket: 'math', difficulty: 4, variants: 24, minutes: 3 },
  (rng) => {
    const d = rint(rng, 2, 5)
    const x = d * rnz(rng, 4)
    const b = rnz(rng, 8)
    const rhs = x / d + b
    return {
      title: 'Clear the denominator',
      prompt: `Solve for x:  **x/${d} ${sgn(b)} = ${rhs}**`,
      answer: numeric(x),
      hints: [
        'Deal with the added constant first, then the division.',
        `Subtract ${b >= 0 ? b : `(${b})`} from both sides: x/${d} = ${x / d}.`,
        `Multiply both sides by ${d}: x = **${x}**.`,
      ],
      explanation: `Subtracting gives x/${d} = ${x / d}, then multiplying by ${d} gives **x = ${x}**.\n\nOrder matters: multiplying by ${d} first would require multiplying EVERY term, including the ${b} — doable, but a common place to lose a term. Undoing the outermost operation first keeps each step small.`,
    }
  },
)

export const ALGEBRA_DEPTH_TEMPLATES: ItemTemplate[] = [
  substituteSigned,
  oneStepInverse,
  inequalityFlip,
  solutionCount,
  squareOfSum,
  factorableOrNot,
  exponentRules,
  slopeTwoPoints,
  slopeSpecial,
  systemSubstitution,
  functionNotation,
  quadraticFactor,
  growthCompare,
  wordToEquation,
  fractionCoefficient,
  rateFromGraph,
  extraneousCheck,
  inequalityRegion,
  ratioEquation,
  literalEquation,
  combineNegative,
  inverseProportion,
]
