/**
 * Density for the high-school tracks' thin skills — trig, transformations,
 * circles, function moves, logarithm structure. Same laws as everywhere:
 * original problems, computed answers, mal-rule distractors.
 */
import { rint } from '../../engine/rng'
import type { ItemTemplate } from '../../domain/types'
import { cycle, mcqNoted, numeric, tpl } from '../lib'

const trigAngleSide = tpl(
  { id: 'trig-choose-solve', name: 'Pick the ratio, then use it', skillIds: ['m-trig'], bucket: 'math', difficulty: 4, variants: 24, minutes: 3 },
  (rng, seed) => {
    // 3-4-5 family keeps everything exact.
    const k = rint(rng, 2, 6)
    const [opp, adj, hyp] = [3 * k, 4 * k, 5 * k]
    const mode = cycle(seed, ['sin', 'cos', 'tan'] as const)
    const val = mode === 'sin' ? opp / hyp : mode === 'cos' ? adj / hyp : opp / adj
    const c = cycle(Math.floor(seed / 3), [
      ['a ramp', 'the ramp surface'],
      ['a zipline', 'the cable'],
      ['a ladder', 'the ladder'],
      ['a kite string', 'the string'],
    ] as const)
    return {
      title: 'Trig ratio in the wild',
      prompt: `For ${c[0]}, the angle θ at the ground has: opposite side **${opp} m**, adjacent **${adj} m**, and ${c[1]} (hypotenuse) **${hyp} m**. What is **${mode}(θ)**? Answer as a decimal.`,
      answer: numeric(Math.round(val * 100) / 100, { tolerance: 0.005 }),
      hints: [
        mode === 'sin' ? 'sin = opposite / hypotenuse.' : mode === 'cos' ? 'cos = adjacent / hypotenuse.' : 'tan = opposite / adjacent.',
        mode === 'sin'
          ? `Put the two sides in as a ratio: ${opp}/${hyp}.`
          : mode === 'cos'
            ? `Put the two sides in as a ratio: ${adj}/${hyp}.`
            : `Put the two sides in as a ratio: ${opp}/${adj}.`,
        `Worked path: **${Math.round(val * 100) / 100}**.`,
      ],
      explanation: `${mode}(θ) = ${mode === 'sin' ? `opposite/hypotenuse = ${opp}/${hyp}` : mode === 'cos' ? `adjacent/hypotenuse = ${adj}/${hyp}` : `opposite/adjacent = ${opp}/${adj}`} = **${Math.round(val * 100) / 100}**. The ratio choice IS the skill — SOH-CAH-TOA is a filing system, and the misfiled ratio is the dominant trig error. Note the ratio came out the same for every ${3 * 2}-${4 * 2}-${5 * 2}-shaped triangle: ratios depend on the ANGLE, not the size, which is the whole reason trig works.`,
    }
  },
)

const transformCompose = tpl(
  { id: 'transform-compose', name: 'Two moves, one landing spot', skillIds: ['m-transform', 'm-coord'], bucket: 'math', difficulty: 4, variants: 40, minutes: 2.5 },
  (rng, seed) => {
    const x = rint(rng, -6, 6)
    const y = rint(rng, -6, 6)
    const mode = cycle(seed, ['reflect-then-shift', 'rotate180-then-shift'] as const)
    const dx = rint(rng, 1, 4)
    const dy = rint(rng, 1, 4)
    const mid: [number, number] = mode === 'reflect-then-shift' ? [-x, y] : [-x, -y]
    const fin: [number, number] = [mid[0] + dx, mid[1] + dy]
    const askX = seed % 2 === 0
    return {
      title: 'Compose the transformations',
      prompt: `The point **(${x}, ${y})** is ${mode === 'reflect-then-shift' ? 'reflected across the y-axis' : 'rotated 180° about the origin'}, THEN translated by (+${dx}, +${dy}). What is the **${askX ? 'x' : 'y'}-coordinate** of where it lands?`,
      answer: numeric(askX ? fin[0] : fin[1]),
      hints: [
        mode === 'reflect-then-shift' ? 'Reflecting across the y-axis flips the SIGN of x only.' : 'A 180° rotation about the origin flips BOTH signs.',
        `After step one: (${mid[0]}, ${mid[1]}). Then add the shift.`,
        `Worked path: (${fin[0]}, ${fin[1]}) → **${askX ? fin[0] : fin[1]}**.`,
      ],
      explanation: `Step one sends (${x}, ${y}) to (${mid[0]}, ${mid[1]}) — ${mode === 'reflect-then-shift' ? 'the y-axis reflection negates x and leaves y alone' : '180° about the origin negates both coordinates'}. The translation then adds componentwise: **(${fin[0]}, ${fin[1]})**. ORDER matters: shifting first and transforming second lands elsewhere (try it), which is why compositions are read right-to-left like instructions, not left-to-right like sentences.`,
    }
  },
)

