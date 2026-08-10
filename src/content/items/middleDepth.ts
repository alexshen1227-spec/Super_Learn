/**
 * Middle-school depth: the CCSS grade 6-8 kinds the bank was thin on, straight
 * from the standards audit (docs/RESEARCH.md §25): GCF/LCM (6.NS.4), unit
 * rates with fraction inputs (7.RP.1), compound probability (7.SP.8),
 * comparing distributions by center-vs-spread (7.SP.3), repeating decimals and
 * irrationals (8.NS.1-2), cones and spheres (8.G.9), distance on the grid
 * (8.G.8), trend-line prediction with its limits (8.SP), and expected-value
 * comparison. All original; every answer computed.
 */
import { rint } from '../../engine/rng'
import type { ItemTemplate } from '../../domain/types'
import { cycle, fraction, gcd, mcq, mcqNoted, numeric, tpl } from '../lib'

// ---------------------------------------------------------------- number

const gcfLcm = tpl(
  { id: 'num-gcf-lcm', name: 'GCF and LCM', skillIds: ['m-integers'], bucket: 'math', difficulty: 2, variants: 40, minutes: 2 },
  (rng, seed) => {
    // Build from shared structure so both answers are exact: a = g·p, b = g·q
    // with p, q coprime.
    const g = cycle(seed, [2, 3, 4, 5, 6] as const)
    const coprime: [number, number][] = [[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [2, 7], [3, 7], [5, 6]]
    const [p, q] = coprime[rint(rng, 0, coprime.length - 1)]
    const a = g * p
    const b = g * q
    const lcm = g * p * q
    const wantGcf = seed % 2 === 0
    const c = cycle(Math.floor(seed / 2), [
      { gcfQ: `Gift bags must split ${a} pencils and ${b} erasers evenly with nothing left over. What is the LARGEST number of identical bags possible?`, lcmQ: `One light blinks every ${a} seconds, another every ${b}. After how many seconds do they first blink together?` },
      { gcfQ: `Tiles of one square size must exactly cover a ${a} cm × ${b} cm rectangle. What is the largest tile side, in cm?`, lcmQ: `Bus A leaves every ${a} minutes and Bus B every ${b}. They just left together — in how many minutes will they next leave together?` },
    ] as const)
    return {
      title: wantGcf ? 'Greatest common factor' : 'Least common multiple',
      prompt: wantGcf ? c.gcfQ : c.lcmQ,
      answer: numeric(wantGcf ? g : lcm),
      hints: [
        wantGcf ? 'You need the biggest number dividing BOTH.' : 'You need the smallest number BOTH divide into.',
        `${a} = ${g}×${p} and ${b} = ${g}×${q} share exactly the factor ${g}.`,
        `Worked path: **${wantGcf ? g : lcm}**.`,
      ],
      explanation: wantGcf
        ? `Factor both: ${a} = ${g}·${p}, ${b} = ${g}·${q}, and ${p} and ${q} share nothing — so the GCF is **${g}**. Splitting-evenly questions are GCF questions: the bag count must divide both totals.`
        : `${a} = ${g}·${p} and ${b} = ${g}·${q} first coincide at ${g}·${p}·${q} = **${lcm}**. Together-again questions are LCM questions. A useful check: GCF × LCM = ${g} × ${lcm} = ${g * lcm} = ${a} × ${b}, the product of the pair — if that identity fails, one of the two answers is wrong.`,
    }
  },
)

const rateFractions = tpl(
  { id: 'rate-fractions', name: 'Rates from fraction inputs', skillIds: ['m-ratio', 'm-fractions'], bucket: 'math', difficulty: 3, variants: 32, minutes: 2.5 },
  (rng, seed) => {
    const c = cycle(seed, [
      { did: 'walked', amt: 'km', per: 'hour' },
      { did: 'poured', amt: 'liters', per: 'minute' },
      { did: 'painted', amt: 'walls', per: 'hour' },
      { did: 'read', amt: 'chapters', per: 'hour' },
    ] as const)
    // (a/b) amount in (cNum/d) time → unit rate = (a/b)·(d/cNum); build so it's clean.
    const b = cycle(Math.floor(seed / 4), [2, 3, 4] as const)
    const a = rint(rng, 1, b - 1 > 0 ? b - 1 : 1) // proper fraction amount... keep a < b
    const d = cycle(Math.floor(seed / 12), [2, 4] as const)
    const rateN = a * d
    const rateD = b
    const g = gcd(rateN, rateD)
    return {
      title: 'Unit rate, fraction inputs',
      prompt: `Someone ${c.did} **${a}/${b} ${c.amt}** in **1/${d} ${c.per}**. What is the rate in ${c.amt} per ${c.per}? Answer as a fraction or whole number.`,
      answer: fraction(rateN, rateD),
      hints: [
        `Rate = amount ÷ time = (${a}/${b}) ÷ (1/${d}).`,
        `Dividing by 1/${d} multiplies by ${d}.`,
        `Worked path: ${a}/${b} × ${d} = ${rateN / g}/${rateD / g}.`,
      ],
      explanation: `(${a}/${b}) ÷ (1/${d}) = ${a}/${b} × ${d} = **${rateN / g}${rateD / g === 1 ? '' : '/' + rateD / g} ${c.amt} per ${c.per}** — in 1/${d} of a ${c.per} they did ${a}/${b}, so a full ${c.per} holds ${d} of those chunks. Complex-fraction rates are grade 7's honest jump: same "per one" idea, but the divide-by-a-fraction step now has to be real.`,
    }
  },
)

const repeatingDecimal = tpl(
  { id: 'num-repeating', name: 'Repeating decimal → fraction', skillIds: ['m-roots', 'm-decimals'], bucket: 'math', difficulty: 3, variants: 8, minutes: 2.5 },
  (rng, seed) => {
    const classify = seed % 3 === 0
    if (classify) {
      const c = cycle(Math.floor(seed / 3), [
        { n: '0.272727… (repeating)', is: 'Rational — the repeat can be captured as 27/99' },
        { n: '√10', is: 'Irrational — 10 is not a perfect square' },
        { n: 'the decimal 0.1 31 131 1131… (each block gains a 1, so no block ever repeats)', is: 'Irrational — no repeating block, so no fraction captures it' },
        { n: '√49', is: 'Rational — it equals the whole number 7' },
      ] as const)
      const all = [
        'Rational — the repeat can be captured as 27/99',
        'Irrational — 10 is not a perfect square',
        'Irrational — no repeating block, so no fraction captures it',
        'Rational — it equals the whole number 7',
      ]
      return {
        title: 'Rational or not?',
        prompt: `Classify **${c.n}**.`,
        answer: mcq(rng, c.is, all.filter((x) => x !== c.is)),
        hints: [
          'Rational = expressible as a fraction of integers; decimals that terminate OR repeat qualify.',
          'A root is rational only when the number under it is a perfect square.',
        ],
        explanation: `**${c.is}**. The dividing line is exact: terminating and repeating decimals are fractions in disguise; never-repeating ones are not, and √n joins the rationals only when n is a perfect square. "It has a pattern" is not enough — the pattern must REPEAT the same block forever.`,
      }
    }
    const block = cycle(seed, [3, 6, 7, 2, 8, 4] as const)
    return {
      title: 'Capture the repeat',
      prompt: `Write **0.${block}${block}${block}… (the digit ${block} repeating forever)** as a fraction in lowest terms.`,
      answer: fraction(block, 9),
      hints: [
        'Call it x. Then 10x shifts the decimal one place — and the tails match.',
        `10x − x = ${block}, so 9x = ${block}.`,
        `Worked path: ${block}/9${gcd(block, 9) > 1 ? ` = ${block / gcd(block, 9)}/${9 / gcd(block, 9)}` : ''}.`,
      ],
      explanation: `Let x = 0.${block}${block}${block}… Then 10x = ${block}.${block}${block}…, and subtracting kills the infinite tail: 9x = ${block}, so x = **${block}/9**${gcd(block, 9) > 1 ? ` = ${block / gcd(block, 9)}/${9 / gcd(block, 9)}` : ''}. This is why every repeating decimal is rational — the shift-and-subtract trick converts any repeat into a fraction, which is exactly what irrational numbers refuse.`,
    }
  },
)

// ---------------------------------------------------------------- probability & stats

const probAtLeast = tpl(
  { id: 'prob-at-least', name: 'At least one', skillIds: ['m-prob'], bucket: 'math', difficulty: 4, variants: 6, minutes: 2.5, calibration: true },
  (_rng, seed) => {
    const c = cycle(seed, [
      { trial: 'flips of a fair coin', hit: 'heads', pMissN: 1, pMissD: 2 },
      { trial: 'rolls of a fair die', hit: 'a six', pMissN: 5, pMissD: 6 },
      { trial: 'spins of a 4-section spinner', hit: 'the red section', pMissN: 3, pMissD: 4 },
    ] as const)
    const n = 2 + (Math.floor(seed / 3) % 2)
    const missN = c.pMissN ** n
    const missD = c.pMissD ** n
    const hitN = missD - missN
    return {
      title: 'The complement shortcut',
      prompt: `In **${n} ${c.trial}**, what is the probability of getting **${c.hit} at least once**? Answer as a fraction.`,
      answer: fraction(hitN, missD),
      hints: [
        '"At least one" is easiest through its opposite: NONE.',
        `P(none) = (${c.pMissN}/${c.pMissD})${n === 2 ? '²' : '³'} = ${missN}/${missD}.`,
        `Worked path: 1 − ${missN}/${missD} = ${hitN}/${missD}.`,
      ],
      explanation: `P(at least one) = 1 − P(none) = 1 − (${c.pMissN}/${c.pMissD})^${n} = 1 − ${missN}/${missD} = **${hitN}/${missD}**. Multiplying the single-trial probability by itself computes "EVERY time", and adding it n times overshoots badly — "at least one" almost always wants the complement door, and recognizing that is the skill.`,
    }
  },
)

const probNoReplace = tpl(
  { id: 'prob-no-replace', name: 'Without putting it back', skillIds: ['m-prob', 'm-counting', 'm-conditionalprob'], bucket: 'math', difficulty: 4, variants: 32, minutes: 2.5 },
  (rng, seed) => {
    const c = cycle(seed, [
      ['marbles', 'red', 'bag'],
      ['tickets', 'winning', 'jar'],
      ['socks', 'blue', 'drawer'],
      ['cards', 'starred', 'deck'],
    ] as const)
    const good = rint(rng, 3, 5)
    const bad = rint(rng, 3, 6)
    const total = good + bad
    const n1 = good * (good - 1)
    const d1 = total * (total - 1)
    const g = gcd(n1, d1)
    return {
      title: 'Two draws, no replacement',
      prompt: `A ${c[2]} holds **${good} ${c[1]} ${c[0]}** and **${bad}** others. You draw two, **without replacement**. What is the probability both are ${c[1]}? Answer as a fraction.`,
      answer: fraction(n1, d1),
      hints: [
        'The second draw happens in a CHANGED world: one fewer of everything.',
        `First: ${good}/${total}. Second, given a ${c[1]} is gone: ${good - 1}/${total - 1}.`,
        `Worked path: ${n1 / g}/${d1 / g}.`,
      ],
      explanation: `P = (${good}/${total}) × (${good - 1}/${total - 1}) = **${n1 / g}/${d1 / g}**. Keeping the denominators at ${total} is the with-replacement world, and it overstates the chance — after the first success there are only ${good - 1} ${c[1]} ${c[0]} in ${total - 1}. The habit worth building: before multiplying, ask what the world looks like when the second event happens.`,
    }
  },
)

const madCompare = tpl(
  { id: 'stats-mad', name: 'Spread as a number', skillIds: ['m-variability'], bucket: 'math', difficulty: 3, variants: 32, minutes: 3 },
  (rng, seed) => {
    // Symmetric-around-mean sets so the MAD is exact by construction.
    const mean = cycle(seed, [10, 12, 15, 20] as const)
    const dev = cycle(Math.floor(seed / 4), [1, 2, 3] as const)
    const devB = dev + rint(rng, 1, 3)
    const setA = [mean - dev, mean - dev, mean + dev, mean + dev]
    const setB = [mean - devB, mean - devB, mean + devB, mean + devB]
    return {
      title: 'Mean absolute deviation',
      prompt: `Team A's scores: **${setA.join(', ')}**. Team B's: **${setB.join(', ')}**. Both average ${mean}. What is the MAD (mean absolute deviation) of **Team B**?`,
      answer: numeric(devB),
      hints: [
        'MAD = average distance from the mean, ignoring direction.',
        `Every Team B score sits exactly ${devB} away from ${mean}.`,
        `Worked path: **${devB}**.`,
      ],
      explanation: `Each of B's scores is |score − ${mean}| = ${devB} from the mean, so the average distance is **${devB}**. Same center, different spread: A's MAD is ${dev}, so B is ${devB > dev * 2 ? 'more than twice' : 'noticeably'} more scattered — and that difference is invisible to the mean alone, which is the whole reason a spread NUMBER exists.`,
    }
  },
)

const evCompare = tpl(
  { id: 'ev-compare', name: 'Which option pays long-run?', skillIds: ['m-ev'], bucket: 'math', difficulty: 4, variants: 24, minutes: 3, transfer: true },
  (rng, seed) => {
    const c = cycle(seed, [
      { a: 'Spinner A', b: 'Spinner B', unit: 'points' },
      { a: 'Game A', b: 'Game B', unit: 'tickets' },
      { a: 'Route A (toll gamble)', b: 'Route B (steady)', unit: 'minutes saved' },
    ] as const)
    // A: p chance of big, else small. B: certain mid. Constructed so EVs differ.
    const pD = 4
    const pN = 1
    const big = cycle(Math.floor(seed / 3), [20, 24, 32] as const)
    const small = rint(rng, 0, 4)
    const evA4 = pN * big + (pD - pN) * small // 4×EV(A), integral
    const mid = evA4 / 4 + (seed % 2 === 0 ? 1 : -1) // B beats or loses by 1... may be fractional
    const midInt = Math.round(mid)
    const evA = evA4 / 4
    const better = evA > midInt ? c.a : c.b
    const { answer, distractorNotes, distractorTags } = mcqNoted(rng, `${better} — its long-run average is higher`, [
      [`${better === c.a ? c.b : c.a} — its long-run average is higher`, `compute both: A averages ${evA} and B averages ${midInt}`, 'slip'],
      [`${c.a} — its best case (${big}) is the biggest number on offer`, 'the best case ignores how OFTEN it happens; expected value weights outcomes by probability', 'concept'],
      [`They are equal in the long run`, `${evA} and ${midInt} differ — close is not equal`, 'slip'],
    ])
    return {
      title: 'Expected value, head to head',
      prompt: `${c.a} gives **${big} ${c.unit}** with probability 1/4, otherwise **${small}**. ${c.b} gives **${midInt} ${c.unit}** every time. Over many plays, which earns more per play?`,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        `EV(A) = (1/4)(${big}) + (3/4)(${small}).`,
        `That is ${evA}; compare with ${c.b}'s certain ${midInt}.`,
      ],
      explanation: `EV(A) = (1/4)·${big} + (3/4)·${small} = ${evA} ${c.unit} per play, against ${c.b}'s ${midInt}. **${better}** wins the long run. The pull to resist is best-case thinking — ${big} is loud, but it happens a quarter of the time, and expected value is exactly the discipline of letting the probabilities do the shouting.`,
    }
  },
)

