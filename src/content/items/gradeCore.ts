/**
 * Curriculum-core families for the four skills added with the math tracks:
 * scale drawings (7.G.1), sampling & inference (7.SP.1-2), forms of linear
 * equations, and two-variable inequalities (both Algebra 1).
 *
 * Problem KINDS are modeled on what these courses actually assign — CCSS
 * grade-7 standards, Khan Academy unit exercises, CPM and AoPS chapter
 * coverage (docs/RESEARCH.md §25 for sources). All problems are original;
 * every answer is computed from the generator's own values.
 */
import { rint, rnz } from '../../engine/rng'
import type { ItemTemplate } from '../../domain/types'
import { cycle, fraction, mcq, mcqNoted, numeric, tpl } from '../lib'

// ---------------------------------------------------------------- m-scale

const scaleConvert = tpl(
  { id: 'scale-convert', name: 'Read the scale', skillIds: ['m-scale'], bucket: 'math', difficulty: 2, variants: 24, minutes: 2 },
  (rng, seed) => {
    const per = cycle(seed, [3, 4, 5, 8, 10, 25] as const) // real metres per drawn cm
    const scene = cycle(Math.floor(seed / 6), [
      { thing: 'a school hallway', unit: 'm' },
      { thing: 'a garden plot', unit: 'm' },
      { thing: 'a stage set', unit: 'm' },
      { thing: 'a parking lot', unit: 'm' },
    ] as const)
    const toReal = seed % 2 === 0
    const drawn = rint(rng, 3, 12)
    const real = drawn * per
    return {
      title: 'Scale drawing',
      prompt: toReal
        ? `A plan of ${scene.thing} uses the scale **1 cm : ${per} ${scene.unit}**. A wall is **${drawn} cm** long on the plan. How long is the real wall, in ${scene.unit}?`
        : `A plan of ${scene.thing} uses the scale **1 cm : ${per} ${scene.unit}**. The real wall is **${real} ${scene.unit}** long. How long is it on the plan, in cm?`,
      answer: numeric(toReal ? real : drawn),
      hints: [
        `Every drawn centimeter stands for ${per} real ${scene.unit}.`,
        toReal ? `Multiply the drawn length by ${per}.` : `Divide the real length by ${per}.`,
        `Worked path: **${toReal ? real : drawn}**.`,
      ],
      explanation: toReal
        ? `Each cm stands for ${per} ${scene.unit}, so ${drawn} cm ↔ ${drawn} × ${per} = **${real} ${scene.unit}**. Drawing → reality multiplies by the scale.`
        : `Each cm stands for ${per} ${scene.unit}, so ${real} ${scene.unit} ↔ ${real} ÷ ${per} = **${drawn} cm**. Reality → drawing divides by the scale.`,
    }
  },
)

const scaleFactor = tpl(
  { id: 'scale-factor', name: 'Find the scale, then use it', skillIds: ['m-scale'], bucket: 'math', difficulty: 3, variants: 24, minutes: 2.5 },
  (rng, seed) => {
    const k = cycle(seed, [2, 3, 4, 5, 6, 8] as const)
    const a = rint(rng, 3, 9)
    const b = rint(rng, 4, 11)
    const bigA = a * k
    const bigB = b * k
    return {
      title: 'Two similar figures',
      prompt: `A photo is enlarged so that its ${a} cm side becomes **${bigA} cm**. The other side was **${b} cm**. How long is the other side after enlargement, in cm?`,
      answer: numeric(bigB),
      hints: [
        'First find what the known side was multiplied by.',
        `${bigA} ÷ ${a} = ${k} — every length is multiplied by ${k}.`,
        `Worked path: **${bigB}**.`,
      ],
      explanation: `The scale factor is ${bigA} ÷ ${a} = **${k}**, and enlargement applies one factor to EVERY length: ${b} × ${k} = **${bigB} cm**. The classic error is adding the difference (${bigA} − ${a} = ${bigA - a}) instead of multiplying — scaling is multiplicative.`,
    }
  },
)

