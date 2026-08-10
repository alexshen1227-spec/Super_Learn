/**
 * Upper curriculum expansion: data spread, exponential models, waves,
 * algorithm scaling, and experimental design. Every numeric key is computed
 * from the generated values and audited through the production validator.
 */
import type { ItemTemplate } from '../../domain/types'
import { pick, rint } from '../../engine/rng'
import { cycle, mcq, mcqNoted, numeric, round, tpl} from '../lib'

const variabilityIqr = tpl(
  { id: 'var-iqr', name: 'Interquartile range', skillIds: ['m-variability'], bucket: 'math', difficulty: 2, variants: 20, minutes: 2.5 },
  (rng) => {
    const start = rint(rng, 2, 12)
    const data = [start]
    for (let i = 1; i < 7; i++) data.push(data[i - 1] + rint(rng, 1, 4))
    const q1 = data[1]
    const q3 = data[5]
    const iqr = q3 - q1
    return {
      title: 'The middle half',
      prompt: `The sorted data are **${data.join(', ')}**. Exclude the overall median when splitting the halves. What is the interquartile range (IQR)?`,
      answer: numeric(iqr),
      hints: [
        'For seven values, the fourth value is the overall median; leave it out of both halves.',
        `The lower-half median is Q1 = ${q1}; the upper-half median is Q3 = ${q3}.`,
        `IQR = Q3 − Q1 = ${q3} − ${q1} = **${iqr}**.`,
      ],
      explanation: `The lower half is ${data.slice(0, 3).join(', ')} and the upper half is ${data.slice(4).join(', ')}. Their medians are ${q1} and ${q3}, so IQR = ${q3} − ${q1} = **${iqr}**. IQR describes the spread of the middle 50%.`,
      commonErrors: { strategy: 'Range uses maximum − minimum; IQR uses Q3 − Q1 and deliberately ignores the outer quarters.' },
    }
  },
)

const variabilityCompare = tpl(
  { id: 'var-compare', name: 'Same center, different spread', skillIds: ['m-variability'], bucket: 'math', difficulty: 3, variants: 16, minutes: 3, transfer: true, calibration: true },
  (rng) => {
    const center = rint(rng, 12, 30)
    const wide = rint(rng, 6, 10)
    const a = [center - wide, center, center, center, center + wide]
    const b = [center - 2, center - 1, center, center + 1, center + 2]
    const correct = 'Group B is more consistent: it has the same mean but much less spread'
    const noted = mcqNoted(rng, correct, [
      ['They are equally consistent because their means match', 'center-only trap — equal averages do not imply equal variability', 'concept'],
      ['Group A is more consistent because it contains the center value three times', 'frequency trap — the extreme values still create much larger spread', 'concept'],
      ['No comparison is possible unless both groups have at least 100 values', 'sample-size overreach — small samples limit certainty but their observed spreads remain comparable', 'inference'],
    ])
    return {
      title: 'What the average hides',
      prompt: `Two machines fill boxes to a target of ${center} g.\n\n**Machine A:** ${a.join(', ')}\n\n**Machine B:** ${b.join(', ')}\n\nBoth means are ${center} g. Which conclusion is supported by these data?`,
      answer: noted.answer,
      distractorNotes: noted.distractorNotes,
      distractorTags: noted.distractorTags,
      hints: [
        'The mean only locates the center. Compare how far values wander from it.',
        `A spans ${a[4] - a[0]} g; B spans ${b[4] - b[0]} g.`,
        `Worked path: **${correct}**.`,
      ],
      explanation: `Both groups balance at ${center}, but A ranges across ${a[4] - a[0]} g while B ranges across only ${b[4] - b[0]} g. **Group B is more consistent.** Center and spread answer different questions, so both belong in a comparison.`,
      transferBridge: 'Where else could two equal averages conceal different risk—grades, delivery times, medical outcomes, or investment returns?',
    }
  },
)

