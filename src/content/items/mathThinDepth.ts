/**
 * Depth for the ten thinnest math skills, measured by the census on
 * 2026-08-18: m-ineqintro, m-variables, m-rationalops, m-units, m-ev,
 * m-conditionalprob, m-inference, m-absolute, m-piecewise, m-radicals.
 * Each gets two new families — one 1-2★ way in, one 3-4★ — so every one of
 * these skills now has at least four distinct families.
 *
 * Design rule for the pass: where an existing family already asks a question
 * one way, the new family asks for the SAME kind of answer through a
 * DIFFERENT question form — reversed direction (solutions → equation, output
 * → input, table → rule), structure recognition (sign before size), or error
 * repair (fix a wrong conversion). Varying the question form while keeping
 * the response is the largest retention moderator in Pan & Rickard's 2018
 * meta-analysis of retrieval practice (response-congruent pairs, d ≈ .58 vs
 * .28 for response-incongruent).
 *
 * House laws, kept: every answer is computed from the drawn values; case
 * choice derives from the folded seed via cycle() so declared variants are
 * real; distractors name their misconception; option lengths stay parallel.
 */
import type { ErrorTag, ItemTemplate } from '../../domain/types'
import { rint, rnz } from '../../engine/rng'
import { cycle, fracStr, fraction, mcqNoted, numeric, round, tpl } from '../lib'

const PROV_DEPTH = 'Original construction (2026-08-18 thin-skill depth pass); answer computed by generator.'

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const lcFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

// ================================================================ m-ineqintro

const ineqNumberLine = tpl(
  { id: 'mtd-ineq-numberline', name: 'Number line to inequality', skillIds: ['m-ineqintro'], bucket: 'math', difficulty: 2, variants: 16, minutes: 2, provenance: PROV_DEPTH },
  (rng, seed) => {
    const inclusive = seed % 2 === 0
    const right = Math.floor(seed / 2) % 2 === 0
    const b = cycle(Math.floor(seed / 4), [-3, 2, 5, 9] as const)
    const sign = right ? (inclusive ? '≥' : '>') : inclusive ? '≤' : '<'
    const flippedStrict = right ? (inclusive ? '>' : '≥') : inclusive ? '<' : '≤'
    const wrongDir = right ? (inclusive ? '≤' : '<') : inclusive ? '≥' : '>'
    const correct = `x ${sign} ${b}`
    const { answer, distractorNotes, distractorTags } = mcqNoted(rng, correct, [
      [
        `x ${flippedStrict} ${b}`,
        `Dot type sets the boundary rule: a ${inclusive ? `filled dot means ${b} itself is a solution, so the sign needs the equal bar` : `hollow dot means ${b} itself is excluded, so the sign must stay strict`}.`,
        'misread',
      ],
      [`x ${wrongDir} ${b}`, 'Direction comes from the shading: the shaded side IS the solution set, and this option points the other way.', 'representation'],
      [`x = ${b}`, 'An inequality names a whole set of numbers; the dot is only the boundary of that set, not the answer itself.', 'concept'],
    ])
    return {
      title: 'Read the number line',
      prompt: `A number line shows ${inclusive ? 'a **filled (closed)** dot' : 'an **open (hollow)** dot'} at **${b}**, with shading over every number to the **${right ? 'right' : 'left'}** of it. Which inequality does the picture show?`,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'The dot marks the boundary; the shading marks which numbers belong to the solution set.',
        `Translate each feature separately — that is the move: shading ${right ? 'right means x is greater than the boundary' : 'left means x is less than the boundary'}, and a ${inclusive ? 'filled dot adds the equal bar (≥ or ≤)' : 'hollow dot keeps the sign strict (> or <)'}.`,
        `Worked path: **${correct}**.`,
      ],
      explanation: `The shading covers the numbers ${right ? 'greater' : 'less'} than ${b}, and the ${inclusive ? `filled dot says ${b} itself counts, so the sign carries the equal bar` : `hollow dot says ${b} itself is left out, so the sign stays strict`}: **${correct}**. The picture and the inequality are two spellings of the same set — dot type and shading direction each map to exactly one feature of the symbols, which is why either version can be rebuilt from the other.`,
      commonErrors: { representation: 'Most misreads here change a single feature: right sign but wrong dot rule, or right dot rule but mirrored direction. Check the two features one at a time.' },
    }
  },
)

const ineqWholeBoundary = tpl(
  { id: 'mtd-ineq-max-whole', name: 'The last whole number allowed', skillIds: ['m-ineqintro'], bucket: 'math', difficulty: 3, variants: 12, minutes: 2.5, provenance: PROV_DEPTH },
  (rng, seed) => {
    const atMost = seed % 2 === 0
    const p = cycle(Math.floor(seed / 2), [4, 6, 7, 9] as const)
    const q = rint(rng, 5, 12)
    const r = rint(rng, 1, p - 1)
    const total = p * q + r
    if (atMost) {
      return {
        title: 'How many can you afford?',
        prompt: `You have **$${total}** and each ticket costs **$${p}**. Whole tickets only. What is the LARGEST number of tickets you can buy?`,
        answer: numeric(q),
        hints: [
          `Every allowed count x satisfies ${p}x ≤ ${total} — but only whole numbers of tickets exist.`,
          `Divide and read the leftover — that is the move: ${total} ÷ ${p} = ${q} remainder ${r}, and a partial ticket cannot be bought, so round DOWN.`,
          `Worked path: **${q}** tickets (spending $${p * q}, with $${r} left over).`,
        ],
        explanation: `The limit is the inequality ${p}x ≤ ${total}, whose boundary is ${total}/${p} = ${q} and a bit. The solutions are every number up to that boundary, but the context keeps only whole ones, so the largest allowed is **${q}** — buying ${q + 1} would need $${p * (q + 1)}, which is $${p - r} more than you have. An inequality answers with a whole set; the question then picks the best whole number inside it.`,
        commonErrors: { strategy: `Rounding ${total}/${p} to the NEAREST whole number can land outside the limit — an at-most constraint always rounds down.` },
      }
    }
    return {
      title: 'How many to reach the goal?',
      prompt: `Each car wash earns **$${p}**, and you need AT LEAST **$${total}** for a trip. Whole washes only. What is the SMALLEST number of washes that reaches the goal?`,
      answer: numeric(q + 1),
      hints: [
        `Every sufficient count x satisfies ${p}x ≥ ${total} — but only whole washes exist.`,
        `Divide and read the leftover — that is the move: ${total} ÷ ${p} = ${q} remainder ${r}, and stopping at ${q} washes leaves you $${r} short, so round UP.`,
        `Worked path: **${q + 1}** washes (earning $${p * (q + 1)}).`,
      ],
      explanation: `The requirement is ${p}x ≥ ${total}, whose boundary is ${total}/${p} = ${q} and a bit. After ${q} washes you have $${p * q}, still $${r} short, so the smallest whole number that works is **${q + 1}** — it overshoots to $${p * (q + 1)}, and overshooting is allowed while falling short is not. At-least constraints round up; at-most constraints round down.`,
      commonErrors: { strategy: `Rounding ${total}/${p} down gives ${q}, which fails the very condition the inequality states — check which side of the boundary the context allows.` },
    }
  },
)

// ================================================================ m-variables

