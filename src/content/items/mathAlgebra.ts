/**
 * Math items — algebra, linear relationships, geometry, and mathematical
 * thinking. Answers computed from generated values.
 */
import type { ItemTemplate } from '../../domain/types'
import { pick, rint, rnz } from '../../engine/rng'
import { cycle, fixed, fracStr, mcq, mcqNoted, numeric, round, simplify, tpl} from '../lib'

// ---------------------------------------------------------------- expressions

const exprEval = tpl(
  { id: 'expr-evaluate', name: 'Evaluate an expression', skillIds: ['m-expressions'], bucket: 'math', difficulty: 1, variants: 18, minutes: 1.5 },
  (rng) => {
    const a = rint(rng, 2, 6)
    const b = rint(rng, 1, 9)
    const x = rnz(rng, 5)
    const value = a * x * x + b
    return {
      title: 'Evaluate',
      prompt: `Evaluate **${a}x² + ${b}** when **x = ${x}**.`,
      answer: numeric(value),
      hints: [
        'Substitute carefully — the square applies to x only, including its sign.',
        `x² = (${x})² = ${x * x}.`,
        `Worked path: ${a} × ${x * x} + ${b} = **${value}**.`,
      ],
      explanation: `Substitute x = ${x}: ${a}(${x})² + ${b} = ${a}(${x * x}) + ${b} = **${value}**. Note (${x})² is ${x * x}, ${x < 0 ? 'positive — the square eats the sign' : 'as expected'}.`,
      commonErrors: { slip: x < 0 ? `Getting −${x * x} from (${x})² is the top slip: squaring a negative gives a positive.` : 'Multiplying a×x before squaring changes the value.' },
    }
  },
)

const exprSimplify = tpl(
  { id: 'expr-simplify', name: 'Combine like terms', skillIds: ['m-expressions'], bucket: 'math', difficulty: 2, variants: 16, minutes: 2 },
  (rng) => {
    const a = rint(rng, 2, 7)
    const b = rint(rng, 2, 7)
    const c = rnz(rng, 6)
    const d = rnz(rng, 8)
    const xCo = a + b
    const konst = c + d
    const kStr = (v: number) => (v >= 0 ? `+ ${v}` : `− ${-v}`)
    const correct = konst === 0 ? `${xCo}x` : `${xCo}x ${kStr(konst)}`
    return {
      title: 'Simplify',
      prompt: `Simplify: **${a}x ${kStr(c)} + ${b}x ${kStr(d)}**`,
      answer: mcq(rng, correct, [
        `${xCo + konst}x`,
        `${a * b}x ${kStr(konst)}`,
        `${xCo}x ${kStr(c - d)}`,
        `${xCo + Math.abs(konst)}x`,
      ]),
      hints: [
        'Only like terms combine: x-terms with x-terms, numbers with numbers.',
        `x-terms: ${a}x + ${b}x = ${xCo}x. Constants: ${c} + ${d} = ${konst}.`,
        `Worked path: **${correct}**.`,
      ],
      explanation: `Group like terms: (${a} + ${b})x = ${xCo}x and ${c} + ${d} = ${konst}, giving **${correct}**. An x-term and a constant are different kinds of quantity — they can sit next to each other but never merge.`,
    }
  },
)

const exprTranslate = tpl(
  { id: 'expr-translate', name: 'Words → expression', skillIds: ['m-expressions'], bucket: 'math', difficulty: 2, variants: 4, minutes: 2 },
  (rng) => {
    const n = rint(rng, 2, 9)
    const m = rint(rng, 2, 9)
    const kind = pick(rng, ['less', 'twice-more', 'quotient'] as const)
    const phrase =
      kind === 'less'
        ? `**${n} less than** a number x`
        : kind === 'twice-more'
          ? `**${m} more than twice** a number x`
          : `the **quotient** of a number x **and ${n}**`
    const correct = kind === 'less' ? `x − ${n}` : kind === 'twice-more' ? `2x + ${m}` : `x / ${n}`
    const wrong =
      kind === 'less'
        ? [`${n} − x`, `x + ${n}`, `${n}x`]
        : kind === 'twice-more'
          ? [`2(x + ${m})`, `2x − ${m}`, `${m}x + 2`]
          : [`${n} / x`, `x − ${n}`, `${n}x`]
    return {
      title: 'Translate the phrase',
      prompt: `Which expression means ${phrase}?`,
      answer: mcq(rng, correct, wrong),
      hints: [
        'Test with a concrete number: if x were 10, what would the phrase give?',
        kind === 'less' ? `"${n} less than x" starts from x and removes ${n} — order matters in subtraction.` : kind === 'twice-more' ? 'Build inside-out: "twice a number" first, then the "more than".' : '"Quotient of A and B" means A ÷ B, in that order.',
        `Worked path: **${correct}**.`,
      ],
      explanation: `Check with x = 10: the phrase gives ${kind === 'less' ? 10 - n : kind === 'twice-more' ? 2 * 10 + m : `10/${n}`}, which matches **${correct}**.`,
      commonErrors: { misread: kind === 'less' ? `"${n} less than x" is x − ${n}, not ${n} − x — the reversal is the single most common translation error.` : 'Grouping the wrong part changes the value.' },
    }
  },
)

// ---------------------------------------------------------------- equations

const eq1Solve = tpl(
  { id: 'eq1-solve', name: 'Two-step equations', skillIds: ['m-lineq1'], bucket: 'math', difficulty: 2, variants: 20, minutes: 2 },
  (rng) => {
    const a = rint(rng, 2, 9)
    const x = rnz(rng, 9)
    const b = rnz(rng, 12)
    const c = a * x + b
    const bStr = b >= 0 ? `+ ${b}` : `− ${-b}`
    return {
      title: 'Solve for x',
      prompt: `Solve: **${a}x ${bStr} = ${c}**`,
      answer: numeric(x),
      hints: [
        'Undo the operations in reverse order — what was done to x last?',
        `Subtract ${b >= 0 ? b : `(${b})`} from both sides: ${a}x = ${c - b}.`,
        `Worked path: x = ${c - b} ÷ ${a} = **${x}**.`,
      ],
      explanation: `${a}x ${bStr} = ${c} → ${a}x = ${c - b} → x = **${x}**. Check: ${a}(${x}) ${bStr} = ${c} ✓.`,
      commonErrors: { slip: 'Dividing before moving the constant applies the division to only part of the left side.' },
    }
  },
)

const eq1Check = tpl(
  { id: 'eq1-check', name: 'Which value solves it?', skillIds: ['m-lineq1'], bucket: 'math', difficulty: 1, variants: 14, minutes: 1.5 },
  (rng) => {
    const a = rint(rng, 2, 6)
    const x = rint(rng, -6, 8)
    const b = rnz(rng, 10)
    const c = a * x + b
    const bStr = b >= 0 ? `+ ${b}` : `− ${-b}`
    return {
      title: 'Test the candidates',
      prompt: `Which value of x satisfies **${a}x ${bStr} = ${c}**?`,
      answer: mcq(rng, String(x), [String(x + 1), String(x - 1), String(x + a), String(-x === x ? x + 2 : -x)]),
      hints: [
        'You do not have to solve — substitute each candidate and check.',
        `Try one: does ${a}(candidate) ${bStr} equal ${c}?`,
        `Worked path: ${a}(${x}) ${bStr} = ${c} ✓ so x = **${x}**.`,
      ],
      explanation: `Substituting ${x}: ${a}×${x} ${bStr} = ${a * x} ${bStr} = ${c} ✓. Checking a solution is itself a skill — it catches slips for free.`,
    }
  },
)

const eqmBoth = tpl(
  { id: 'eqm-bothsides', name: 'Variables on both sides', skillIds: ['m-lineqmulti'], bucket: 'math', difficulty: 2, variants: 18, minutes: 2.5 },
  (rng) => {
    const x = rnz(rng, 8)
    const a = rint(rng, 3, 9)
    const cco = rint(rng, 2, a - 1)
    const b = rnz(rng, 10)
    const d = (a - cco) * x + b
    const dStr = d >= 0 ? `+ ${d}` : `− ${-d}`
    const bStr = b >= 0 ? `+ ${b}` : `− ${-b}`
    return {
      title: 'Solve for x',
      prompt: `Solve: **${a}x ${bStr} = ${cco}x ${dStr}**`,
      answer: numeric(x),
      hints: [
        'Collect the x-terms on one side first.',
        `Subtract ${cco}x from both sides: ${a - cco}x ${bStr} = ${d}.`,
        `Worked path: ${a - cco}x = ${d - b} → x = **${x}**.`,
      ],
      explanation: `Move ${cco}x left: ${a - cco}x ${bStr} = ${d}. Move ${b}: ${a - cco}x = ${d - b}. Divide: x = **${x}**. Check by substituting into BOTH sides: each gives ${a * x + b}.`,
    }
  },
)

