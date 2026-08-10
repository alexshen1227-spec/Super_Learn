/**
 * More manipulable diagrams — same two-checkpoint shape as `explore.ts`
 * (Notice what stayed fixed, then Predict away from the picture), aimed at
 * four misconceptions that survive being told and rarely survive being shown.
 *
 * Why these four:
 *
 *  - **Perimeter and area move independently.** "Same fence, same field" is
 *    one of the most persistent beliefs in school geometry, and a rectangle
 *    you can squash while the perimeter caption refuses to change is about the
 *    fastest cure there is.
 *  - **Zero net force does not mean stopped.** Newton's first law is the most
 *    documented misconception in physics education: learners read "no force"
 *    as "no motion". Putting a genuinely FLAT, genuinely non-zero velocity
 *    line on the screen attacks it directly.
 *  - **One outlier drags the mean and leaves the median alone.** Learners
 *    treat the two as interchangeable summaries; watching one marker slide
 *    away while the other sits still separates them permanently.
 *  - **Small samples are not just small versions of big ones.** Reading that
 *    variability shrinks with n is not the same experience as watching a cloud
 *    of dots pull in around the true value.
 *
 * Every value below is computed, and every sample is precomputed here so the
 * picture is identical on every device and every replay — sampling variation
 * you can't reproduce is not something the audit could ever check.
 */
import type { ExploreStop, ItemPart, ItemTemplate } from '../../domain/types'
import { cycle, mcq, numeric, tpl } from '../lib'

function part(stage: string, body: Omit<ItemPart, 'stage'>): ItemPart {
  return { stage, ...body }
}

function r2(v: number): number {
  return Math.round(v * 1000) / 1000
}

// ------------------------------------------------- perimeter versus area

/**
 * Fixed perimeter, changing shape. The area is largest at the square and
 * collapses toward zero at the extremes — with the perimeter caption stating
 * the same number the whole way, so the learner cannot miss what is held.
 */
const exploreFence = tpl(
  {
    id: 'explore-fence',
    name: 'Explore: same fence, different field',
    skillIds: ['m-area'],
    bucket: 'math',
    difficulty: 2,
    variants: 4,
    minutes: 4,
    kind: 'multi',
  },
  (rng, seed) => {
    // Perimeter is a multiple of 4 so the square case has whole sides.
    const perimeter = cycle(seed, [24, 32, 40, 20])
    const half = perimeter / 2
    const square = half / 2
    // Five widths, symmetric about the square, so the learner watches the area
    // climb to a peak and fall away again rather than only climb.
    const quarter = Math.round(square / 2)
    const widths = [...new Set([1, quarter, square, half - quarter, half - 1])].sort((a, b) => a - b)
    const stops: ExploreStop[] = widths.map((w) => {
      const h = half - w
      return {
        value: `${w} m × ${h} m`,
        // The shape goes in the caption, not just the area: a fixed perimeter
        // makes w × h and h × w equal, so an area-only caption repeats itself
        // and the slider looks broken.
        caption: `Pen ${w} m × ${h} m. Perimeter ${perimeter} m, area ${r2(w * h)} m².`,
        plot: {
          xMin: 0,
          xMax: half,
          yMin: 0,
          yMax: half,
          xLabel: 'width (m)',
          yLabel: 'height (m)',
          series: [],
          rect: { x: 0, y: 0, w, h, label: `${r2(w * h)} m²` },
        },
      }
    })
    const best = square * square
    const worst = Math.min(...widths.map((w) => w * (half - w)))
    return {
      title: 'Same fence, different field',
      prompt: `You have **${perimeter} m of fence** and you are making a rectangular pen. The fence never changes length — only the shape does.`,
      hints: [
        'Read the perimeter line at two very different shapes before deciding.',
        'Width plus height is always half the fence. Try making them equal.',
        'A long thin pen and a square pen use the same fence and hold very different amounts.',
      ],
      explanation: `Width + height is fixed at ${half} m whatever shape you pick, but width × height is not. The area is largest when the sides are equal (${square} × ${square} = ${best} m²) and shrinks toward nothing as the pen gets long and thin.`,
      transferBridge:
        'Two quantities can be linked without one determining the other. Knowing a total tells you nothing about a product — the same idea behind two students with identical total marks and very different profiles.',
      parts: [
        part('Notice', {
          study: `The fence is ${perimeter} m long in every single shape below.`,
          explore: {
            label: 'the shape of the pen',
            stops,
            initial: 0,
            invitation:
              'Drag from the thinnest shape to the widest and read both numbers each time. One of them never changes.',
          },
          prompt: `Every shape you looked at used exactly ${perimeter} m of fence. What happened to the area?`,
          answer: mcq(rng, `It changed a lot — from ${worst} m² up to ${best} m² and back down`, [
            'It stayed the same, because the amount of fence stayed the same',
            'It rose steadily the wider the pen got, with no highest point',
            'It changed only because the fence was being measured differently',
          ]),
          explanation: `Perimeter and area are not locked together. The fence sets width + height; the area is width × height, and a fixed sum can be split into very different products. Biggest at ${square} × ${square} = ${best} m², smallest at the extremes.`,
        }),
        part('Predict', {
          prompt: `Still ${perimeter} m of fence. What is the **largest** area you could enclose, in m²?`,
          answer: numeric(best),
          hints: [
            `Half the fence is ${half} m, and that is the width plus the height.`,
            `Split ${half} into two equal parts and multiply them.`,
            `Worked path: ${square} × ${square} = **${best}** m².`,
          ],
          explanation: `**${best} m²**, from a ${square} m × ${square} m square. For a fixed perimeter the square always wins — pushing the sides apart lengthens one and shortens the other, and the product falls.`,
        }),
      ],
    }
  },
)