const trendPredict = tpl(
  { id: 'trend-predict', name: 'Use the trend, know its limits', skillIds: ['m-bestfit'], bucket: 'math', difficulty: 3, variants: 32, minutes: 2.5, calibration: true },
  (rng, seed) => {
    const c = cycle(seed, [
      { x: 'hours studied', y: 'quiz score', unit: 'points' },
      { x: 'weeks of training', y: '5K time saved', unit: 'seconds' },
      { x: 'plant age in weeks', y: 'height', unit: 'cm' },
      { x: 'practice sessions', y: 'words per minute', unit: 'wpm' },
    ] as const)
    const m = rint(rng, 3, 8)
    const b = rint(rng, 10, 40)
    const inside = seed % 2 === 0
    if (inside) {
      const x = rint(rng, 3, 7)
      return {
        title: 'Predict from the line',
        prompt: `A best-fit line through data on ${c.x} (0 to 10) vs ${c.y} is **y = ${m}x + ${b}**. Predict ${c.y} at **${x} ${c.x.split(' ')[0] === 'hours' ? 'hours' : c.x}** (inside the data range).`,
        answer: numeric(m * x + b),
        hints: [
          'Substitute into the line.',
          `${m}×${x} + ${b}.`,
          `Worked path: **${m * x + b}**.`,
        ],
        explanation: `y = ${m}(${x}) + ${b} = **${m * x + b} ${c.unit}** — a fair estimate because ${x} sits inside the range the line was fitted on, and prediction between observed points (interpolation) is what a trend line is for. The prediction is a best GUESS with scatter around it, not a promise.`,
      }
    }
    const far = rint(rng, 40, 80)
    const { answer, distractorNotes, distractorTags } = mcqNoted(
      rng,
      `Not trustworthy — ${far} is far outside the data, and the straight-line pattern may not continue`,
      [
        [`${m * far + b} ${c.unit}, exactly as the line says`, 'the arithmetic is right but the LINE has no evidence out there — extrapolation is the trap', 'inference'],
        [`Trustworthy, because the line fit the data well`, 'good fit inside the range says nothing about behavior far outside it', 'inference'],
        [`Not trustworthy, because best-fit lines only work at the exact measured points`, 'too strict the other way — interpolation between observed points is legitimate', 'inference'],
      ],
    )
    return {
      title: 'The edge of the evidence',
      prompt: `The same line (fitted on ${c.x} from 0 to 10) predicts y = ${m * far + b} at **${far}**. How much should you trust that?`,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'Where does the DATA live, and where is the question asking?',
        'A line fitted on 0-10 has evidence about 0-10.',
      ],
      explanation: `**Not trustworthy** — ${far} is far beyond the fitted range, and nothing in the data says the pattern stays straight out there (real quantities saturate, plateau, or break). The same line is a good tool at x = 5 and a guess wearing a lab coat at x = ${far}. Knowing WHERE a model's evidence ends is the difference between using it and being used by it.`,
    }
  },
)