const eqmDistribute = tpl(
  { id: 'eqm-distribute', name: 'Distribute, then solve', skillIds: ['m-lineqmulti'], bucket: 'math', difficulty: 3, variants: 14, minutes: 3 },
  (rng) => {
    const a = rint(rng, 2, 5)
    const b = rnz(rng, 6)
    const x = rnz(rng, 7)
    const c = a * (x + b)
    const bStr = b >= 0 ? `+ ${b}` : `− ${-b}`
    return {
      title: 'Solve for x',
      prompt: `Solve: **${a}(x ${bStr}) = ${c}**`,
      answer: numeric(x),
      hints: [
        'Two valid starts: distribute the multiplier, or divide both sides by it.',
        `Dividing first is cleaner here: x ${bStr} = ${c / a}.`,
        `Worked path: x = ${c / a} − ${b >= 0 ? b : `(${b})`} = **${x}**.`,
      ],
      explanation: `Divide both sides by ${a}: x ${bStr} = ${c / a}, so x = **${x}**. Distributing first (${a}x ${b >= 0 ? `+ ${a * b}` : `− ${-a * b}`} = ${c}) reaches the same place with one more step.`,
      commonErrors: { slip: `Distributing to the x but not the ${b >= 0 ? b : -b} is the classic distribution slip.` },
    }
  },
)

const eqmFractions = tpl(
  { id: 'eqm-fractions', name: 'Fraction coefficients', skillIds: ['m-lineqmulti'], bucket: 'math', difficulty: 3, variants: 14, minutes: 3, calibration: true },
  (rng) => {
    const d = pick(rng, [2, 3, 4, 5])
    const n = rint(rng, 1, d - 1)
    const x = d * rint(rng, 1, 6) * (rng() < 0.3 ? -1 : 1)
    const b = rnz(rng, 8)
    const c = (n * x) / d + b
    const bStr = b >= 0 ? `+ ${b}` : `− ${-b}`
    return {
      title: 'Solve for x',
      prompt: `Solve: **(${n}/${d})x ${bStr} = ${c}**`,
      answer: numeric(x),
      hints: [
        'A fraction coefficient undoes with its reciprocal.',
        `First isolate the x-term: (${n}/${d})x = ${c - b}.`,
        `Worked path: x = ${c - b} × ${d}/${n} = **${x}**.`,
      ],
      explanation: `(${n}/${d})x = ${c - b}; multiply both sides by ${d}/${n}: x = ${c - b} × ${d}/${n} = **${x}**.`,
    }
  },
)

const ineqSolve = tpl(
  { id: 'ineq-solve', name: 'Solve an inequality', skillIds: ['m-inequal'], bucket: 'math', difficulty: 2, variants: 16, minutes: 2 },
  (rng) => {
    const neg = rng() < 0.5
    const a = (neg ? -1 : 1) * rint(rng, 2, 6)
    const x = rint(rng, -5, 7)
    const b = rnz(rng, 9)
    const c = a * x + b
    const dir = pick(rng, ['<', '>'] as const)
    const resultDir = neg ? (dir === '<' ? '>' : '<') : dir
    const correct = `x ${resultDir} ${x}`
    const bStr = b >= 0 ? `+ ${b}` : `− ${-b}`
    const noted = mcqNoted(rng, correct, [
      [`x ${resultDir === '<' ? '>' : '<'} ${x}`, neg ? 'The forgotten flip — dividing by a negative reverses the direction (multiply 2 < 3 by −1: −2 > −3).' : 'The phantom flip — the direction only reverses for NEGATIVE multipliers, and this divisor is positive.', 'concept'],
      [`x ${resultDir} ${x + (a > 0 ? b : -b)}`, 'The constant never moved — solve the inequality exactly like the equation first, sign logic second.', 'incomplete'],
      [`x ${resultDir === '<' ? '>' : '<'} ${-x === x ? x + 1 : -x}`, 'Sign confusion on the value itself — the flip changes the DIRECTION symbol, never the number.', 'slip'],
    ])
    return {
      title: 'Solve the inequality',
      prompt: `Solve: **${a}x ${bStr} ${dir} ${c}**`,
      answer: noted.answer,
      distractorNotes: noted.distractorNotes,
      distractorTags: noted.distractorTags,
      hints: [
        'Solve like an equation — but watch what division does to the direction.',
        `${a}x ${dir} ${c - b}. Now divide by ${a}${neg ? ' — a NEGATIVE' : ''}.`,
        `Worked path: **${correct}**${neg ? ' (the direction flipped because dividing by a negative reverses order)' : ''}.`,
      ],
      explanation: `${a}x ${dir} ${c - b} → dividing by ${a} gives **${correct}**. ${neg ? `Dividing by a negative flips the direction: if −2x < 6 then x > −3 (test x = 0: −0 < 6 ✓).` : 'Positive divisor: direction unchanged.'} Sanity-check with one value from your answer region.`,
      commonErrors: { concept: neg ? 'Forgetting the flip when dividing by a negative is THE inequality error. Multiplying both sides of 2 < 3 by −1 gives −2 > −3.' : 'Flipping when you should not is as wrong as not flipping when you should.' },
    }
  },
)

const wordSetup = tpl(
  { id: 'word-setup', name: 'Choose the equation', skillIds: ['m-wordeq'], bucket: 'math', difficulty: 2, variants: 12, minutes: 2.5 },
  (rng) => {
    const fee = rint(rng, 3, 9)
    const per = rint(rng, 2, 6)
    const total = fee + per * rint(rng, 4, 12)
    const correct = `${fee} + ${per}x = ${total}`
    return {
      title: 'Model the situation',
      prompt: `A skate rental costs a **$${fee}** flat fee plus **$${per} per hour**. You spent **$${total}** total. Which equation finds the hours x?`,
      answer: mcq(rng, correct, [
        `${per} + ${fee}x = ${total}`,
        `${fee}x + ${per}x = ${total}`,
        `${per}x − ${fee} = ${total}`,
      ]),
      hints: [
        'Which cost happens once, and which repeats per hour?',
        `The flat fee is paid once; the ${per} multiplies the hours.`,
        `Worked path: **${correct}**.`,
      ],
      explanation: `Total = one-time fee + rate × hours: **${correct}**. (Solving it: x = ${(total - fee) / per} hours.) Swapping the roles of ${fee} and ${per} produces a model where the FEE grows hourly — reread which number repeats.`,
      commonErrors: { representation: 'Attaching x to the wrong coefficient is a representation error, not an algebra error — the equation was wrong before any solving began.' },
    }
  },
)

const wordSolve = tpl(
  { id: 'word-solve', name: 'Number relationships', skillIds: ['m-wordeq'], bucket: 'math', difficulty: 3, variants: 12, minutes: 3, transfer: true },
  (rng) => {
    const n = rint(rng, 5, 30)
    const kind = pick(rng, ['consecutive', 'age'] as const)
    if (kind === 'consecutive') {
      const sum = 3 * n + 3
      return {
        title: 'Consecutive integers',
        prompt: `Three **consecutive integers** add to **${sum}**. What is the **smallest** of the three?`,
        answer: numeric(n),
        hints: [
          'Call the smallest x — what are the other two in terms of x?',
          `x + (x + 1) + (x + 2) = ${sum}.`,
          `Worked path: 3x + 3 = ${sum} → x = **${n}**.`,
        ],
        explanation: `Let the smallest be x: x + (x+1) + (x+2) = 3x + 3 = ${sum}, so x = **${n}** (the integers are ${n}, ${n + 1}, ${n + 2}).`,
      }
    }
    const diff = rint(rng, 2, 6)
    const young = n
    const old = n * diff
    const sum = young + old
    return {
      title: 'Age puzzle',
      prompt: `Maya is **${diff} times** as old as her brother. Their ages add to **${sum}**. How old is her **brother**?`,
      answer: numeric(young),
      hints: [
        'Let the brother be x. Express Maya in terms of x.',
        `x + ${diff}x = ${sum}.`,
        `Worked path: ${diff + 1}x = ${sum} → x = **${young}**.`,
      ],
      explanation: `Brother = x, Maya = ${diff}x: x + ${diff}x = ${diff + 1}x = ${sum}, so x = **${young}** (Maya is ${old}).`,
    }
  },
)