const scaleArea = tpl(
  { id: 'scale-area', name: 'Lengths scale, areas square', skillIds: ['m-scale'], bucket: 'math', difficulty: 4, variants: 20, minutes: 2.5, calibration: true },
  (rng, seed) => {
    const k = cycle(seed, [2, 3, 4, 5] as const)
    const w = rint(rng, 3, 7)
    const h = rint(rng, 4, 8)
    const area = w * h
    const bigArea = area * k * k
    const { answer, distractorNotes } = mcqNoted(rng, `${bigArea} cm²`, [
      [`${area * k} cm²`, 'scaled the area by k — but BOTH dimensions grow, so area scales by k²'],
      [`${bigArea * k} cm²`, 'cubed the factor — that is what volume does, not area'],
      [`${area + k * k} cm²`, 'added instead of multiplied — scaling is multiplicative'],
    ])
    return {
      title: 'Area under scaling',
      prompt: `A ${w} cm × ${h} cm sticker (area ${area} cm²) is enlarged by scale factor **${k}**. What is the area of the enlarged sticker?`,
      answer,
      distractorNotes,
      hints: [
        'Width AND height each get multiplied by the factor.',
        `New sides: ${w * k} × ${h * k}.`,
        `Worked path: **${bigArea} cm²**.`,
      ],
      explanation: `Both sides scale: (${w} × ${k}) × (${h} × ${k}) = ${w * k} × ${h * k} = **${bigArea} cm²** — which is ${area} × ${k}² . Lengths scale by k, areas by k², volumes by k³. One factor, applied once per dimension.`,
    }
  },
)

// ---------------------------------------------------------------- m-sampling

const sampleScaleUp = tpl(
  { id: 'sample-scale-up', name: 'Let the sample speak', skillIds: ['m-sampling'], bucket: 'math', difficulty: 2, variants: 24, minutes: 2.5 },
  (_rng, seed) => {
    const scene = cycle(seed, [
      { pop: 'students at a school', trait: 'walk to school', n: 800 },
      { pop: 'visitors to a library', trait: 'came for the study rooms', n: 600 },
      { pop: 'apples in an orchard crate shipment', trait: 'have a bruise', n: 1200 },
      { pop: 'listeners of a local station', trait: 'stream rather than use radio', n: 2000 },
    ] as const)
    const sample = cycle(Math.floor(seed / 4), [40, 50, 80] as const)
    const frac = cycle(Math.floor(seed / 12), [
      { hit: 1, of: 4 },
      { hit: 3, of: 10 },
    ] as const)
    const hits = (sample * frac.hit) / frac.of
    const estimate = (scene.n * frac.hit) / frac.of
    return {
      title: 'From sample to population',
      prompt: `A **random** sample of ${sample} of the ${scene.n} ${scene.pop} finds that **${hits}** of them ${scene.trait}. Best estimate for how many of all ${scene.n} do?`,
      answer: numeric(estimate),
      hints: [
        'Find the fraction of the sample first.',
        `${hits}/${sample} of the sample ${scene.trait} — apply that same fraction to ${scene.n}.`,
        `Worked path: **${estimate}**.`,
      ],
      explanation: `The sample rate is ${hits}/${sample} = ${frac.hit}/${frac.of}. A random sample's power is exactly this: its proportions estimate the population's, so ${scene.n} × ${frac.hit}/${frac.of} = **${estimate}**. The estimate inherits the sample's randomness — a different sample would land nearby, not on the same number.`,
    }
  },
)