// ---------------------------------------------------------------- geometry

const volConeSphere = tpl(
  { id: 'vol-cone-sphere', name: 'Cones, spheres, cylinders', skillIds: ['m-volume', 'm-solidgeometry'], bucket: 'math', difficulty: 3, variants: 23, minutes: 2.5 },
  (rng, seed) => {
    const r = cycle(seed, [1, 2, 3, 4] as const)
    const h = rint(rng, 2, 6) * 3 // divisible by 3 so cone volume is exact in π
    const kind = cycle(Math.floor(seed / 4), ['cylinder', 'cone', 'sphere'] as const)
    const inPi = kind === 'cylinder' ? r * r * h : kind === 'cone' ? (r * r * h) / 3 : (4 / 3) * r ** 3
    const prompt =
      kind === 'sphere'
        ? `A sphere has radius **${r}**. Its volume is kπ. What is **k**? (V = (4/3)πr³ — with r = ${r}, k stays exact.)`
        : kind === 'cone'
          ? `A cone has radius **${r}** and height **${h}**. Its volume is kπ. What is **k**? (V = (1/3)πr²h.)`
          : `A cylinder has radius **${r}** and height **${h}**. Its volume is kπ. What is **k**? (V = πr²h.)`
    const exact = kind === 'sphere' ? (4 * r ** 3) % 3 === 0 ? (4 * r ** 3) / 3 : null : inPi
    // For spheres keep r a multiple of 3? r∈{1..4}: 4r³/3 exact only for r=3. Use k as fraction-safe:
    const answer = kind === 'sphere' && exact === null ? fraction(4 * r ** 3, 3) : numeric(exact as number)
    return {
      title: 'Solid volume',
      prompt: kind === 'sphere' && exact === null ? prompt + ' Answer as a fraction.' : prompt,
      answer,
      hints: [
        kind === 'cylinder' ? 'Base area times height.' : kind === 'cone' ? 'A cone is exactly one third of its cylinder.' : 'V = (4/3)πr³ — cube the radius first.',
        kind === 'sphere' ? `r³ = ${r ** 3}.` : `r² = ${r * r}${kind === 'cone' ? `, and one third of ${r * r * h}` : `, times h = ${h}`}.`,
      ],
      explanation:
        kind === 'cylinder'
          ? `V = πr²h = π·${r * r}·${h} = **${inPi}π**. The cylinder is the reference solid the other two formulas are measured against.`
          : kind === 'cone'
            ? `V = (1/3)πr²h = (1/3)·${r * r}·${h}·π = **${inPi}π** — exactly a third of the matching cylinder (${r * r * h}π). The 1/3 is not a convention; pour three cones of water into the cylinder and it fills.`
            : `V = (4/3)πr³ = (4/3)·${r ** 3}·π = **${exact === null ? `${4 * r ** 3}/3` : exact}π**. Cubing the radius before anything else is the discipline — doubling r multiplies the volume by 8, which is why "slightly bigger ball" is so much heavier.`,
    }
  },
)

