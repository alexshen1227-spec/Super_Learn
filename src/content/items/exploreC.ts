/**
 * Manipulable diagrams, third set — the same Notice-then-Predict shape as
 * `explore.ts` and `exploreB.ts`, taking the count to fifteen families.
 *
 * Selection rule, unchanged: a draggable diagram earns its session minutes
 * only where a learner holds a belief that reading does not shift. Eight more
 * of those, chosen so five reuse existing plot primitives and none needs a
 * runtime formula:
 *
 *  - percentage change is not symmetric (+20% then −20% loses money);
 *  - stopping distance follows the SQUARE of speed, which is why a small
 *    speed rise is a large danger rise;
 *  - two data sets can share a mean and share nothing else;
 *  - a trend line says nothing on its own about how well it predicts;
 *  - a parabola in vertex form slides without changing shape;
 *  - a zero exponent is 1 and a negative one is not negative;
 *  - every circle in the universe has the same circumference-to-diameter
 *    ratio, which is what π actually is;
 *  - shortening a wave raises its frequency and leaves its speed alone.
 */
import type { ExploreStop, ItemPart, ItemTemplate, PlotSeries } from '../../domain/types'
import { cycle, mcq, numeric, tpl } from '../lib'
import { stackDots, stackedHeight } from '../../engine/plotGeometry'

function part(stage: string, body: Omit<ItemPart, 'stage'>): ItemPart {
  return { stage, ...body }
}
function r2(v: number): number {
  return Math.round(v * 1000) / 1000
}
/** Money and measurements, to two places, without trailing binary dust. */
function money(v: number): string {
  return (Math.round(v * 100) / 100).toFixed(2)
}

/** A real minus sign, never a hyphen, in front of any number a learner reads. */
function neg(n: number): string {
  return n < 0 ? `−${Math.abs(n)}` : `${n}`
}

/**
 * A tidy number for a caption: at most one decimal place, and no trailing
 * zero. Reported as "some numbers are kinda broken" — captions were showing
 * 13.333 and 6.667, which read as a glitch rather than as a value.
 */
function tidy(v: number): string {
  const r = Math.round(v * 10) / 10
  return Number.isInteger(r) ? String(r) : r.toFixed(1)
}

// ------------------------------------------------- percentage asymmetry

/**
 * The same percentage up then down never returns to the start, and the gap
 * widens with the size of the swing. Believing otherwise is what makes "the
 * shop put it up 20% then took 20% off, so it's back to normal" feel true.
 */
const explorePercentSwing = tpl(
  {
    id: 'explore-percent-swing',
    name: 'Explore: up then down by the same percent',
    skillIds: ['m-percent'],
    bucket: 'math',
    difficulty: 3,
    variants: 4,
    minutes: 4,
    kind: 'multi',
  },
  (rng, seed) => {
    const scene = cycle(seed, [
      { thing: 'a jacket', start: 100, unit: '£' },
      { thing: 'a bike', start: 200, unit: '£' },
      { thing: 'a phone', start: 400, unit: '£' },
      { thing: 'a guitar', start: 250, unit: '£' },
    ])
    const start = scene.start
    const pcts = [10, 20, 30, 40, 50]
    const yMax = Math.ceil((start * 1.5) / 50) * 50
    const stops: ExploreStop[] = pcts.map((p) => {
      const up = r2(start * (1 + p / 100))
      const down = r2(up * (1 - p / 100))
      return {
        value: `${p}%`,
        caption: `${scene.unit}${money(start)} → up ${p}% → ${scene.unit}${money(up)} → down ${p}% → ${scene.unit}${money(down)}.`,
        plot: {
          xMin: 0,
          xMax: 2,
          yMin: 0,
          yMax,
          xLabel: 'step',
          yLabel: scene.unit,
          series: [
            {
              points: [
                [0, start],
                [1, up],
                [2, down],
              ] as [number, number][],
              label: 'price',
              tone: 0,
            },
            {
              points: [
                [0, start],
                [2, start],
              ] as [number, number][],
              label: 'the original price',
              tone: 1,
            },
          ],
        },
      }
    })
    const worst = r2(start * 1.5 * 0.5)
    return {
      title: 'Up then down by the same percent',
      prompt: `**${scene.thing}** costs **${scene.unit}${money(start)}**. The price goes UP by some percent, then DOWN by that same percent.`,
      hints: [
        'Compare the end of the blue line with the flat orange line at every setting.',
        'The rise is a percentage of the ORIGINAL price; the fall is a percentage of the bigger price.',
        'A percent is always a percent OF something, and the something changed in between.',
      ],
      explanation: `Up ${'x'}% then down ${'x'}% never returns to the start, and the shortfall grows as the swing grows: at 50% the price ends at ${scene.unit}${money(worst)}, a quarter below where it began. The rise is taken on the original price and the fall on the larger one, so the fall is worth more.`,
      transferBridge:
        'A percentage is meaningless without knowing what it is a percentage OF. The same trap sits behind a portfolio that falls 50% and then rises 50%, which leaves you a quarter down, not level.',
      parts: [
        part('Notice', {
          study: `The flat orange line is the original price. The blue line is what actually happens.`,
          explore: {
            label: 'the size of the swing',
            stops,
            initial: 0,
            invitation:
              'Work up from the smallest swing to the largest and compare where the blue line finishes against the flat orange one.',
          },
          prompt: 'After going up and then down by the SAME percent, where did the price end up?',
          answer: mcq(rng, 'Below where it started, and further below for bigger swings', [
            'Exactly back where it started, since the same percent went up and came down',
            'Above where it started, because the rise came first',
            'Below where it started by the same amount whatever the swing was',
          ]),
          explanation: `The percent is the same but the AMOUNT is not, because the second percentage is taken from a bigger number. Up 10% then down 10% loses 1% of the original; up 50% then down 50% loses 25% of it.`,
        }),
        part('Predict', {
          prompt: `A share worth £100 falls by **50%**, then rises by **50%**. What is it worth, in pounds?`,
          answer: numeric(75),
          hints: [
            'Do the fall first: 50% of £100 is £50, so it is worth £50.',
            'Now rise 50% — but 50% OF £50, not of £100.',
            'Worked path: £50 + £25 = **£75**.',
          ],
          explanation:
            '**£75.** The fall was 50% of £100 (£50); the rise was 50% of £50 (£25). Order does not rescue it either — rising first and falling second gives £75 as well. To get back to £100 from £50 you need a 100% rise, which is why a big loss is so much harder to undo than it looks.',
        }),
      ],
    }
  },
)