const variableReverse = tpl(
  { id: 'mtd-var-reverse', name: 'Table row, backwards', skillIds: ['m-variables'], bucket: 'math', difficulty: 2, variants: 24, minutes: 2, provenance: PROV_DEPTH },
  (rng) => {
    const rate = rint(rng, 2, 9)
    const start = rint(rng, 1, 12)
    const x = rint(rng, 3, 10)
    const y = start + rate * x
    return {
      title: 'Find the missing input',
      prompt: `The relationship is **y = ${start} + ${rate}x**. A table row shows y = **${y}**, but the x cell is smudged. What x belongs in that row?`,
      answer: numeric(x),
      hints: [
        'The equation still connects the pair — this time the KNOWN number is the output y.',
        `Undo the steps in reverse order — that is the move: subtract the starting ${start} first, then divide by the rate ${rate}.`,
        `Worked path: (${y} − ${start}) ÷ ${rate} = **${x}**.`,
      ],
      explanation: `Working backwards: ${y} − ${start} = ${y - start}, and ${y - start} ÷ ${rate} = **${x}**. Check forwards: ${start} + ${rate}(${x}) = ${y}. A table row is a pair, and the equation can fill EITHER blank — going from y back to x just undoes the operations in the opposite order from how they were applied.`,
      commonErrors: { strategy: `Dividing ${y} by ${rate} before subtracting undoes the steps in the wrong order — the ${start} was added last, so it comes off first.` },
    }
  },
)

const variableRule = tpl(
  { id: 'mtd-var-rule', name: 'Which equation fits the table?', skillIds: ['m-variables'], bucket: 'math', difficulty: 3, variants: 20, minutes: 2.5, provenance: PROV_DEPTH },
  (rng) => {
    const rate = rint(rng, 2, 6)
    let start = rint(rng, 1, 9)
    if (start === rate) start = rate + 1
    const rows = [1, 2, 3, 4].map((x) => `| ${x} | ${start + rate * x} |`).join('\n')
    const table = `| x | y |\n| --- | --- |\n${rows}`
    const correct = `y = ${start} + ${rate}x`
    const { answer, distractorNotes, distractorTags } = mcqNoted(rng, correct, [
      [
        `y = ${rate} + ${start}x`,
        `Start and rate have traded jobs. The first row cannot tell them apart (both give ${start + rate} at x = 1) — the second row can: this one gives ${rate + 2 * start}, not ${start + 2 * rate}.`,
        'incomplete',
      ],
      [`y = ${start + rate}x`, `Fits the first row only. A rule must fit EVERY row: at x = 2 this gives ${2 * (start + rate)}, but the table says ${start + 2 * rate}.`, 'incomplete'],
      [`y = ${start + rate} + ${rate}x`, `Uses the x = 1 output as the starting value — the start is what y would be at x = 0, one step BEFORE the table begins.`, 'concept'],
    ])
    return {
      title: 'From table to rule',
      prompt: `${table}\n\nWhich equation fits **every** row of this table?`,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'Test candidate rules against MORE than one row — a single row can be fooled.',
        `Read the structure — that is the move: y climbs by ${rate} each time x grows by 1, so the multiplier on x is ${rate}; then step back once from x = 1 to find the start: ${start + rate} − ${rate} = ${start}.`,
        `Worked path: **${correct}** (check x = 2: ${start} + ${rate}·2 = ${start + 2 * rate}).`,
      ],
      explanation: `The y values step up by ${rate} per row, so the rate is ${rate}; stepping back from (1, ${start + rate}) to x = 0 gives the start, ${start}. So **${correct}**. Two of the wrong rules also pass the x = 1 row — that is the lesson of this table: one matching row is a coincidence waiting to happen, and a rule earns the name only by fitting every row.`,
      commonErrors: { incomplete: 'Checking a single row is the trap this table is built around — two wrong options agree with the first row and fall apart on the second.' },
    }
  },
)

// ================================================================ m-rationalops

const rationalSign = tpl(
  { id: 'mtd-rational-sign', name: 'Sign before size', skillIds: ['m-rationalops'], bucket: 'math', difficulty: 1, variants: 12, minutes: 2, provenance: PROV_DEPTH },
  (rng, seed) => {
    const kind = seed % 3 // 0 → positive, 1 → negative, 2 → zero
    const sub = Math.floor(seed / 3) % 4
    const evenPatterns = [
      [false, false, false],
      [true, true, false],
      [true, false, true],
      [false, true, true],
    ] as const
    const oddPatterns = [
      [true, false, false],
      [false, true, false],
      [false, false, true],
      [true, true, true],
    ] as const
    const negs = kind === 1 ? oddPatterns[sub] : evenPatterns[sub]
    const sizes = [rint(rng, 2, 9), rint(rng, 2, 9), rint(rng, 2, 9)]
    const zeroPos = kind === 2 ? sub % 2 : -1 // never the divisor (position 2)
    const fmt = (i: number) => (i === zeroPos ? '0' : negs[i] ? `(−${sizes[i]})` : `${sizes[i]}`)
    const expr = `${fmt(0)} × ${fmt(1)} ÷ ${fmt(2)}`
    const negCount = [0, 1, 2].filter((i) => i !== zeroPos && negs[i]).length
    const correct = kind === 2 ? 'Zero' : negCount % 2 === 0 ? 'Positive' : 'Negative'
    const distractors: [string, string, ErrorTag][] =
      kind === 2
        ? [
            ['Positive', 'Zero times anything is zero — one zero factor wipes out the whole product before any signs matter.', 'concept'],
            ['Negative', 'The minus signs never get a say here: a zero factor makes the result zero, and zero has no sign.', 'concept'],
            ['It depends on the sizes of the numbers', 'Sizes decide how big a result is; they cannot rescue a product that contains a zero factor.', 'concept'],
          ]
        : [
            [
              correct === 'Positive' ? 'Negative' : 'Positive',
              `Count the negative factors: ${negCount}. Minus signs cancel in PAIRS, so ${negCount % 2 === 0 ? 'an even count leaves a positive result' : 'an odd count leaves one minus standing'}.`,
              'concept',
            ],
            ['Zero', 'A product or quotient is zero only when some factor is zero — none of these is.', 'concept'],
            ['It depends on the sizes of the numbers', 'Sizes decide how BIG the result is; the signs alone decide its direction.', 'concept'],
          ]
    const { answer, distractorNotes, distractorTags } = mcqNoted(rng, correct, distractors)
    return {
      title: 'Predict the sign',
      prompt: `Without computing the result, what is its **sign**?\n\n**${expr}**`,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'No arithmetic needed — the sign of a product or quotient follows its own rule.',
        kind === 2
          ? 'Scan for a zero first — that is the move: one zero factor makes the whole product zero, no matter what else is there.'
          : `Count the minus signs — that is the move: each PAIR of minuses cancels (negating twice returns you to the start), so ${negCount} negative factor${negCount === 1 ? '' : 's'} leaves the result ${negCount % 2 === 0 ? 'positive' : 'negative'}.`,
        `Worked path: **${correct}**.`,
      ],
      explanation:
        kind === 2
          ? `One factor is 0, and zero times or into anything is zero, so the result is **Zero** — a number with no sign at all. The check order worth keeping: look for zeros first, then count minus signs, and only then care about sizes.`
          : `There ${negCount === 1 ? 'is 1 negative factor' : `are ${negCount} negative factors`}. Each pair of minus signs cancels — negating twice returns to the start — so an ${negCount % 2 === 0 ? 'even count makes the result' : 'odd count makes the result'} **${correct}**. Division obeys the same rule as multiplication, because dividing by a number is multiplying by its reciprocal, and a reciprocal keeps its sign.`,
      commonErrors: { slip: 'Sign errors survive even perfect arithmetic — settle the sign first, on its own, and then never touch it again.' },
    }
  },
)