const sampleBias = tpl(
  { id: 'sample-bias', name: 'Which sample can you trust?', skillIds: ['m-sampling'], bucket: 'math', difficulty: 3, variants: 4, minutes: 2.5, calibration: true },
  (rng, seed) => {
    const c = cycle(seed, [
      {
        question: 'how long students at the whole school sleep',
        good: 'Pick 50 student ID numbers at random from the full roster and ask those students',
        bads: [
          ['Ask the first 50 students arriving at zero period', 'early arrivers are exactly the students whose sleep differs — the method selects on the thing being measured'],
          ['Post a survey link and count whoever answers', 'self-selected respondents care more about the topic than the average student'],
          ['Ask everyone on the morning swim team', 'one team is a cluster with shared habits, not a miniature of the school'],
        ] as [string, string][],
      },
      {
        question: 'what fraction of a city supports a new bike lane',
        good: 'Dial randomly generated phone numbers across every neighborhood',
        bads: [
          ['Survey people at the bike shop', 'the location pre-filters for people who already cycle'],
          ['Let a cycling forum vote in an online poll', 'self-selection plus a cycling audience double-filters the sample'],
          ['Ask drivers stuck at one downtown intersection', 'one location at one time of day is a cluster, not a cross-section'],
        ] as [string, string][],
      },
      {
        question: 'the average battery life of a phone model',
        good: 'Test a random selection of units pulled from across all production runs',
        bads: [
          ['Test the units customers returned as faulty', 'returned units are selected precisely because something was wrong'],
          ['Test the first 30 units off the line on launch day', 'one production run shares its conditions — early units are their own cluster'],
          ['Average the battery ratings users post in reviews', 'people review when unusually pleased or unusually annoyed — the middle stays silent'],
        ] as [string, string][],
      },
      {
        question: 'how often the trains on a line run late',
        good: 'Check the recorded times of trains sampled at random across the full timetable',
        bads: [
          ['Time the trains during your own commute each day', 'one time slot has its own traffic pattern — rush hour is not the timetable'],
          ['Count complaints posted about the line', 'nobody posts "train arrived as scheduled" — complaints select for lateness'],
          ['Check the first ten trains of the day', 'the early-morning cluster runs before congestion builds'],
        ] as [string, string][],
      },
    ] as const)
    const { answer, distractorNotes } = mcqNoted(rng, c.good, c.bads.map(([t, n]) => [t, n] as [string, string]))
    return {
      title: 'Sampling method',
      prompt: `You want to estimate ${c.question}. Which sampling method gives every member a fair chance of being included?`,
      answer,
      distractorNotes,
      hints: [
        'Ask of each method: who gets systematically left out or over-included?',
        'Random selection from the WHOLE group is the only method where no trait raises your chance of being picked.',
      ],
      explanation: `**${c.good}** — randomness from the full group is what makes a sample speak for the population. Each rejected method selects on something (enthusiasm, location, timing, being unusual), and whatever the method selects on is exactly where its estimate bends.`,
    }
  },
)

const sampleVariability = tpl(
  { id: 'sample-variability', name: 'Two samples, two answers', skillIds: ['m-sampling'], bucket: 'math', difficulty: 4, variants: 12, minutes: 2.5, calibration: true },
  (rng, seed) => {
    const base = cycle(seed, [30, 35, 40, 45] as const)
    const gap = cycle(Math.floor(seed / 4), [4, 6, 8] as const)
    const a = base
    const b = base + gap
    const mid = (a + b) / 2
    const { answer, distractorNotes } = mcqNoted(
      rng,
      `Both are legitimate estimates — random samples vary, and the truth is likely near this range`,
      [
        [`The second sample must have been done incorrectly`, 'disagreement between random samples is expected, not evidence of a mistake'],
        [`The class should keep sampling until a sample hits ${mid}% exactly`, 'no single sample is "the right one" — stopping when you like the number is a bias machine'],
        [`The true value must be exactly ${mid}%, the average of the two`, 'averaging two samples improves the estimate but cannot pin the truth to one exact number'],
      ],
    )
    return {
      title: 'Sampling variability',
      prompt: `Two classes each take a fair random sample of the same school. One estimates **${a}%** of students bring lunch; the other estimates **${b}%**. What is the right conclusion?`,
      answer,
      distractorNotes,
      hints: [
        'Would two fair random samples of the same school give identical numbers?',
        'Variation between honest samples is normal; its size shrinks as samples grow.',
      ],
      explanation: `Random samples of the same population routinely disagree by a few points — that wobble IS sampling variability. Two honest estimates of ${a}% and ${b}% suggest the truth is plausibly nearby, and bigger samples would tighten the range. Neither sample is wrong, and re-sampling until a number you like appears would be worse than either.`,
    }
  },
)