// ---------------------------------------------------------------- coordinate & linear

const coordQuadrant = tpl(
  { id: 'coord-quadrant', name: 'Quadrants & axes', skillIds: ['m-coord'], bucket: 'math', difficulty: 1, variants: 14, minutes: 1 },
  (rng) => {
    const x = rnz(rng, 8)
    const y = rnz(rng, 8)
    const q = x > 0 && y > 0 ? 'Quadrant I' : x < 0 && y > 0 ? 'Quadrant II' : x < 0 && y < 0 ? 'Quadrant III' : 'Quadrant IV'
    return {
      title: 'Locate the point',
      prompt: `In which quadrant is the point **(${x}, ${y})**?`,
      answer: mcq(rng, q, ['Quadrant I', 'Quadrant II', 'Quadrant III', 'Quadrant IV'].filter((o) => o !== q)),
      hints: [
        'First coordinate: left/right. Second: down/up.',
        `x = ${x} means ${x > 0 ? 'right' : 'left'} of the y-axis; y = ${y} means ${y > 0 ? 'above' : 'below'} the x-axis.`,
        `Worked path: **${q}** (quadrants count counterclockwise from top-right).`,
      ],
      explanation: `(${x}, ${y}) sits ${x > 0 ? 'right' : 'left'} and ${y > 0 ? 'up' : 'down'} → **${q}**.`,
    }
  },
)

const coordDistance = tpl(
  { id: 'coord-distance', name: 'Distance on the grid', skillIds: ['m-coord'], bucket: 'math', difficulty: 2, variants: 12, minutes: 2 },
  (rng) => {
    const x1 = rint(rng, -8, 3)
    const y = rint(rng, -6, 6)
    const dist = rint(rng, 3, 12)
    const vertical = rng() < 0.5
    const p1 = vertical ? `(${y}, ${x1})` : `(${x1}, ${y})`
    const p2 = vertical ? `(${y}, ${x1 + dist})` : `(${x1 + dist}, ${y})`
    return {
      title: 'Distance between points',
      prompt: `How far apart are **${p1}** and **${p2}**?`,
      answer: numeric(dist),
      hints: [
        'These points share a coordinate — the distance runs along one axis.',
        `Only the ${vertical ? 'y' : 'x'}-coordinates differ: from ${x1} to ${x1 + dist}.`,
        `Worked path: |${x1 + dist} − ${x1}| = **${dist}**.`,
      ],
      explanation: `Same ${vertical ? 'x' : 'y'}-coordinate, so subtract the differing ones: |${x1 + dist} − (${x1})| = **${dist}**. (Distance is always positive — absolute value handles the direction.)`,
    }
  },
)

const slopeTwoPoints = tpl(
  { id: 'slope-two-points', name: 'Slope from two points', skillIds: ['m-linear'], bucket: 'math', difficulty: 2, variants: 18, minutes: 2.5 },
  (rng) => {
    const x1 = rint(rng, -5, 3)
    const y1 = rint(rng, -5, 5)
    const dx = rint(rng, 1, 6)
    const sn = rnz(rng, 4)
    const sd = rint(rng, 1, 3)
    const x2 = x1 + dx * sd
    const y2 = y1 + dx * sn
    const [rn, rd] = simplify(dx * sn, dx * sd)
    return {
      title: 'Find the slope',
      prompt: `Find the slope of the line through **(${x1}, ${y1})** and **(${x2}, ${y2})**. (Fractions like -3/2 are fine.)`,
      answer: numeric(rn / rd, { tolerance: 0.001 }),
      hints: [
        'Slope = rise over run = change in y over change in x.',
        `Rise: ${y2} − (${y1}) = ${y2 - y1}. Run: ${x2} − (${x1}) = ${x2 - x1}.`,
        `Worked path: ${y2 - y1}/${x2 - x1} = **${fracStr(rn, rd)}**.`,
      ],
      explanation: `m = (y₂ − y₁)/(x₂ − x₁) = (${y2} − ${y1})/(${x2} − ${x1}) = ${y2 - y1}/${x2 - x1} = **${fracStr(rn, rd)}**. Subtract in the SAME order top and bottom.`,
      commonErrors: { slip: 'Mixing the subtraction order (y₂−y₁ over x₁−x₂) negates the slope.' },
    }
  },
)

const slopeTable = tpl(
  { id: 'slope-table', name: 'Rate from a table', skillIds: ['m-linear'], bucket: 'math', difficulty: 2, variants: 10, minutes: 2 },
  (rng) => {
    const m = rnz(rng, 6)
    const b = rint(rng, -5, 10)
    const xs = [0, 1, 2, 3]
    const table = `| x | y |\n| --- | --- |\n${xs.map((x) => `| ${x} | ${m * x + b} |`).join('\n')}`
    return {
      title: 'Rate of change',
      prompt: `This table is linear:\n\n${table}\n\nWhat is the **rate of change** (slope)?`,
      answer: numeric(m),
      hints: [
        'How much does y move each time x increases by 1?',
        `From x=0 to x=1: y goes ${b} → ${m + b}.`,
        `Worked path: change = ${m + b} − ${b} = **${m}** per step.`,
      ],
      explanation: `Each +1 in x changes y by ${m}: slope = **${m}**. (The value at x = 0, ${b}, is the intercept — a different number with a different job.)`,
    }
  },
)

const linfuncInterpret = tpl(
  { id: 'linfunc-interpret', name: 'Interpret y = mx + b', skillIds: ['m-linfunc'], bucket: 'math', difficulty: 2, variants: 12, minutes: 2 },
  (rng) => {
    const m = rint(rng, 2, 9)
    const b = rint(rng, 5, 40)
    const correct = `Each month adds $${m}; the jar started with $${b}`
    return {
      title: 'Read the model',
      prompt: `A savings jar follows **y = ${m}x + ${b}**, where x is months and y is dollars. What do ${m} and ${b} mean?`,
      answer: mcq(rng, correct, [
        `Each month adds $${b}; the jar started with $${m}`,
        `The jar always holds $${m + b}`,
        `Each month the jar doubles, starting from $${b}`,
      ]),
      hints: [
        'Which number multiplies the months? That one repeats.',
        `At x = 0 (no months yet), y = ${b}. At each new month, y grows by ${m}.`,
        `Worked path: **${correct}**.`,
      ],
      explanation: `The coefficient of x is the per-month change ($${m}/month); the constant is the starting amount at x = 0 ($${b}). Slope = rate, intercept = starting value — the two roles never swap.`,
    }
  },
)

const linfuncSolve = tpl(
  { id: 'linfunc-solve', name: 'Use a linear model', skillIds: ['m-linfunc'], bucket: 'math', difficulty: 2, variants: 16, minutes: 2 },
  (rng) => {
    const m = rint(rng, 3, 12)
    const b = rint(rng, 10, 60)
    const x = rint(rng, 4, 15)
    const forward = rng() < 0.5
    const y = m * x + b
    return {
      title: 'Work the model',
      prompt: forward
        ? `A phone plan costs **y = ${m}x + ${b}** dollars for x GB of data. How much does **${x} GB** cost?`
        : `A phone plan costs **y = ${m}x + ${b}** dollars for x GB. Your bill was **$${y}**. How many GB did you use?`,
      answer: numeric(forward ? y : x),
      hints: [
        forward ? 'Substitute the known x.' : 'Substitute the known y, then solve for x.',
        forward ? `y = ${m}(${x}) + ${b}.` : `${y} = ${m}x + ${b} → ${y - b} = ${m}x.`,
        `Worked path: **${forward ? y : x}**.`,
      ],
      explanation: forward
        ? `y = ${m}×${x} + ${b} = ${m * x} + ${b} = **$${y}**.`
        : `${y} = ${m}x + ${b} → x = (${y} − ${b})/${m} = **${x} GB**. Forward = plug in x; backward = solve for x.`,
    }
  },
)

