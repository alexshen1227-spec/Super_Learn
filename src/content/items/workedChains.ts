/**
 * Worked chains — problems answered by showing the intermediate values.
 *
 * A single answer box can only report WHETHER you were right. These items ask
 * for each link, so a wrong final answer is traced to the step that actually
 * broke, and the misconception is DERIVED from that step rather than
 * self-reported afterwards. Self-tagging your own error is self-assessment by
 * another name, and the evidence model refuses it everywhere else.
 *
 * Chains are chosen where the failure modes are genuinely distinct — a percent
 * problem can fail at "which number is the base?" or at the arithmetic, and
 * those want different repairs.
 */
import type { ItemTemplate } from '../../domain/types'
import { pick, rint } from '../../engine/rng'
import { mcq, numeric, round, steps, tpl } from '../lib'

const percentChange = tpl(
  {
    id: 'chain-percent-change',
    name: 'Percent change, step by step',
    skillIds: ['m-percent'],
    bucket: 'math',
    difficulty: 3,
    variants: 40,
    minutes: 3,
    calibration: true,
  },
  (rng) => {
    const original = rint(rng, 4, 30) * 5
    const pct = pick(rng, [10, 15, 20, 25, 40, 50] as const)
    const rise = rng() < 0.5
    const change = (original * pct) / 100
    const final = rise ? original + change : original - change
    const thing = pick(rng, ['a monthly bus pass', 'a bag of climbing chalk', 'a set of guitar strings', 'a month of storage rental'] as const)
    return {
      title: 'Percent change',
      prompt: `The price of ${thing} was **$${original}** and ${rise ? 'rose' : 'fell'} by **${pct}%**.\n\nWork it through one line at a time.`,
      answer: steps([
        {
          label: 'Which amount is the base — the number the percent is taken OF?',
          answer: mcq(rng, `$${original}, the price before the change`, [
            `$${round(final, 2)}, the price after the change`,
            `$${change}, the size of the change itself`,
          ]),
          diagnoses: 'concept',
          why: 'Percent change is always measured against the ORIGINAL amount. Choosing the new price as the base is the error that makes a rise and a fall of the same percent look reversible — they are not.',
        },
        {
          label: `Size of the change, in dollars`,
          answer: numeric(change, { tolerance: 0.005 }),
          diagnoses: 'slip',
          why: `${pct}% of $${original} is ${pct / 100} × ${original} = $${change}.`,
        },
        {
          label: 'Final price, in dollars',
          answer: numeric(round(final, 2), { tolerance: 0.005 }),
          diagnoses: 'strategy',
          why: `${rise ? 'Add' : 'Subtract'} the change: $${original} ${rise ? '+' : '−'} $${change} = $${round(final, 2)}.`,
        },
      ]),
      hints: [
        'Identify the base before you compute anything — everything else depends on it.',
        `${pct}% of the ORIGINAL $${original} is the size of the change.`,
        `$${original} ${rise ? '+' : '−'} $${change} = **$${round(final, 2)}**.`,
      ],
      explanation: `Base $${original} → change ${pct}% of ${original} = $${change} → final **$${round(final, 2)}**.\n\nSplitting it out shows why percent problems go wrong in two completely different ways. Picking the wrong base is a concept error and needs the idea retaught; getting the base right and the multiplication wrong is a slip and needs nothing but care. One answer box cannot tell those apart, which is why the repair used to be guesswork.`,
    }
  },
)

