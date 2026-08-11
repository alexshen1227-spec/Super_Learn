/**
 * High-school bridge — the ground between where a strong middle-grade learner
 * stands and where the high-school sequence starts.
 *
 * Four families the bank was missing outright: absolute value, sequences,
 * right-triangle trigonometry, and reading a scatter plot honestly. These are
 * the Algebra 1 / Geometry topics a learner meets first, and the app covered
 * everything around them without covering them.
 *
 * House style, kept: answers computed from the generated values, distractors
 * that name a real misconception, and options of comparable length so nothing
 * can be picked off by shape.
 */
import type { ItemTemplate } from '../../domain/types'
import { mcq, numeric, round, steps, tpl } from '../lib'

// ================================================================ absolute value

const absoluteEquation = tpl(
  { id: 'hs-abs-equation', name: 'Two answers, not one', skillIds: ['m-absolute'], bucket: 'math', difficulty: 3, variants: 40, minutes: 2, calibration: true },
  (_rng, seed) => {
    const inside = 1 + (seed % 8)
    const target = 2 + (Math.floor(seed / 8) % 6)
    const hi = inside + target
    const lo = inside - target
    return {
      title: 'Absolute value equation',
      prompt: `Solve **|x − ${inside}| = ${target}**.\n\nEnter the **larger** solution.`,
      answer: numeric(hi),
      hints: [
        'The bars mean distance from zero, and distance does not care about direction.',
        `So x − ${inside} could be ${target} OR −${target} — two cases, both legitimate.`,
        `x = ${inside} + ${target} = ${hi}, or x = ${inside} − ${target} = ${lo}. The larger is **${hi}**.`,
      ],
      explanation: `Two cases: x − ${inside} = ${target} gives **x = ${hi}**, and x − ${inside} = −${target} gives x = ${lo}.\n\nThe reason there are always two is worth holding onto rather than memorising: |x − ${inside}| asks how far x sits from ${inside}, and you can be ${target} away on either side. Reading it as distance tells you the number of answers before you do any algebra.`,
      commonErrors: {
        concept: `Solving only x − ${inside} = ${target} finds ${hi} and loses ${lo}. Half the answer is missing, and the equation never said which side.`,
      },
    }
  },
)

const absoluteInequality = tpl(
  { id: 'hs-abs-inequality', name: 'Band or two rays?', skillIds: ['m-absolute'], bucket: 'math', difficulty: 4, variants: 12, minutes: 2.5, calibration: true },
  (rng, seed) => {
    const c = 2 + (seed % 6)
    const less = Math.floor(seed / 6) % 2 === 0
    const correct = less
      ? `Between −${c} and ${c} — a single band around zero`
      : `Below −${c} or above ${c} — two separate rays`
    return {
      title: 'Which shape is the answer?',
      prompt: `Describe the solution to **|x| ${less ? '<' : '>'} ${c}**.`,
      answer: mcq(rng, correct, [
        less
          ? `Below −${c} or above ${c} — two separate rays`
          : `Between −${c} and ${c} — a single band around zero`,
        `Only the values above ${c}, since a distance cannot be negative in the first place`,
        `Every number at all, because |x| is never negative so the statement always holds`,
      ]),
      hints: [
        'Read it as distance: which points sit closer to zero than the number, and which sit further?',
        less
          ? `"Closer to zero than ${c}" is everything squeezed between −${c} and ${c}.`
          : `"Further from zero than ${c}" is everything outside the interval — on both sides.`,
        `So the answer is: ${correct.toLowerCase()}.`,
      ],
      explanation: `**${correct}.**\n\nThe shape follows from the direction, and reading the bars as distance gets you there without memorising two rules. Closer-than gives one connected band; further-than gives two pieces, because being far from zero is possible in either direction.\n\nThe option that keeps only the positive side is the common slip: it quietly forgets that −${c + 3} is further from zero than ${c} too.`,
    }
  },
)

// ================================================================ sequences