// ---------------------------------------------------------------- m-linforms

const linformSlopeIntercept = tpl(
  { id: 'linform-pointslope', name: 'Point + slope → the line', skillIds: ['m-linforms'], bucket: 'math', difficulty: 3, variants: 40, minutes: 2.5 },
  (rng) => {
    const m = rnz(rng, 5)
    const x1 = rnz(rng, 6)
    const y1 = rint(rng, -8, 8)
    const b = y1 - m * x1
    return {
      title: 'Build the equation',
      prompt: `A line has slope **${m}** and passes through **(${x1}, ${y1})**. Write it as y = mx + b. What is **b**?`,
      answer: numeric(b),
      hints: [
        `Point-slope first: y − ${y1} = ${m}(x − ${x1 < 0 ? `(${x1})` : x1}).`,
        `Expand and collect: y = ${m}x + (${y1} − ${m}·${x1}).`,
        `Worked path: **${b}**.`,
      ],
      explanation: `Fastest route is point-slope: y − ${y1} = ${m}(x − ${x1 < 0 ? `(${x1})` : x1}), then expand → y = ${m}x + ${b >= 0 ? b : `(${b})`}, so b = **${b}**. Equivalently, b = y₁ − m·x₁ = ${y1} − ${m}×${x1 < 0 ? `(${x1})` : x1}. The usual slip is a sign error when x₁ is negative — the two minuses stack.`,
    }
  },
)

const linformStandard = tpl(
  { id: 'linform-standard', name: 'Read standard form', skillIds: ['m-linforms'], bucket: 'math', difficulty: 3, variants: 36, minutes: 2.5 },
  (rng, seed) => {
    const A = rnz(rng, 6)
    const B = rnz(rng, 6)
    const mult = rint(rng, 2, 6)
    const C = A * B * mult * (rng() < 0.5 ? 1 : -1) // divisible by both A and B
    const askSlope = seed % 2 === 0
    return askSlope
      ? {
          title: 'Standard form → slope',
          prompt: `For the line **${A}x ${B >= 0 ? '+' : '−'} ${Math.abs(B)}y = ${C}**, what is the slope? Answer as a fraction (it may simplify).`,
          answer: fraction(-A, B),
          hints: [
            'Solve for y to expose the slope.',
            `${B}y = ${C} − ${A}x → y = (${C} − ${A}x)/${B}.`,
            `Slope = −A/B = ${-A}/${B}.`,
          ],
          explanation: `Solving for y: y = (−${A}/${B >= 0 ? B : `(${B})`})x + ${C}/${B >= 0 ? B : `(${B})`}, so the slope is **−A/B**. Worth keeping as a rule — and worth re-deriving once so the rule has something under it.`,
        }
      : {
          title: 'Standard form → intercept',
          prompt: `For the line **${A}x ${B >= 0 ? '+' : '−'} ${Math.abs(B)}y = ${C}**, what is the **x-intercept**? Give just the x-value.`,
          answer: numeric(C / A),
          hints: [
            'On the x-axis, y = 0.',
            `Set y = 0: ${A}x = ${C}.`,
            `Worked path: **${C / A}**.`,
          ],
          explanation: `At the x-intercept y = 0, so ${A}x = ${C} → x = **${C / A}**. This is standard form's party trick: each intercept is one substitution away, no rearranging into y = mx + b needed.`,
        }
  },
)

