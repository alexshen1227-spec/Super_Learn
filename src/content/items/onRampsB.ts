/**
 * Foundation rungs, part two — the remaining thirty.
 *
 * `onRamps.ts` opened the fourteen skills whose easiest task was 4★. Thirty
 * more started at 3★ ("Combining — combine ideas without scaffolding, or
 * choose the method yourself"), which is still not a way IN: it is the rung
 * after the one a learner meeting the idea for the first time needs.
 *
 * With these, every skill in the tree has a 1★ or 2★ entry and the audit gate
 * drops from ENTRY_CEILING 3 to 2. See RESEARCH.md §32a for the measurement
 * that started this and `onRamps.ts` for the authoring rules — one idea, a
 * familiar form, an answer computed by the generator, and deliberately not a
 * shrunken copy of the hard task.
 */
import type { ItemTemplate } from '../../domain/types'
import { rint } from '../../engine/rng'
import { cycle, mcq, numeric, round, tpl } from '../lib'

/* ================================================================= math */

const scatterDirection = tpl(
  { id: 'onramp-bestfit', name: 'Which way does it lean?', skillIds: ['m-bestfit'], bucket: 'math', difficulty: 1, variants: 8, minutes: 2 },
  (rng, seed) => {
    const up = seed % 2 === 0
    const base = rint(rng, 10, 30)
    const step = rint(rng, 3, 8)
    const xs = [1, 2, 3, 4, 5]
    const ys = xs.map((x, i) => base + (up ? step * x : -step * x) + (i % 2 === 0 ? 1 : -1))
    const table = `| x | ${xs.join(' | ')} |\n| --- | ${xs.map(() => '---').join(' | ')} |\n| y | ${ys.join(' | ')} |`
    const correct = up ? 'Positive — as x goes up, y tends to go up' : 'Negative — as x goes up, y tends to go down'
    return {
      title: 'Direction of association',
      prompt: `Five paired measurements:\n\n${table}\n\nWhat is the **direction** of the association?`,
      answer: mcq(rng, correct, [
        up ? 'Negative — as x goes up, y tends to go down' : 'Positive — as x goes up, y tends to go up',
        'No association — y does not change with x',
        'You cannot tell direction from only five points',
      ]),
      hints: [
        'Read the y row from left to right and ask only one thing: is it generally climbing or generally falling?',
        `The y values are ${ys.join(', ')}.`,
        `Worked path: **${correct}**`,
      ],
      explanation:
        `**${correct}**. The y values run ${ys.join(', ')}, so they ${up ? 'climb' : 'fall'} overall — the small wobble either side does not change the direction.\n\n` +
        `Direction is the first thing to read off a scatter, before strength and long before any line. Everything later in this skill — trend lines, residuals, and the warning about overclaiming — assumes you can name it.`,
    }
  },
)

const evOneOutcome = tpl(
  { id: 'onramp-ev', name: 'One outcome, one chance', skillIds: ['m-ev'], bucket: 'math', difficulty: 1, variants: 10, minutes: 2 },
  (rng) => {
    const denom = cycleOf(rng, [2, 4, 5, 10])
    const prize = denom * rint(rng, 2, 9)
    const ev = prize / denom
    return {
      title: 'Expected value, one outcome',
      prompt:
        `A game pays **$${prize}** if you win and **$0** if you lose. You win **1 time in ${denom}**.\n\n` +
        `On average, how many dollars does one play pay? (Number only.)`,
      answer: numeric(ev),
      hints: [
        'Average payout = what you win × how often you win it.',
        `That is $${prize} × 1/${denom}.`,
        `Worked path: ${prize} ÷ ${denom} = **${ev}**.`,
      ],
      explanation:
        `$${prize} × 1/${denom} = **$${ev}** per play.\n\n` +
        `Note what this number is and is not: no single play ever pays $${ev} — you get $${prize} or nothing. It is the long-run average, and that is exactly what makes it the right thing to compare a price against.`,
    }
  },
)

const spreadCompare = tpl(
  { id: 'onramp-hsdata', name: 'Which set is more spread out?', skillIds: ['m-hsdata'], bucket: 'math', difficulty: 1, variants: 10, minutes: 2 },
  (rng) => {
    const centre = rint(rng, 20, 60)
    const tight = rint(rng, 1, 3)
    const wide = rint(rng, 8, 15)
    const a = [centre - tight, centre, centre + tight, centre]
    const b = [centre - wide, centre, centre + wide, centre]
    return {
      title: 'Spread',
      prompt:
        `Two sets, both with a mean of ${centre}:\n\n` +
        `Set A: ${a.join(', ')}\nSet B: ${b.join(', ')}\n\n` +
        `What is the **range** of the more spread-out set? (Largest minus smallest.)`,
      answer: numeric(2 * wide),
      hints: [
        'Spread is about how far the values sit from each other, not where the middle is.',
        `Set A runs from ${centre - tight} to ${centre + tight}; Set B runs from ${centre - wide} to ${centre + wide}.`,
        `Worked path: ${centre + wide} − ${centre - wide} = **${2 * wide}**.`,
      ],
      explanation:
        `Set B is the wider one, and its range is ${centre + wide} − ${centre - wide} = **${2 * wide}** (Set A's is only ${2 * tight}).\n\n` +
        `Both sets have the same mean, which is the whole point: a centre tells you nothing about spread. Standard deviation later in this skill is a more careful version of the same question — how far from the middle do the values usually sit?`,
    }
  },
)

const absoluteValue = tpl(
  { id: 'onramp-absolute', name: 'Distance from zero', skillIds: ['m-absolute'], bucket: 'math', difficulty: 1, variants: 12, minutes: 1.5 },
  (rng, seed) => {
    const n = rint(rng, 2, 19)
    const negative = seed % 2 === 0
    const inside = negative ? -n : n
    return {
      title: 'Absolute value',
      prompt: `The bars mean "distance from zero", which is never negative.\n\nWhat is **|${inside}|**?`,
      answer: numeric(n),
      hints: [
        'Ask how far the number sits from zero on the number line, ignoring which side.',
        `${inside} is ${n} steps from zero.`,
        `Worked path: **${n}**.`,
      ],
      explanation:
        `|${inside}| = **${n}**${negative ? `, because ${inside} is ${n} away from zero even though it sits on the left` : ''}.\n\n` +
        `Reading it as distance rather than "make it positive" is what makes the harder work possible: |x| = ${n} has TWO answers, ${n} and −${n}, precisely because two different points are ${n} from zero. That split is the whole topic.`,
    }
  },
)