// -------------------------------------------------------- Newton's first law

/**
 * The whole item exists for one stop: net force zero. If a learner leaves
 * still believing that removing the force stops the object, nothing else in
 * the mechanics course lands properly.
 */
const exploreNetForce = tpl(
  {
    id: 'explore-netforce',
    name: 'Explore: what a force actually changes',
    skillIds: ['p-forces'],
    bucket: 'physics',
    difficulty: 3,
    variants: 4,
    minutes: 4.5,
    kind: 'multi',
  },
  (rng, seed) => {
    // The numbers are chosen so the hardest brake brings the trolley to rest
    // EXACTLY at the end of the window. Anything stronger sends the line below
    // zero, and a quantity labelled "speed" that reads −10 teaches a wrong
    // idea in passing while trying to teach a right one.
    const plan = cycle(seed, [
      { mass: 2, tMax: 6 },
      { mass: 5, tMax: 8 },
      { mass: 3, tMax: 5 },
      { mass: 4, tMax: 7 },
    ])
    const { mass, tMax } = plan
    const v0 = 2 * tMax
    const forces = [-2 * mass, -mass, 0, mass, 2 * mass]
    const yMin = 0
    const yMax = 4 * tMax

    const stops: ExploreStop[] = forces.map((f) => {
      const a = f / mass
      const vEnd = v0 + a * tMax
      return {
        value: `${f > 0 ? '+' : f < 0 ? '−' : ''}${Math.abs(f)} N`,
        caption:
          f === 0
            ? `No net force. Speed stays at ${v0} m/s the whole way.`
            : `Net force ${f > 0 ? '+' : '−'}${Math.abs(f)} N on ${mass} kg: speed changes by ${r2(Math.abs(a))} m/s every second, reaching ${r2(vEnd)} m/s.`,
        plot: {
          xMin: 0,
          xMax: tMax,
          yMin,
          yMax,
          xLabel: 'time (s)',
          yLabel: 'speed (m/s)',
          series: [
            {
              points: [
                [0, v0],
                [tMax, r2(vEnd)],
              ] as [number, number][],
              label: `net force ${f} N`,
              tone: f === 0 ? 1 : 0,
            },
          ],
        },
      }
    })

    return {
      title: 'What a force actually changes',
      prompt: `A ${mass} kg trolley is already moving at **${v0} m/s** on a level track. You control the **net force** on it.`,
      hints: [
        'Look at the height of the line at time zero, then at its slope.',
        'Set the force to zero and read what the speed does over the whole 8 seconds.',
        'A force changes how fast the speed is CHANGING, not the speed itself.',
      ],
      explanation: `Net force sets the slope of a speed–time graph, not its height. At zero net force the graph is flat and sitting at ${v0} m/s — the trolley keeps going at a steady speed, because nothing is changing it.`,
      transferBridge:
        'Whenever something is already moving, ask what would have to act on it to make it stop — coasting is the default, not the thing needing explanation. And in reverse: if something IS slowing down, some force is doing it, and naming that force is usually the whole problem.',
      parts: [
        part('Notice', {
          study: `The trolley is ALREADY moving at ${v0} m/s before anything is applied.`,
          explore: {
            label: 'the net force',
            stops,
            initial: 2,
            invitation:
              'Push it hard, brake it hard, then set it to zero and look carefully at what the line does.',
          },
          prompt: 'With the net force set to zero, what did the trolley do over the eight seconds?',
          answer: mcq(rng, `Kept moving at a steady ${v0} m/s — the line was flat but not at zero`, [
            'Slowed down and stopped, because nothing was pushing it any more',
            'Stopped instantly the moment the force reached zero',
            'Slowly drifted back toward where it started',
          ]),
          explanation: `The line at zero net force is flat and sitting at ${v0} m/s — flat means the speed is not CHANGING, not that it is zero. A force is what changes motion; with none, the motion it already had simply continues. On a real track friction is a force, which is why everyday objects do stop — that is friction doing it, not the absence of a push.`,
        }),
        part('Predict', {
          prompt: `A spacecraft far from any star is drifting at 4 km/s with its engines **switched off** and nothing touching it. Ten years later, how fast is it going?`,
          answer: mcq(rng, 'About 4 km/s — with no force acting, nothing changes its speed', [
            'Almost zero — without engines it gradually runs out of motion',
            'Faster than 4 km/s, because it has been travelling for so long',
            'Impossible to say without knowing the mass of the spacecraft',
          ]),
          hints: [
            'What would have to act on it to change its speed?',
            'Empty space has no track and no air, so there is nothing to slow it.',
            'Worked path: no net force means no change in speed. **About 4 km/s.**',
          ],
          explanation:
            'About 4 km/s. Nothing acts on it, so nothing changes it — motion does not need to be maintained, only changed. The instinct that it must "run out" comes from a lifetime of watching friction act on everything, which makes coasting look like a special case when it is actually the default.',
        }),
      ],
    }
  },
)