const gridDistance = tpl(
  { id: 'pyth-distance', name: 'Distance on the grid', skillIds: ['m-triangles', 'm-coord'], bucket: 'math', difficulty: 3, variants: 40, minutes: 2.5, transfer: true },
  (rng) => {
    const trips: [number, number][] = [[3, 4], [6, 8], [5, 12], [8, 15], [9, 12], [7, 24]]
    const [dx, dy] = trips[rint(rng, 0, trips.length - 1)]
    const d = Math.sqrt(dx * dx + dy * dy)
    const x1 = rint(rng, -5, 3)
    const y1 = rint(rng, -5, 3)
    return {
      title: 'How far apart?',
      prompt: `Find the distance between **(${x1}, ${y1})** and **(${x1 + dx}, ${y1 + dy})**.`,
      answer: numeric(d),
      hints: [
        'Draw the right triangle: the legs are the horizontal and vertical gaps.',
        `Legs ${dx} and ${dy}: distance² = ${dx}² + ${dy}².`,
        `Worked path: √${dx * dx + dy * dy} = **${d}**.`,
      ],
      explanation: `Horizontal gap ${dx}, vertical gap ${dy}, and the straight-line distance is the hypotenuse: √(${dx}² + ${dy}²) = √${dx * dx + dy * dy} = **${d}**. Adding the gaps (${dx + dy}) measures the taxicab route, not the crow's flight — the Pythagorean theorem is what turns coordinates into distances, and it is the bridge this skill exists to build.`,
    }
  },
)

export const MIDDLE_DEPTH_TEMPLATES: ItemTemplate[] = [
  gcfLcm,
  rateFractions,
  repeatingDecimal,
  probAtLeast,
  probNoReplace,
  madCompare,
  evCompare,
  trendPredict,
  volConeSphere,
  gridDistance,
]