const rationalMissing = tpl(
  { id: 'mtd-rational-missing', name: 'Fill the signed blank', skillIds: ['m-rationalops'], bucket: 'math', difficulty: 3, variants: 18, minutes: 2, provenance: PROV_DEPTH },
  (rng, seed) => {
    const mode = cycle(seed, ['times', 'plus', 'minus'] as const)
    const wrap = (v: number) => (v < 0 ? `(−${-v})` : `${v}`)
    if (mode === 'times') {
      const msize = rint(rng, 2, 9)
      const missing = rng() < 0.5 ? -msize : msize
      const fsize = rint(rng, 2, 9)
      const factor = rng() < 0.5 ? -fsize : fsize
      const product = missing * factor
      return {
        title: 'Missing factor',
        prompt: `What number goes in the blank?\n\n**□ × ${wrap(factor)} = ${product}**`,
        answer: numeric(missing),
        hints: [
          'The blank is one unknown number — its sign and its size both have to work out.',
          `Undo the multiplication — that is the move: divide ${product} by ${wrap(factor)}, settling the sign by the sign rule (same signs → positive, different signs → negative).`,
          `Worked path: ${product} ÷ ${wrap(factor)} = **${missing}**.`,
        ],
        explanation: `Division undoes multiplication: the blank is ${product} ÷ ${wrap(factor)} = **${missing}**. Size first: ${Math.abs(product)} ÷ ${Math.abs(factor)} = ${Math.abs(missing)}. Then the sign: the product is ${product < 0 ? 'negative' : 'positive'} and the known factor is ${factor < 0 ? 'negative' : 'positive'}, so the blank must be ${missing < 0 ? 'negative' : 'positive'} for the signs to come out right. Check: ${wrap(missing)} × ${wrap(factor)} = ${product}.`,
        commonErrors: { slip: 'The classic miss here is a correct size with a flipped sign — verify by multiplying your answer back in.' },
      }
    }
    if (mode === 'plus') {
      const a = rint(rng, -12, 12)
      const missing = rnz(rng, 12)
      const total = a + missing
      return {
        title: 'Missing addend',
        prompt: `What number goes in the blank?\n\n**${a} + □ = ${total}**`,
        answer: numeric(missing),
        hints: [
          'Ask what CHANGE carries the start to the result — it may be a move right or a move left.',
          `Undo the addition — that is the move: subtract the start from the result, ${total} − ${wrap(a)}.`,
          `Worked path: ${total} − ${wrap(a)} = **${missing}**.`,
        ],
        explanation: `The blank is the gap between ${a} and ${total}: ${total} − ${wrap(a)} = **${missing}**. On a number line, going from ${a} to ${total} is a move of ${Math.abs(missing)} to the ${missing > 0 ? 'right, so the blank is positive' : 'left, so the blank is negative'}. Check: ${a} + ${wrap(missing)} = ${total}.`,
        commonErrors: { concept: 'When start and result sit on opposite sides of zero, the gap is both distances COMBINED — draw the two points if the size feels wrong.' },
      }
    }
    const a = rint(rng, -10, 10)
    const missing = rnz(rng, 9)
    const result = a - missing
    return {
      title: 'Missing subtrahend',
      prompt: `What number goes in the blank?\n\n**${a} − □ = ${result}**`,
      answer: numeric(missing),
      hints: [
        'Whatever fills the blank was TAKEN AWAY from the start to leave the result.',
        `Rearrange — that is the move: the amount removed equals start minus result, ${wrap(a)} − ${wrap(result)}.`,
        `Worked path: ${wrap(a)} − ${wrap(result)} = **${missing}**.`,
      ],
      explanation: `Start minus result gives what was removed: ${wrap(a)} − ${wrap(result)} = **${missing}**.${missing < 0 ? ` The blank is NEGATIVE: subtracting −${-missing} raised the value from ${a} to ${result}, because taking away a debt is a gain.` : ''} Check: ${a} − ${wrap(missing)} = ${result}.`,
      commonErrors: { concept: 'If the result is LARGER than the start, the blank has to be negative — subtracting a positive can only lower the value.' },
    }
  },
)

// ================================================================ m-units

const unitsCompare = tpl(
  { id: 'mtd-units-compare', name: 'Compare across units', skillIds: ['m-units'], bucket: 'math', difficulty: 2, variants: 16, minutes: 2, provenance: PROV_DEPTH },
  (rng, seed) => {
    const kind = seed % 4
    const smallWins = Math.floor(seed / 4) % 2 === 0
    let bigAmt: number
    let factor: number
    let delta: number
    let bigUnit: string
    let smallUnit: string
    let what: string
    if (kind === 0) {
      bigAmt = rint(rng, 2, 6)
      factor = 100
      delta = rint(rng, 2, 8) * 10
      bigUnit = 'm'
      smallUnit = 'cm'
      what = 'length'
    } else if (kind === 1) {
      bigAmt = rint(rng, 2, 5)
      factor = 1000
      delta = rint(rng, 5, 40) * 10
      bigUnit = 'kg'
      smallUnit = 'g'
      what = 'mass'
    } else if (kind === 2) {
      bigAmt = rint(rng, 2, 4)
      factor = 60
      delta = rint(rng, 5, 25)
      bigUnit = 'hours'
      smallUnit = 'minutes'
      what = 'time'
    } else {
      bigAmt = rint(rng, 2, 4)
      factor = 1000
      delta = rint(rng, 5, 30) * 10
      bigUnit = 'L'
      smallUnit = 'mL'
      what = 'volume'
    }
    const smallAmt = bigAmt * factor + (smallWins ? delta : -delta)
    const optSmall = `${smallAmt} ${smallUnit}`
    const optBig = `${bigAmt} ${bigUnit}`
    const correct = smallWins ? optSmall : optBig
    const loser = smallWins ? optBig : optSmall
    const { answer, distractorNotes, distractorTags } = mcqNoted(rng, correct, [
      [loser, `Convert before comparing: ${bigAmt} ${bigUnit} is ${bigAmt * factor} ${smallUnit}, against ${smallAmt} ${smallUnit} — the bigger raw number decides nothing on its own.`, 'concept'],
      ['They are exactly the same amount', `Equal would need exactly ${bigAmt * factor} ${smallUnit}; this pair differs by ${delta} ${smallUnit}.`, 'slip'],
    ])
    return {
      title: 'Which is more?',
      prompt: `Which is the greater ${what}: **${optSmall}** or **${optBig}**?`,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'Raw numbers in different units cannot be compared directly — 100 of a tiny unit can be less than 1 of a big one.',
        `Put both in the same unit — that is the move: 1 ${bigUnit === 'hours' ? 'hour' : bigUnit} is ${factor} ${smallUnit}, so ${bigAmt} ${bigUnit} = ${bigAmt * factor} ${smallUnit}.`,
        `Worked path: ${smallAmt} vs ${bigAmt * factor} ${smallUnit} → **${correct}**.`,
      ],
      explanation: `In ${smallUnit}: ${optBig} converts to ${bigAmt * factor} ${smallUnit}, and ${smallAmt} ${smallWins ? '>' : '<'} ${bigAmt * factor}, so **${correct}** is more. A number measures something only once its unit is attached, so comparisons happen between quantities, never between bare numbers — converting to a shared unit is what makes the two numbers comparable at all.`,
      commonErrors: {
        concept: smallWins
          ? `The raw number ${smallAmt} dwarfs ${bigAmt}, and here the small-unit side happens to win anyway — but only the conversion could tell you that, not the raw numbers.`
          : `The raw number ${smallAmt} dwarfs ${bigAmt}, yet the ${bigUnit} side wins — each ${bigUnit === 'hours' ? 'hour' : bigUnit} is worth ${factor} ${smallUnit}.`,
      },
    }
  },
)