const sequenceRule = tpl(
  { id: 'hs-sequence-nth', name: 'Find the nth term', skillIds: ['m-sequences'], bucket: 'math', difficulty: 3, variants: 48, minutes: 2.5 },
  (_rng, seed) => {
    const a = 2 + (seed % 8)
    const d = 2 + (Math.floor(seed / 8) % 6)
    const n = 7 + (Math.floor(seed / 48) % 5)
    const nth = a + (n - 1) * d
    const terms = [a, a + d, a + 2 * d, a + 3 * d]
    return {
      title: 'Arithmetic sequence',
      prompt: `A sequence starts **${terms.join(', ')}, …**\n\nWhat is the **${n}th** term?`,
      answer: numeric(nth),
      hints: [
        'Check what happens between consecutive terms — is it the same amount added, or the same factor multiplied?',
        `Each step adds ${d}. Now count STEPS, not terms: reaching the ${n}th term takes ${n - 1} steps from the first.`,
        `${a} + ${n - 1} × ${d} = **${nth}**.`,
      ],
      explanation: `The common difference is ${d}, so the nth term is ${a} + (n − 1)(${d}). At n = ${n}: ${a} + ${n - 1} × ${d} = **${nth}**.\n\nThe (n − 1) is where this goes wrong. The first term has taken no steps at all, so reaching the ${n}th takes ${n - 1} of them — using ${n} gives ${a + n * d}, one step too far. Counting gaps rather than fenceposts is the same habit that fixes off-by-one errors in code.`,
      commonErrors: {
        slip: `Using n instead of n − 1 gives ${a + n * d}. The first term is the starting point, not a step.`,
      },
    }
  },
)

const sequenceType = tpl(
  { id: 'hs-sequence-type', name: 'Adding or multiplying?', skillIds: ['m-sequences'], bucket: 'math', difficulty: 2, variants: 24, minutes: 2 },
  (rng, seed) => {
    const geometric = seed % 2 === 0
    const a = 2 + (Math.floor(seed / 2) % 5)
    const r = 2 + (Math.floor(seed / 10) % 2)
    const d = 3 + (Math.floor(seed / 10) % 4)
    const terms = geometric ? [a, a * r, a * r * r, a * r * r * r] : [a, a + d, a + 2 * d, a + 3 * d]
    const next = geometric ? a * r ** 4 : a + 4 * d
    return {
      title: 'Name the pattern',
      prompt: `**${terms.join(', ')}, …**\n\nWhat kind of sequence is this, and what comes next?`,
      answer: mcq(
        rng,
        geometric
          ? `Geometric — each term is multiplied by ${r}, so the next term is ${next}`
          : `Arithmetic — each term adds ${d}, so the next term is ${next}`,
        [
          geometric
            ? `Arithmetic — each term adds ${terms[1] - terms[0]}, so the next term is ${terms[3] + (terms[1] - terms[0])}`
            : `Geometric — each term is multiplied by ${round(terms[1] / terms[0], 2)}, so the next term is ${round(terms[3] * (terms[1] / terms[0]), 2)}`,
          `Neither, because the gaps are not consistent`,
          `Both fit, so either rule continues it`,
        ],
      ),
      hints: [
        'Test both: subtract consecutive terms, then divide consecutive terms. Only one stays constant.',
        `Differences: ${terms[1] - terms[0]}, ${terms[2] - terms[1]}, ${terms[3] - terms[2]}. Ratios: ${round(terms[1] / terms[0], 2)}, ${round(terms[2] / terms[1], 2)}.`,
        geometric ? `The ratio is constant at ${r}.` : `The difference is constant at ${d}.`,
      ],
      explanation: geometric
        ? `The **ratio** is constant: each term is ${r} times the one before, so this is geometric and the next term is **${next}**.\n\nDifferences here are ${terms[1] - terms[0]}, ${terms[2] - terms[1]}, ${terms[3] - terms[2]} — growing, which is the giveaway. Checking both tests takes ten seconds and settles it.`
        : `The **difference** is constant at ${d}, so this is arithmetic and the next term is **${next}**.\n\nRatios here are ${round(terms[1] / terms[0], 2)}, ${round(terms[2] / terms[1], 2)} — not constant, which rules geometric out. Arithmetic sequences are straight lines in disguise; geometric ones are exponentials.`,
    }
  },
)

// ================================================================ trigonometry