const twoStepEquation = tpl(
  {
    id: 'chain-solve-linear',
    name: 'Solve it, showing the middle',
    skillIds: ['m-lineqmulti'],
    bucket: 'math',
    difficulty: 3,
    variants: 44,
    minutes: 2.5,
  },
  (rng) => {
    const a = rint(rng, 2, 9)
    const x = rint(rng, -8, 9) || 3
    const b = rint(rng, -12, 12) || 5
    const c = a * x + b
    const bStr = b >= 0 ? `+ ${b}` : `− ${-b}`
    return {
      title: 'Two moves, two boxes',
      prompt: `Solve **${a}x ${bStr} = ${c}**.\n\nShow the middle line — that is where these usually go wrong.`,
      answer: steps([
        {
          label: `After undoing the ${b >= 0 ? 'addition' : 'subtraction'}, what does ${a}x equal?`,
          answer: numeric(c - b),
          diagnoses: 'slip',
          why: `${c} ${b >= 0 ? '−' : '+'} ${Math.abs(b)} = ${c - b}. Subtracting a negative moves the value UP, which is the step people reverse.`,
        },
        {
          label: 'The value of x',
          answer: numeric(x),
          diagnoses: 'strategy',
          why: `Divide both sides by the coefficient: ${c - b} ÷ ${a} = ${x}. Dividing before moving the constant is the usual order error.`,
        },
      ]),
      hints: [
        'Undo the operations in reverse order: the constant first, then the coefficient.',
        `Move the ${b >= 0 ? `+ ${b}` : `− ${-b}`} across: ${a}x = ${c - b}.`,
        `Divide by ${a}: x = **${x}**.`,
      ],
      explanation: `${a}x ${bStr} = ${c} → ${a}x = ${c - b} → x = **${x}**. Check: ${a}(${x}) ${bStr} = ${c} ✓.\n\nAsking for the middle line separates two failures that look identical from the outside. Getting ${c - b} wrong is a sign-handling slip; getting it right and then dividing wrongly — or dividing before moving the constant — is a strategy error about the order of operations.`,
    }
  },
)

const netForceChain = tpl(
  {
    id: 'chain-net-force',
    name: 'Force to acceleration',
    skillIds: ['p-forces'],
    bucket: 'physics',
    difficulty: 3,
    variants: 30,
    minutes: 3,
    calibration: true,
  },
  (rng) => {
    const m = pick(rng, [2, 4, 5, 8, 10, 20] as const)
    const push = pick(rng, [30, 40, 60, 80, 100] as const)
    const friction = pick(rng, [10, 20] as const)
    const net = push - friction
    const a = round(net / m, 3)
    return {
      title: 'Two forces, one crate',
      prompt: `A **${m} kg** crate is pushed with **${push} N** while friction resists with **${friction} N**.\n\nFind the acceleration, showing the middle value.`,
      answer: steps([
        {
          label: 'Net force, in newtons',
          answer: numeric(net),
          diagnoses: 'representation',
          why: `The forces oppose, so they subtract: ${push} − ${friction} = ${net} N. Adding them instead treats friction as a helper.`,
        },
        {
          label: 'Acceleration, in m/s²',
          answer: numeric(a, { tolerance: 0.005 }),
          diagnoses: 'slip',
          why: `a = F/m = ${net}/${m} = ${a} m/s².`,
        },
      ]),
      hints: [
        'Draw the two forces first. Which way does each one point?',
        `Opposing forces subtract: ${push} − ${friction} = ${net} N.`,
        `a = F/m = ${net} ÷ ${m} = **${a} m/s²**.`,
      ],
      explanation: `Net force ${push} − ${friction} = ${net} N, then a = F/m = **${a} m/s²**.\n\nThe two boxes catch two different mistakes. A wrong net force is a representation error — the force diagram was wrong before any arithmetic started — and no amount of care with F = ma will rescue it. A right net force with wrong division is just a slip. Repairing them the same way would waste your time on one and fail to fix the other.`,
    }
  },
)