const unitsRepair = tpl(
  { id: 'mtd-units-repair', name: 'Repair the conversion', skillIds: ['m-units'], bucket: 'math', difficulty: 3, variants: 16, minutes: 2.5, provenance: PROV_DEPTH },
  (_rng, seed) => {
    const cases = [
      { from: 'm', to: 'cm', factor: 100, vals: [2.5, 3.5, 6.5, 8.5], flaw: 'divide' as const, flawText: 'divided by 100 instead of multiplying' },
      { from: 'km', to: 'm', factor: 1000, vals: [1.5, 2.5, 4.5, 7.5], flaw: 'divide' as const, flawText: 'divided by 1000 instead of multiplying' },
      { from: 'minutes', to: 'seconds', factor: 60, vals: [4, 7, 9, 12], flaw: 'x100' as const, flawText: 'multiplied by 100, but time is not metric — one minute is 60 seconds' },
      { from: 'L', to: 'mL', factor: 1000, vals: [1.5, 3.5, 2.5, 0.5], flaw: 'x100' as const, flawText: 'multiplied by 100, but milli- means thousandths — one litre is 1000 mL' },
    ]
    const c = cases[seed % 4]
    const v = cycle(Math.floor(seed / 4), c.vals)
    const correctV = Math.round(v * c.factor)
    const wrongShown = c.flaw === 'divide' ? round(v / c.factor, 6) : Math.round(v * 100)
    const sing = c.from.endsWith('s') ? c.from.slice(0, -1) : c.from
    return {
      title: 'Fix the wrong conversion',
      prompt: `A classmate converts **${v} ${c.from}** to ${c.to} and writes **${wrongShown} ${c.to}**. That is wrong. What is the correct number of ${c.to}?`,
      answer: numeric(correctV),
      hints: [
        `Sanity-check the direction first: ${c.to} are a smaller unit than ${c.from}, so the same amount needs a count BIGGER than ${v}.`,
        `Multiply by the exact factor — that is the move: 1 ${sing} = ${c.factor} ${c.to}, so compute ${v} × ${c.factor}.`,
        `Worked path: ${v} × ${c.factor} = **${correctV} ${c.to}**.`,
      ],
      explanation: `The right value is ${v} × ${c.factor} = **${correctV} ${c.to}**. The classmate ${c.flawText}${c.flaw === 'divide' ? `, and the size check exposes it instantly: ${wrongShown} ${c.to} is far less than even one ${sing}, yet the amount never changed` : ''}. The habit that prevents both kinds of error: before any arithmetic, decide whether the number should grow or shrink (smaller unit → bigger count) and by roughly what scale — a wrong direction or a wrong power of ten then has nowhere to hide.`,
      commonErrors: {
        strategy:
          c.flaw === 'divide'
            ? 'Divide-or-multiply confusion is the top conversion error — the direction check (smaller unit → bigger number) catches it before any arithmetic happens.'
            : 'Not every unit pair runs on powers of ten — take the factor from the units themselves, not from the metric habit.',
      },
    }
  },
)

// ================================================================ m-ev

const evSpinner = tpl(
  { id: 'mtd-ev-spinner', name: 'Equally likely, long-run average', skillIds: ['m-ev'], bucket: 'math', difficulty: 2, variants: 24, minutes: 2, provenance: PROV_DEPTH },
  (_rng, seed) => {
    const offsets = cycle(seed, [
      [-2, -1, 1, 2],
      [-3, 0, 1, 2],
      [-4, 1, 1, 2],
      [0, 0, -1, 1],
      [-2, 2, -1, 1],
      [-3, -1, 1, 3],
    ] as const)
    const t = cycle(Math.floor(seed / 6), [4, 6, 7, 9] as const)
    const values = offsets.map((o) => t + o)
    const sum = values.reduce((a, b) => a + b, 0)
    const hasRepeat = values.some((v, i) => values.indexOf(v) !== i)
    return {
      title: 'Spinner average',
      prompt: `A spinner has **4 equal sections** worth **${values.join(', ')}** points. Over many spins, what is the average number of points per spin?`,
      answer: numeric(t),
      hints: [
        'Every section is equally likely, so each one carries the same weight in the long run.',
        'With equal chances, expected value is simply the MEAN — that is the move: add the four section values and divide by 4.',
        `Worked path: ${values.join(' + ')} = ${sum}, and ${sum} ÷ 4 = **${t}**.`,
      ],
      explanation: `Each section comes up about a quarter of the time, so the long-run average is (${values.join(' + ')}) ÷ 4 = **${t}** points. This is expected value in its simplest clothing: every outcome weighted by its probability, and with equal probabilities the weights are all 1/4 — which is exactly the ordinary mean.${hasRepeat ? ' Note the repeated value: it appears twice, so it counts twice. Sections are weighted by how often they come up, not by how many different numbers appear.' : ''}`,
      commonErrors: { concept: 'Averaging only the DIFFERENT values, or reporting the most common one, answers another question — every section contributes, weighted by its chance.' },
    }
  },
)

const evFair = tpl(
  { id: 'mtd-ev-fair', name: 'Make the game fair', skillIds: ['m-ev'], bucket: 'math', difficulty: 4, variants: 16, minutes: 3, provenance: PROV_DEPTH },
  (rng, seed) => {
    const askWin = seed % 2 === 0
    const d = cycle(Math.floor(seed / 2), [3, 4, 5, 6] as const)
    const loss = rint(rng, 2, 6)
    const win = loss * (d - 1)
    if (askWin) {
      return {
        title: 'Price the prize',
        prompt: `A spinner has **${d} equal sections**. On ${d - 1} of them you PAY **$${loss}**; on the last one you WIN a prize. What prize (in dollars) makes the game exactly fair — a long-run average of $0?`,
        answer: numeric(win),
        hints: [
          'Fair means the expected value is zero: what you win on average balances what you pay on average.',
          `Balance the two sides — that is the move: (1/${d}) × prize must equal (${d - 1}/${d}) × ${loss}.`,
          `Worked path: prize = ${d - 1} × ${loss} = **$${win}**.`,
        ],
        explanation: `Per spin you expect to pay (${d - 1}/${d}) × ${loss} and to win (1/${d}) × prize. Setting the two equal gives prize = ${d - 1} × ${loss} = **$${win}**. The shape of that answer is the insight: one rare win has to cover ${d - 1} losses, so a fair prize is ${d - 1} times the loss — rare good outcomes must be LARGE to balance frequent small ones.`,
        commonErrors: { concept: `Setting the prize equal to the $${loss} loss ignores how OFTEN each side happens — the probabilities are the weights in the balance.` },
      }
    }
    return {
      title: 'Price the penalty',
      prompt: `A spinner has **${d} equal sections**. On one you WIN **$${win}**; on the other ${d - 1} you PAY the same penalty each time. What penalty (in dollars) makes the game exactly fair — a long-run average of $0?`,
      answer: numeric(loss),
      hints: [
        'Fair means the expected value is zero: the winning side and the paying side balance.',
        `Balance the two sides — that is the move: (1/${d}) × ${win} must equal (${d - 1}/${d}) × penalty.`,
        `Worked path: penalty = ${win} ÷ ${d - 1} = **$${loss}**.`,
      ],
      explanation: `Per spin the win contributes (1/${d}) × ${win}; the ${d - 1} paying sections together contribute (${d - 1}/${d}) × penalty. Equal means penalty = ${win} ÷ ${d - 1} = **$${loss}**. The asymmetry is the lesson: a prize that lands once per ${d} spins gets balanced by ${d - 1} small payments, so the fair penalty is the prize SHRUNK by that factor, never matched to it one-for-one.`,
      commonErrors: { concept: `Splitting the $${win} evenly, as if "win minus loss should be zero", skips the probabilities — expected value weights each outcome by how often it happens.` },
    }
  },
)

// ================================================================ m-conditionalprob