const sysSolve = tpl(
  { id: 'sys-solve', name: 'Solve a system', skillIds: ['m-systems'], bucket: 'math', difficulty: 3, variants: 16, minutes: 3.5 },
  (rng) => {
    const x = rnz(rng, 6)
    const y = rnz(rng, 6)
    const a = rint(rng, 1, 3)
    const b = rint(rng, 1, 3)
    const c = a * x + b * y
    const d = x - y
    return {
      title: 'Solve the system',
      prompt: `Solve for **x**:\n\n**${a === 1 ? '' : a}x + ${b === 1 ? '' : b}y = ${c}**\n**x − y = ${d}**`,
      answer: numeric(x),
      hints: [
        'The second equation hands you a substitution: x = y + ' + d + '.',
        `Substitute into the first: ${a}(y + ${d}) + ${b}y = ${c}.`,
        `Worked path: ${a + b}y = ${c - a * d} → y = ${y}, then x = **${x}**.`,
      ],
      explanation: `From the second equation x = y ${d >= 0 ? `+ ${d}` : `− ${-d}`}. Substituting: ${a}(y ${d >= 0 ? `+ ${d}` : `− ${-d}`}) + ${b}y = ${c} → ${a + b}y = ${c - a * d} → y = ${y}, so x = **${x}**. A solution means BOTH equations are true at once — check it in both.`,
    }
  },
)

const sysWord = tpl(
  { id: 'sys-word', name: 'System from a story', skillIds: ['m-systems'], bucket: 'math', difficulty: 4, variants: 12, minutes: 4, transfer: true, calibration: true },
  (rng) => {
    const adult = rint(rng, 8, 15)
    const child = rint(rng, 4, adult - 2)
    const nA = rint(rng, 3, 9)
    const nC = rint(rng, 3, 9)
    const people = nA + nC
    const totalCost = adult * nA + child * nC
    return {
      title: 'Ticket counts',
      prompt: `Adult tickets cost **$${adult}** and child tickets **$${child}**. A group of **${people}** people paid **$${totalCost}** total. How many **adult** tickets were bought?`,
      answer: numeric(nA),
      hints: [
        'Two unknowns need two facts: the head count and the money count.',
        `a + c = ${people} and ${adult}a + ${child}c = ${totalCost}.`,
        `Worked path: substitute c = ${people} − a → ${adult - child}a = ${totalCost - child * people} → a = **${nA}**.`,
      ],
      explanation: `Let a = adults, c = children. a + c = ${people}; ${adult}a + ${child}c = ${totalCost}. Substitute c = ${people} − a: ${adult}a + ${child}(${people} − a) = ${totalCost} → ${adult - child}a = ${totalCost - child * people} → a = **${nA}** (c = ${nC}). Check: $${adult * nA} + $${child * nC} = $${totalCost} ✓.`,
    }
  },
)

const funcEval = tpl(
  { id: 'func-eval', name: 'Evaluate f(x)', skillIds: ['m-functions'], bucket: 'math', difficulty: 1, variants: 16, minutes: 1.5 },
  (rng) => {
    const a = rint(rng, 2, 6)
    const b = rnz(rng, 9)
    const x = rnz(rng, 6)
    const bStr = b >= 0 ? `+ ${b}` : `− ${-b}`
    return {
      title: 'Function notation',
      prompt: `If **f(x) = ${a}x ${bStr}**, find **f(${x})**.`,
      answer: numeric(a * x + b),
      hints: [
        'f(x) is not multiplication — it means "the output when the input is x".',
        `Replace every x with ${x}: f(${x}) = ${a}(${x}) ${bStr}.`,
        `Worked path: ${a * x} ${bStr} = **${a * x + b}**.`,
      ],
      explanation: `f(${x}) = ${a}(${x}) ${bStr} = **${a * x + b}** — the notation names an input-output rule.`,
    }
  },
)

const funcConcept = tpl(
  { id: 'func-concept', name: 'What makes a function', skillIds: ['m-functions'], bucket: 'math', difficulty: 2, variants: 4, minutes: 2 },
  (rng) => {
    const x = rint(rng, 2, 7)
    const correct = `Each input has exactly one output`
    return {
      title: 'Function or not?',
      prompt: `The pairs **(1, 4), (2, 7), (${x}, 5), (${x}, 9)** are NOT a function. Why?`,
      answer: mcq(rng, `The input ${x} maps to two different outputs`, [
        'The outputs are not in order',
        `The output 5 appears with a different input than 9`,
        'Functions cannot repeat any numbers at all',
      ]),
      hints: [
        correct + ' — check each input.',
        `The input ${x} appears twice. What outputs does it claim?`,
        `Worked path: ${x} → 5 and ${x} → 9 breaks the one-output rule.`,
      ],
      explanation: `A function must give ONE output per input. Input ${x} maps to both 5 and 9, so this relation is not a function. (Two different inputs sharing an output is fine — that happens in y = x² all the time.)`,
    }
  },
)

// ---------------------------------------------------------------- polynomials & quadratics

const polyMultiply = tpl(
  { id: 'poly-multiply', name: 'Multiply binomials', skillIds: ['m-polys'], bucket: 'math', difficulty: 2, variants: 16, minutes: 2.5 },
  (rng) => {
    const a = rnz(rng, 6)
    const b = rnz(rng, 6)
    const sum = a + b
    const prod = a * b
    const term = (v: number, suffix: string) => (v === 0 ? '' : `${v > 0 ? '+ ' : '− '}${Math.abs(v) === 1 && suffix ? '' : Math.abs(v)}${suffix} `)
    const correct = `x² ${term(sum, 'x')}${term(prod, '')}`.trim().replace(/^\+ /, '')
    const wrong1 = `x² ${term(prod, 'x')}${term(sum, '')}`.trim()
    const wrong2 = `x² ${term(a * b, '')}`.trim()
    const wrong3 = `x² ${term(sum, 'x')}${term(-prod, '')}`.trim()
    const aStr = a >= 0 ? `+ ${a}` : `− ${-a}`
    const bStr = b >= 0 ? `+ ${b}` : `− ${-b}`
    const noted = mcqNoted(rng, correct, [
      [wrong1, 'Sum and product swapped — the MIDDLE term carries the sum of the constants; the LAST carries their product.', 'concept'],
      [wrong2, 'The missing middle — x·(inner) and (outer)·x were skipped; every term must multiply every term.', 'incomplete'],
      [wrong3, 'Sign slip on the product — multiply the constants WITH their signs.', 'slip'],
    ])
    return {
      title: 'Expand',
      prompt: `Expand: **(x ${aStr})(x ${bStr})**`,
      answer: noted.answer,
      distractorNotes: noted.distractorNotes,
      distractorTags: noted.distractorTags,
      hints: [
        'Every term in the first factor multiplies every term in the second.',
        `Four products: x·x, x·(${b}), (${a})·x, (${a})(${b}).`,
        `Worked path: x² + ${sum}x + ${prod} → **${correct}**.`.replace('+ -', '− '),
      ],
      explanation: `x·x = x²; outer + inner: ${b}x + ${a}x = ${sum}x; last: (${a})(${b}) = ${prod}. Result: **${correct}**. The middle term is the SUM ${a} + ${b}; the last is the PRODUCT.`,
    }
  },
)

const polyFactor = tpl(
  { id: 'poly-factor', name: 'Factor a quadratic', skillIds: ['m-polys'], bucket: 'math', difficulty: 3, variants: 16, minutes: 3 },
  (rng) => {
    const p = rnz(rng, 6)
    let q = rnz(rng, 6)
    if (q === -p) q = q + 1 === 0 ? q + 2 : q + 1 // avoid b=0 for readability
    const b = p + q
    const c = p * q
    const s = (v: number) => (v >= 0 ? `+ ${v}` : `− ${-v}`)
    const correct = `(x ${s(p)})(x ${s(q)})`
    const alt = `(x ${s(-p)})(x ${s(-q)})`
    return {
      title: 'Factor',
      prompt: `Factor: **x² ${b === 0 ? '' : `${s(b)}x `}${s(c)}**`,
      answer: mcq(rng, correct, [alt, `(x ${s(p)})(x ${s(-q)})`, `(x ${s(-p)})(x ${s(q)})`]),
      hints: [
        `Look for two numbers that MULTIPLY to ${c} and ADD to ${b}.`,
        `Factor pairs of ${c}: walk them and check the sums.`,
        `Worked path: ${p} and ${q} work (product ${c}, sum ${b}) → **${correct}**.`,
      ],
      explanation: `Need product ${c} and sum ${b}: that is ${p} and ${q}. So x² ${b === 0 ? '' : `${s(b)}x `}${s(c)} = **${correct}**. Verify by expanding — factoring is just expansion run backward.`,
    }
  },
)