const trigRatio = tpl(
  { id: 'hs-trig-ratio', name: 'Pick the right ratio', skillIds: ['m-trig'], bucket: 'math', difficulty: 4, variants: 36, minutes: 2.5, calibration: true },
  (rng, seed) => {
    // Six ORDERED side pairs (which you have vs which you want reads
    // differently even when the ratio is the same) crossed with six concrete
    // settings. Without the contexts this template asked three questions in
    // thirty-six costumes.
    const ordered = [
      ['opposite', 'adjacent'],
      ['adjacent', 'opposite'],
      ['opposite', 'hypotenuse'],
      ['hypotenuse', 'opposite'],
      ['adjacent', 'hypotenuse'],
      ['hypotenuse', 'adjacent'],
    ] as const
    const contexts = [
      'A ramp leans against a loading dock.',
      'A ladder rests against a wall.',
      'A kite string runs from your hand to the kite.',
      'A guy-wire runs from the ground to a point on a mast.',
      'A hiking trail cuts diagonally up a hillside.',
      'A camera on a tripod is aimed up at a window.',
    ]
    const [known, want] = ordered[seed % 6]
    const context = contexts[Math.floor(seed / 6) % 6]
    const pairs: Record<string, string> = {
      'opposite|hypotenuse': 'sine',
      'adjacent|hypotenuse': 'cosine',
      'opposite|adjacent': 'tangent',
    }
    const key = [known, want].sort().join('|')
    const normalized =
      key === 'hypotenuse|opposite' ? 'opposite|hypotenuse' : key === 'adjacent|hypotenuse' ? 'adjacent|hypotenuse' : 'opposite|adjacent'
    const ratio = pairs[normalized] ?? 'tangent'
    const others = ['sine', 'cosine', 'tangent'].filter((r) => r !== ratio)
    // "hypotenuse side" is not English; the other two are adjectives.
    const side = (s: string) => (s === 'hypotenuse' ? 'the **hypotenuse**' : `the **${s}** side`)
    return {
      title: 'Which ratio connects them?',
      prompt: `${context} That sets up a right triangle, and you know one acute angle.\n\nYou have ${side(known)} and you want ${side(want)}.\n\nWhich ratio links exactly those two?`,
      answer: mcq(rng, `${ratio.charAt(0).toUpperCase() + ratio.slice(1)} — it relates the ${normalized.replace('|', ' and the ')}`, [
        `${others[0].charAt(0).toUpperCase() + others[0].slice(1)} — it relates the ${Object.keys(pairs).find((k) => pairs[k] === others[0])!.replace('|', ' and the ')}`,
        `${others[1].charAt(0).toUpperCase() + others[1].slice(1)} — it relates the ${Object.keys(pairs).find((k) => pairs[k] === others[1])!.replace('|', ' and the ')}`,
        `None of them, because two sides cannot be linked without knowing a second angle first`,
      ]),
      hints: [
        'Write SOH-CAH-TOA out and find the pair that contains BOTH the side you have and the side you want.',
        `You have the ${known} and want the ${want}.`,
        `That pairing is ${ratio}.`,
      ],
      explanation: `**${ratio.charAt(0).toUpperCase() + ratio.slice(1)}** is the ratio containing the ${normalized.replace('|', ' and the ')}.\n\nChoosing the ratio is the whole skill; the arithmetic afterwards is easy. The method is mechanical: name the side you have, name the side you want, and pick the ratio holding both.\n\nOne caution that trips people later: "opposite" and "adjacent" are defined RELATIVE to the angle you are using. Switch to the other acute angle and they swap. Only the hypotenuse stays put.`,
      commonErrors: {
        representation: 'Labelling the sides before choosing which angle you are working from. The labels move when the angle does.',
      },
    }
  },
)

const trigSolve = tpl(
  { id: 'hs-trig-solve', name: 'Find the missing side', skillIds: ['m-trig'], bucket: 'math', difficulty: 4, variants: 18, minutes: 3 },
  (_rng, seed) => {
    // Angles chosen so the ratios are exact enough to type with a tolerance.
    const cases = [
      { angle: 30, hyp: 10, opp: 5 },
      { angle: 30, hyp: 20, opp: 10 },
      { angle: 30, hyp: 14, opp: 7 },
      { angle: 45, hyp: 10, opp: round(10 * Math.SQRT1_2, 2) },
      { angle: 45, hyp: 8, opp: round(8 * Math.SQRT1_2, 2) },
      { angle: 60, hyp: 10, opp: round(10 * Math.sin(Math.PI / 3), 2) },
    ] as const
    const c = cases[seed % cases.length]
    const scale = 1 + Math.floor(seed / cases.length) % 3
    const hyp = c.hyp * scale
    const opp = round(c.opp * scale, 2)
    return {
      title: 'Solve the triangle',
      prompt: `A right triangle has a **${c.angle}°** angle and a hypotenuse of **${hyp}**.\n\nHow long is the side **opposite** the ${c.angle}° angle? (Two decimal places.)`,
      answer: numeric(opp, { tolerance: 0.02 }),
      hints: [
        'You have the hypotenuse and want the opposite side — which ratio holds both?',
        `Sine: sin(${c.angle}°) = opposite / ${hyp}.`,
        `opposite = ${hyp} × sin(${c.angle}°) = **${opp}**.`,
      ],
      explanation: `sin(${c.angle}°) = opposite ÷ hypotenuse, so opposite = ${hyp} × sin(${c.angle}°) = **${opp}**.\n\nSanity-check the size, always: the opposite side must be shorter than the hypotenuse, because the hypotenuse is the longest side of a right triangle. ${opp} < ${hyp} ✓. An answer larger than the hypotenuse means the ratio was used upside down.`,
      commonErrors: {
        strategy: `Dividing instead of multiplying gives ${round(hyp / Math.sin((c.angle * Math.PI) / 180), 2)}, which is longer than the hypotenuse — impossible, and the length check catches it instantly.`,
      },
    }
  },
)