const systemCheck = tpl(
  { id: 'onramp-systems', name: 'Does the pair fit both?', skillIds: ['m-systems'], bucket: 'math', difficulty: 2, variants: 10, minutes: 2 },
  (rng, seed) => {
    const x = rint(rng, 1, 8)
    const y = rint(rng, 1, 8)
    const a = rint(rng, 1, 4)
    const b = rint(rng, 1, 4)
    const s1 = a * x + b * y
    const s2 = x + y
    const fits = seed % 2 === 0
    const tryX = fits ? x : x + rint(rng, 1, 3)
    const tryY = fits ? y : y
    const ok1 = a * tryX + b * tryY === s1
    const ok2 = tryX + tryY === s2
    const both = ok1 && ok2
    return {
      title: 'Checking a solution',
      prompt:
        `A solution to a PAIR of equations has to satisfy **both** of them.\n\n` +
        `Equation 1: ${a}x + ${b}y = ${s1}\nEquation 2: x + y = ${s2}\n\n` +
        `Is **x = ${tryX}, y = ${tryY}** a solution to the pair? Answer **1** for yes, **0** for no.`,
      answer: numeric(both ? 1 : 0),
      hints: [
        'Substitute into the first equation and see whether it balances. Then do the same for the second.',
        `Equation 1 gives ${a}×${tryX} + ${b}×${tryY} = ${a * tryX + b * tryY}, against ${s1}. Equation 2 gives ${tryX} + ${tryY} = ${tryX + tryY}, against ${s2}.`,
        `Worked path: **${both ? 1 : 0}**.`,
      ],
      explanation:
        `Equation 1: ${a}×${tryX} + ${b}×${tryY} = ${a * tryX + b * tryY} ${ok1 ? '=' : '≠'} ${s1}. ` +
        `Equation 2: ${tryX} + ${tryY} = ${tryX + tryY} ${ok2 ? '=' : '≠'} ${s2}. So the answer is **${both ? 1 : 0}**.\n\n` +
        `Satisfying one equation is easy — infinitely many pairs do. A solution to a SYSTEM is a pair that satisfies every equation at once, which is why the graphs meet at a point rather than overlapping along a line.`,
    }
  },
)

const piecewiseEvaluate = tpl(
  { id: 'onramp-piecewise', name: 'Which rule applies?', skillIds: ['m-piecewise'], bucket: 'math', difficulty: 2, variants: 10, minutes: 2 },
  (rng, seed) => {
    const cut = rint(rng, 3, 9)
    const lowRate = rint(rng, 2, 5)
    const highRate = lowRate + rint(rng, 1, 4)
    const below = seed % 2 === 0
    const input = below ? Math.max(0, cut - rint(rng, 1, 2)) : cut + rint(rng, 1, 4)
    const out = input < cut ? lowRate * input : highRate * input
    return {
      title: 'Piecewise rule',
      prompt:
        `A printer charges **$${lowRate} per page** for the first ${cut} pages, and **$${highRate} per page** for any order of ${cut} pages or more:\n\n` +
        `cost(p) = ${lowRate}p when p < ${cut}, and ${highRate}p when p ≥ ${cut}\n\n` +
        `What is **cost(${input})**, in dollars?`,
      answer: numeric(out),
      hints: [
        'Two steps, in order: first decide WHICH rule the input falls under, then use only that one.',
        `Is ${input} below ${cut}, or ${cut} and above? ${input < cut ? 'Below' : 'At or above'}.`,
        `Worked path: ${input < cut ? lowRate : highRate} × ${input} = **${out}**.`,
      ],
      explanation:
        `${input} is ${input < cut ? `below ${cut}, so the first rule applies` : `at least ${cut}, so the second rule applies`}: ${input < cut ? lowRate : highRate} × ${input} = **$${out}**.\n\n` +
        `Choosing the branch is the whole skill, and it is where nearly every mistake lives. The arithmetic afterwards is ordinary; picking the wrong side of the cut-off is not.`,
    }
  },
)

const doublingGrowth = tpl(
  { id: 'onramp-exponential', name: 'Repeated multiplication', skillIds: ['m-exponential'], bucket: 'math', difficulty: 1, variants: 12, minutes: 2 },
  (rng) => {
    const start = rint(rng, 2, 9)
    const factor = cycleOf(rng, [2, 3])
    const steps = rint(rng, 3, 5)
    const end = start * factor ** steps
    return {
      title: 'Growth factor',
      prompt:
        `A colony starts at **${start}** and **multiplies by ${factor}** every hour.\n\n` +
        `How many are there after **${steps} hours**?`,
      answer: numeric(end),
      hints: [
        'Growth like this multiplies each step — it does not add the same amount each step.',
        `${start}${` × ${factor}`.repeat(steps)}`,
        `Worked path: ${start} × ${factor}^${steps} = **${end}**.`,
      ],
      explanation:
        `${start} × ${factor}^${steps} = **${end}**.\n\n` +
        `The single most useful contrast in this topic: adding ${factor} each hour would have reached ${start + factor * steps}. Multiplying reached ${end}. Linear growth adds a fixed AMOUNT; exponential growth multiplies by a fixed FACTOR, and over a few steps the gap becomes enormous.`,
    }
  },
)