const quadSqrt = tpl(
  { id: 'quad-sqrt', name: 'Solve x² = k', skillIds: ['m-quadratic'], bucket: 'math', difficulty: 2, variants: 11, minutes: 2 },
  (_rng, seed) => {
    // Enumerated: sampling from eleven values collapsed to three forms.
    const r = 2 + (seed % 11)
    return {
      title: 'Square-root solving',
      prompt: `Solve **x² = ${r * r}**. Enter the **positive** solution. (How many solutions are there in total?)`,
      answer: numeric(r),
      hints: [
        'Undo squaring with a square root — but count the solutions.',
        `Both ${r}² and (−${r})² equal ${r * r}.`,
        `Worked path: x = ±${r}; positive solution **${r}**.`,
      ],
      explanation: `x = ±√${r * r} = ±${r} — TWO solutions, because squaring destroys sign information. The positive one is **${r}**.`,
      commonErrors: { incomplete: 'Reporting only +√k silently loses half the solution set; this prompt asks for the positive one but the full answer is ±.' },
    }
  },
)

const quadFactorSolve = tpl(
  { id: 'quad-solve-factored', name: 'Solve by factoring', skillIds: ['m-quadratic'], bucket: 'math', difficulty: 3, variants: 12, minutes: 3, transfer: true },
  (rng) => {
    const p = rint(rng, 1, 7)
    let q = rint(rng, 1, 7) * -1
    if (-q === p) q = q - 1
    const b = p + q
    const c = p * q
    const s = (v: number) => (v >= 0 ? `+ ${v}` : `− ${-v}`)
    const larger = Math.max(-p, -q)
    return {
      title: 'Zero-product solving',
      prompt: `Solve **x² ${b === 0 ? '' : `${s(b)}x `}${s(c)} = 0**. Enter the **larger** solution.`,
      answer: numeric(larger),
      hints: [
        'Factor first; a product is zero only when a factor is zero.',
        `Two numbers with product ${c} and sum ${b}: ${p} and ${q}.`,
        `Worked path: (x ${s(p)})(x ${s(q)}) = 0 → x = ${-p} or ${-q}; larger = **${larger}**.`,
      ],
      explanation: `Factor: (x ${s(p)})(x ${s(q)}) = 0. Zero-product property: x = ${-p} or x = ${-q}. The larger is **${larger}**. (The zero-product step is WHY we set quadratics equal to 0 before factoring.)`,
    }
  },
)

// ---------------------------------------------------------------- geometry

const anglePairs = tpl(
  { id: 'angle-pairs', name: 'Angle pairs', skillIds: ['m-angles'], bucket: 'math', difficulty: 1, variants: 16, minutes: 1.5 },
  (rng) => {
    const kind = pick(rng, ['supplementary', 'complementary', 'vertical'] as const)
    const a = kind === 'complementary' ? rint(rng, 15, 75) : rint(rng, 25, 155)
    const ans = kind === 'supplementary' ? 180 - a : kind === 'complementary' ? 90 - a : a
    return {
      title: 'Angle relationships',
      prompt:
        kind === 'vertical'
          ? `Two lines cross. One angle measures **${a}°**. What is the measure of the angle **directly across** (vertical) from it, in degrees?`
          : `Two angles are **${kind}**. One measures **${a}°**. What is the other, in degrees?`,
      answer: numeric(ans),
      hints: [
        kind === 'supplementary' ? 'Supplementary angles form a straight line.' : kind === 'complementary' ? 'Complementary angles form a right angle.' : 'Vertical angles are mirror images across the crossing point.',
        kind === 'vertical' ? 'Vertical angles are always equal.' : `They sum to ${kind === 'supplementary' ? 180 : 90}°.`,
        `Worked path: **${ans}°**.`,
      ],
      explanation:
        kind === 'vertical'
          ? `Vertical angles are congruent: **${ans}°**. (Each is supplementary to the same neighbor, so they must match.)`
          : `${kind === 'supplementary' ? 'A straight line holds 180°' : 'A right angle holds 90°'}, so the partner is ${kind === 'supplementary' ? 180 : 90} − ${a} = **${ans}°**. The names just tag which total you subtract from.`,
    }
  },
)

const angleTriangle = tpl(
  { id: 'angle-triangle', name: 'Triangle angle sum', skillIds: ['m-angles'], bucket: 'math', difficulty: 2, variants: 16, minutes: 2 },
  (rng) => {
    const a = rint(rng, 25, 85)
    const b = rint(rng, 25, Math.min(85, 170 - a - 10))
    const c = 180 - a - b
    return {
      title: 'Missing angle',
      prompt: `A triangle has angles **${a}°** and **${b}°**. Find the third angle, in degrees.`,
      answer: numeric(c),
      hints: [
        'The three angles of any triangle have a fixed total.',
        `They sum to 180°: third = 180 − ${a} − ${b}.`,
        `Worked path: **${c}°**.`,
      ],
      explanation: `180 − ${a} − ${b} = **${c}°**. (Why 180? Tear the corners off a paper triangle and they line up along a straight edge.)`,
    }
  },
)

const angleParallel = tpl(
  { id: 'angle-parallel', name: 'Parallel lines & transversal', skillIds: ['m-angles'], bucket: 'math', difficulty: 3, variants: 12, minutes: 2.5 },
  (rng) => {
    const a = rint(rng, 40, 140)
    const rel = pick(rng, ['alternate interior', 'corresponding', 'co-interior'] as const)
    const ans = rel === 'co-interior' ? 180 - a : a
    return {
      title: 'Transversal angles',
      prompt: `A transversal crosses two **parallel** lines. One angle is **${a}°**. What is its **${rel}** angle, in degrees?`,
      answer: numeric(ans),
      hints: [
        'Parallel lines make the transversal cross at identical tilts.',
        rel === 'co-interior' ? 'Co-interior (same-side interior) angles are supplementary.' : `${rel[0].toUpperCase() + rel.slice(1)} angles are equal.`,
        `Worked path: **${ans}°**.`,
      ],
      explanation:
        rel === 'co-interior'
          ? `Co-interior angles sum to 180°: 180 − ${a} = **${ans}°**.`
          : `${rel[0].toUpperCase() + rel.slice(1)} angles are congruent when lines are parallel: **${ans}°**. (All eight angles at the two crossings are just ${a}° and ${180 - a}° repeating.)`,
    }
  },
)

const PYTH_TRIPLES: [number, number, number][] = [
  [3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20], [7, 24, 25], [20, 21, 29], [9, 40, 41], [12, 35, 37],
]

const pythHypotenuse = tpl(
  { id: 'pyth-hypotenuse', name: 'Find the hypotenuse', skillIds: ['m-triangles'], bucket: 'math', difficulty: 2, variants: 5, minutes: 2 },
  (rng) => {
    const [a, b, c] = pick(rng, PYTH_TRIPLES)
    return {
      title: 'Hypotenuse',
      prompt: `A right triangle has legs **${a}** and **${b}**. Find the hypotenuse.`,
      answer: numeric(c),
      hints: [
        'The hypotenuse faces the right angle — it is the longest side.',
        `a² + b² = c²: ${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}.`,
        `Worked path: c = √${c * c} = **${c}**.`,
      ],
      explanation: `${a}² + ${b}² = ${a * a + b * b} = ${c}², so the hypotenuse is **${c}**. The theorem only applies to RIGHT triangles, and only the hypotenuse sits alone on its side of the equation.`,
    }
  },
)