// ================================================================ trend lines

const trendLine = tpl(
  { id: 'hs-trend-line', name: 'Read the trend line', skillIds: ['m-bestfit'], bucket: 'math', difficulty: 3, variants: 30, minutes: 3, transfer: true, calibration: true },
  (_rng, seed) => {
    const slope = 2 + (seed % 6)
    const intercept = 30 + (Math.floor(seed / 6) % 5) * 5
    const at = 4 + (Math.floor(seed / 30) % 4)
    const predicted = intercept + slope * at
    const contexts = [
      { x: 'hours revised', y: 'test score', unit: 'points per hour' },
      { x: 'weeks of practice', y: 'free throws made out of 50', unit: 'makes per week' },
      { x: 'minutes of daily reading', y: 'words read per minute', unit: 'words per minute, per daily minute' },
    ] as const
    const c = contexts[seed % contexts.length]
    const far = 40
    return {
      title: 'Read a trend line honestly',
      prompt: `A scatter plot of **${c.y}** against **${c.x}** has a trend line **y = ${slope}x + ${intercept}**, fitted to data covering 0 to 10 on the x-axis.\n\nWork through what it does and does not say.`,
      answer: steps([
        {
          label: `Predicted ${c.y} at ${at} ${c.x}`,
          answer: numeric(predicted),
          diagnoses: 'slip',
          why: `${slope} × ${at} + ${intercept} = ${predicted}. Substitution, nothing more.`,
        },
        {
          label: `What the slope of ${slope} means`,
          answer: {
            type: 'mcq',
            options: [
              `About ${slope} ${c.unit} — a rate of change across this data`,
              `That ${c.x} causes ${c.y} to rise, at ${slope} per unit`,
              `That the typical value of ${c.y} in this data is about ${slope}`,
            ],
            correct: 0,
          },
          diagnoses: 'concept',
          why: `A slope is a RATE with units. It is not a cause — the plot recorded what happened, it did not assign anyone to anything — and it is not a typical value, which is what the intercept region describes.`,
        },
        {
          label: `Is predicting at x = ${far} sound?`,
          answer: {
            type: 'mcq',
            options: [
              `No — that is far outside the 0 to 10 range the line was fitted to`,
              `Yes — the equation is defined for every value of x you put into it`,
              `Yes, provided the trend line fits the plotted points closely enough`,
            ],
            correct: 0,
          },
          diagnoses: 'inference',
          why: `The line summarises the range it was drawn from. At x = ${far} it predicts ${intercept + slope * far}, which no data supports — extrapolation is guessing with a ruler.`,
        },
      ]),
      hints: [
        'First box is pure substitution. The other two are about what a fitted line is entitled to claim.',
        `At x = ${at}: ${slope}(${at}) + ${intercept} = ${predicted}.`,
        'A slope is a rate with units; a fitted line only speaks for the range it was fitted to.',
      ],
      explanation: `At ${at} ${c.x} the line predicts **${predicted}**. Its slope means about **${slope} ${c.unit}**, and it is **not** sound to predict at x = ${far}.\n\nThe three boxes separate three different skills. Substituting is arithmetic. Reading the slope as a rate with units is interpretation. Knowing the line stops speaking outside 0–10 is judgement — and it is the one people skip, because the equation happily returns ${intercept + slope * far} without warning you that nothing was ever measured out there.\n\nThe causal claim is the other trap: this plot recorded what people already did. Nobody was assigned an amount of ${c.x}, so association is all it can carry.`,
      transferBridge:
        'Next time you meet a chart in an article, ask its two limits out loud: what range was actually measured, and was anything assigned or merely observed?',
    }
  },
)

export const HS_BRIDGE_TEMPLATES: ItemTemplate[] = [
  absoluteEquation,
  absoluteInequality,
  sequenceRule,
  sequenceType,
  trigRatio,
  trigSolve,
  trendLine,
]