const complexBasics = tpl(
  { id: 'onramp-complex', name: 'What i actually is', skillIds: ['m-complex'], bucket: 'math', difficulty: 1, variants: 4, minutes: 2 },
  (rng, seed) => {
    const k = rint(rng, 2, 9)
    const ask = cycle(seed, ['square', 'multiple', 'square', 'multiple', 'square', 'multiple', 'square', 'multiple'] as const)
    const value = ask === 'square' ? -1 : -k
    return {
      title: 'The imaginary unit',
      prompt:
        `The imaginary unit **i** is defined by one rule: **i² = −1**.\n\n` +
        (ask === 'square'
          ? `What is **i²**?`
          : `What is **${k}i²**? (Use the rule, then multiply.)`),
      answer: numeric(value),
      hints: [
        'There is nothing to work out — i² is defined to be −1. Everything else follows from substituting that in.',
        ask === 'square' ? 'The definition IS the answer.' : `${k}i² = ${k} × (i²) = ${k} × (−1).`,
        `Worked path: **${value}**.`,
      ],
      explanation:
        (ask === 'square'
          ? `**−1**, by definition.`
          : `${k}i² = ${k} × (−1) = **${-k}**.`) +
        `\n\nWhy mathematicians bothered: no real number squares to a negative, so x² + 1 = 0 had no solution. Defining one symbol that does fixes that — and it turns out every real-coefficient quadratic then has roots, which is the result this skill is heading toward.`,
    }
  },
)

const triangleInequality = tpl(
  { id: 'onramp-geoconstruct', name: 'Can these sides close?', skillIds: ['m-geoconstruct'], bucket: 'math', difficulty: 2, variants: 10, minutes: 2 },
  (rng, seed) => {
    const a = rint(rng, 3, 9)
    const b = rint(rng, 3, 9)
    const possible = seed % 2 === 0
    const c = possible ? Math.max(1, a + b - rint(rng, 1, Math.max(1, a + b - 2))) : a + b + rint(rng, 1, 4)
    const works = a + b > c && a + c > b && b + c > a
    return {
      title: 'Triangle inequality',
      prompt:
        `Two short sides can only close into a triangle if together they are LONGER than the third.\n\n` +
        `Can sides **${a}**, **${b}** and **${c}** form a triangle? Answer **1** for yes, **0** for no.`,
      answer: numeric(works ? 1 : 0),
      hints: [
        'Add the two shorter sides and compare with the longest one.',
        `Sorted: ${[a, b, c].sort((x, y) => x - y).join(', ')}. Is the sum of the first two more than the third?`,
        `Worked path: **${works ? 1 : 0}**.`,
      ],
      explanation: (() => {
        const [p, q, r] = [a, b, c].sort((x, y) => x - y)
        return (
          `Sorted, the sides are ${p}, ${q}, ${r}. ${p} + ${q} = ${p + q}, which is ${p + q > r ? 'more' : 'not more'} than ${r}, so the answer is **${works ? 1 : 0}**.\n\n` +
          `Picture it: hinge the two shorter sides at their ends and swing them toward each other. If together they cannot reach across the longest side, they never meet and there is no triangle. Every construction question in this skill starts from whether the figure can exist at all.`
        )
      })(),
    }
  },
)

const prismVolume = tpl(
  { id: 'onramp-solidgeometry', name: 'Volume as stacked layers', skillIds: ['m-solidgeometry'], bucket: 'math', difficulty: 1, variants: 12, minutes: 2 },
  (rng) => {
    const w = rint(rng, 2, 9)
    const d = rint(rng, 2, 9)
    const h = rint(rng, 2, 9)
    return {
      title: 'Volume of a prism',
      prompt:
        `A box is **${w} × ${d}** on the base and **${h}** tall.\n\n` +
        `Its volume is the base area times the height. What is the volume, in cubic units?`,
      answer: numeric(w * d * h),
      hints: [
        'Work out the area of one flat layer first, then ask how many such layers are stacked.',
        `Base area = ${w} × ${d} = ${w * d}, and there are ${h} layers of it.`,
        `Worked path: ${w * d} × ${h} = **${w * d * h}**.`,
      ],
      explanation:
        `Base area ${w} × ${d} = ${w * d}; stacked ${h} high gives **${w * d * h}** cubic units.\n\n` +
        `"Base area × height" is worth holding onto as the IDEA rather than the formula, because it is the same idea that makes a cylinder πr²h and, in a stranger form, gives a cone and pyramid their one-third. Cavalieri's principle later in this skill is just this observation taken seriously: same layers, same volume, however the stack leans.`,
    }
  },
)

const circleEquation = tpl(
  { id: 'onramp-conics', name: 'Read a circle off its equation', skillIds: ['m-conics'], bucket: 'math', difficulty: 2, variants: 12, minutes: 2 },
  (rng, seed) => {
    const h = rint(rng, -6, 6)
    const k = rint(rng, -6, 6)
    const r = rint(rng, 2, 9)
    const wantRadius = seed % 2 === 0
    const sx = h >= 0 ? `− ${h}` : `+ ${-h}`
    const sy = k >= 0 ? `− ${k}` : `+ ${-k}`
    return {
      title: 'Circle from its equation',
      prompt:
        `A circle with centre (h, k) and radius r has equation **(x − h)² + (y − k)² = r²**.\n\n` +
        `Given **(x ${sx})² + (y ${sy})² = ${r * r}**, what is its **${wantRadius ? 'radius' : 'centre x-coordinate'}**?`,
      answer: numeric(wantRadius ? r : h),
      hints: [
        wantRadius
          ? 'The right-hand side is r SQUARED, not r.'
          : 'The number inside the bracket is subtracted from x, so read off what makes the bracket zero.',
        wantRadius ? `r² = ${r * r}.` : `x ${sx} = 0 when x = ${h}.`,
        `Worked path: **${wantRadius ? r : h}**.`,
      ],
      explanation:
        wantRadius
          ? `r² = ${r * r}, so r = **${r}**. Taking the square root is the step people skip — the equation stores the radius squared, never the radius.`
          : `The bracket (x ${sx}) is zero when x = **${h}**, so that is the centre's x-coordinate. Watch the sign: a "− ${h}" in the equation means the centre is at +${h}, not −${h}.`,
    }
  },
)