const linformChoose = tpl(
  { id: 'linform-choose', name: 'Pick the right form', skillIds: ['m-linforms'], bucket: 'math', difficulty: 2, variants: 4, minutes: 2 },
  (rng, seed) => {
    const c = cycle(seed, [
      {
        have: 'the slope and one point the line passes through (neither on the y-axis)',
        best: 'Point-slope: y − y₁ = m(x − x₁)',
        why: 'it takes exactly what you have and asks for nothing more',
      },
      {
        have: 'the slope and the y-intercept',
        best: 'Slope-intercept: y = mx + b',
        why: 'both known values drop straight into their named slots',
      },
      {
        have: 'a need to find both intercepts quickly',
        best: 'Standard: Ax + By = C',
        why: 'setting x = 0 or y = 0 hands you each intercept in one step',
      },
      {
        have: 'a table of x with the amount y changes per step, plus the starting amount',
        best: 'Slope-intercept: y = mx + b',
        why: 'per-step change is m and the starting amount is b, read straight off the table',
      },
    ] as const)
    const all = [
      'Point-slope: y − y₁ = m(x − x₁)',
      'Slope-intercept: y = mx + b',
      'Standard: Ax + By = C',
    ]
    return {
      title: 'Three forms, one line',
      prompt: `You know ${c.have}. Which form of a linear equation is the most direct fit?`,
      answer: mcq(rng, c.best, all.filter((f) => f !== c.best)),
      hints: [
        'Match what each form NAMES to what you actually hold.',
        'The right form needs no algebra before you can write it down.',
      ],
      explanation: `**${c.best}** — ${c.why}. All three describe the same lines; the choice is about which known values slot in without rearranging. Converting later is always allowed.`,
    }
  },
)

const linformTwoPoints = tpl(
  { id: 'linform-twopoints', name: 'Through two points', skillIds: ['m-linforms'], bucket: 'math', difficulty: 4, variants: 40, minutes: 3 },
  (rng) => {
    const m = rnz(rng, 4)
    const b = rint(rng, -7, 7)
    const x1 = rnz(rng, 5)
    let x2 = rnz(rng, 5)
    while (x2 === x1) x2 = rnz(rng, 5)
    const y1 = m * x1 + b
    const y2 = m * x2 + b
    return {
      title: 'Equation from two points',
      prompt: `A line passes through **(${x1}, ${y1})** and **(${x2}, ${y2})**. In y = mx + b form, what is **b**?`,
      answer: numeric(b),
      hints: [
        `Slope first: m = (${y2} − ${y1})/(${x2} − ${x1}).`,
        `m = ${m}. Now push one point through y = ${m}x + b.`,
        `Worked path: **${b}**.`,
      ],
      explanation: `Slope: (${y2} − ${y1})/(${x2} − ${x1}) = ${y2 - y1}/${x2 - x1} = **${m}**. Then either point gives b: ${y1} = ${m}×${x1 < 0 ? `(${x1})` : x1} + b → b = **${b}**. Checking the OTHER point catches slope slips for free — a line that misses its second point was never the line.`,
    }
  },
)

// ---------------------------------------------------------------- m-ineq2d

const ineq2dTest = tpl(
  { id: 'ineq2d-test-point', name: 'In the region or not?', skillIds: ['m-ineq2d'], bucket: 'math', difficulty: 2, variants: 40, minutes: 2 },
  (rng, seed) => {
    const m = rnz(rng, 4)
    const b = rint(rng, -6, 6)
    const px = rint(rng, -5, 5)
    const boundary = m * px + b
    const above = seed % 2 === 0
    const off = rint(rng, 1, 6)
    const py = above ? boundary + off : boundary - off
    const gt = rng() < 0.5
    const sat = gt ? py > boundary : py < boundary
    const line = `y ${gt ? '>' : '<'} ${m}x ${b >= 0 ? '+ ' + b : '− ' + Math.abs(b)}`
    return {
      title: 'Test the point',
      prompt: `Is the point **(${px}, ${py})** a solution of **${line}**?`,
      answer: mcq(rng, sat ? 'Yes — it satisfies the inequality' : 'No — it fails the inequality', [
        sat ? 'No — it fails the inequality' : 'Yes — it satisfies the inequality',
        'Cannot tell without graphing the line',
      ]),
      hints: [
        `Substitute x = ${px} into the right side.`,
        `Right side = ${m}×${px < 0 ? `(${px})` : px} ${b >= 0 ? '+ ' + b : '− ' + Math.abs(b)} = ${boundary}. Compare ${py} with it.`,
      ],
      explanation: `At x = ${px} the boundary sits at y = ${boundary}. The point's y is ${py}, which is ${py > boundary ? 'above' : 'below'} it, so ${py} ${gt ? '>' : '<'} ${boundary} is **${sat ? 'true' : 'false'}**. No graph needed — substituting IS the test, and it is the same test shading a graph performs at every point at once.`,
    }
  },
)