const condProbGiven = tpl(
  { id: 'mtd-condprob-given', name: 'A clue shrinks the die', skillIds: ['m-conditionalprob'], bucket: 'math', difficulty: 2, variants: 8, minutes: 2, provenance: PROV_DEPTH },
  (_rng, seed) => {
    const cases = [
      { clue: 'an even number', keep: [2, 4, 6], ask: 'the 6', hit: [6] },
      { clue: 'an odd number', keep: [1, 3, 5], ask: 'the 1', hit: [1] },
      { clue: 'a number bigger than 2', keep: [3, 4, 5, 6], ask: 'the 6', hit: [6] },
      { clue: 'a number bigger than 2', keep: [3, 4, 5, 6], ask: 'an even number', hit: [4, 6] },
      { clue: 'a number smaller than 5', keep: [1, 2, 3, 4], ask: 'an odd number', hit: [1, 3] },
      { clue: 'an even number', keep: [2, 4, 6], ask: 'a number bigger than 3', hit: [4, 6] },
      { clue: 'an odd number', keep: [1, 3, 5], ask: 'a number bigger than 3', hit: [5] },
      { clue: 'a number bigger than 1', keep: [2, 3, 4, 5, 6], ask: 'a multiple of 3', hit: [3, 6] },
    ]
    const c = cycle(seed, cases)
    const n = c.hit.filter((h) => c.keep.includes(h)).length
    const den = c.keep.length
    return {
      title: 'Probability after a clue',
      prompt: `You roll one fair six-sided die, hidden from view. A truthful friend peeks and says: "It is **${c.clue}**." Given that clue, what is the probability the roll is **${c.ask}**? Answer as a fraction.`,
      answer: fraction(n, den),
      hints: [
        'The clue rules some faces out entirely — they are no longer part of the question.',
        `List the survivors — that is the move: the clue leaves {${c.keep.join(', ')}}, and that list becomes the NEW denominator.`,
        `Worked path: ${n} of the ${den} surviving faces ${n === 1 ? 'is' : 'are'} ${c.ask}, so **${n}/${den}**.`,
      ],
      explanation: `Before the clue, six faces were possible. The clue shrinks the world to {${c.keep.join(', ')}} — ${den} equally likely faces — and of those, ${n} ${n === 1 ? 'is' : 'are'} ${c.ask}: probability **${n}/${den}**. That restrict-then-recount step IS conditional probability: "given" means the denominator changes from all outcomes to just the ones compatible with what you learned.`,
      commonErrors: { concept: `Keeping 6 as the denominator answers the before-the-clue question — the clue already eliminated ${6 - den} faces, and probabilities live in the world that remains.` },
    }
  },
)

const condProbNatFreq = tpl(
  { id: 'mtd-condprob-natfreq', name: 'Of the flagged, how many are real?', skillIds: ['m-conditionalprob'], bucket: 'math', difficulty: 4, variants: 12, minutes: 3, provenance: PROV_DEPTH },
  (rng, seed) => {
    const c = cycle(seed, [
      { items: 'emails', cond: 'spam', device: 'the filter', act: 'flags', acted: 'flagged' },
      { items: 'parts', cond: 'faulty', device: 'the scanner', act: 'rejects', acted: 'rejected' },
      { items: 'days', cond: 'rainy', device: 'the weather app', act: 'warns about', acted: 'warned about' },
    ] as const)
    const total = cycle(Math.floor(seed / 3), [100, 200] as const)
    const T = rint(rng, 30, 60)
    const R = total - T
    const a = T - rint(rng, 4, 12)
    const b = rint(rng, 5, 20)
    return {
      title: 'Read it from the counts',
      prompt: `Out of **${total} ${c.items}**, **${T}** are ${c.cond}. ${cap(c.device)} ${c.act} **${a}** of those ${T} — but it also ${c.act} **${b}** of the ${R} ${c.items} that are not ${c.cond}. Of all the ${c.items} ${c.device} ${c.acted}, what fraction are really ${c.cond}? Answer as a fraction.`,
      answer: fraction(a, a + b),
      hints: [
        `Two different groups end up ${c.acted}: truly ${c.cond} ones and false alarms.`,
        `Build the ${c.acted} pile first — that is the move: ${a} truly ${c.cond} + ${b} false alarms = ${a + b} ${c.items}. The question lives entirely inside that pile, so it is the denominator.`,
        `Worked path: ${a} of the ${a + b} — **${fracStr(a, a + b)}**.`,
      ],
      explanation: `The ${c.acted} pile holds ${a} + ${b} = ${a + b} ${c.items}, of which ${a} are really ${c.cond}: **${fracStr(a, a + b)}**. Notice the direction: "${c.device} catches ${a} of the ${T} ${c.cond} ones" is a DIFFERENT fraction (${fracStr(a, T)}) — the catch rate. The question reverses the condition, and the two fractions have different denominators because they condition on different groups. Keeping everything as whole-item counts (natural frequencies) is what makes that reversal visible instead of slippery.`,
      commonErrors: { concept: `Answering ${fracStr(a, T)} reports how many of the ${c.cond} ${c.items} get caught — the reverse of what was asked. The denominator must be the group named after "of all": the ${c.acted} pile.` },
    }
  },
)

// ================================================================ m-inference

const inferMethod = tpl(
  { id: 'mtd-infer-method', name: 'Pick the fair sample', skillIds: ['m-inference'], bucket: 'math', difficulty: 2, variants: 4, minutes: 2.5, provenance: PROV_DEPTH },
  (rng, seed) => {
    const cases: { goal: string; correct: string; wrong: [string, string, ErrorTag][] }[] = [
      {
        goal: 'A school wants to know how its 900 students feel about the cafeteria menu.',
        correct: 'Draw 60 names at random from the student list',
        wrong: [
          ['Survey the students sitting at one lunch table', 'One table is a friendship cluster — friends share tastes, so the answers arrive pre-correlated.', 'concept'],
          ['Ask the members of the school cooking club', 'The cooking club cares about food far more than a typical student does — an interested group overstates its own interest.', 'concept'],
          ['Post a poll and count whoever answers first', 'Self-selected responders skew toward the strongest opinions; the indifferent majority never clicks.', 'concept'],
        ],
      },
      {
        goal: 'A city wants to know how often its residents use the main park.',
        correct: 'Pick households at random from the resident roll',
        wrong: [
          ['Interview people who are walking in the park', 'Sampling inside the park guarantees park users — the residents who never come cannot appear in the data at all.', 'concept'],
          ['Poll the followers of the park fan account', 'Fans opted in because they love the park; their usage is nowhere near typical.', 'concept'],
          ['Survey one apartment building near the gate', 'Distance drives usage, so one building measures its own location more than the city.', 'concept'],
        ],
      },
      {
        goal: 'A game studio wants to know how hard all of its players find level 3.',
        correct: 'Sample player accounts at random from all accounts',
        wrong: [
          ['Ask the top 100 players on the leaderboard', 'Leaderboard players are the most skilled sliver — difficulty ratings from them run far too low.', 'concept'],
          ['Read the posts on the game discussion forum', 'Forum posters are the frustrated and the devoted; quiet middle-ground players never post.', 'concept'],
          ['Ask five friends who play the game to rate it', 'Five people you chose share your circle and roughly your skill — tiny AND clustered.', 'concept'],
        ],
      },
      {
        goal: 'A library wants to know which opening hours its members would prefer.',
        correct: 'Phone a random sample from the full member list',
        wrong: [
          ['Ask the visitors present on Friday evening', 'Friday-evening visitors are the people the CURRENT hours already suit — the members kept away are invisible.', 'concept'],
          ['Collect the notes left in the suggestion box', 'Suggestion boxes gather the unusually motivated; a handful of strong opinions is not the membership.', 'concept'],
          ['Survey the volunteers who staff the desk', 'Volunteers are the most involved members there are — their preferences are nothing like the average.', 'concept'],
        ],
      },
    ]
    const c = cycle(seed, cases)
    const { answer, distractorNotes, distractorTags } = mcqNoted(rng, c.correct, c.wrong)
    return {
      title: 'Choose the sampling method',
      prompt: `${c.goal} Which method gives the fairest picture of the whole group?`,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'A fair sample gives every member of the population the same chance of being included.',
        'Interrogate each method — that is the move: ask WHO could never end up in this sample, because whoever is excluded is exactly who the result will silently ignore.',
        `Worked path: **${c.correct}** — random selection from the complete population.`,
      ],
      explanation: `**${c.correct}.** Random selection from the FULL population is what lets a small group stand in for a big one: nobody is systematically left out, so the sample differs from the population only by luck, and luck averages out. Each rejected method bakes in a tilt before the first answer arrives — sampling the people who are convenient to reach, or the people who already care, measures the reaching and the caring rather than the population.`,
      commonErrors: { concept: 'Sample size cannot repair a tilted method: 1,000 self-selected answers are worse than 60 random ones, because the bias scales up along with the count.' },
    }
  },
)