const modelMeaning = tpl(
  { id: 'onramp-model', name: 'What does that number mean?', skillIds: ['m-model'], bucket: 'math', difficulty: 2, variants: 6, minutes: 2 },
  (rng, seed) => {
    const flat = rint(rng, 2, 9)
    const rate = rint(rng, 2, 9)
    const cases = [
      { ctx: `A taxi charges a flat fee plus a rate per mile: C = ${flat} + ${rate}m`, unit: 'mile', a: 'The fee charged before you travel at all', b: `The cost of each ${'mile'}` },
      { ctx: `A gym charges a joining fee plus a monthly rate: C = ${flat} + ${rate}m`, unit: 'month', a: 'The one-off cost of joining', b: 'The cost of each month' },
      { ctx: `A printing job costs a setup fee plus a rate per copy: C = ${flat} + ${rate}m`, unit: 'copy', a: 'The setup cost before any copies', b: 'The cost of each copy' },
    ]
    const c = cycle(seed, cases)
    const askFlat = seed % 2 === 0
    const correct = askFlat ? c.a : c.b
    return {
      title: 'Reading a model',
      prompt: `${c.ctx}\n\nWhat does the **${askFlat ? flat : rate}** represent?`,
      answer: mcq(rng, correct, [
        askFlat ? c.b : c.a,
        'The total cost',
        `The number of ${c.unit}s`,
      ]),
      hints: [
        'Ask what happens when m = 0. Whatever is left over is the part that does not depend on the quantity.',
        `Set m = 0: C = ${flat}. So ${flat} is the part you pay regardless.`,
        `Worked path: **${correct}**`,
      ],
      explanation:
        `**${correct}**\n\n` +
        `Every symbol in a model should have a meaning you can say out loud in the language of the situation. That is the difference between modelling and algebra: the check at the end — "does ${flat} being the ${askFlat ? 'flat part' : 'rate'} make sense here?" — is only possible if each piece means something.`,
    }
  },
)

const proofOneCase = tpl(
  { id: 'onramp-proof', name: 'How much does one example prove?', skillIds: ['m-proof'], bucket: 'math', difficulty: 1, variants: 4, minutes: 2 },
  (rng, seed) => {
    const cases = [
      { claim: 'Every number in this list is even', kind: 'all' },
      { claim: 'All squares of whole numbers end in 0, 1, 4, 5, 6 or 9', kind: 'all' },
      { claim: 'Some whole number is both even and a multiple of 7', kind: 'some' },
      { claim: 'There exists a shape with four equal sides and no right angles', kind: 'some' },
    ]
    const c = cycle(seed, cases)
    const isAll = c.kind === 'all'
    const correct = isAll
      ? 'One example that FAILS the claim disproves it; no number of examples that fit can prove it'
      : 'One example that FITS the claim proves it outright'
    return {
      title: 'Examples and counterexamples',
      prompt: `Consider the claim: **"${c.claim}"**\n\nWhat can a single example do to it?`,
      answer: mcq(rng, correct, [
        isAll
          ? 'One example that FITS the claim proves it outright'
          : 'One example that FAILS the claim disproves it; no number of examples that fit can prove it',
        'A single example can neither prove nor disprove any claim',
        'Examples settle it either way, as long as you check at least three',
      ]),
      hints: [
        'Read the quantity word first: does the claim say EVERY/ALL, or does it say SOME/THERE EXISTS?',
        isAll
          ? 'An "every" claim covers infinitely many cases, so checking a few cannot cover them all — but one failure is enough to break it.'
          : 'A "some" claim only needs one case to be true, so producing one settles it.',
        `Worked path: **${correct}**`,
      ],
      explanation:
        `**${correct}**\n\n` +
        `The asymmetry is the point, and it runs the whole of proof. "For all" claims are cheap to destroy and expensive to establish; "there exists" claims are the exact reverse. Before doing any work on a claim, read its quantity word and you will know which job you are being asked to do.`,
    }
  },
)

const pairingSum = tpl(
  { id: 'onramp-nonroutine', name: 'Look for the structure', skillIds: ['m-nonroutine'], bucket: 'math', difficulty: 2, variants: 5, minutes: 2.5 },
  (rng) => {
    const n = rint(rng, 4, 12) * 2
    const total = (n * (n + 1)) / 2
    return {
      title: 'Adding without adding',
      prompt:
        `Add every whole number from **1 to ${n}**.\n\n` +
        `You can grind through it — or pair the first with the last, the second with the second-last, and notice something.`,
      answer: numeric(total),
      hints: [
        `Try the pairs: 1 + ${n}, 2 + ${n - 1}, 3 + ${n - 2}. What do you notice about each total?`,
        `Every pair adds to ${n + 1}, and there are ${n / 2} pairs.`,
        `Worked path: ${n / 2} × ${n + 1} = **${total}**.`,
      ],
      explanation:
        `Each pair sums to ${n + 1}, and ${n} numbers make ${n / 2} pairs: ${n / 2} × ${n + 1} = **${total}**.\n\n` +
        `Nothing here required a formula you had to know in advance — it required noticing that the list is symmetric and using that. That is what "non-routine" means in this skill: the method is not handed to you, so the move is to look for structure before you start calculating.`,
    }
  },
)

/* =============================================================== coding */

const traceTwoVars = tpl(
  { id: 'onramp-ctrace', name: 'Track the values by hand', skillIds: ['c-trace'], bucket: 'coding', difficulty: 1, variants: 12, minutes: 2 },
  (rng) => {
    const a0 = rint(rng, 2, 9)
    const b0 = rint(rng, 2, 9)
    const a1 = a0 + b0
    const b1 = a1 - b0
    return {
      title: 'Tracing assignments',
      prompt:
        'Run this by hand, one line at a time:\n\n```\n' +
        `a = ${a0}\nb = ${b0}\na = a + b\nb = a - b\n` +
        '```\n\nWhat is the final value of **b**?',
      answer: numeric(b1),
      hints: [
        'Keep a two-column table and rewrite a value only on the line that assigns to it.',
        `After line 3, a = ${a0} + ${b0} = ${a1} and b is still ${b0}.`,
        `Worked path: b = ${a1} − ${b0} = **${b1}**.`,
      ],
      explanation:
        `a starts at ${a0}, b at ${b0}. Line 3 makes a = ${a1}. Line 4 then uses the NEW a: b = ${a1} − ${b0} = **${b1}**.\n\n` +
        `The one habit worth building here: an assignment uses the values as they are at that moment, not as they were written at the top. Keeping a running table costs seconds and removes almost every tracing error.`,
    }
  },
)