const ineq2dRegion = tpl(
  { id: 'ineq2d-region', name: 'Describe the region', skillIds: ['m-ineq2d'], bucket: 'math', difficulty: 3, variants: 24, minutes: 2.5, calibration: true },
  (rng, seed) => {
    const m = rnz(rng, 4)
    const b = rint(rng, -5, 5)
    const kind = cycle(seed, ['>', '≥', '<', '≤'] as const)
    const strict = kind === '>' || kind === '<'
    const aboveSide = kind === '>' || kind === '≥'
    const correct = `${aboveSide ? 'Above' : 'Below'} a ${strict ? 'dashed' : 'solid'} line`
    const { answer, distractorNotes } = mcqNoted(rng, correct, [
      [`${aboveSide ? 'Below' : 'Above'} a ${strict ? 'dashed' : 'solid'} line`, 'the side flipped — test one point instead of guessing from the symbol'],
      [`${aboveSide ? 'Above' : 'Below'} a ${strict ? 'solid' : 'dashed'} line`, strict ? 'strict inequalities (<, >) exclude the boundary, so the line is dashed' : 'with ≤ or ≥ the boundary itself qualifies, so the line is solid'],
      [`Only the line itself`, 'that describes the EQUATION y = mx + b; an inequality claims a whole side of it'],
    ])
    return {
      title: 'Graph of an inequality',
      prompt: `Which describes the graph of **y ${kind} ${m}x ${b >= 0 ? '+ ' + b : '− ' + Math.abs(b)}**?`,
      answer,
      distractorNotes,
      hints: [
        'Two decisions: is the boundary included (solid vs dashed), and which side holds?',
        `"y ${kind} …" means the points whose y-value is ${aboveSide ? 'bigger than' : 'smaller than'}${strict ? '' : ' or equal to'} the line's.`,
      ],
      explanation: `**${correct}.** "y ${kind}" collects points ${aboveSide ? 'above' : 'below'} the boundary${strict ? ', and strictness excludes the boundary itself — dashed' : ', and equality admits the boundary — solid'}. When unsure of the side, substitute one easy point (the origin, unless the line passes through it) and let arithmetic decide.`,
    }
  },
)

const ineq2dSystem = tpl(
  { id: 'ineq2d-system', name: 'Satisfy both at once', skillIds: ['m-ineq2d'], bucket: 'math', difficulty: 4, variants: 36, minutes: 3 },
  (rng) => {
    const m1 = rnz(rng, 3)
    const m2 = rnz(rng, 3)
    const x0 = rint(rng, -4, 4)
    const y0 = rint(rng, -5, 5)
    const gap = rint(rng, 2, 4)
    // Build the band around the chosen point: L1(x0) = y0 - gap, L2(x0) = y0 + gap.
    const b1 = y0 - gap - m1 * x0
    const b2 = y0 + gap - m2 * x0
    const L1 = (x: number) => m1 * x + b1
    const L2 = (x: number) => m2 * x + b2
    // Distractors constructed to fail: below the lower boundary, above the upper,
    // and ON the lower boundary (fails the strict >).
    const cands: [number, number][] = [
      [x0, y0],
      [x0, L1(x0) - rint(rng, 1, 3)],
      [x0 + 1, L2(x0 + 1) + rint(rng, 1, 3)],
      [x0 - 1, L1(x0 - 1)],
    ]
    const fmt = ([x, y]: [number, number]) => `(${x}, ${y})`
    const term = (m: number, b: number) => `${m}x ${b >= 0 ? '+ ' + b : '− ' + Math.abs(b)}`
    return {
      title: 'System of inequalities',
      prompt: `Which point satisfies **both** y > ${term(m1, b1)} and y < ${term(m2, b2)}?`,
      answer: mcq(rng, fmt(cands[0]), cands.slice(1).map(fmt)),
      hints: [
        'Test each candidate in BOTH inequalities — one failure disqualifies.',
        `For each point, compute ${term(m1, b1)} and ${term(m2, b2)} at its x, then compare its y with both.`,
        `Worked path: **${fmt(cands[0])}**.`,
      ],
      explanation: `At x = ${x0} the boundaries sit at ${L1(x0)} and ${L2(x0)}, and ${y0} lies strictly between them — so **${fmt(cands[0])}** satisfies both. The others each fail one: below the first line, above the second, or exactly ON a boundary, which a strict inequality excludes. A system's solution region is the overlap, and the overlap only ever shrinks.`,
    }
  },
)