const inferEstimate = tpl(
  { id: 'mtd-infer-estimate', name: 'Scale the sample up', skillIds: ['m-inference'], bucket: 'math', difficulty: 3, variants: 16, minutes: 2.5, provenance: PROV_DEPTH },
  (rng, seed) => {
    const c = cycle(seed, [
      { pop: 'students', trait: 'walk to school', place: 'a school' },
      { pop: 'households', trait: 'own a bicycle', place: 'a town district' },
      { pop: 'trees', trait: 'show storm damage', place: 'a city park' },
      { pop: 'books', trait: 'need a repair', place: 'a library' },
    ] as const)
    const n = cycle(Math.floor(seed / 4), [40, 50, 60, 30] as const)
    const m = rint(rng, 12, 24)
    const P = n * m
    const h = rint(rng, 6, Math.floor(n / 2))
    const est = m * h
    return {
      title: 'Estimate the whole from the sample',
      prompt: `${cap(c.place)} has **${P} ${c.pop}**. A **random** sample of **${n}** of them finds that **${h}** ${c.trait}. What is the best estimate of how many of all ${P} ${c.pop} ${c.trait}?`,
      answer: numeric(est),
      hints: [
        'A random sample is a scale model: its fraction is the best available guess for the population fraction.',
        `Scale up — that is the move: the population is ${m} times the sample (${P} ÷ ${n} = ${m}), so multiply the count ${h} by ${m}. Equivalently, take ${h}/${n} of ${P}.`,
        `Worked path: ${h} × ${m} = **${est}**.`,
      ],
      explanation: `The sample rate is ${h}/${n}, and the whole group is ${m} times the sample, so the estimate is ${h} × ${m} = **${est}** ${c.pop}. Two honesty notes carry the statistics here: the carry-over is earned by the word RANDOM (a convenience sample would copy its own tilt up to the population), and the result is an estimate rather than a count — another random sample would give a nearby answer, not this exact one.`,
      commonErrors: { concept: `Reporting ${h} forgets that the sample is a ${n}-item window into ${P} — the count must be scaled by the ×${m} between the window and the whole.` },
    }
  },
)

// ================================================================ m-absolute

const absDistance = tpl(
  { id: 'mtd-abs-distance', name: 'How far apart?', skillIds: ['m-absolute'], bucket: 'math', difficulty: 2, variants: 18, minutes: 2, provenance: PROV_DEPTH },
  (rng, seed) => {
    const mode = cycle(seed, ['temps', 'depths', 'line'] as const)
    if (mode === 'temps') {
      const lo = -rint(rng, 2, 15)
      const hi = rint(rng, 2, 15)
      const gap = hi - lo
      return {
        title: 'Degrees apart',
        prompt: `The overnight low was **${lo}°C** and the afternoon high was **${hi}°C**. How many degrees apart are the two temperatures?`,
        answer: numeric(gap),
        hints: [
          'Distance apart is always positive — it measures the size of the gap, not its direction.',
          `Subtract and take the size — that is the move: |${hi} − (${lo})| — or walk the number line: ${lo} up to 0 is ${-lo} degrees, then 0 up to ${hi} is ${hi} more.`,
          `Worked path: ${-lo} + ${hi} = **${gap}**.`,
        ],
        explanation: `The gap is |${hi} − (${lo})| = |${gap}| = **${gap}** degrees. Crossing zero means the two sizes ADD: ${-lo} below zero plus ${hi} above it. Absolute value is exactly this distance idea — |a − b| measures how far apart a and b sit, no matter which is bigger or which side of zero they occupy.`,
        commonErrors: { concept: `Subtracting the sizes (getting ${Math.abs(hi + lo)}) treats both temperatures as if they sat on the same side of zero — these straddle it, so the distances add.` },
      }
    }
    if (mode === 'depths') {
      const d1 = rint(rng, 5, 40)
      let d2 = rint(rng, 5, 40)
      if (d2 === d1) d2 = d1 + rint(rng, 2, 6)
      const gap = Math.abs(d1 - d2)
      return {
        title: 'Metres apart',
        prompt: `A diver holds at **${-d1} m** (below the surface) and a reef shelf sits at **${-d2} m**. How many metres apart are they?`,
        answer: numeric(gap),
        hints: [
          'Both positions are below zero — the question is how far apart they sit, not how deep either one is.',
          `Subtract and take the size — that is the move: |(${-d1}) − (${-d2})| = |${d2 - d1}|.`,
          `Worked path: **${gap}** metres.`,
        ],
        explanation: `The distance is |(${-d1}) − (${-d2})| = |${d2 - d1}| = **${gap}** m. Same side of zero, so the distance is the DIFFERENCE of the two depths — adding them (${d1 + d2}) would count the stretch from the surface twice. Compare with two positions straddling zero, where the sizes add: the form |a − b| gets both cases right automatically, which is why it is the definition worth keeping.`,
        commonErrors: { slip: `Adding the two depths gives ${d1 + d2}, the total of two surface-distances — the question asks only for the gap between the positions.` },
      }
    }
    const a = -rint(rng, 2, 15)
    const b = rint(rng, 2, 15)
    const gap = b - a
    return {
      title: 'Distance on the number line',
      prompt: `How far apart are **${a}** and **${b}** on the number line?`,
      answer: numeric(gap),
      hints: [
        'Distance never carries a sign — it is the length of the stretch between the two points.',
        `Use the distance form — that is the move: |${a} − ${b}| — or walk it: ${a} to 0 is ${-a} steps, then 0 to ${b} is ${b} more.`,
        `Worked path: ${-a} + ${b} = **${gap}**.`,
      ],
      explanation: `|${a} − ${b}| = |${a - b}| = **${gap}**. The two points straddle zero, so their distances from zero add. This is the reading of absolute value that scales up later: |x − c| = r says "x is r away from c", which is exactly why such equations split into two cases — one solution on each side.`,
      commonErrors: { concept: `Subtracting one size from the other gives ${Math.abs(b + a)}, which treats the points as same-side — they straddle zero, so the sizes add instead.` },
    }
  },
)