const pythLeg = tpl(
  { id: 'pyth-leg', name: 'Find a leg', skillIds: ['m-triangles'], bucket: 'math', difficulty: 3, variants: 5, minutes: 2.5 },
  (rng) => {
    const [a, b, c] = pick(rng, PYTH_TRIPLES)
    return {
      title: 'Missing leg',
      prompt: `A right triangle has hypotenuse **${c}** and one leg **${a}**. Find the other leg.`,
      answer: numeric(b),
      hints: [
        'The hypotenuse is the c in a² + b² = c² — is it given here?',
        `Rearrange: leg² = ${c}² − ${a}² = ${c * c - a * a}.`,
        `Worked path: √${b * b} = **${b}**.`,
      ],
      explanation: `leg² = c² − a² = ${c * c} − ${a * a} = ${b * b}, so the leg is **${b}**.`,
      commonErrors: { strategy: `Adding ${a}² + ${c}² treats the hypotenuse as a leg — the hypotenuse is always the one being squared alone.` },
    }
  },
)

const pythWord = tpl(
  { id: 'pyth-word', name: 'Right triangles in the world', skillIds: ['m-triangles'], bucket: 'math', difficulty: 3, variants: 6, minutes: 3, transfer: true },
  (rng) => {
    const [a, b, c] = pick(rng, PYTH_TRIPLES)
    const kind = pick(rng, ['ladder', 'tv'] as const)
    return kind === 'ladder'
      ? {
          title: 'Ladder reach',
          prompt: `A **${c} m** ladder leans against a wall with its base **${a} m** from the wall. How high up the wall does it reach, in meters?`,
          answer: numeric(b),
          hints: [
            'Sketch it: wall, ground, ladder — where is the right angle?',
            `The ladder is the hypotenuse: height² = ${c}² − ${a}².`,
            `Worked path: √(${c * c} − ${a * a}) = **${b} m**.`,
          ],
          explanation: `Wall ⊥ ground, ladder = hypotenuse ${c}: height = √(${c}² − ${a}²) = √${b * b} = **${b} m**. The modeling step — spotting which length is the hypotenuse — IS the problem.`,
        }
      : {
          title: 'Screen diagonal',
          prompt: `A rectangular screen is **${a}** by **${b}** inches. Screens are advertised by their **diagonal**. What size is this screen, in inches?`,
          answer: numeric(c),
          hints: [
            'The diagonal splits the rectangle into two right triangles.',
            `diagonal² = ${a}² + ${b}².`,
            `Worked path: √${c * c} = **${c}** inches.`,
          ],
          explanation: `The diagonal is the hypotenuse of a ${a}-${b} right triangle: √(${a * a} + ${b * b}) = **${c}″**.`,
        }
  },
)

const transformPoint = tpl(
  { id: 'transform-point', name: 'Transform a point', skillIds: ['m-transform'], bucket: 'math', difficulty: 2, variants: 16, minutes: 2 },
  (rng) => {
    const x = rnz(rng, 7)
    const y = rnz(rng, 7)
    const kind = pick(rng, ['reflect-x', 'reflect-y', 'translate'] as const)
    const dx = rnz(rng, 5)
    const dy = rnz(rng, 5)
    const result =
      kind === 'reflect-x' ? [x, -y] : kind === 'reflect-y' ? [-x, y] : [x + dx, y + dy]
    const desc =
      kind === 'reflect-x'
        ? 'reflected across the **x-axis**'
        : kind === 'reflect-y'
          ? 'reflected across the **y-axis**'
          : `translated **${dx >= 0 ? 'right' : 'left'} ${Math.abs(dx)}** and **${dy >= 0 ? 'up' : 'down'} ${Math.abs(dy)}**`
    const correct = `(${result[0]}, ${result[1]})`
    return {
      title: 'Where does the point land?',
      prompt: `The point **(${x}, ${y})** is ${desc}. Where does it land?`,
      answer: mcq(rng, correct, [
        `(${-result[0]}, ${result[1]})`,
        `(${result[0]}, ${-result[1]})`,
        `(${result[1]}, ${result[0]})`,
      ]),
      hints: [
        kind === 'translate' ? 'Translation slides — add to each coordinate.' : 'Reflection flips the sign of ONE coordinate — which one?',
        kind === 'reflect-x' ? 'Reflecting across the x-axis keeps x, negates y.' : kind === 'reflect-y' ? 'Reflecting across the y-axis negates x, keeps y.' : `x: ${x} ${dx >= 0 ? `+ ${dx}` : `− ${-dx}`}; y: ${y} ${dy >= 0 ? `+ ${dy}` : `− ${-dy}`}.`,
        `Worked path: **${correct}**.`,
      ],
      explanation:
        kind === 'translate'
          ? `Add the shifts: (${x} + ${dx}, ${y} + ${dy}) = **${correct}**.`
          : `Reflection across the ${kind === 'reflect-x' ? 'x-axis negates y' : 'y-axis negates x'}: **${correct}**. (Mnemonic: reflecting across an axis changes the OTHER coordinate.)`,
    }
  },
)

const dilateScale = tpl(
  { id: 'transform-dilate', name: 'Similar figures', skillIds: ['m-transform'], bucket: 'math', difficulty: 2, variants: 12, minutes: 2 },
  (rng) => {
    const small = rint(rng, 3, 9)
    const k = pick(rng, [2, 3, 1.5, 2.5])
    const other = rint(rng, 4, 12)
    const big = round(small * k, 2)
    const ans = round(other * k, 2)
    return {
      title: 'Similar triangles',
      prompt: `Two triangles are **similar**. A side of ${small} in the small one matches a side of **${big}** in the large one. What does a side of **${other}** in the small one match?`,
      answer: numeric(ans),
      hints: [
        'Similarity means ALL sides scale by the same factor.',
        `Scale factor: ${big} ÷ ${small} = ${k}.`,
        `Worked path: ${other} × ${k} = **${ans}**.`,
      ],
      explanation: `Scale factor k = ${big}/${small} = ${k}; the matching side is ${other} × ${k} = **${ans}**. One ratio unlocks every side — that is the power of similarity.`,
    }
  },
)

const areaRectTri = tpl(
  { id: 'area-rect-tri', name: 'Area basics', skillIds: ['m-area'], bucket: 'math', difficulty: 1, variants: 14, minutes: 1.5 },
  (rng) => {
    const b = rint(rng, 4, 14)
    const h = rint(rng, 3, 12)
    const tri = rng() < 0.5
    const ans = tri ? (b * h) / 2 : b * h
    return {
      title: tri ? 'Triangle area' : 'Rectangle area',
      prompt: tri
        ? `A triangle has base **${b}** and height **${h}**. Find its area.`
        : `A rectangle is **${b}** by **${h}**. Find its area.`,
      answer: numeric(ans),
      hints: [
        tri ? 'A triangle is half of a matching rectangle.' : 'Area counts unit squares: rows × columns.',
        tri ? `Rectangle would be ${b} × ${h} = ${b * h}; the triangle is half.` : `${b} rows of ${h} squares.`,
        `Worked path: **${ans}**.`,
      ],
      explanation: tri ? `A = ½ · ${b} · ${h} = **${ans}** — the ½ is there because two copies of the triangle tile a ${b}×${h} rectangle.` : `A = ${b} × ${h} = **${ans}** square units.`,
    }
  },
)

const areaComposite = tpl(
  { id: 'area-composite', name: 'Composite area', skillIds: ['m-area'], bucket: 'math', difficulty: 3, variants: 12, minutes: 3, transfer: true },
  (rng) => {
    const w = rint(rng, 6, 12)
    const h = rint(rng, 5, 10)
    const cutW = rint(rng, 2, w - 3)
    const cutH = rint(rng, 2, h - 2)
    const ans = w * h - cutW * cutH
    return {
      title: 'L-shaped area',
      prompt: `An L-shaped room is a **${w} × ${h}** rectangle with a **${cutW} × ${cutH}** rectangular corner missing. Find its area.`,
      answer: numeric(ans),
      hints: [
        'Two strategies: split the L into two rectangles, or subtract the missing corner.',
        `Subtracting is faster: full rectangle ${w * h}, missing piece ${cutW * cutH}.`,
        `Worked path: ${w * h} − ${cutW * cutH} = **${ans}**.`,
      ],
      explanation: `Whole minus hole: ${w}×${h} − ${cutW}×${cutH} = ${w * h} − ${cutW * cutH} = **${ans}**. (Splitting into two rectangles gives the same total — a good self-check.)`,
    }
  },
)