const searchCount = tpl(
  { id: 'onramp-calgo', name: 'How many checks, worst case?', skillIds: ['c-algo'], bucket: 'coding', difficulty: 1, variants: 10, minutes: 2 },
  (rng) => {
    const n = rint(rng, 5, 40)
    return {
      title: 'Linear search',
      prompt:
        `A linear search looks at each item in turn until it finds what it wants.\n\n` +
        `In a list of **${n}** items, what is the largest number of items it might have to look at?`,
      answer: numeric(n),
      hints: [
        'Worst case means the least lucky arrangement. Where would the item have to be?',
        'If it is the very last one — or not there at all — every item gets checked.',
        `Worked path: **${n}**.`,
      ],
      explanation:
        `**${n}** — the target could be last, or absent, and either way every item is examined.\n\n` +
        `Worst case is the number worth quoting because it is a promise rather than a hope. It is also the number that makes binary search look impressive later: on ${n} sorted items it needs about ${Math.ceil(Math.log2(n + 1))} checks instead of ${n}.`,
    }
  },
)

const growthCompare = tpl(
  { id: 'onramp-ccomplexity', name: 'What happens when the input doubles?', skillIds: ['c-complexity'], bucket: 'coding', difficulty: 2, variants: 3, minutes: 2 },
  (rng, seed) => {
    const cases = [
      { kind: 'a fixed number of steps, whatever the size', correct: 'It stays the same', why: 'constant work does not depend on the input at all' },
      { kind: 'one step per item', correct: 'It roughly doubles', why: 'twice the items means twice the steps' },
      { kind: 'one step for every PAIR of items', correct: 'It roughly quadruples', why: 'doubling the items multiplies the number of pairs by about four' },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Scaling',
      prompt:
        `An algorithm does **${c.kind}**.\n\n` +
        `If you **double** the number of items, what happens to the work?`,
      answer: mcq(rng, c.correct, ['It stays the same', 'It roughly doubles', 'It roughly quadruples', 'It roughly halves'].filter((x) => x !== c.correct)),
      hints: [
        'Try it with small numbers: work out the steps for 10 items, then for 20.',
        'Ask whether the work is tied to the number of items, to the number of pairs, or to neither.',
        `Worked path: **${c.correct}** — ${c.why}.`,
      ],
      explanation:
        `**${c.correct}**, because ${c.why}.\n\n` +
        `This "what happens when I double it?" question is the whole of complexity in one move. It is more useful than counting exact steps, because it survives faster hardware: quadrupling stays quadrupling on a machine ten times quicker.`,
    }
  },
)

/* ============================================================== science */

const correlationMeaning = tpl(
  { id: 'onramp-scorr', name: 'What a correlation actually says', skillIds: ['s-corr'], bucket: 'science', difficulty: 1, variants: 4, minutes: 2 },
  (rng, seed) => {
    const cases = [
      'Towns with more libraries tend to have more coffee shops.',
      'People who own more umbrellas tend to have higher heating bills.',
      'Students with longer commutes tend to own more headphones.',
      'Cities with more bicycles tend to have more parks.',
    ]
    const c = cycle(seed, cases)
    const correct = 'The two tend to go together — nothing yet about one causing the other'
    return {
      title: 'Reading a correlation',
      prompt: `A study reports: **${c}**\n\nWhat has been established so far?`,
      answer: mcq(rng, correct, [
        'The first one is what causes the second one to happen',
        'The second one is what causes the first one to happen',
        'Nothing at all — a correlation of this kind is simply meaningless',
      ]),
      hints: [
        'Separate two different questions: do they move together, and does one make the other happen?',
        'The study measured the first. It has not looked at the second.',
        `Worked path: **${correct}**`,
      ],
      explanation:
        `**${correct}**.\n\n` +
        `A correlation is a real, useful observation — the last option is wrong too, and over-scepticism is its own error. What it is not is a cause. The rest of this skill is about the three explanations that remain open once you see one: the first causes the second, the second causes the first, or something else causes both.`,
    }
  },
)

const controlGroup = tpl(
  { id: 'onramp-sdesign', name: 'Which group is the control?', skillIds: ['s-design'], bucket: 'science', difficulty: 1, variants: 5, minutes: 2 },
  (rng, seed) => {
    const cases = [
      { setup: 'Half the plants get the new fertiliser; half get nothing extra.', control: 'The plants that got nothing extra' },
      { setup: 'Half the class uses the new study app; half studies as usual.', control: 'The students who studied as usual' },
      { setup: 'Half the patients get the drug; half get an identical-looking pill with no drug in it.', control: 'The patients who got the inactive pill' },
      { setup: 'Half the runners wear the new shoe; half wear their normal shoe.', control: 'The runners in their normal shoe' },
      { setup: 'Half the shops display the new sign; half keep the old layout.', control: 'The shops that kept the old layout' },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Control group',
      prompt: `${c.setup}\n\nWhich group is the **control**?`,
      answer: mcq(rng, c.control, [
        c.setup.split(';')[0].replace('Half the', 'The').replace(/ get | uses | wear | display /, (m) => m.replace('s ', ' ')).trim(),
        'Both groups together',
        'Neither — this study has no control',
      ]),
      hints: [
        'The control is the group that does NOT get the thing being tested.',
        'It exists to answer one question: what would have happened anyway?',
        `Worked path: **${c.control}**`,
      ],
      explanation:
        `**${c.control}**.\n\n` +
        `Without it, any change could be the season, the weather, practice, or growing up. The control is the comparison that turns "things got better" into "things got better **because of this**", and it is the single feature that most separates a study you can learn from from one you cannot.`,
    }
  },
)

const axisStartsAtZero = tpl(
  { id: 'onramp-sgraphs', name: 'Where does the axis start?', skillIds: ['s-graphs'], bucket: 'science', difficulty: 1, variants: 8, minutes: 2 },
  (rng, seed) => {
    const truncated = seed % 2 === 0
    const low = truncated ? rint(rng, 40, 90) : 0
    const barA = low + rint(rng, 5, 20)
    const barB = barA + rint(rng, 3, 12)
    const correct = truncated
      ? `No — it starts at ${low}, so the bars exaggerate the difference`
      : 'Yes — it starts at 0, so bar heights can be compared directly'
    return {
      title: 'Axis check',
      prompt:
        `A bar chart shows two values, ${barA} and ${barB}. Its vertical axis runs from **${low}** to ${barB + 5}.\n\n` +
        `Can the bar heights be trusted as a fair picture of the difference?`,
      answer: mcq(rng, correct, [
        truncated
          ? 'Yes — it starts at 0, so bar heights can be compared directly'
          : `No — it starts at ${low}, so the bars exaggerate the difference`,
        'It does not matter where the axis starts',
        'You would need the raw data to say anything at all',
      ]),
      hints: [
        'Look at the bottom of the vertical axis before you look at the bars.',
        'A bar only represents a quantity honestly when its length is measured from zero.',
        `Worked path: **${correct}**`,
      ],
      explanation:
        `**${correct}**\n\n` +
        (truncated
          ? `Starting at ${low} means each bar only draws the part above ${low}, so a difference of ${barB - barA} out of ${barB} fills a large share of the plot. The numbers are honest; the picture is not.`
          : `A zero baseline is what makes "twice as tall" mean "twice as much". It is the first thing to check on any bar chart, and the most common thing missing.`),
    }
  },
)