// -------------------------------------------------------- stopping distance

/**
 * Braking distance goes as the square of speed. The everyday belief that "a
 * bit faster is a bit worse" is wrong in a way that matters, and a bar you can
 * watch quadruple is more convincing than the formula.
 */
const exploreStopping = tpl(
  {
    id: 'explore-stopping',
    name: 'Explore: how speed changes stopping distance',
    skillIds: ['p-energy'],
    bucket: 'physics',
    difficulty: 3,
    variants: 3,
    minutes: 4,
    kind: 'multi',
  },
  (rng, seed) => {
    // Braking deceleration, in m/s². Dry tarmac is around 7; the variants
    // stand for different surfaces rather than different physics.
    const scene = cycle(seed, [
      { surface: 'dry road', a: 8 },
      { surface: 'wet road', a: 5 },
      { surface: 'loose gravel', a: 4 },
    ])
    const speedsKmh = [20, 40, 60, 80]
    const dist = (kmh: number) => r2((kmh / 3.6) ** 2 / (2 * scene.a))
    const xMax = Math.ceil(dist(speedsKmh[speedsKmh.length - 1]) / 10) * 10
    const stops: ExploreStop[] = speedsKmh.map((v) => {
      const d = dist(v)
      return {
        value: `${v} km/h`,
        caption: `At ${v} km/h on ${scene.surface}, braking takes about ${d.toFixed(1)} m.`,
        plot: {
          xMin: 0,
          xMax,
          yMin: 0,
          yMax: 3,
          hideY: true,
          xLabel: 'braking distance (m)',
          series: [],
          rect: { x: 0, y: 1, w: d, h: 1, label: `${d.toFixed(1)} m` },
        },
      }
    })
    const d20 = dist(20)
    const d40 = dist(40)
    return {
      title: 'How speed changes stopping distance',
      prompt: `A car brakes as hard as it can on **${scene.surface}**. You choose how fast it was going.`,
      hints: [
        'Compare 20 with 40, then 40 with 80. Doubling the speed does what to the bar?',
        'The bar more than doubles when the speed doubles — count how many times over.',
        'Braking distance follows the SQUARE of the speed, not the speed itself.',
      ],
      explanation: `Doubling the speed roughly quadruples the braking distance: ${d20.toFixed(1)} m at 20 km/h against ${d40.toFixed(1)} m at 40 km/h. All the energy of motion has to be removed by the brakes, and that energy goes as speed squared.`,
      transferBridge:
        'Anything proportional to a square punishes small increases far more than intuition expects — which is also why wind loading, drag and area-based costs all surprise people.',
      parts: [
        part('Notice', {
          study: `The bar is how far the car travels after the brakes go on.`,
          explore: {
            label: 'the speed',
            stops,
            initial: 0,
            invitation: 'Step up through the speeds. Compare 20 with 40, then 40 with 80.',
          },
          prompt: 'When the speed DOUBLED, roughly what happened to the braking distance?',
          answer: mcq(rng, 'It became about four times as long', [
            'It became about twice as long',
            'It became about eight times as long',
            'It grew by a fixed number of metres each time',
          ]),
          explanation: `Doubling the speed roughly quadruples the distance — ${d20.toFixed(1)} m becomes ${d40.toFixed(1)} m. The energy the brakes must remove goes as speed squared, so a modest speed rise is a large stopping-distance rise. This is separate from reaction distance, which does grow in step with speed; the total is the two added together.`,
        }),
        part('Predict', {
          prompt: `A car needs 12 m to brake from 30 km/h. Roughly how far does it need from **60 km/h**?`,
          answer: mcq(rng, 'About 48 m — four times as far', [
            'About 24 m — twice as far',
            'About 12 m — the distance does not depend on speed',
            'About 15 m — a little further',
          ]),
          hints: [
            'The speed doubled from 30 to 60.',
            'Doubling the speed multiplies the braking distance by 2 × 2.',
            'Worked path: 12 × 4 = **about 48 m**.',
          ],
          explanation:
            'About 48 m. Doubling speed multiplies braking distance by four, because the energy to remove goes as the square. Worth being precise about what this does NOT say: it is about BRAKING distance only. Reaction distance, covered before the brakes are touched, does double rather than quadruple — so the total stopping distance grows by somewhere between the two.',
        }),
      ],
    }
  },
)