const perimeterMissing = tpl(
  { id: 'perimeter-missing', name: 'Perimeter reasoning', skillIds: ['m-area'], bucket: 'math', difficulty: 2, variants: 12, minutes: 2 },
  (rng) => {
    const w = rint(rng, 3, 12)
    const perim = 2 * w + 2 * rint(rng, 4, 14)
    const ans = (perim - 2 * w) / 2
    return {
      title: 'Missing side',
      prompt: `A rectangle has perimeter **${perim}** and width **${w}**. Find its length.`,
      answer: numeric(ans),
      hints: [
        'Perimeter = 2 lengths + 2 widths.',
        `${perim} = 2L + 2(${w}) → 2L = ${perim - 2 * w}.`,
        `Worked path: L = **${ans}**.`,
      ],
      explanation: `P = 2L + 2W → L = (P − 2W)/2 = (${perim} − ${2 * w})/2 = **${ans}**.`,
    }
  },
)

const circleC = tpl(
  { id: 'circle-circumference', name: 'Circumference', skillIds: ['m-circles'], bucket: 'math', difficulty: 2, variants: 8, minutes: 2 },
  (rng) => {
    const r = rint(rng, 2, 12)
    const givenDiameter = rng() < 0.5
    const ans = round(2 * Math.PI * r, 1)
    return {
      title: 'Circumference',
      prompt: `A circle has ${givenDiameter ? `**diameter ${2 * r}**` : `**radius ${r}**`}. Find its circumference to **1 decimal place** (use π ≈ 3.14159).`,
      answer: numeric(ans, { tolerance: 0.15 }),
      hints: [
        'C = πd — the circumference is about 3.14 diameters.',
        givenDiameter ? `d = ${2 * r} directly.` : `d = 2r = ${2 * r}.`,
        `Worked path: π × ${2 * r} ≈ **${ans}**.`,
      ],
      explanation: `C = πd = π × ${2 * r} ≈ **${ans}**. π IS the ratio circumference/diameter — that is where the formula comes from, not a coincidence.`,
    }
  },
)

const circleA = tpl(
  { id: 'circle-area', name: 'Circle area', skillIds: ['m-circles'], bucket: 'math', difficulty: 2, variants: 5, minutes: 2 },
  (rng) => {
    const r = rint(rng, 2, 10)
    const ans = round(Math.PI * r * r, 1)
    return {
      title: 'Circle area',
      prompt: `A circle has radius **${r}**. Find its area to **1 decimal place**.`,
      answer: numeric(ans, { tolerance: 0.2 }),
      hints: [
        'A = πr² — squared radius, then π.',
        `r² = ${r * r}.`,
        `Worked path: π × ${r * r} ≈ **${ans}**.`,
      ],
      explanation: `A = πr² = π × ${r * r} ≈ **${ans}**. Sanity check: it should land between the inner square (2r² = ${2 * r * r}) and outer square (4r² = ${4 * r * r}).`,
      commonErrors: { slip: `Using 2r instead of r² computes circumference-flavored numbers; the area formula squares the radius first.` },
    }
  },
)

const volPrism = tpl(
  { id: 'vol-prism', name: 'Prism volume', skillIds: ['m-volume'], bucket: 'math', difficulty: 2, variants: 12, minutes: 2 },
  (rng) => {
    const l = rint(rng, 3, 10)
    const w = rint(rng, 2, 8)
    const h = rint(rng, 2, 9)
    return {
      title: 'Box volume',
      prompt: `A box measures **${l} × ${w} × ${h}** cm. Find its volume, in cm³.`,
      answer: numeric(l * w * h),
      hints: [
        'Volume = layers of unit cubes.',
        `One layer holds ${l} × ${w} = ${l * w} cubes; there are ${h} layers.`,
        `Worked path: ${l * w} × ${h} = **${l * w * h}** cm³.`,
      ],
      explanation: `V = l·w·h = ${l}×${w}×${h} = **${l * w * h} cm³** — base area times height, which is why the same idea works for every prism.`,
    }
  },
)

const volCylinder = tpl(
  { id: 'vol-cylinder', name: 'Cylinder volume', skillIds: ['m-volume'], bucket: 'math', difficulty: 3, variants: 8, minutes: 2.5 },
  (rng) => {
    const r = rint(rng, 2, 6)
    const h = rint(rng, 3, 12)
    const ans = round(Math.PI * r * r * h, 1)
    return {
      title: 'Cylinder volume',
      prompt: `A cylinder has radius **${r}** and height **${h}**. Find its volume to **1 decimal place**.`,
      answer: numeric(ans, { tolerance: 0.5 }),
      hints: [
        'Same prism logic: base area × height.',
        `Base area: πr² = π × ${r * r} ≈ ${round(Math.PI * r * r, 2)}.`,
        `Worked path: × ${h} ≈ **${ans}**.`,
      ],
      explanation: `V = πr²h = π × ${r * r} × ${h} ≈ **${ans}** — a cylinder is a prism with a circular base.`,
    }
  },
)

// ---------------------------------------------------------------- modeling, proof, non-routine