// -------------------------------------------------- mean versus median

/**
 * One value moves; everything else is nailed down. The mean marker slides with
 * it and the median marker does not — a comparison that is very hard to
 * mistake once seen, and very easy to forget when only read.
 */
const exploreOutlier = tpl(
  {
    id: 'explore-outlier',
    name: 'Explore: what one extreme value can move',
    skillIds: ['m-stats'],
    bucket: 'math',
    difficulty: 2,
    variants: 4,
    minutes: 4,
    kind: 'multi',
  },
  (rng, seed) => {
    const scene = cycle(seed, [
      { what: 'minutes of homework', unit: 'min', base: [20, 25, 30, 30, 35, 40] },
      { what: 'books read this year', unit: 'books', base: [3, 5, 6, 6, 8, 10] },
      { what: 'minutes to get to school', unit: 'min', base: [5, 10, 12, 15, 18, 20] },
      { what: 'goals scored this season', unit: 'goals', base: [2, 4, 5, 7, 8, 9] },
    ])
    const base = scene.base
    const spread = base[base.length - 1] - base[0]
    // Stops reach far enough for the mean to visibly walk away from the median,
    // but not so far that the six pinned values collapse into the left edge.
    const outliers = [
      base[base.length - 1],
      base[base.length - 1] + spread,
      base[base.length - 1] + spread * 2,
      base[base.length - 1] + spread * 4,
      base[base.length - 1] + spread * 6,
    ]
    const xMax = Math.ceil(outliers[outliers.length - 1] / 10) * 10
    const median = (vals: number[]) => {
      const s = [...vals].sort((a, b) => a - b)
      const mid = s.length / 2
      return s.length % 2 ? s[(s.length - 1) / 2] : (s[mid - 1] + s[mid]) / 2
    }

    const stops: ExploreStop[] = outliers.map((last) => {
      const vals = [...base, last]
      // One decimal place: nobody reports a homework average as 31.429.
      const mean = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
      const med = r2(median(vals))
      return {
        value: `${last} ${scene.unit}`,
        caption: `Seven values, the largest at ${last}. Mean ${mean}, median ${med}.`,
        plot: {
          xMin: 0,
          xMax,
          yMin: 0,
          yMax: 2,
          hideY: true,
          xLabel: scene.what,
          series: [],
          dots: vals.map((v, i) => ({ x: v, y: 1, tone: (i === vals.length - 1 ? 1 : 0) as 0 | 1 })),
          marks: [
            { x: mean, label: `mean ${mean}`, tone: 1 as const },
            { x: med, label: `median ${med}`, tone: 0 as const },
          ],
        },
      }
    })

    const far = [...base, outliers[outliers.length - 1]]
    const farMean = Math.round((far.reduce((a, b) => a + b, 0) / far.length) * 10) / 10
    const farMed = r2(median(far))
    return {
      title: 'What one extreme value can move',
      prompt: `Seven people reported their **${scene.what}**. Six of the answers never change. You can drag the seventh.`,
      hints: [
        'Watch both dashed markers, not just the dots.',
        'Drag the last value as far right as it goes and compare the two markers.',
        'The mean uses every value; the median only cares about the middle position.',
      ],
      explanation: `Pulling one value far to the right drags the mean with it (up to ${farMean}) while the median barely moves (${farMed}). The mean adds every value in, so an extreme one carries real weight; the median only asks which value sits in the middle when they are lined up.`,
      transferBridge:
        'When a report gives an "average", ask which one. Incomes, house prices and waiting times are all reported as means by people who want the number to look bigger, and as medians by people who want it to look typical.',
      parts: [
        part('Notice', {
          study: `Six of the seven values are pinned in place. Only the largest one moves.`,
          explore: {
            label: 'the largest value',
            stops,
            initial: 0,
            invitation:
              'Drag the last value out as far as it will go, watching the two dashed markers as you do.',
          },
          prompt: 'As you dragged one value far out to the right, what did the two markers do?',
          answer: mcq(rng, 'The mean followed it a long way; the median hardly moved', [
            'Both followed it, since both are averages of the same numbers',
            'The median followed it; the mean stayed where it was',
            'Neither moved, because six of the seven values never changed',
          ]),
          explanation: `The mean is a total shared out, so every value pulls on it and a distant one pulls hard. The median is a POSITION — the middle value once they are in order — and moving the largest value further right does not change which value is in the middle.`,
        }),
        part('Predict', {
          prompt: `Nine people are in a room. Eight earn about £25,000 a year; the ninth earns £10 million. Which describes a **typical** person in that room better?`,
          answer: mcq(rng, 'The median, because it is not dragged by the one extreme salary', [
            'The mean, because it uses all nine salaries rather than throwing information away',
            'Neither — with an extreme value present, no single number can be used at all',
            'The mean, because with nine people the sample is large enough for it to settle down',
          ]),
          hints: [
            'Work out roughly what the mean would be, then ask whether anyone in the room actually earns that.',
            'The mean here is over £1.1 million. The median is £25,000.',
            'Worked path: the number that describes a typical person is the **median**.',
          ],
          explanation:
            'The median. The mean is above £1.1 million, and not one person in the room earns anything close to it — a summary nobody matches is a poor summary. Note what this does NOT say: the mean is not broken, and it is the right tool when you want the total (a payroll budget is exactly the mean times the headcount). It is the wrong tool for "typical".',
        }),
      ],
    }
  },
)