const similaritySolve = tpl(
  { id: 'transform-similar-solve', name: 'Similar triangles, missing side', skillIds: ['m-transform', 'm-proportion'], bucket: 'math', difficulty: 3, variants: 32, minutes: 2.5 },
  (rng, seed) => {
    const k = cycle(seed, [2, 3, 4] as const) // scale factor, exact
    const a = rint(rng, 3, 8)
    const b = rint(rng, 4, 9)
    const c = cycle(Math.floor(seed / 3), [
      ['a phone photo and its print', 'cm'],
      ['a model bridge and the real one', 'm'],
      ['a shadow-stick setup and the flagpole\'s', 'm'],
      ['two nested picture frames', 'cm'],
    ] as const)
    return {
      title: 'Use the similarity',
      prompt: `Two similar triangles come from ${c[0]}. The small one has sides **${a} ${c[1]}** and **${b} ${c[1]}**; the large one's side matching the ${a} is **${a * k} ${c[1]}**. How long is the side matching the ${b}, in ${c[1]}?`,
      answer: numeric(b * k),
      hints: [
        'Find the one scale factor connecting the matching pair you know.',
        `${a * k} ÷ ${a} = ${k} — every length scales by ${k}.`,
        `Worked path: **${b * k}**.`,
      ],
      explanation: `The matching pair gives the factor: ${a * k}/${a} = **${k}**, and similarity means ONE factor stretches every length, so ${b} × ${k} = **${b * k} ${c[1]}**. The classic slip is additive — "the side grew by ${a * k - a}, so add ${a * k - a}" — but similar figures multiply, never add, which is also why doubling a photo's sides quadruples its area.`,
    }
  },
)

const circleSector = tpl(
  { id: 'circle-sector', name: 'A slice of the circle', skillIds: ['m-circles'], bucket: 'math', difficulty: 3, variants: 25, minutes: 2.5 },
  (rng, seed) => {
    const r = rint(rng, 2, 8)
    const frac = cycle(seed, [
      { deg: 90, name: 'a quarter', mult: 4 },
      { deg: 120, name: 'a third', mult: 3 },
      { deg: 60, name: 'a sixth', mult: 6 },
      { deg: 180, name: 'half', mult: 2 },
    ] as const)
    const askArea = seed % 2 === 0
    const areaK = (r * r) / frac.mult
    const arcK = (2 * r) / frac.mult
    const isInt = (v: number) => Number.isInteger(v)
    const val = askArea ? areaK : arcK
    return {
      title: askArea ? 'Sector area' : 'Arc length',
      prompt: `A circle has radius **${r}**. A **${frac.deg}°** slice is cut. Its ${askArea ? 'AREA' : 'curved edge (arc length)'} is kπ — what is **k**?${isInt(val) ? '' : ' (May be a decimal.)'}`,
      answer: numeric(Math.round(val * 100) / 100, { tolerance: 0.005 }),
      hints: [
        `${frac.deg}° is ${frac.name} of the full 360°.`,
        askArea ? `Full area is ${r * r}π; take ${frac.name}.` : `Full circumference is ${2 * r}π; take ${frac.name}.`,
        `Worked path: **${Math.round(val * 100) / 100}**.`,
      ],
      explanation: `A ${frac.deg}° slice is ${frac.deg}/360 = 1/${frac.mult} of the circle, so its ${askArea ? `area is ${r * r}π ÷ ${frac.mult}` : `arc is ${2 * r}π ÷ ${frac.mult}`} = **${Math.round(val * 100) / 100}π**. Every sector question is the same two steps — what fraction of the circle, applied to which whole (area ${r * r}π vs circumference ${2 * r}π) — and mixing up WHICH whole is the standard slip.`,
    }
  },
)