const absBuild = tpl(
  { id: 'mtd-abs-build', name: 'Two solutions, one equation', skillIds: ['m-absolute'], bucket: 'math', difficulty: 3, variants: 40, minutes: 2.5, provenance: PROV_DEPTH },
  (rng, seed) => {
    const c = (seed % 8) + 1
    let r = 2 + (Math.floor(seed / 8) % 5)
    if (r === c) r = 7
    const lo = c - r
    const hi = c + r
    const eq = (center: number, dist: number) => (center < 0 ? `|x + ${-center}| = ${dist}` : `|x − ${center}| = ${dist}`)
    const { answer, distractorNotes, distractorTags } = mcqNoted(rng, eq(c, r), [
      [eq(r, c), `Center and distance are swapped: inside the bars lives the MIDPOINT (${c}), and the right side is the distance to each solution (${r}).`, 'representation'],
      [eq(lo, hi), `Built straight from the endpoints — but the bars want the midpoint and the half-gap, not the endpoints themselves. Its solutions would be ${lo + hi} and ${lo - hi}.`, 'concept'],
      [`x − ${c} = ${r}`, `Without the bars there is only ONE solution (${hi}); the bars are what create the two-sided split around ${c}.`, 'concept'],
    ])
    return {
      title: 'Rebuild the equation',
      prompt: `An absolute-value equation has exactly two solutions: **x = ${lo}** and **x = ${hi}**. Which equation is it?`,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'Two solutions sitting symmetrically around a middle point — the bars measure distance from that middle.',
        `Find the midpoint and the half-gap — that is the move: center = (${lo} + ${hi})/2 = ${c}, distance = (${hi} − ${lo})/2 = ${r}. Then write "x is ${r} away from ${c}" in symbols.`,
        `Worked path: **${eq(c, r)}**.`,
      ],
      explanation: `Both solutions sit ${r} away from ${c}: |${hi} − ${c}| = ${r} and |${lo} − ${c}| = ${r}, so the equation is **${eq(c, r)}**. This is the usual question run backwards, and the backwards direction exposes the anatomy: the number inside the bars is the CENTER of the two solutions, and the number on the right is their shared DISTANCE from it. Read every |x − c| = r that way and the two-case split stops being a rule to memorise.`,
      commonErrors: { representation: 'The two numbers in the equation are midpoint and radius — not the two solutions. Rebuilding from the endpoints without averaging them is the standard miss.' },
    }
  },
)

// ================================================================ m-piecewise

const piecewiseBranch = tpl(
  { id: 'mtd-piecewise-branch', name: 'Which piece owns the input?', skillIds: ['m-piecewise'], bucket: 'math', difficulty: 1, variants: 12, minutes: 2, provenance: PROV_DEPTH },
  (rng, seed) => {
    const position = seed % 3 // 0 below, 1 at the boundary, 2 above
    const cut = cycle(Math.floor(seed / 3), [2, 5, -1, 7] as const)
    const v = position === 0 ? cut - rint(rng, 1, 4) : position === 1 ? cut : cut + rint(rng, 1, 4)
    const a = rint(rng, 2, 5)
    const b = rint(rng, 1, 9)
    const cc = rint(rng, 2, 6)
    const first = v < cut
    const correct = first ? `The first rule, the one for x < ${cut}` : `The second rule, the one for x ≥ ${cut}`
    const wrongBranch = first ? `The second rule, the one for x ≥ ${cut}` : `The first rule, the one for x < ${cut}`
    const { answer, distractorNotes, distractorTags } = mcqNoted(rng, correct, [
      [
        wrongBranch,
        position === 1
          ? `The boundary belongs to exactly one side: the "x ≥ ${cut}" piece claims ${cut} itself (the equal bar), and the strict "x < ${cut}" piece does not.`
          : `Check the comparison slowly: ${v} ${first ? 'is' : 'is not'} less than ${cut}, so the ${first ? 'first' : 'second'} interval owns it.`,
        'misread',
      ],
      ['Both rules apply, so it has two outputs', 'A function must give ONE output per input — the intervals are built not to overlap, so each x belongs to exactly one piece.', 'concept'],
      ['Neither of the two rules covers it', `Together "x < ${cut}" and "x ≥ ${cut}" cover every number there is — nothing falls through the gap.`, 'concept'],
    ])
    return {
      title: 'Pick the piece',
      prompt: `A function is defined in two pieces:\n\nf(x) = **${a}x + ${b}** when x < ${cut}, and **${cc}x** when x ≥ ${cut}\n\nTo find **f(${v})**, which rule should you use?`,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'Do not compute anything yet — the only question is which interval the input lands in.',
        `Compare the input with the cut-off — that is the move: is ${v} less than ${cut}, or is it ${cut} or more? The sign carrying the equal bar (≥) is the one that owns the boundary itself.`,
        `Worked path: ${v} ${first ? '<' : '≥'} ${cut}, so the **${first ? 'first' : 'second'}** rule applies.`,
      ],
      explanation: `Since ${v} ${first ? `< ${cut}` : `≥ ${cut}`}, the ${first ? 'first' : 'second'} piece owns it${position === 1 ? ` — and the boundary case is the one worth slowing down for: ${cut} satisfies "x ≥ ${cut}" but not the strict "x < ${cut}", so the equal bar decides` : ''}. Choosing the branch is most of the skill with piecewise rules: the arithmetic afterwards is ordinary, and nearly every real mistake is a boundary or direction slip made in this first step.`,
      commonErrors: { misread: 'The boundary input goes to whichever piece carries the equal bar — read the two interval signs before touching the formulas.' },
    }
  },
)

const piecewiseReverse = tpl(
  { id: 'mtd-piecewise-reverse', name: 'From the fee back to the range', skillIds: ['m-piecewise'], bucket: 'math', difficulty: 3, variants: 18, minutes: 2.5, provenance: PROV_DEPTH },
  (rng, seed) => {
    const tier = seed % 3
    const shipping = Math.floor(seed / 3) % 2 === 0
    const f1 = rint(rng, 3, 5)
    const f2 = f1 + rint(rng, 2, 4)
    const f3 = f2 + rint(rng, 2, 4)
    const fees = [f1, f2, f3]
    const b1 = shipping ? cycle(Math.floor(seed / 6), [20, 25, 30] as const) : cycle(Math.floor(seed / 6), [2, 3, 4] as const)
    const b2 = b1 + (shipping ? rint(rng, 4, 6) * 5 : rint(rng, 2, 3))
    const bound = (x: number) => (shipping ? `$${x}` : `${x} hours`)
    const rowLabel = shipping ? 'Order total' : 'Time parked'
    const thing = shipping ? 'order total' : 'parking time'
    const subject = shipping ? 'One order paid a delivery fee of' : 'One driver paid a fee of'
    const ranges = [`Under ${bound(b1)}`, `At least ${bound(b1)} but under ${bound(b2)}`, `${bound(b2)} or more`]
    const table = `| ${rowLabel} | Fee |\n| --- | --- |\n| Under ${bound(b1)} | $${f1} |\n| At least ${bound(b1)}, under ${bound(b2)} | $${f2} |\n| ${bound(b2)} or more | $${f3} |`
    const others = [0, 1, 2].filter((i) => i !== tier)
    const { answer, distractorNotes, distractorTags } = mcqNoted(rng, ranges[tier], [
      [ranges[others[0]], `That row charges $${fees[others[0]]}, not the $${fees[tier]} that was actually paid.`, 'misread'],
      [ranges[others[1]], `That row charges $${fees[others[1]]}, not the $${fees[tier]} that was actually paid.`, 'misread'],
      ['It cannot be told from the fee alone', `Every tier charges a different amount here ($${f1}, $${f2}, $${f3}), so the fee pins down its tier exactly.`, 'incomplete'],
    ])
    return {
      title: 'Run the rule backwards',
      prompt: `${table}\n\n${subject} **$${fees[tier]}**. Which range must the ${thing} be in?`,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'Run the machine backwards: which inputs would have PRODUCED this output?',
        `Match the output to its row — that is the move: find $${fees[tier]} in the fee column and read off that row's interval, minding which row owns each boundary (exactly ${bound(b1)} belongs to the middle row, because it says "at least").`,
        `Worked path: **${ranges[tier]}**.`,
      ],
      explanation: `The fee $${fees[tier]} appears in exactly one row, so the ${thing} must be ${lcFirst(ranges[tier])}. Two features make the backwards read possible: every tier charges a DIFFERENT fee (if two rows matched, the fee alone could not decide), and each boundary belongs to exactly one row — exactly ${bound(b1)} costs $${f2}, not $${f1}. Forwards, a piecewise rule sends each input to one output; backwards, one output opens up into a whole interval of inputs.`,
      commonErrors: { misread: `The boundary is the sharp edge: exactly ${bound(b1)} lands in the middle row — "under ${bound(b1)}" stops just short of it.` },
    }
  },
)