// -------------------------------------------------- same mean, different spread

/**
 * The companion to the outlier item in `exploreB.ts`. There the mean moved and
 * the median did not; here the mean is pinned and everything else changes, so
 * "same average" is separated from "same data" in the other direction.
 */
const exploreSpread = tpl(
  {
    id: 'explore-spread',
    name: 'Explore: same average, different story',
    skillIds: ['m-variability'],
    bucket: 'math',
    difficulty: 3,
    variants: 3,
    minutes: 4,
    kind: 'multi',
  },
  (rng, seed) => {
    const scene = cycle(seed, [
      { what: 'test scores out of 100', centre: 60, unit: '' },
      { what: 'minutes of sleep lost per night', centre: 40, unit: '' },
      { what: 'daily temperature (°C)', centre: 20, unit: '' },
    ])
    const c = scene.centre
    // Seven values, symmetric about the centre, so the mean is EXACTLY the
    // centre at every setting and the marker provably cannot move.
    const widths = [1, 2, 4, 7, 10]
    // Derived from the widest setting rather than assumed from the centre: the
    // temperature variant is centred on 20 and legitimately reaches below zero,
    // which an axis of 0..2c would have clipped off the left edge.
    const reach = 3 * Math.max(...widths)
    const xMin = c - reach - widths[widths.length - 1]
    const xMax = c + reach + widths[widths.length - 1]
    const axis = { xMin, xMax, hideY: true }
    const valuesAt = (w: number) => [-3, -2, -1, 0, 1, 2, 3].map((k) => c + k * w)
    const dotHeight = stackedHeight(widths.map(valuesAt), axis)
    const stops: ExploreStop[] = widths.map((w) => {
      const vals = valuesAt(w)
      return {
        value: `spread ${w}`,
        caption: `Seven values from ${neg(Math.min(...vals))} to ${neg(Math.max(...vals))}. Mean ${c}.`,
        plot: {
          xMin,
          xMax,
          yMin: 0,
          yMax: dotHeight,
          hideY: true,
          xLabel: scene.what,
          series: [],
          dots: stackDots(vals, axis),
          marks: [{ x: c, label: `mean ${c}`, tone: 1 as const }],
        },
      }
    })
    const tight = widths[0] * 3
    const wide = widths[widths.length - 1] * 3
    return {
      title: 'Same average, different story',
      prompt: `Seven measurements of **${scene.what}**. You control how spread out they are.`,
      hints: [
        'Watch the dashed marker as you drag, not the dots.',
        'Compare the tightest setting with the widest — what is identical about them?',
        'An average tells you where the middle is and nothing about how far things stray from it.',
      ],
      explanation: `The mean is ${c} at every single setting, because the values stay balanced around it — yet the data goes from clustered within ${tight} of the middle to scattered ${wide} either side. Two groups can share an average and share nothing else.`,
      transferBridge:
        'Ask for the spread whenever you are given an average. A river with an average depth of one metre is not a river you can safely wade across.',
      parts: [
        part('Notice', {
          study: `Seven measurements. Only how spread out they are changes.`,
          explore: {
            label: 'how spread out the values are',
            stops,
            initial: 0,
            invitation: 'Drag from the tightest setting to the widest, watching the dashed marker.',
          },
          prompt: 'As the values spread further and further apart, what did the dashed marker do?',
          answer: mcq(rng, `It never moved — the average stayed ${c} at every setting`, [
            'It moved outward with the values, since the values got bigger',
            'It moved toward the middle, because spreading out cancels extremes',
            'It jumped about, because averages depend on every value',
          ]),
          explanation: `Every setting keeps the values balanced around ${c}, so the mean is stuck there. What changed is everything else: how typical the average is, how far a random value sits from it, and how much you would trust it as a description.`,
        }),
        part('Predict', {
          prompt: `Two towns both have an average yearly temperature of **11 °C**. One ranges from 9 to 13; the other from −15 to 37. What does the shared average tell you about what it is like to live there?`,
          answer: mcq(rng, 'Almost nothing — the average is identical and the experience is completely different', [
            'That the two towns have very similar climates, since the averages match',
            'That the second town is warmer overall, because its highest temperature is higher',
            'That the averages must have been calculated wrongly, since the ranges differ so much',
          ]),
          hints: [
            'Both averages are 11. What is different?',
            'Think about what you would need to pack for each town.',
            'Worked path: the average is the same and the SPREAD is not, so it tells you **almost nothing**.',
          ],
          explanation:
            'Almost nothing. One town needs a light jacket year-round; the other needs both a heatwave plan and a snow plan. Note what this does not say — the average is not useless, it genuinely locates the middle. It is just radically incomplete on its own, which is why spread is reported beside it rather than instead of it.',
        }),
      ],
    }
  },
)