const roundToPowerOfTen = tpl(
  { id: 'onramp-sfermi', name: 'Nearest power of ten', skillIds: ['s-fermi'], bucket: 'science', difficulty: 1, variants: 10, minutes: 2 },
  (rng) => {
    const exp = rint(rng, 2, 6)
    const lead = rint(rng, 1, 9)
    const value = lead * 10 ** exp
    // Round to the nearest power of ten: leading digit >= 5 rounds up an order.
    const rounded = lead >= 5 ? 10 ** (exp + 1) : 10 ** exp
    return {
      title: 'Order of magnitude',
      prompt:
        `Estimating starts by throwing away precision on purpose.\n\n` +
        `Round **${value.toLocaleString('en-US')}** to the nearest power of ten (1, 10, 100, 1000, …). Give the number, no commas.`,
      answer: numeric(rounded),
      hints: [
        'You are choosing between two neighbours: the power of ten below it and the one above.',
        `Those are ${(10 ** exp).toLocaleString('en-US')} and ${(10 ** (exp + 1)).toLocaleString('en-US')}. Which is ${value.toLocaleString('en-US')} closer to on a multiplying scale?`,
        `Worked path: **${rounded}**.`,
      ],
      explanation:
        `**${rounded.toLocaleString('en-US')}**. The leading digit is ${lead}, so it sits ${lead >= 5 ? 'nearer the power above' : 'nearer the power below'}.\n\n` +
        `Deliberately losing accuracy is what makes a Fermi estimate fast, and it costs less than it looks: if every factor in a chain is right to the nearest power of ten, the answer is usually within a factor of ten too — which is often all the decision needed.`,
    }
  },
)

const percentPoints = tpl(
  { id: 'onramp-ssources', name: 'Percent or percentage points?', skillIds: ['s-sources'], bucket: 'science', difficulty: 1, variants: 10, minutes: 2 },
  (rng) => {
    const from = rint(rng, 10, 40)
    const to = from + rint(rng, 5, 30)
    const points = to - from
    return {
      title: 'Percent vs percentage points',
      prompt:
        `A figure rises from **${from}%** to **${to}%**.\n\n` +
        `By how many **percentage points** did it rise? (Number only.)`,
      answer: numeric(points),
      hints: [
        'Percentage points are the plain difference between the two percentages.',
        `${to} − ${from}.`,
        `Worked path: **${points}**.`,
      ],
      explanation:
        `${to} − ${from} = **${points} percentage points**.\n\n` +
        `The same change is also a rise of ${round((points / from) * 100, 1)}% **relative to the starting figure**, and both numbers are true. Which one gets printed is a choice, and the bigger-sounding one usually wins — so when a headline quotes a percentage change, the first question is "percent of what?".`,
    }
  },
)

/* ========================================================= investigator */

const baseRateCount = tpl(
  { id: 'onramp-ibayes', name: 'Start with the base rate', skillIds: ['i-bayes'], bucket: 'investigator', difficulty: 1, variants: 4, minutes: 2 },
  (rng) => {
    const population = cycleOf(rng, [1000, 2000, 5000, 10_000])
    const rate = cycleOf(rng, [1, 2, 5])
    const have = (population * rate) / 100
    return {
      title: 'Natural frequencies',
      prompt:
        `Out of **${population.toLocaleString('en-US')}** people, **${rate}%** have a certain condition.\n\n` +
        `How many people is that? (Number only.)`,
      answer: numeric(have),
      hints: [
        'Percentages are hard to reason with. Turn it into a count of actual people first.',
        `${rate}% of ${population.toLocaleString('en-US')} means ${rate} out of every 100.`,
        `Worked path: ${population} × ${rate} ÷ 100 = **${have}**.`,
      ],
      explanation:
        `${population.toLocaleString('en-US')} × ${rate}% = **${have.toLocaleString('en-US')}** people, leaving ${(population - have).toLocaleString('en-US')} without it.\n\n` +
        `This translation is not a warm-up, it IS the method. Presented as percentages and conditional probabilities, most people — including doctors and lawyers in the published studies — get test-accuracy questions wrong. Presented as counts of people, far more get them right, and the reason is exactly this step.`,
    }
  },
)