const funcShift = tpl(
  { id: 'func-shift', name: 'Slide the graph', skillIds: ['m-functions', 'm-quadratic'], bucket: 'math', difficulty: 4, variants: 21, minutes: 2.5, calibration: true },
  (rng, seed) => {
    const h = rint(rng, 1, 6)
    const kk = rint(rng, 1, 6)
    const inside = seed % 2 === 0
    if (inside) {
      const dir = cycle(Math.floor(seed / 2), ['minus', 'plus'] as const)
      const correct = dir === 'minus' ? `${h} units to the RIGHT` : `${h} units to the LEFT`
      const { answer, distractorNotes, distractorTags } = mcqNoted(rng, correct, [
        [dir === 'minus' ? `${h} units to the LEFT` : `${h} units to the RIGHT`, 'inside changes run OPPOSITE to their sign — the x that used to do the job is now x ∓ ' + h],
        [`${h} units UP`, 'inside the parentheses moves the graph horizontally; vertical moves are added OUTSIDE'],
        [`Nothing — the shape absorbs it`, 'the shape is preserved but the position is not; every point slides'],
      ])
      return {
        title: 'The inside shift',
        prompt: `Compared with the graph of f(x), where does the graph of **f(x ${dir === 'minus' ? '−' : '+'} ${h})** sit?`,
        answer,
        distractorNotes,
        distractorTags,
        hints: [
          'Ask: what input now produces the value f(0) used to produce?',
          dir === 'minus' ? `x = ${h} does — so the graph moved right.` : `x = −${h} does — so the graph moved left.`,
        ],
        explanation: `**${correct}.** Inside edits act on the INPUT and run backwards: f(x − ${h}) needs x to be ${h} bigger to feed f the same value, so everything slides right. The backwards-ness is the single most-missed fact about function graphs, and testing one point (where did f(0)'s output go?) settles it every time.`,
      }
    }
    const up = seed % 4 < 2
    return {
      title: 'The outside shift',
      prompt: `g(x) = f(x) ${up ? '+' : '−'} ${kk}. If the point (3, 5) is on f's graph, which point is certainly on **g's** graph?`,
      answer: mcqNoted(rng, `(3, ${up ? 5 + kk : 5 - kk})`, [
        [`(${up ? 3 + kk : 3 - kk}, 5)`, 'outside edits act on the OUTPUT — the x-coordinate does not move'],
        [`(3, ${up ? 5 - kk : 5 + kk})`, 'the vertical direction matches the sign for outside edits: plus means up'],
        [`(${3 - kk}, ${5 - kk})`, 'a diagonal slide would need both an inside and an outside edit'],
      ]).answer,
      hints: [
        'Outside the function = after the output = vertical.',
        `The output 5 becomes 5 ${up ? '+' : '−'} ${kk}.`,
      ],
      explanation: `g(3) = f(3) ${up ? '+' : '−'} ${kk} = ${up ? 5 + kk : 5 - kk}, so **(3, ${up ? 5 + kk : 5 - kk})**. Outside edits are honest (plus goes up); inside edits are backwards. Holding that asymmetry — output edits literal, input edits reversed — is what makes every graph-transformation question routine.`,
    }
  },
)

const logStructure = tpl(
  { id: 'log-structure', name: 'Logs turn products into sums', skillIds: ['m-exponential', 'm-logarithms'], bucket: 'math', difficulty: 5, variants: 12, minutes: 2.5 },
  (_rng, seed) => {
    const a = cycle(seed, [2, 3, 4, 5] as const)
    const b = cycle(Math.floor(seed / 4), [3, 5, 7] as const)
    const askProduct = seed % 2 === 0
    if (askProduct) {
      return {
        title: 'Split the product',
        prompt: `Given log(${a}) ≈ ${Math.log10(a).toFixed(2)} and log(${b}) ≈ ${Math.log10(b).toFixed(2)}, what is **log(${a * b})**, to 2 decimals?`,
        answer: numeric(Math.round((Math.log10(a) + Math.log10(b)) * 100) / 100, { tolerance: 0.02 }),
        hints: [
          'A log of a product is the SUM of the logs.',
          `log(${a}) + log(${b}) = ${Math.log10(a).toFixed(2)} + ${Math.log10(b).toFixed(2)}.`,
          `Worked path: **${(Math.log10(a) + Math.log10(b)).toFixed(2)}**.`,
        ],
        explanation: `log(${a}·${b}) = log(${a}) + log(${b}) ≈ **${(Math.log10(a) + Math.log10(b)).toFixed(2)}** — because multiplying numbers ADDS their exponents, and logs ARE exponents. This one rule is why logs were invented: they turn multiplication into addition, which is also why slide rules worked and why log scales tame huge ranges.`,
      }
    }
    const p = cycle(Math.floor(seed / 2), [2, 3, 4] as const)
    return {
      title: 'Pull down the power',
      prompt: `Given log(${a}) ≈ ${Math.log10(a).toFixed(2)}, what is **log(${a}^${p})**, to 2 decimals?`,
      answer: numeric(Math.round(p * Math.log10(a) * 100) / 100, { tolerance: 0.02 }),
      hints: [
        'A log of a power PULLS the exponent out front.',
        `${p} × log(${a}).`,
        `Worked path: **${(p * Math.log10(a)).toFixed(2)}**.`,
      ],
      explanation: `log(${a}^${p}) = ${p}·log(${a}) ≈ **${(p * Math.log10(a)).toFixed(2)}** — a power is repeated multiplication, and each multiplication adds one more log(${a}). The power rule is the product rule applied ${p} times, which is worth deriving once so the rules stay one idea instead of three memorized strings.`,
    }
  },
)

export const HS_DENSITY_TEMPLATES: ItemTemplate[] = [
  trigAngleSide,
  transformCompose,
  similaritySolve,
  circleSector,
  funcShift,
  logStructure,
]