// ------------------------------------------------ the line versus the scatter

/**
 * A trend line drawn through a cloud says where the middle goes, not how
 * closely anything follows it. The line here is IDENTICAL at every setting and
 * only the scatter changes, which isolates the point exactly.
 */
const exploreScatter = tpl(
  {
    id: 'explore-scatter',
    name: 'Explore: the line is the same, the story is not',
    skillIds: ['m-bestfit'],
    bucket: 'math',
    difficulty: 3,
    variants: 3,
    minutes: 4.5,
    kind: 'multi',
  },
  (rng, seed) => {
    const scene = cycle(seed, [
      { x: 'hours revised', y: 'test score' },
      { x: 'hours of training', y: 'race time saved (s)' },
      { x: 'weeks of practice', y: 'pieces played from memory' },
    ])
    const xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    // A fixed wobble pattern, scaled by the slider. Written down rather than
    // drawn, so every learner sees the same cloud and the audit can check it.
    const wobble = [1, -1, 0.6, -0.8, 0.2, -0.4, 0.9, -0.6, -0.2, 0.5]
    const slope = 4
    const intercept = 30
    const spreads = [0, 4, 10, 20]
    const yMin = 0
    const yMax = 100
    const stops: ExploreStop[] = spreads.map((s) => {
      const line: PlotSeries = {
        points: [
          [xs[0], intercept + slope * xs[0]],
          [xs[xs.length - 1], intercept + slope * xs[xs.length - 1]],
        ],
        label: 'trend line',
        tone: 1,
      }
      return {
        value: s === 0 ? 'no scatter' : `scatter ${s}`,
        caption:
          s === 0
            ? 'Every point sits exactly on the line.'
            : `Points stray up to ${s} either side of the same line.`,
        plot: {
          xMin: 0,
          xMax: 11,
          yMin,
          yMax,
          xLabel: scene.x,
          yLabel: scene.y,
          series: [line],
          dots: xs.map((x, i) => ({
            x,
            y: r2(Math.min(yMax, Math.max(yMin, intercept + slope * x + wobble[i] * s))),
          })),
        },
      }
    })
    return {
      title: 'The line is the same, the story is not',
      prompt: `A trend line is drawn through some data about **${scene.x}** and **${scene.y}**. The line never changes. Only the data around it does.`,
      hints: [
        'Look at the line itself at each setting. Is it in a different place?',
        'Pick one value on the horizontal axis and ask how confidently you could guess its height.',
        'A line describes the middle of a cloud, not how tightly the cloud hugs it.',
      ],
      explanation: `The trend line is identical at every setting — same steepness, same starting height — while the data goes from sitting exactly on it to scattering 20 either side. The line tells you the general direction; only the scatter tells you how much to trust a prediction from it.`,
      transferBridge:
        'When a report quotes a trend, ask how tightly the data follows it. A real trend with huge scatter can be true on average and useless for any individual case.',
      parts: [
        part('Notice', {
          study: `The line is drawn in the same place in every picture below.`,
          explore: {
            label: 'how scattered the data is',
            stops,
            initial: 0,
            invitation:
              'Step from no scatter to the widest, watching the line itself rather than the dots.',
          },
          prompt: 'The line stayed put the whole time. What changed as the scatter grew?',
          answer: mcq(rng, 'How well the line predicts any single individual point on it', [
            'The direction of the relationship, which weakened as points spread out',
            'The steepness of the line, which flattened as the scatter grew',
            'Nothing important — scatter is measurement noise and can be ignored',
          ]),
          explanation: `Direction and steepness are properties of the LINE, and the line never moved. What the scatter changes is how far a real point is likely to sit from it — which is exactly what you need if you want to predict one case rather than describe the average.`,
        }),
        part('Predict', {
          prompt: `A study reports a real upward trend between hours revised and test score, with scores scattering ±25 marks around the line. A student revises for one extra hour. What can you honestly tell them?`,
          answer: mcq(rng, 'That scores tend to rise with revision, but their own result could easily land far off the line', [
            'That their score will rise by exactly the amount the line predicts',
            'That the trend is too scattered to mean anything at all, so revising makes no difference',
            'That their score will rise by at least the amount the line predicts',
          ]),
          hints: [
            'The trend being real and the prediction being precise are two different claims.',
            'A scatter of ±25 marks is wider than the rise the extra hour buys.',
            'Worked path: the trend is real, and any **individual** result can land far from it.',
          ],
          explanation:
            'Both halves matter. Denying the trend ignores the line; promising the line ignores the scatter. With ±25 marks of scatter, an individual result is dominated by everything else going on, even though the average effect is genuine. This is the same reasoning that separates "smoking causes cancer" from "this smoker will get cancer" — a real population trend, an uncertain individual case.',
        }),
      ],
    }
  },
)