const distinguishingTest = tpl(
  { id: 'onramp-ihypo', name: 'Which check tells them apart?', skillIds: ['i-hypo'], bucket: 'investigator', difficulty: 2, variants: 4, minutes: 2.5 },
  (rng, seed) => {
    const cases = [
      {
        setup: 'Your bike light will not turn on. Either the battery is flat, or the bulb has blown.',
        correct: 'Put the same battery in a different light and see whether that one works',
        wrong: ['Press the switch again, rather harder this time', 'Check whether the light is made by a brand that you actually trust', 'Ask a friend which of the two they think it is'],
        why: 'a working light with this battery rules the battery out; a dead one rules the bulb out. Either result eliminates one explanation.',
      },
      {
        setup: 'Plants on one windowsill are wilting. Either they are underwatered, or that sill is too hot.',
        correct: 'Move half the plants to a cooler sill and keep watering everything the same',
        wrong: ['Water every one of them rather more', 'Look up how much water a species like this one usually needs each week', 'Wait for a week and then see what happens'],
        why: 'holding water constant while changing the temperature means any difference has only one explanation left.',
      },
      {
        setup: 'A file will not open. Either the file is corrupt, or your program is too old.',
        correct: 'Try opening a different, known-good file in the same program',
        wrong: ['Restart the computer and try again', 'Try opening exactly the same file over again in a moment', 'Check how large the file actually is'],
        why: 'if the known-good file opens, the program is fine and the file is the suspect; if it also fails, the program is.',
      },
      {
        setup: 'A recipe came out badly. Either the oven runs cold, or you mismeasured the flour.',
        correct: 'Bake something simple with an oven thermometer inside',
        wrong: ['Make exactly the same recipe again in the same way', 'Buy a completely different brand of flour', 'Ask whether any other people liked it'],
        why: 'reading the real oven temperature settles that explanation on its own, without touching the other.',
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'A test that separates',
      prompt: `${c.setup}\n\nWhich check would tell you **which** explanation is right?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'A useful test is one whose two possible results point at different explanations.',
        'Ask of each option: if it comes out one way, do I learn anything? If both results leave me where I started, it is not a test.',
        `Worked path: **${c.correct}**`,
      ],
      explanation:
        `**${c.correct}** — ${c.why}\n\n` +
        `The habit is to ask what each possible RESULT would tell you, before you run the check. Repeating the thing that failed, or gathering facts that both explanations predict equally, feels like investigating and moves nothing.`,
    }
  },
)

const oddsToPercent = tpl(
  { id: 'onramp-iforecast', name: 'Say it as a percent', skillIds: ['i-forecast'], bucket: 'investigator', difficulty: 1, variants: 8, minutes: 2 },
  (_rng, seed) => {
    const denoms = [2, 4, 5, 8, 10, 20, 25, 50]
    const d = cycle(seed, denoms)
    const pct = round(100 / d, 1)
    return {
      title: 'Putting a number on it',
      prompt:
        `A forecast has to be a number before it can be scored.\n\n` +
        `"About **1 chance in ${d}**" is what percent? (Number only, one decimal place if needed.)`,
      answer: numeric(pct, { tolerance: 0.05 }),
      hints: [
        '"1 in n" means one out of every n times.',
        `So it is 1 ÷ ${d}, then × 100 to make it a percent.`,
        `Worked path: 100 ÷ ${d} = **${pct}**.`,
      ],
      explanation:
        `1 ÷ ${d} × 100 = **${pct}%**.\n\n` +
        `Vague words are unfalsifiable — "probably", "a real chance" and "unlikely" mean wildly different numbers to different people, and no one can ever be shown to have been wrong. A percent can be scored, and being scored is the only thing that turns guessing into a skill you can improve.`,
    }
  },
)

const explanationCoverage = tpl(
  { id: 'onramp-iabduce', name: 'Which explanation covers more?', skillIds: ['i-abduce'], bucket: 'investigator', difficulty: 2, variants: 4, minutes: 2.5 },
  (rng, seed) => {
    const cases = [
      {
        facts: ['the kitchen light is off', 'the fridge is silent', 'the clock on the oven is blank'],
        broad: 'The power to the kitchen has gone out',
        narrow: 'The kitchen light bulb has blown',
        why: 'a blown bulb explains one of the three; a power cut explains all three at once.',
      },
      {
        facts: ['your phone will not connect', 'the laptop cannot load pages', 'the TV says "no network"'],
        broad: 'The home internet connection is down',
        narrow: 'Your phone has run out of data',
        why: 'a phone data problem cannot explain the laptop or the TV; one downed connection explains every device.',
      },
      {
        facts: ['the plant is drooping', 'the soil is dry two inches down', 'the pot feels light'],
        broad: 'The plant has not been watered enough',
        narrow: 'The room is too cold for it',
        why: 'cold might explain drooping, but not dry soil or a light pot. Underwatering explains all three.',
      },
      {
        facts: ['your legs ache', 'you slept badly', 'you are unusually hungry'],
        broad: 'Yesterday\'s long run is still catching up with you',
        narrow: 'You slept on your legs awkwardly',
        why: 'an awkward sleeping position could explain aching legs alone; hard exercise the day before explains the soreness, the disturbed sleep and the appetite together.',
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Scope of an explanation',
      prompt:
        `You notice three things:\n\n- ${c.facts.join('\n- ')}\n\n` +
        `Both explanations below are possible. Which one accounts for **more** of what you noticed?`,
      answer: mcq(rng, c.broad, [c.narrow, 'They account for exactly the same amount', 'Neither explains any of it']),
      hints: [
        'Take each explanation and tick off which of the three observations it would account for.',
        'The question is not which is more likely — it is which covers more ground.',
        `Worked path: **${c.broad}**`,
      ],
      explanation:
        `**${c.broad}** — ${c.why}\n\n` +
        `Scope is one of the two virtues this skill trains (the other is parsimony: how many extra assumptions an explanation needs). Neither settles the matter on its own — the wide explanation can still be wrong — but an explanation that leaves most of your evidence unaccounted for is rarely the one to bet on first.`,
    }
  },
)

/* ============================================================ strategist */

const premortemMeaning = tpl(
  { id: 'onramp-premortem', name: 'What a pre-mortem is', skillIds: ['st-premortem'], bucket: 'strategist', difficulty: 1, variants: 3, minutes: 2 },
  (rng, seed) => {
    const cases = [
      'You are about to start a two-week group project.',
      'You are about to commit to a revision plan for an exam in a month.',
      'You are about to organise an event with several people helping.',
    ]
    const c = cycle(seed, cases)
    const correct = 'Imagine it has already failed, and list the reasons why'
    return {
      title: 'Pre-mortem',
      prompt: `${c}\n\nWhat does a **pre-mortem** ask you to do?`,
      answer: mcq(rng, correct, [
        'List everything that could possibly go wrong, in any order',
        'Work out how likely the plan is to succeed, as a percentage',
        'Wait until it finishes, then review what went wrong',
      ]),
      hints: [
        'The name is the clue: a post-mortem happens after a death, so a pre-mortem happens before one.',
        'The trick is the tense — you assume the failure has already happened rather than asking whether it might.',
        `Worked path: **${correct}**`,
      ],
      explanation:
        `**${correct}**\n\n` +
        `Why the tense matters: "what could go wrong?" invites reassurance, and people mostly answer it with things they have already handled. "It failed — why?" takes the failure as settled and sends you looking for the cause, which surfaces the risks nobody wanted to raise while the plan still looked good. It is the same information, made much easier to say out loud.`,
    }
  },
)

const buildInBuffer = tpl(
  { id: 'onramp-stestimate', name: 'Add up the pieces', skillIds: ['st-estimate'], bucket: 'strategist', difficulty: 1, variants: 12, minutes: 2 },
  (rng) => {
    const parts = [rint(rng, 10, 40), rint(rng, 10, 40), rint(rng, 10, 40)]
    const sum = parts.reduce((a, b) => a + b, 0)
    return {
      title: 'Estimating a total',
      prompt:
        `A job breaks into three parts you estimate at **${parts[0]}**, **${parts[1]}** and **${parts[2]}** minutes.\n\n` +
        `How long is the whole job, if nothing goes wrong? (Minutes, number only.)`,
      answer: numeric(sum),
      hints: [
        'Break-it-into-pieces estimates are added, not averaged.',
        `${parts.join(' + ')}`,
        `Worked path: **${sum}**.`,
      ],
      explanation:
        `${parts.join(' + ')} = **${sum} minutes** — if nothing goes wrong.\n\n` +
        `That last clause is doing real work. People are reliably optimistic about their own plans, and the usual reason is that the estimate covers the parts you thought of and none of the joins between them: setting up, switching, waiting on someone, fixing the first attempt. Decomposing is the right first move; expecting the total to be a floor rather than a prediction is the second.`,
    }
  },
)

/* ============================================================== insight */

const pressureOrNot = tpl(
  { id: 'onramp-hinfluence', name: 'Pressure, or an ordinary request?', skillIds: ['h-influence'], bucket: 'insight', difficulty: 2, variants: 6, minutes: 2.5 },
  (rng, seed) => {
    const cases = [
      { msg: '"This offer disappears in 10 minutes — decide now, do not check with anyone."', tactic: 'False urgency, plus pressure not to consult anyone', legit: false },
      { msg: '"The form is due Friday. Here is the link — ask me if anything is unclear."', tactic: 'Nothing — a real deadline, stated plainly, with help offered', legit: true },
      { msg: '"Everyone else in the group already agreed. Are you really going to be the difficult one?"', tactic: 'Social pressure, plus naming you as the problem for hesitating', legit: false },
      { msg: '"Most people pick option B, but take your time and pick what suits you."', tactic: 'Nothing — it reports what others do without pressing you to copy them', legit: true },
      { msg: '"If you were actually my friend you would not need to think about it."', tactic: 'Making the relationship the price of disagreeing', legit: false },
      { msg: '"I would really like you to come, but I understand if you cannot."', tactic: 'Nothing — a clear wish with an easy way to say no', legit: true },
    ]
    const c = cycle(seed, cases)
    const others = cases.filter((x) => x.tactic !== c.tactic).map((x) => x.tactic)
    return {
      title: 'Reading the ask',
      prompt:
        `Someone says:\n\n> ${c.msg}\n\nWhat, if anything, is the pressure tactic here?\n\n` +
        `Some of these are perfectly ordinary. "Nothing is wrong" is a real answer.`,
      answer: mcq(rng, c.tactic, others.slice(0, 3)),
      hints: [
        'Three questions: is the time limit real, is there any cost to saying no, and are you being discouraged from checking with someone?',
        'An ordinary request can be direct, and even disappointed, without making refusal expensive.',
        `Worked path: **${c.tactic}**`,
      ],
      explanation:
        `**${c.tactic}**\n\n` +
        (c.legit
          ? `Recognising the ordinary ones matters as much as spotting the tactics. A defence that flags everything is not a defence — it just makes you suspicious of people being straightforward with you, and that costs you more than it protects.`
          : `The tell is not that they want something; people are allowed to want things. It is that saying no has been made expensive — through time you do not have, a group you would be letting down, or a friendship put on the table. Naming it is usually enough to slow it down, and "I will let you know tomorrow" is a complete sentence.`),
    }
  },
)

/* ================================================================= meta */

const confidenceMeaning = tpl(
  { id: 'onramp-xcalib', name: 'What "80% sure" promises', skillIds: ['x-calib'], bucket: 'meta', difficulty: 1, variants: 8, minutes: 2 },
  (rng, seed) => {
    const pct = cycle(seed, [50, 60, 70, 80, 90, 60, 80, 70])
    const n = cycleOf(rng, [10, 20, 50])
    const expected = (pct * n) / 100
    return {
      title: 'What a confidence means',
      prompt:
        `You answer **${n}** questions and say you are **${pct}% sure** on every one.\n\n` +
        `If that confidence is honest, about how many should you get right? (Number only.)`,
      answer: numeric(expected),
      hints: [
        'A confidence is a prediction about how often you are right, not a feeling about this one question.',
        `${pct}% of ${n}.`,
        `Worked path: ${n} × ${pct} ÷ 100 = **${expected}**.`,
      ],
      explanation:
        `${pct}% of ${n} is **${expected}**.\n\n` +
        `That is what makes confidence checkable. Getting ${n} out of ${n} right after saying ${pct}% is not a triumph — it means you were underconfident and could have committed harder. Being right about ${expected} of them is the target, and the gap between what you claim and what happens is the only thing worth improving here.`,
    }
  },
)

/** Deterministic choice from a small list, driven by the seeded rng. */
function cycleOf<T>(rng: () => number, xs: readonly T[]): T {
  return xs[Math.floor(rng() * xs.length) % xs.length]
}

export const ONRAMP_B_TEMPLATES: ItemTemplate[] = [
  scatterDirection,
  evOneOutcome,
  spreadCompare,
  absoluteValue,
  systemCheck,
  piecewiseEvaluate,
  doublingGrowth,
  complexBasics,
  triangleInequality,
  prismVolume,
  circleEquation,
  modelMeaning,
  proofOneCase,
  pairingSum,
  traceTwoVars,
  searchCount,
  growthCompare,
  correlationMeaning,
  controlGroup,
  axisStartsAtZero,
  roundToPowerOfTen,
  percentPoints,
  baseRateCount,
  distinguishingTest,
  oddsToPercent,
  explanationCoverage,
  premortemMeaning,
  buildInBuffer,
  pressureOrNot,
  confidenceMeaning,
]