const exponentialGrowth = tpl(
  { id: 'exp-growth', name: 'Repeated percent growth', skillIds: ['m-exponential'], bucket: 'math', difficulty: 3, variants: 14, minutes: 3 },
  (rng) => {
    const start = pick(rng, [80, 100, 160, 200, 320, 400])
    const rate = pick(rng, [10, 20, 25])
    const periods = pick(rng, [2, 3])
    const factor = 1 + rate / 100
    const result = round(start * factor ** periods, 2)
    return {
      title: 'Growth compounds',
      prompt: `A quantity starts at **${start}** and grows by **${rate}% per period** for **${periods} periods**. What is the final amount?`,
      answer: numeric(result, { tolerance: 0.01 }),
      hints: [
        `A ${rate}% increase means multiply by ${factor}, not add ${rate}% of the original forever.`,
        `Model: ${start} × ${factor}^${periods}.`,
        `Worked path: ${start} × ${round(factor ** periods, 4)} = **${result}**.`,
      ],
      explanation: `Each period acts on the new amount: ${start}(${factor})^${periods} = **${result}**. Adding ${rate * periods}% of the starting value would ignore compounding.` ,
      commonErrors: { concept: 'Repeated percent change multiplies growth factors; it does not repeatedly add a percent of the original base.' },
    }
  },
)

const exponentialRecognize = tpl(
  { id: 'exp-recognize', name: 'Linear or exponential?', skillIds: ['m-exponential'], bucket: 'math', difficulty: 3, variants: 16, minutes: 2.5, transfer: true },
  (rng) => {
    const start = rint(rng, 2, 8)
    const factor = pick(rng, [2, 3])
    const exponential = [start, start * factor, start * factor ** 2, start * factor ** 3]
    const add = rint(rng, 3, 8)
    const linear = [start, start + add, start + 2 * add, start + 3 * add]
    const showExp = rng() < 0.5
    const values = showExp ? exponential : linear
    const correct = showExp
      ? `Exponential: each value is multiplied by ${factor}`
      : `Linear: each value increases by ${add}`
    return {
      title: 'Name the growth pattern',
      prompt: `At equally spaced times, a quantity is **${values.join(', ')}**. Which model fits?`,
      answer: mcq(rng, correct, showExp
        ? [`Linear: it increases by ${values[1] - values[0]}`, 'Neither: exponential data cannot contain whole numbers', 'Quadratic: the values are getting larger']
        : [`Exponential: it grows by ${add}`, 'Neither: linear data must start at zero', 'Exponential: every value is positive']),
      hints: [
        'Check consecutive differences for linear behavior and consecutive ratios for exponential behavior.',
        showExp ? `Ratios: ${values[1]}/${values[0]} = ${factor}, ${values[2]}/${values[1]} = ${factor}.` : `Differences: ${values[1]}−${values[0]} = ${add}, ${values[2]}−${values[1]} = ${add}.`,
        `Worked path: **${correct}**.`,
      ],
      explanation: `${correct}. Linear patterns preserve an additive difference; exponential patterns preserve a multiplicative ratio.`,
      transferBridge: 'When reading a real growth claim, ask whether the absolute change or the percentage change is staying constant.',
    }
  },
)

const waveEquation = tpl(
  { id: 'wave-equation', name: 'Wave speed equation', skillIds: ['p-waves'], bucket: 'physics', difficulty: 2, variants: 20, minutes: 2.5 },
  (rng) => {
    const frequency = pick(rng, [50, 80, 100, 120, 200, 250])
    const wavelength = pick(rng, [0.5, 1, 1.5, 2, 3, 4])
    const speed = frequency * wavelength
    const solve = pick(rng, ['speed', 'wavelength'] as const)
    const answer = solve === 'speed' ? speed : wavelength
    const prompt = solve === 'speed'
      ? `A wave has frequency **${frequency} Hz** and wavelength **${wavelength} m**. What is its speed in m/s?`
      : `A wave travels at **${speed} m/s** with frequency **${frequency} Hz**. What is its wavelength in meters?`
    return {
      title: 'v = fλ',
      prompt,
      answer: numeric(answer, { unit: solve === 'speed' ? 'm/s' : 'm' }),
      hints: [
        'Use v = fλ. Hz means cycles per second.',
        solve === 'speed' ? `Multiply: ${frequency} × ${wavelength}.` : `Rearrange: λ = v/f = ${speed}/${frequency}.`,
        `Worked path: **${answer} ${solve === 'speed' ? 'm/s' : 'm'}**.`,
      ],
      explanation: solve === 'speed'
        ? `v = fλ = ${frequency} × ${wavelength} = **${speed} m/s**. The units check: (1/s)×m = m/s.`
        : `λ = v/f = ${speed}/${frequency} = **${wavelength} m**. Dividing speed by cycles per second leaves distance per cycle.`,
    }
  },
)