const modelChoose = tpl(
  { id: 'model-choose', name: 'Choose the model', skillIds: ['m-model'], bucket: 'math', difficulty: 3, variants: 4, minutes: 2.5 },
  (rng, seed) => {
    const cases = [
      {
        s: 'A phone battery starts full and loses the same percent of its CURRENT charge every hour.',
        correct: 'Exponential decay', wrong: ['Linear decrease', 'Proportional (through zero)', 'Quadratic'],
        why: 'losing a fraction of the current amount compounds — equal FRACTIONS, not equal amounts.',
      },
      {
        s: 'A pool drains at a steady 40 liters per minute from 5000 liters.',
        correct: 'Linear decrease', wrong: ['Exponential decay', 'Proportional (through zero)', 'Quadratic'],
        why: 'a constant amount per minute is a constant slope.',
      },
      {
        s: 'Total cost of apples at $2.50 per kg, no other fees.',
        correct: 'Proportional (through zero)', wrong: ['Linear with a startup fee', 'Exponential growth', 'Quadratic'],
        why: 'zero kg costs zero dollars, and cost per kg is constant — a line through the origin.',
      },
      {
        s: 'The area covered by a square patio as its side length grows.',
        correct: 'Quadratic', wrong: ['Linear increase', 'Exponential growth', 'Proportional (through zero)'],
        why: 'area scales with the SQUARE of side length.',
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Model selection',
      prompt: `${c.s}\n\nWhich model fits best?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ask: for equal steps of the input, does the output change by equal AMOUNTS, equal FRACTIONS, or something else?',
        'Test two or three concrete steps of the situation.',
        `Worked path: **${c.correct}** — ${c.why}`,
      ],
      explanation: `**${c.correct}**, because ${c.why}`,
    }
  },
)

const modelBudget = tpl(
  { id: 'model-budget', name: 'Build & use a model', skillIds: ['m-model'], bucket: 'math', difficulty: 3, variants: 12, minutes: 3.5, transfer: true },
  (rng) => {
    const save = rint(rng, 5, 20)
    const start = rint(rng, 10, 60)
    const goal = start + save * rint(rng, 5, 14)
    const weeks = (goal - start) / save
    return {
      title: 'Savings plan',
      prompt: `You have **$${start}** and save **$${save} per week** toward a **$${goal}** goal. How many weeks until you reach it?`,
      answer: numeric(weeks),
      hints: [
        'Write the model first: money after w weeks = ?',
        `${start} + ${save}w = ${goal}.`,
        `Worked path: w = (${goal} − ${start})/${save} = **${weeks}**.`,
      ],
      explanation: `Model: ${start} + ${save}w = ${goal} → w = ${goal - start}/${save} = **${weeks} weeks**. Check the model's edges: at w = 0 you have $${start} ✓.`,
    }
  },
)

const proofCounterexample = tpl(
  { id: 'proof-counterexample', name: 'Find the counterexample', skillIds: ['m-proof'], bucket: 'math', difficulty: 3, variants: 4, minutes: 2.5, calibration: true },
  (rng, seed) => {
    const claims = [
      // Every option carries the same parallel clause. When only the correct
      // option spells out its consequence, its length gives it away and the
      // item stops testing anything (see the option-balance audit rule).
      {
        claim: '"Doubling a number always makes it larger."',
        correct: 'x = −3 (doubling gives −6, which is smaller)',
        wrong: [
          'x = 5 (doubling gives 10, which is larger)',
          'x = 100 (doubling gives 200, which is larger)',
          'x = 1/2 (doubling gives 1, which is larger)',
        ],
        why: 'negative numbers get MORE negative when doubled; zero stays equal.',
      },
      {
        claim: '"The square of a number is always bigger than the number."',
        correct: 'x = 1/2 (its square is 1/4, which is smaller)',
        wrong: [
          'x = 3 (its square is 9, which is larger)',
          'x = −2 (its square is 4, which is larger)',
          'x = 10 (its square is 100, which is much larger)',
        ],
        why: 'fractions between 0 and 1 shrink when squared (and 1² = 1).',
      },
      {
        claim: '"If a number is divisible by 4, it is divisible by 8."',
        correct: 'x = 12 (divisible by 4 but not by 8)',
        wrong: [
          'x = 16 (divisible by 4 and also by 8)',
          'x = 24 (divisible by 4 and also by 8)',
          'x = 7 (divisible by neither 4 nor by 8)',
        ],
        why: 'divisibility climbs DOWN factors, not up: multiples of 8 are multiples of 4, not vice versa.',
      },
      {
        claim: '"Adding two fractions always gives a smaller number than multiplying them."',
        correct: '1/2 and 1/3 (sum 5/6 is bigger than product 1/6)',
        wrong: [
          '2 and 3 (sum 5 is smaller than product 6)',
          '4 and 5 (sum 9 is far smaller than the product 20)',
          '3 and 3 (sum 6 is smaller than product 9)',
        ],
        why: 'for small fractions, products shrink fast — sums usually win.',
      },
    ]
    const c = cycle(seed, claims)
    return {
      title: 'One counterexample kills a claim',
      prompt: `Claim: ${c.claim}\n\nWhich choice is a **counterexample**?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'A counterexample must FIT the claim’s setup but BREAK its conclusion.',
        'Check the edge cases: negatives, zero, fractions between 0 and 1.',
        `Worked path: **${c.correct}** — ${c.why}`,
      ],
      explanation: `**${c.correct}**. ${c.why} One valid counterexample fully disproves a "for all" claim — no number of confirming examples can prove it.`,
    }
  },
)

const proofAlways = tpl(
  { id: 'proof-always', name: 'Always, sometimes, never', skillIds: ['m-proof'], bucket: 'math', difficulty: 3, variants: 4, minutes: 2.5 },
  (rng, seed) => {
    const cases = [
      { s: 'The sum of two odd numbers is even.', a: 'Always true', why: '(2a+1)+(2b+1) = 2(a+b+1), which is even for every choice.' },
      { s: 'A number is smaller than its square.', a: 'Sometimes true', why: 'true for 3 (9), false for 1/2 (1/4) and for 1 (equal).' },
      { s: 'The perimeter of a square equals its area.', a: 'Sometimes true', why: 'only at side 4 (both 16); false elsewhere.' },
      { s: 'An even number plus an odd number is even.', a: 'Never true', why: '2a + (2b+1) = 2(a+b)+1 is odd for every choice.' },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Always / sometimes / never',
      prompt: `**${c.s}**\n\nIs this always, sometimes, or never true?`,
      answer: mcq(rng, c.a, ['Always true', 'Sometimes true', 'Never true'].filter((o) => o !== c.a)),
      hints: [
        'Try a few examples first — but examples only settle "sometimes".',
        '"Always" and "never" need a reason that covers EVERY case (algebra helps: write odd as 2k+1).',
        `Worked path: **${c.a}** — ${c.why}`,
      ],
      explanation: `**${c.a}**: ${c.why} Examples can only ever prove "sometimes"; the universal claims need structure.`,
    }
  },
)

const nrWorkBackward = fixed(
  { id: 'nr-work-backward', name: 'Work backward', skillIds: ['m-nonroutine'], bucket: 'math', difficulty: 4, minutes: 4, transfer: true, calibration: true },
  {
    title: 'The mystery number',
    prompt:
      'I pick a number. I **triple it**, **subtract 5**, then **halve the result** — and end up with **8**. What number did I pick?',
    answer: numeric(7),
    hints: [
      'Two good strategies: name it x and go forward, or UNDO each step from 8 backward.',
      'Backward: before halving it was 16; before subtracting 5 it was 21.',
      'Worked path: 21 ÷ 3 = **7**. (Forward check: 7 → 21 → 16 → 8 ✓.)',
    ],
    explanation:
      'Undo the steps in reverse order with inverse operations: end 8 → double it (undo the halving) = 16 → add 5 (undo the subtraction) = 21 → divide by 3 (undo the tripling) = **7**. Algebraically: (3x − 5)/2 = 8 → 3x − 5 = 16 → x = 7. Working backward turns a puzzle into bookkeeping — the reusable move is "invert the steps, reverse the order."',
  },
)

const nrPattern = fixed(
  { id: 'nr-pattern', name: 'Pattern structure', skillIds: ['m-nonroutine'], bucket: 'math', difficulty: 4, minutes: 4, transfer: true },
  {
    title: 'Growing squares',
    prompt:
      'A pattern of square tables: 1 table seats 4. Two tables pushed together in a row seat 6. Three in a row seat 8.\n\nHow many people can sit at **25 tables** pushed together in a row?',
    answer: numeric(52),
    hints: [
      'Draw the first three cases. What stays the same, and what grows?',
      'Each new table adds 2 seats (one each side); the two END seats never change.',
      'Worked path: seats = 2n + 2 → 2(25) + 2 = **52**.',
    ],
    explanation:
      'Structure: every table contributes its top and bottom seat (2n) and the row keeps exactly 2 end seats, so seats = 2n + 2. For n = 25: **52**. Finding the structural rule beats extending the list 22 more times — and explains WHY the rule holds.',
  },
)

const nrLogic = fixed(
  { id: 'nr-digits', name: 'Digit deduction', skillIds: ['m-nonroutine'], bucket: 'math', difficulty: 4, minutes: 4, transfer: true, calibration: true },
  {
    title: 'The two-digit number',
    prompt:
      'A two-digit number: its digits **add to 11**, and reversing its digits makes it **27 larger**. What is the original number?',
    answer: numeric(47),
    hints: [
      'Name the digits: tens t, units u. What is the number’s value in terms of t and u?',
      'Value = 10t + u; reversed = 10u + t. Reversal adds 27: (10u + t) − (10t + u) = 27.',
      'Worked path: 9(u − t) = 27 → u − t = 3; with t + u = 11 → u = 7, t = 4 → **47**.',
    ],
    explanation:
      'Let tens = t, units = u. t + u = 11 and (10u + t) − (10t + u) = 9(u − t) = 27, so u − t = 3. Solving the little system: u = 7, t = 4 → **47**. Check: 4 + 7 = 11 ✓ and 74 − 47 = 27 ✓. The insight worth keeping: reversal always changes a two-digit number by 9 × (digit difference).',
  },
)

export const MATH_ALGEBRA_TEMPLATES: ItemTemplate[] = [
  exprEval,
  exprSimplify,
  exprTranslate,
  eq1Solve,
  eq1Check,
  eqmBoth,
  eqmDistribute,
  eqmFractions,
  ineqSolve,
  wordSetup,
  wordSolve,
  coordQuadrant,
  coordDistance,
  slopeTwoPoints,
  slopeTable,
  linfuncInterpret,
  linfuncSolve,
  sysSolve,
  sysWord,
  funcEval,
  funcConcept,
  polyMultiply,
  polyFactor,
  quadSqrt,
  quadFactorSolve,
  anglePairs,
  angleTriangle,
  angleParallel,
  pythHypotenuse,
  pythLeg,
  pythWord,
  transformPoint,
  dilateScale,
  areaRectTri,
  areaComposite,
  perimeterMissing,
  circleC,
  circleA,
  volPrism,
  volCylinder,
  modelChoose,
  modelBudget,
  proofCounterexample,
  proofAlways,
  nrWorkBackward,
  nrPattern,
  nrLogic,
]