// --------------------------------------------------------- vertex form

/**
 * A parabola in vertex form slides without changing shape, which is the same
 * invariant the line item teaches one level down and is routinely lost when
 * quadratics arrive.
 */
const exploreVertex = tpl(
  {
    id: 'explore-vertex',
    name: 'Explore: sliding a parabola',
    skillIds: ['m-quadratic'],
    bucket: 'math',
    difficulty: 3,
    variants: 4,
    minutes: 4,
    kind: 'multi',
  },
  (rng, seed) => {
    const plan = cycle(seed, [
      { axis: 'h', a: 1 },
      { axis: 'k', a: 1 },
      { axis: 'h', a: 2 },
      { axis: 'k', a: 2 },
    ] as const)
    const xMin = -6
    const xMax = 6
    const yMin = -6
    const yMax = 10
    const curve = (h: number, k: number): PlotSeries[] => {
      const pts: [number, number][] = []
      for (let x = xMin; x <= xMax + 1e-9; x += 0.25) {
        const y = plan.a * (x - h) ** 2 + k
        if (y >= yMin && y <= yMax) pts.push([r2(x), r2(y)])
      }
      return pts.length >= 2 ? [{ points: pts, label: 'parabola', tone: 0 }] : []
    }
    const shape = plan.a === 1 ? '(x − h)² + k' : `${plan.a}(x − h)² + k`

    if (plan.axis === 'h') {
      const hs = [-3, -2, -1, 0, 1, 2, 3]
      const stops: ExploreStop[] = hs.map((h) => ({
        value: `h = ${h < 0 ? `−${-h}` : h}`,
        caption: `y = ${plan.a === 1 ? '' : plan.a}(x ${h < 0 ? '+' : '−'} ${Math.abs(h)})². Lowest point at (${neg(h)}, 0).`,
        plot: { xMin, xMax, yMin, yMax, xLabel: 'x', yLabel: 'y', series: curve(h, 0) },
      }))
      return {
        title: 'Sliding a parabola sideways',
        prompt: `A parabola is written **y = ${shape}** with **k = 0**. You can change **h**.`,
        hints: [
          'Track the lowest point of the curve as you drag.',
          'Compare the width of the curve at the far left and far right settings.',
          'In this form, h moves the curve and does not reshape it.',
        ],
        explanation: `Changing h slides the whole parabola left and right without altering its shape: every version is the same curve in a different place, with its lowest point at (h, 0). Note the sign — (x − 3)² sits at x = +3, not −3, because the bracket is zero when x equals 3.`,
        transferBridge:
          'The same "what makes the bracket zero" question locates the turning point of any shifted function, which is why this form is worth rearranging into.',
        parts: [
          part('Notice', {
            study: `Every curve below is y = ${shape} with k = 0. Only h changes.`,
            explore: {
              label: 'the value of h',
              stops,
              initial: 3,
              invitation: 'Drag from one end to the other and watch the shape of the curve, not just its position.',
            },
            prompt: 'As h moved the curve across the screen, what happened to the SHAPE of the curve?',
            answer: mcq(rng, 'It stayed identical — the same curve simply moved sideways', [
              'It became wider as h grew and narrower as h shrank',
              'It flipped upside down once h passed zero',
              'It became narrower the further from the centre it went',
            ]),
            explanation: `h is a position, not a shape. The whole curve slides; nothing about its width or direction depends on h. Width is controlled by the number in front of the bracket, which never changed here.`,
          }),
          part('Predict', {
            prompt: `For **y = (x − 7)²**, at what value of x does the curve reach its lowest point?`,
            answer: numeric(7),
            hints: [
              'The square of anything is never negative, so the smallest the curve can be is 0.',
              'That happens exactly when the bracket is zero. What makes x − 7 equal zero?',
              'Worked path: x − 7 = 0, so x = **7**.',
            ],
            explanation: `**7**. A square is never negative, so the lowest value is 0, reached when the bracket is 0. The minus sign in (x − 7) still puts the curve at +7 — the sign inside the bracket is the opposite of the direction it moves, which is the single most common slip with this form.`,
          }),
        ],
      }
    }

    const ks = [-4, -2, 0, 2, 4, 6]
    const stops: ExploreStop[] = ks.map((k) => ({
      value: `k = ${k < 0 ? `−${-k}` : k}`,
      caption: `y = ${plan.a === 1 ? '' : plan.a}x² ${k < 0 ? '−' : '+'} ${Math.abs(k)}. Lowest point at (0, ${neg(k)}).`,
      plot: { xMin, xMax, yMin, yMax, xLabel: 'x', yLabel: 'y', series: curve(0, k) },
    }))
    return {
      title: 'Sliding a parabola up and down',
      prompt: `A parabola is written **y = ${shape}** with **h = 0**. You can change **k**.`,
      hints: [
        'Track the lowest point of the curve as you drag.',
        'Count how many times the curve crosses the horizontal axis at each setting.',
        'k lifts and drops the curve; it does not reshape it.',
      ],
      explanation: `k lifts the whole parabola up and down without reshaping it. It also decides how many times the curve meets the horizontal axis: twice when the lowest point is below it, once when it just touches, and never when the whole curve sits above — which is exactly what the discriminant is measuring.`,
      transferBridge:
        'How many solutions an equation has is often a question about where a curve sits relative to a line, not about the algebra at all.',
      parts: [
        part('Notice', {
          study: `Every curve below is y = ${shape} with h = 0. Only k changes.`,
          explore: {
            label: 'the value of k',
            stops,
            initial: 2,
            invitation:
              'Drag from the lowest setting to the highest, counting how many times the curve crosses the horizontal axis.',
          },
          prompt: 'How many times does the curve cross the horizontal axis when its lowest point is ABOVE that axis?',
          answer: mcq(rng, 'Never — the whole curve sits above it', [
            'Twice, as it does at every setting',
            'Once, at the lowest point',
            'It depends on how steep the curve is',
          ]),
          explanation: `Once the lowest point is lifted above the axis, no part of the curve can reach it. That is the picture behind "no real solutions": you are asking where a curve meets a line it never touches.`,
        }),
        part('Predict', {
          prompt: `How many times does **y = x² + 5** cross the horizontal axis?`,
          answer: numeric(0),
          hints: [
            'x² is never negative, so what is the smallest y can be?',
            'The lowest point is at y = 5, which is above the axis.',
            'Worked path: the curve never reaches the axis, so **0** times.',
          ],
          explanation: `**0.** The smallest x² can be is 0, so the smallest y can be is 5 — the curve never gets down to the axis. Solving x² + 5 = 0 gives x² = −5, which no real number satisfies. Same fact, said twice.`,
        }),
      ],
    }
  },
)