const ineq2dWrite = tpl(
  { id: 'ineq2d-write', name: 'Constraint → inequality', skillIds: ['m-ineq2d'], bucket: 'math', difficulty: 4, variants: 24, minutes: 3, transfer: true },
  (rng, seed) => {
    const c = cycle(seed, [
      { a: 'bracelets', pa: 4, b: 'keychains', pb: 2, verb: 'craft-fair budget', cap: 'at most' },
      { a: 'veggie trays', pa: 6, b: 'fruit cups', pb: 3, verb: 'party budget', cap: 'at most' },
      { a: 'long practice sessions', pa: 45, b: 'short drills', pb: 15, verb: 'weekly practice-minutes plan', cap: 'at least' },
      { a: 'chapters', pa: 30, b: 'articles', pb: 10, verb: 'reading-minutes goal', cap: 'at least' },
    ] as const)
    const scale = rint(rng, 4, 9)
    const limit = c.pa * scale + c.pb * scale
    const atMost = c.cap === 'at most'
    const sym = atMost ? '≤' : '≥'
    const correct = `${c.pa}x + ${c.pb}y ${sym} ${limit}`
    const { answer, distractorNotes } = mcqNoted(rng, correct, [
      [`${c.pa}x + ${c.pb}y ${atMost ? '≥' : '≤'} ${limit}`, `"${c.cap}" points the other way — this reverses the constraint`],
      [`${c.pa}x + ${c.pb}y ${atMost ? '<' : '>'} ${limit}`, `"${c.cap} ${limit}" INCLUDES hitting ${limit} exactly — the strict symbol wrongly excludes it`],
      [`${c.pb}x + ${c.pa}y ${sym} ${limit}`, 'the coefficients swapped owners — each rate must multiply its own variable'],
    ])
    return {
      title: 'Write the constraint',
      prompt: `Each of the x ${c.a} takes **${c.pa}** and each of the y ${c.b} takes **${c.pb}** (dollars or minutes). The ${c.verb} allows **${c.cap} ${limit}**. Which inequality states the constraint?`,
      answer,
      distractorNotes,
      hints: [
        `Total used = ${c.pa}·x + ${c.pb}·y.`,
        `"${c.cap} ${limit}" means the total ${atMost ? 'may not exceed' : 'must reach'} ${limit}, boundary included.`,
      ],
      explanation: `Total consumption is ${c.pa}x + ${c.pb}y, and "${c.cap} ${limit}" pins it ${atMost ? 'at or below' : 'at or above'} the limit: **${correct}**. Real constraints are usually inclusive — budgets can be spent exactly — which is why ≤/≥ appear far more often than < /> in modeling.`,
    }
  },
)

export const GRADE_CORE_TEMPLATES: ItemTemplate[] = [
  scaleConvert,
  scaleFactor,
  scaleArea,
  sampleScaleUp,
  sampleBias,
  sampleVariability,
  linformSlopeIntercept,
  linformStandard,
  linformChoose,
  linformTwoPoints,
  ineq2dTest,
  ineq2dRegion,
  ineq2dSystem,
  ineq2dWrite,
]