// ------------------------------------------------------------ sample size

/**
 * Precomputed samples, not live randomness: the picture must be identical on
 * every device and every replay, and the audit has to be able to check the
 * exact frames a learner will see. The draws below come from a fixed
 * generator run once and written down.
 */
const exploreSampleSize = tpl(
  {
    id: 'explore-samplesize',
    name: 'Explore: why small samples mislead',
    skillIds: ['m-sampling'],
    bucket: 'math',
    difficulty: 3,
    variants: 3,
    minutes: 4.5,
    kind: 'multi',
  },
  (rng, seed) => {
    const scene = cycle(seed, [
      { thing: 'a fair coin', truth: 50, asks: 'lands heads' },
      { thing: 'a spinner with half the dial shaded', truth: 50, asks: 'lands on the shaded half' },
      { thing: 'a bag with equal numbers of red and blue counters', truth: 50, asks: 'gives red' },
    ])
    /*
     * Twelve surveys per sample size, written down rather than drawn at render
     * time so the picture is identical everywhere and the audit can check the
     * exact frames a learner sees.
     *
     * These are ILLUSTRATIVE rather than the output of one particular random
     * run, but they are not decorative: the spread of a sample proportion
     * shrinks with 1/√n, and these obey it. Full ranges are 60, 34, 16 and 8
     * percentage points against sample sizes 10, 30, 100 and 500 — a 7.5×
     * narrowing where the law predicts √50 ≈ 7.1. A learner who measured them
     * would find the relationship the item claims.
     */
    const runs: Record<number, number[]> = {
      10: [20, 30, 30, 40, 40, 50, 50, 60, 60, 70, 70, 80],
      30: [33, 37, 40, 43, 47, 47, 50, 53, 57, 60, 63, 67],
      100: [42, 44, 46, 47, 49, 50, 50, 51, 53, 54, 56, 58],
      500: [46, 47, 48, 49, 49, 50, 50, 51, 51, 52, 53, 54],
    }
    const sizes = [10, 30, 100, 500]
    const stops: ExploreStop[] = sizes.map((n) => {
      const vals = runs[n]
      const lo = Math.min(...vals)
      const hi = Math.max(...vals)
      return {
        value: `${n} tries each`,
        caption: `Twelve surveys of ${n}. Their results ran from ${lo}% to ${hi}%.`,
        plot: {
          xMin: 0,
          xMax: 100,
          yMin: 0,
          yMax: 2,
          hideY: true,
          xLabel: '% of tries that succeeded',
          series: [],
          // Stagger the height so equal results stay countable instead of
          // hiding underneath each other.
          dots: vals.map((v, i) => ({ x: v, y: r2(0.6 + (i % 3) * 0.4) })),
          marks: [{ x: scene.truth, label: `truth ${scene.truth}%`, tone: 0 as const }],
        },
      }
    })
    const wide = Math.max(...runs[10]) - Math.min(...runs[10])
    const tight = Math.max(...runs[500]) - Math.min(...runs[500])
    return {
      title: 'Why small samples mislead',
      prompt: `You are testing **${scene.thing}**, which really does succeed half the time. Each dot is one survey. You control **how many tries each survey does**.`,
      hints: [
        'The dashed line is the real answer. Compare how far the dots stray from it.',
        'Look at the width of the cloud of dots, not where its middle is.',
        'The middle stays put at every sample size; only the spread changes.',
      ],
      explanation: `The truth is ${scene.truth}% at every setting, and the dots are centred on it every time. What changes is the SPREAD: twelve surveys of 10 ranged across ${wide} percentage points, twelve surveys of 500 across ${tight}. Bigger samples are not more accurate on average — they are less variable, so any single one is more trustworthy.`,
      transferBridge:
        'When a striking result comes from a small sample, the result being striking is itself the reason to doubt it: small samples produce extreme answers routinely, and the extreme ones are the ones that get reported.',
      parts: [
        part('Notice', {
          study: `The real answer is ${scene.truth}% at every setting. Only the number of tries per survey changes.`,
          explore: {
            label: 'tries per survey',
            stops,
            initial: 0,
            invitation:
              'Step from the smallest setting to the largest and watch the width of the cloud of dots, not where its middle sits.',
          },
          prompt: 'As the number of tries per survey grew, what happened to the dots?',
          answer: mcq(rng, 'They pulled in tightly around the dashed line, which never moved', [
            'They moved across to the dashed line, which had been in the wrong place',
            'They spread out further, because more tries means more chances to go wrong',
            'They stayed equally spread out — only the labels changed',
          ]),
          explanation: `The centre was right all along at every sample size; what shrank is the spread. Twelve small surveys scattered across ${wide} percentage points and twelve large ones across ${tight}. That is why a small survey is not simply a rougher version of a big one — it is far more likely to hand you a number a long way from the truth.`,
        }),
        part('Predict', {
          prompt: `A survey of **12 people** finds 75% support for a policy. A survey of **1,200 people** finds 52%. Which is the better estimate of real support, and why?`,
          answer: mcq(rng, 'The 1,200-person one — a 12-person survey can land far from the truth by chance alone', [
            'The 12-person one, because 75% is a much clearer and stronger result',
            'Neither is usable, since surveys can never measure what people really think',
            'They are equally good, because both were carried out the same way',
          ]),
          hints: [
            'Look back at how far twelve surveys of 10 strayed from a truth of 50%.',
            'A tiny survey landing on 75% when the truth is 52% is an ordinary event, not a surprising one.',
            'Worked path: the **1,200-person** survey, because small samples vary hugely.',
          ],
          explanation:
            'The 1,200-person survey. With only 12 people, results far from the truth happen routinely — exactly what the widest setting on the diagram showed. Note what is NOT being claimed: that the big survey is right, or that the small one lied. A large sample controls one specific problem — random variation — and does nothing about a biased question or who was asked in the first place.',
        }),
      ],
    }
  },
)

export const exploreBItems: ItemTemplate[] = [
  exploreFence,
  exploreNetForce,
  exploreOutlier,
  exploreSampleSize,
]