// ------------------------------------------------------- zero and negative powers

/**
 * Halving downward through 2⁰ makes the zero exponent an observation rather
 * than a rule to memorise, and shows that negative exponents give small
 * positive numbers rather than negative ones.
 */
const explorePowers = tpl(
  {
    id: 'explore-powers',
    name: 'Explore: what happens below the first power',
    skillIds: ['m-exponents'],
    bucket: 'math',
    difficulty: 2,
    variants: 3,
    minutes: 4,
    kind: 'multi',
  },
  (rng, seed) => {
    const base = cycle(seed, [2, 3, 5])
    const ns = [3, 2, 1, 0, -1, -2]
    const yMax = base ** 3
    const stops: ExploreStop[] = ns.map((n) => {
      const v = base ** n
      const shown = n >= 0 ? `${v}` : `1/${base ** -n}`
      // The mark and the explanation used r2(base**n), which printed 0.333 and
      // 0.111. A fraction is both tidier and closer to what the step means.
      return {
        value: `${base}^${neg(n)}`,
        caption:
          n >= 0
            ? `${base}^${n} = ${v}. Each step down divides by ${base}.`
            : `${base}^−${-n} = ${shown}. Still dividing by ${base}, and still positive.`,
        plot: {
          xMin: -2.5,
          xMax: 3.5,
          yMin: 0,
          yMax,
          xLabel: 'exponent',
          yLabel: 'value',
          series: [],
          dots: ns.map((k) => ({ x: k, y: r2(base ** k), tone: (k === n ? 1 : 0) as 0 | 1 })),
          marks: [{ x: n, label: shown, tone: 1 as const }],
        },
      }
    })
    return {
      title: 'What happens below the first power',
      prompt: `Powers of **${base}**. Every step to the LEFT divides by ${base}. You choose the exponent.`,
      hints: [
        `Start at the top and go down one step at a time, dividing by ${base} each time.`,
        `${base}^1 is ${base}. Divide by ${base} once more — what should ${base}^0 be?`,
        'Keep dividing past zero. Dividing a positive number can never give a negative one.',
      ],
      explanation: `Going down one step always divides by ${base}: ${base ** 2} → ${base} → 1 → 1/${base}. That is why ${base}^0 = 1 — it is what you get by dividing ${base}^1 by ${base} — and why negative exponents give small POSITIVE fractions rather than negative numbers.`,
      transferBridge:
        'A rule that looks arbitrary is often a pattern continued. Asking "what keeps the pattern working?" is how zero and negative exponents, and later fractional ones, stop needing to be memorised.',
      parts: [
        part('Notice', {
          study: `Each step to the left divides the value by ${base}.`,
          explore: {
            label: 'the exponent',
            stops,
            initial: 0,
            invitation: `Step down one at a time from the top, dividing by ${base} as you go, and watch what happens at 0 and below.`,
          },
          prompt: `Following that pattern down, what is ${base}^0?`,
          answer: mcq(rng, '1', ['0', `${base}`, 'Undefined — a power of zero has no value']),
          explanation: `${base}^1 is ${base}, and one step down divides by ${base}: ${base} ÷ ${base} = 1. So ${base}^0 = 1, not because of a rule handed down but because it is the only value that keeps the pattern unbroken. The same reasoning continues below zero into fractions.`,
        }),
        part('Predict', {
          prompt: `Without a calculator: is **${base}^−2** positive or negative, and is it bigger or smaller than 1?`,
          answer: mcq(rng, `Positive, and smaller than 1 — it is 1 ÷ ${base ** 2}`, [
            `Negative, because the exponent is negative`,
            `Positive and bigger than 1, because ${base} is bigger than 1`,
            `Negative and smaller than −1`,
          ]),
          hints: [
            'A negative exponent tells you to divide, not to make the answer negative.',
            `${base}^−2 means 1 ÷ ${base}², and ${base}² is ${base ** 2}.`,
            `Worked path: 1 ÷ ${base ** 2} = 1/${base ** 2} — **positive and smaller than 1**.`,
          ],
          explanation: `Positive and less than 1: ${base}^−2 = 1 ÷ ${base ** 2} = 1/${base ** 2}. The minus sign in the exponent flips the number over; it never changes its sign. Dividing a positive by a positive cannot give a negative, whatever the exponent says.`,
        }),
      ],
    }
  },
)