// ================================================================ m-radicals

interface RadCase {
  expr: string
  correct: string
  d: [string, string, ErrorTag][]
}

const RAD_CASES: RadCase[] = [
  {
    expr: '³√x',
    correct: 'x^(1/3)',
    d: [
      ['x^3', 'The cube root UNDOES the cube, so its exponent is the reciprocal 1/3, not 3.', 'concept'],
      ['x^(1/2)', 'That would be the square root — the small 3 on the radical asks for a different root.', 'misread'],
      ['(1/3)x', 'Multiplying x by one third is a scaling move; taking a root is a different operation entirely.', 'concept'],
    ],
  },
  {
    expr: '⁴√x',
    correct: 'x^(1/4)',
    d: [
      ['x^4', 'The fourth root UNDOES the fourth power, so the exponent is the reciprocal 1/4.', 'concept'],
      ['x^(1/2)', 'That is the square root — applying it twice would give the fourth root, but on its own it is not.', 'misread'],
      ['(1/4)x', 'A quarter OF x is a scaling move, nothing like the fourth root of x.', 'concept'],
    ],
  },
  {
    expr: '⁵√x',
    correct: 'x^(1/5)',
    d: [
      ['x^5', 'The fifth root undoes the fifth power — its exponent is the reciprocal 1/5.', 'concept'],
      ['x^(1/2)', 'The square root is the DEFAULT radical; the little 5 changes which root is meant.', 'misread'],
      ['(1/5)x', 'One fifth of x is division by 5; the fifth root asks a multiplicative question instead.', 'concept'],
    ],
  },
  {
    expr: '(√x)^3',
    correct: 'x^(3/2)',
    d: [
      ['x^(2/3)', 'Flipped — the power 3 rides on top and the root 2 goes underneath: 3/2.', 'representation'],
      ['x^(1/6)', 'That multiplies 1/2 by 1/3, which is a root OF a root; the 3 here is a POWER, so it sits in the numerator.', 'concept'],
      ['x^3', 'The square root vanished — it contributes the 2 in the denominator of the exponent.', 'incomplete'],
    ],
  },
  {
    expr: '(³√x)^2',
    correct: 'x^(2/3)',
    d: [
      ['x^(3/2)', 'Flipped — the power 2 goes on top and the root 3 underneath: 2/3.', 'representation'],
      ['x^6', 'Root 3 with power 2 does not multiply into 6 — the root index divides, giving 2/3.', 'concept'],
      ['x^(1/6)', 'A sixth root would be a root of a root; the outer 2 is a power, so it goes in the numerator.', 'concept'],
    ],
  },
  {
    expr: '(⁴√x)^3',
    correct: 'x^(3/4)',
    d: [
      ['x^(4/3)', 'Flipped — the power 3 belongs on top and the root 4 underneath: 3/4.', 'representation'],
      ['x^12', 'Multiplying 4 by 3 turns a root into a huge power — the root index goes in the DENOMINATOR.', 'concept'],
      ['x^(1/12)', 'That would be a twelfth root, a root of a root; the 3 here is a power on top.', 'concept'],
    ],
  },
  {
    expr: '√(x^5)',
    correct: 'x^(5/2)',
    d: [
      ['x^(2/5)', 'Flipped — the 5 is the power on top; the square root contributes the 2 underneath.', 'representation'],
      ['x^3', 'Subtracting 2 from 5 borrows the division rule — a square root HALVES the exponent, giving 5/2.', 'concept'],
      ['x^10', 'Doubling belongs to squaring; the square root halves the exponent instead.', 'concept'],
    ],
  },
  {
    expr: '√(x^7)',
    correct: 'x^(7/2)',
    d: [
      ['x^(2/7)', 'Flipped — the 7 stays on top; the root supplies the 2 underneath.', 'representation'],
      ['x^5', 'Subtracting 2 from 7 mixes in the division rule — the root halves the exponent to 7/2.', 'concept'],
      ['x^14', 'Doubling is what SQUARING does; a square root halves the exponent.', 'concept'],
    ],
  },
]

const radicalNotation = tpl(
  { id: 'mtd-radical-notation', name: 'Radical, meet exponent', skillIds: ['m-radicals'], bucket: 'math', difficulty: 2, variants: 8, minutes: 2, provenance: PROV_DEPTH },
  (rng, seed) => {
    const c = cycle(seed, RAD_CASES)
    const { answer, distractorNotes, distractorTags } = mcqNoted(rng, c.correct, c.d)
    return {
      title: 'Translate the notation',
      prompt: `Written as a single power of x, what is **${c.expr}**? (Assume x > 0.)`,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'A radical is an exponent in different clothing — every root has a fractional-exponent spelling.',
        'Use the translation rule — that is the move: the POWER goes in the numerator and the ROOT index in the denominator, so (ⁿ√x)^m = x^(m/n).',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `${c.expr} = **${c.correct}**. The rule is forced, not decorative: exponents must add when powers multiply, and only the m/n form keeps that arithmetic working — for instance x^(1/n) multiplied by itself n times must give x^(n/n) = x, which is exactly what "nth root" means. Power on top, root underneath, and the whole radical language becomes ordinary exponent algebra.`,
      commonErrors: { representation: 'Nearly every miss here is a placement error — the root index belongs in the DENOMINATOR of the exponent. One check: a root makes things smaller-ish, and so does an exponent below 1.' },
    }
  },
)

const radicalProduct = tpl(
  { id: 'mtd-radical-product', name: 'Two roots, one product', skillIds: ['m-radicals'], bucket: 'math', difficulty: 3, variants: 18, minutes: 2.5, provenance: PROV_DEPTH },
  (_rng, seed) => {
    const k = cycle(seed, [2, 3, 5] as const)
    const m = cycle(Math.floor(seed / 3), [1, 2, 3] as const)
    const n = cycle(Math.floor(seed / 9), [1, 2] as const)
    const r1 = k * m * m
    const r2 = k * n * n
    const ans = k * m * n
    const [showA, showB] = seed % 2 === 0 ? [r1, r2] : [r2, r1]
    return {
      title: 'Multiply the radicals',
      prompt: `Compute: **√${showA} × √${showB}**\n\n(The result is a whole number.)`,
      answer: numeric(ans),
      hints: [
        'Two square roots multiply into a single one: the numbers under the roots multiply together.',
        `Combine under one radical — that is the move: √${showA} × √${showB} = √${r1 * r2}. Then ask what times itself gives ${r1 * r2}.`,
        `Worked path: √${r1 * r2} = **${ans}**, because ${ans} × ${ans} = ${r1 * r2}.`,
      ],
      explanation: `√${showA} × √${showB} = √(${showA} × ${showB}) = √${r1 * r2} = **${ans}** — the product rule holds because squaring the left side gives ${showA} × ${showB} directly. There is a second road to the same place: simplify each radical first (√${r1} = ${m}√${k} and √${r2} = ${n}√${k}), then multiply to get ${m * n} × ${k} = ${ans}. Neither number under a root was a perfect square, yet the product is one, because each hid the same leftover factor ${k}.`,
      commonErrors: { concept: `Adding the radicands (getting √${showA + showB}) mixes addition into a multiplication rule — under a radical, products merge but sums never do.` },
    }
  },
)

export const MATH_THIN_DEPTH_TEMPLATES: ItemTemplate[] = [
  ineqNumberLine,
  ineqWholeBoundary,
  variableReverse,
  variableRule,
  rationalSign,
  rationalMissing,
  unitsCompare,
  unitsRepair,
  evSpinner,
  evFair,
  condProbGiven,
  condProbNatFreq,
  inferMethod,
  inferEstimate,
  absDistance,
  absBuild,
  piecewiseBranch,
  piecewiseReverse,
  radicalNotation,
  radicalProduct,
]