const probabilityChain = tpl(
  {
    id: 'chain-compound-prob',
    name: 'Two events, shown separately',
    skillIds: ['m-prob'],
    bucket: 'math',
    difficulty: 4,
    variants: 16,
    minutes: 3,
    calibration: true,
  },
  (_rng, seed) => {
    // Enumerated so every bag composition really occurs.
    const red = 2 + (seed % 4)
    const blue = 3 + (Math.floor(seed / 4) % 4)
    const total = red + blue
    const pRedFirst = round(red / total, 4)
    const pRedSecond = round((red - 1) / (total - 1), 4)
    const both = round((red / total) * ((red - 1) / (total - 1)), 4)
    return {
      title: 'Without replacement',
      prompt: `A bag holds **${red} red** and **${blue} blue** counters. You draw **two without putting the first back**.\n\nWhat is the probability both are red? Show each draw.`,
      answer: steps([
        {
          label: 'P(first is red) — as a decimal to 4 places',
          answer: numeric(pRedFirst, { tolerance: 0.0005 }),
          diagnoses: 'slip',
          why: `${red} red out of ${total} counters = ${pRedFirst}.`,
        },
        {
          label: 'P(second is red, GIVEN the first was red)',
          answer: numeric(pRedSecond, { tolerance: 0.0005 }),
          diagnoses: 'concept',
          why: `One red is gone and one counter is gone: ${red - 1} of ${total - 1} = ${pRedSecond}. Reusing ${pRedFirst} here is the without-replacement error.`,
        },
        {
          label: 'P(both red)',
          answer: numeric(both, { tolerance: 0.0005 }),
          diagnoses: 'strategy',
          why: `Multiply the two: ${pRedFirst} × ${pRedSecond} = ${both}.`,
        },
      ]),
      hints: [
        'Handle the draws one at a time. What is in the bag for the SECOND draw?',
        `After one red leaves, ${red - 1} reds remain among ${total - 1} counters.`,
        `${pRedFirst} × ${pRedSecond} = **${both}**.`,
      ],
      explanation: `P(first red) = ${pRedFirst}, then P(second red | first red) = ${pRedSecond}, and multiplying gives **${both}**.\n\nThe middle box is the whole point of this item. Someone who writes ${pRedFirst} twice has a real conceptual gap about dependence — the bag changed — while someone who gets both probabilities right and then adds instead of multiplying has a strategy error. Both produce a wrong final number, and they need completely different repairs.`,
    }
  },
)

const slopeChain = tpl(
  {
    id: 'chain-line-equation',
    name: 'Build the line',
    skillIds: ['m-linfunc'],
    bucket: 'math',
    difficulty: 4,
    variants: 32,
    minutes: 3,
  },
  (rng) => {
    const m = pick(rng, [-3, -2, 2, 3, 4] as const)
    const b = rint(rng, -8, 9)
    const x1 = rint(rng, -4, 2)
    const x2 = x1 + rint(rng, 1, 4)
    const y1 = m * x1 + b
    const y2 = m * x2 + b
    return {
      title: 'From two points to y = mx + b',
      prompt: `A line passes through **(${x1}, ${y1})** and **(${x2}, ${y2})**.\n\nBuild its equation one piece at a time.`,
      answer: steps([
        {
          label: 'Slope',
          answer: numeric(m),
          diagnoses: 'slip',
          why: `(${y2} − ${y1}) ÷ (${x2} − ${x1}) = ${y2 - y1} ÷ ${x2 - x1} = ${m}. Subtracting in opposite orders flips the sign.`,
        },
        {
          label: 'y-intercept',
          answer: numeric(b),
          diagnoses: 'strategy',
          why: `Substitute a known point back: ${y1} = ${m}(${x1}) + b, so b = ${b}.`,
        },
      ]),
      hints: [
        'Slope first — it is the only part you can get straight from the two points.',
        `Rise ${y2 - y1} over run ${x2 - x1} gives slope ${m}.`,
        `Then put one point into y = ${m}x + b to find b = **${b}**.`,
      ],
      explanation: `Slope = ${y2 - y1}/${x2 - x1} = ${m}; substituting (${x1}, ${y1}) gives b = ${b}, so **y = ${m}x ${b >= 0 ? `+ ${b}` : `− ${-b}`}**.\n\nSeparating the boxes matters because the intercept step depends on the slope. If your slope is wrong, your intercept is almost certainly wrong too — and it would be unfair, and useless, to record that as two mistakes when it is one.`,
    }
  },
)

export const WORKED_CHAIN_TEMPLATES: ItemTemplate[] = [
  percentChange,
  twoStepEquation,
  netForceChain,
  probabilityChain,
  slopeChain,
]