// -------------------------------------------------------------------- π

/**
 * The one ratio that refuses to move. Every circle ever measured has the same
 * circumference-to-diameter ratio, and π is nothing more mysterious than that
 * — a fact usually asserted and almost never watched.
 */
const explorePi = tpl(
  {
    id: 'explore-pi',
    name: 'Explore: the ratio every circle shares',
    skillIds: ['m-circles'],
    bucket: 'math',
    difficulty: 2,
    variants: 3,
    minutes: 4,
    kind: 'multi',
  },
  (rng, seed) => {
    const scene = cycle(seed, [
      { what: 'coins', unit: 'cm' },
      { what: 'plates', unit: 'cm' },
      { what: 'wheels', unit: 'cm' },
    ])
    const radii = [1, 2, 3, 4, 5]
    const span = 12
    const stops: ExploreStop[] = radii.map((r) => {
      const d = 2 * r
      const c = r2(2 * Math.PI * r)
      return {
        value: `radius ${r} ${scene.unit}`,
        caption: `Across: ${d} ${scene.unit}. Around: ${c.toFixed(2)} ${scene.unit}. Around ÷ across = ${(c / d).toFixed(2)}.`,
        plot: {
          xMin: -span / 2,
          xMax: span / 2,
          yMin: -span / 2,
          yMax: span / 2,
          aspectSquare: true,
          series: [],
          circles: [{ cx: 0, cy: 0, r, label: `r = ${r}` }],
        },
      }
    })
    return {
      title: 'The ratio every circle shares',
      prompt: `Round ${scene.what} of different sizes. For each one you can compare the distance **across** the middle with the distance **around** the edge.`,
      hints: [
        'Read the last number in the caption at the smallest circle, then at the largest.',
        'Divide the distance around by the distance across at two very different sizes.',
        'The two distances both grow, and they grow in step.',
      ],
      explanation: `Around ÷ across is 3.14 for every circle at every size — that number IS π. Both distances grow together, so their ratio cannot change: the circumference is π times the diameter by definition, not by coincidence.`,
      transferBridge:
        'A ratio that holds across every example of a shape is a definition in disguise. Sine, cosine and the golden ratio are all the same kind of fact about their own families of shapes.',
      parts: [
        part('Notice', {
          study: `For each circle: "across" is the diameter, "around" is the circumference.`,
          explore: {
            label: 'the size of the circle',
            stops,
            initial: 0,
            invitation:
              'Grow the circle from smallest to largest, reading the last number in the caption each time.',
          },
          prompt: 'As the circle grew, both distances got bigger. What happened to around ÷ across?',
          answer: mcq(rng, 'It stayed at about 3.14 for every one of the circles', [
            'It grew, because a bigger circle has more edge to go around',
            'It shrank, because the distance across grows faster',
            'It changed unpredictably from one circle to the next',
          ]),
          explanation: `Both distances scale together, so the ratio is locked. That fixed ratio is what π is — around ÷ across, the same for every circle that has ever existed. It is not an approximation of the ratio; 3.14 is an approximation of it.`,
        }),
        part('Predict', {
          prompt: `A circular pond is **10 m** across. Roughly how far is it **around** the edge, in metres?`,
          answer: numeric(31.4),
          hints: [
            'Around ÷ across is always about 3.14.',
            'So around = 3.14 × across, and across is 10.',
            'Worked path: 3.14 × 10 = **about 31.4 m**.',
          ],
          explanation: `**About 31.4 m.** Circumference = π × diameter, and the diameter is what "10 m across" means. If you were given the RADIUS as 10 instead, the diameter would be 20 and the answer 62.8 — mixing those two up is the most common slip with circles.`,
        }),
      ],
    }
  },
)