const waveConcept = tpl(
  { id: 'wave-concept', name: 'Frequency, wavelength, amplitude', skillIds: ['p-waves'], bucket: 'physics', difficulty: 3, variants: 2, minutes: 2.5, transfer: true, calibration: true },
  (rng, seed) => {
    const cases = [
      {
        prompt: 'Two sound waves travel through the same air. Wave B has twice the frequency of wave A. What happens to B’s wavelength?',
        correct: 'It is half as long because wave speed in the same medium is approximately fixed',
        wrong: ['It is twice as long', 'It is unchanged because wavelength never depends on frequency', 'It becomes louder'],
      },
      {
        prompt: 'A sound wave’s amplitude increases while its frequency stays fixed. What changes most directly?',
        correct: 'Its intensity (and perceived loudness), not its pitch',
        wrong: ['Its pitch doubles', 'Its wavelength becomes zero', 'Its frequency must decrease'],
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Read the wave',
      prompt: c.prompt,
      answer: mcq(rng, c.correct, c.wrong),
      hints: ['Separate the jobs: frequency relates to pitch, amplitude to intensity, and v = fλ links frequency to wavelength.', 'Hold the stated quantities fixed and use the relationship that remains.', `Worked path: **${c.correct}**.`],
      explanation: `**${c.correct}**. Changing one wave property does not give every other property permission to change; track the equation and the medium.`,
      transferBridge: 'Use the same “what is held fixed?” discipline when reasoning about any proportional relationship.',
    }
  },
)

const complexityCount = tpl(
  { id: 'complexity-count', name: 'Count nested-loop work', skillIds: ['c-complexity'], bucket: 'coding', difficulty: 3, variants: 4, minutes: 3 },
  (rng) => {
    const n = rint(rng, 3, 9)
    const count = n * n
    return {
      title: 'How the work scales',
      prompt: `The inner statement runs once for every pair (i, j):\n\n\`\`\`\nfor (let i = 0; i < ${n}; i++) {\n  for (let j = 0; j < ${n}; j++) {\n    check(i, j)\n  }\n}\n\`\`\`\n\nHow many times does **check** run?`,
      answer: numeric(count),
      hints: ['Count the inner runs for one outer pass, then multiply by the number of outer passes.', `The inner loop runs ${n} times for each of ${n} outer iterations.`, `Worked path: ${n} × ${n} = **${count}** calls.`],
      explanation: `There are ${n} choices for i and ${n} choices for j, making **${n}² = ${count}** pairs. When n doubles, this kind of work roughly quadruples: O(n²).`,
      commonErrors: { strategy: 'Adding the loop lengths counts two separate loops; nesting multiplies their work.' },
    }
  },
)

const complexityChoose = tpl(
  { id: 'complexity-choose', name: 'Choose an algorithm by scale', skillIds: ['c-complexity'], bucket: 'coding', difficulty: 4, variants: 1, minutes: 3, transfer: true },
  (rng) => {
    const power = pick(rng, [8, 9, 10, 11])
    const n = 2 ** power
    const correct = `Binary search: at most about ${power} comparisons because the data are sorted`
    return {
      title: 'Exploit the structure',
      prompt: `You must find one ID in a **sorted** array of ${n} IDs. Which plan scales best?`,
      answer: mcq(rng, correct, [
        `Linear scan: always inspect all ${n} IDs`,
        `Compare every pair: about ${n * n} comparisons`,
        'Shuffle the array first, then scan it',
      ]),
      hints: ['Sorted order lets one comparison rule out a large region.', 'Each binary-search comparison cuts the remaining candidates roughly in half.', `Since ${n} = 2^${power}, about ${power} halvings reach one candidate.`],
      explanation: `**${correct}**. A linear scan is O(n); binary search is O(log n). The advantage grows with the input, which is the point of complexity reasoning.`,
      transferBridge: 'Before optimizing details, ask what structure lets you eliminate whole regions of work.',
    }
  },
)

const designAssignment = tpl(
  { id: 'design-assignment', name: 'Random sampling vs assignment', skillIds: ['s-design'], bucket: 'science', difficulty: 3, variants: 1, minutes: 3, calibration: true },
  (rng) => {
    const correct = 'Randomly assign the volunteers to the two methods, then compare outcomes'
    const noted = mcqNoted(rng, correct, [
      ['Let each volunteer choose the method they prefer', 'self-selection — motivation and prior beliefs can differ between groups', 'inference'],
      ['Put the strongest students in the new-method group', 'baseline imbalance — the groups differ before treatment begins', 'inference'],
      ['Use the new method first and the old method next year', 'time confound — different cohorts and conditions replace a fair comparison', 'inference'],
    ])
    return {
      title: 'Build a causal comparison',
      prompt: 'A school has 80 volunteers and wants to test whether a new study method causes better quiz performance. What is the strongest next step?',
      answer: noted.answer,
      distractorNotes: noted.distractorNotes,
      distractorTags: noted.distractorTags,
      hints: ['The groups should differ systematically in only one thing: the assigned method.', 'Selection by preference or ability creates a difference before treatment.', `Worked path: **${correct}**.`],
      explanation: `**${correct}**. Random assignment does not guarantee perfectly equal groups, but it prevents systematic assignment bias on average and makes a causal comparison defensible.`,
    }
  },
)

const designReplication = tpl(
  { id: 'design-replication', name: 'Blinding and replication', skillIds: ['s-design'], bucket: 'science', difficulty: 4, variants: 2, minutes: 3, transfer: true },
  (rng, seed) => {
    const cases = [
      {
        setup: 'Researchers scoring essays know which students used the new curriculum.',
        ask: 'What design improvement most directly blocks expectation from affecting the scores?',
        correct: 'Hide group labels from the essay scorers (blind the outcome assessment)',
        wrong: [
          'Increase the font size on every essay so the scorers can read them all more comfortably',
          'Tell the scorers the expected result more clearly so they know what to look out for',
          'Score only the essays from the new curriculum and drop the comparison group entirely',
        ],
      },
      {
        setup: 'One small experiment finds a surprising effect with p = 0.04.',
        ask: 'What would most strengthen confidence that the effect is not a sample-specific fluke?',
        correct: 'Independent replication with a new sample and the same predeclared method',
        wrong: ['Repeat the analysis many ways and publish the smallest p-value', 'Remove inconvenient observations without reporting it', 'Treat p = 0.04 as proof that the theory is true'],
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Make the result survive scrutiny',
      prompt: `${c.setup}\n\n${c.ask}`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: ['Name the threat first: expectation bias or a result that may not repeat.', 'Choose a design feature that directly blocks that threat.', `Worked path: **${c.correct}**.`],
      explanation: `**${c.correct}**. Strong evidence is not one impressive number; it is a design that blocks plausible alternative explanations and a result that survives repetition.`,
      transferBridge: 'When evaluating a claim, ask both “how could bias enter?” and “did an independent team reproduce it?”',
    }
  },
)

export const ADVANCED_CURRICULUM_TEMPLATES: ItemTemplate[] = [
  variabilityIqr,
  variabilityCompare,
  exponentialGrowth,
  exponentialRecognize,
  waveEquation,
  waveConcept,
  complexityCount,
  complexityChoose,
  designAssignment,
  designReplication,
]