// ---------------------------------------------------------------- waves

/**
 * Wave speed is a property of the medium, not of the wave. Shortening the
 * wavelength raises the frequency and leaves the speed alone — an invariant
 * that is easy to state, easy to nod at, and easy to lose in an exam.
 */
const exploreWave = tpl(
  {
    id: 'explore-wave',
    name: 'Explore: what stays fixed when a wave changes',
    skillIds: ['p-waves'],
    bucket: 'physics',
    difficulty: 3,
    variants: 3,
    minutes: 4.5,
    kind: 'multi',
  },
  (rng, seed) => {
    const scene = cycle(seed, [
      { medium: 'a stretched rope', speed: 12, unit: 'm/s' },
      { medium: 'still water', speed: 6, unit: 'm/s' },
      { medium: 'a steel bar', speed: 20, unit: 'm/s' },
    ])
    const v = scene.speed
    const lengths = [1, 1.5, 2, 3, 4]
    const xMax = 8
    const amp = 1
    const stops: ExploreStop[] = lengths.map((lam) => {
      // Displayed to one place, but the SPEED is printed as the exact constant
      // it is. Recomputing it from the rounded frequency produced captions
      // reading "Speed 20.001 m/s" on the very diagram whose lesson is that
      // the speed never changes.
      const f = v / lam
      const pts: [number, number][] = []
      for (let x = 0; x <= xMax + 1e-9; x += 0.05) {
        pts.push([r2(x), r2(amp * Math.sin((2 * Math.PI * x) / lam))])
      }
      return {
        value: `${tidy(lam)} m long`,
        caption: `Wavelength ${lam} m, frequency ${tidy(f)} per second. Speed ${v} ${scene.unit}.`,
        plot: {
          xMin: 0,
          xMax,
          yMin: -1.6,
          yMax: 1.6,
          hideY: true,
          xLabel: 'distance (m)',
          series: [{ points: pts, label: `wavelength ${lam} m`, tone: 0 }],
        },
      }
    })
    return {
      title: 'What stays fixed when a wave changes',
      prompt: `A wave travels along **${scene.medium}**. You can change how long each wave is; the frequency changes to match.`,
      hints: [
        'Read the last number in the caption at the shortest and longest settings.',
        'Count the waves on screen at each setting — more waves means a higher frequency.',
        'Wavelength × frequency is the speed, and the medium sets the speed.',
      ],
      explanation: `Squeezing the waves shorter means more of them pass each second, and the two changes cancel exactly: wavelength × frequency = ${v} ${scene.unit} at every setting. The speed belongs to ${scene.medium}, not to the wave you send along it.`,
      transferBridge:
        'When two quantities multiply to a fixed total, one cannot change without the other compensating. Gears, pressure and volume, and pace against distance all behave this way.',
      parts: [
        part('Notice', {
          study: `The rope, the water or the bar never changes. Only the wave sent along it does.`,
          explore: {
            label: 'the length of each wave',
            stops,
            initial: 0,
            invitation:
              'Stretch the wave out and squeeze it up, reading the frequency and the speed in the caption each time.',
          },
          prompt: 'Shortening each wave raised its frequency. What happened to the speed?',
          answer: mcq(rng, `It never changed — ${v} ${scene.unit} at every setting`, [
            'It rose, because a higher frequency means the wave arrives faster',
            'It fell, because shorter waves carry less energy along',
            'It rose and then fell, peaking at the middle setting',
          ]),
          explanation: `Wavelength and frequency moved in exact opposition, so their product held at ${v} ${scene.unit}. Speed is set by what the wave is travelling THROUGH — its tension, depth or stiffness — and not by the wave itself. This is why light of every colour travels at the same speed in a vacuum despite wildly different frequencies.`,
        }),
        part('Predict', {
          prompt: `Sound travels through air at about 340 m/s. A note of **170 Hz** is played, then a note of **340 Hz**. How do their SPEEDS compare?`,
          answer: mcq(rng, 'The same — both travel at about 340 m/s, with different wavelengths', [
            'The 340 Hz note travels twice as fast',
            'The 170 Hz note travels twice as fast, since longer waves cover more ground',
            'It depends on how loud each note is played',
          ]),
          hints: [
            'What decides the speed of sound — the note, or the air?',
            'If the speed is fixed at 340 m/s, doubling the frequency must halve the wavelength.',
            'Worked path: both travel at **about 340 m/s**; only the wavelengths differ (2 m and 1 m).',
          ],
          explanation:
            'The same speed. Air sets it, not the note — which is why a whole orchestra reaches you in chord rather than arriving instrument by instrument. The 170 Hz note has a 2 m wavelength and the 340 Hz note a 1 m one. Loudness is a third, separate property (amplitude) and does not affect speed either.',
        }),
      ],
    }
  },
)

export const exploreCItems: ItemTemplate[] = [
  explorePercentSwing,
  exploreStopping,
  exploreSpread,
  exploreScatter,
  exploreVertex,
  explorePowers,
  explorePi,
  exploreWave,
]
