/**
 * Manipulable diagrams: drag a control, watch a picture answer back, and only
 * then face the question.
 *
 * Every family here follows the same two-checkpoint shape:
 *
 *   1. **Notice** — a diagram with a slider, followed by a question that is
 *      only answerable if you watched what stayed fixed while everything else
 *      moved. Reading the caption is not enough; the caption describes one
 *      state and never the pattern.
 *   2. **Predict** — the same relationship at a value the slider could not
 *      reach. No diagram. This is the checkpoint that distinguishes "I saw it
 *      move" from "I know what it does", and it is why the exploration is
 *      worth session minutes at all.
 *
 * The exploration itself carries no evidence — it is a study phase, exactly
 * like a draft or a PFL probe. Both graded checkpoints do.
 *
 * Every plotted point is computed and clipped here, in the generator, so the
 * renderer never has to guess what an off-chart line should look like. A
 * polyline that got clamped instead of clipped would draw a bent line for a
 * straight function, which on a slope-teaching item would be a lie.
 */
import type { ExploreStop, ItemPart, ItemTemplate, PlotSeries } from '../../domain/types'
import { cycle, mcq, numeric, tpl } from '../lib'

function part(stage: string, body: Omit<ItemPart, 'stage'>): ItemPart {
  return { stage, ...body }
}

/** Round away binary dust so captions and axis labels stay exact. */
function r2(v: number): number {
  return Math.round(v * 1000) / 1000
}

/**
 * Clip one segment to the horizontal band [yMin, yMax] (Liang–Barsky on a
 * single axis). Returns null when the segment misses the band entirely —
 * including the case where both ends are outside on the SAME side, which an
 * endpoint-inside test gets wrong in the other direction: a segment running
 * from below the floor to above the ceiling is fully outside at both ends and
 * still crosses the whole visible band.
 */
function clipSegmentY(
  a: [number, number],
  b: [number, number],
  yMin: number,
  yMax: number,
): [[number, number], [number, number]] | null {
  let t0 = 0
  let t1 = 1
  const dy = b[1] - a[1]
  // Each constraint is p·t <= q.
  const accept = (p: number, q: number): boolean => {
    if (p === 0) return q >= 0
    const t = q / p
    if (p < 0) {
      if (t > t1) return false
      if (t > t0) t0 = t
    } else {
      if (t < t0) return false
      if (t < t1) t1 = t
    }
    return true
  }
  if (!accept(-dy, a[1] - yMin)) return null
  if (!accept(dy, yMax - a[1])) return null
  const at = (t: number): [number, number] => [r2(a[0] + t * (b[0] - a[0])), r2(a[1] + t * dy)]
  return [at(t0), at(t1)]
}

/**
 * Cut a polyline to the visible band and return each visible RUN separately.
 *
 * Runs rather than one list, because a curve that leaves the top and comes
 * back would otherwise be joined by a straight chord across the gap — a line
 * the function never contained. Each run becomes its own polyline.
 */
function clipRuns(points: [number, number][], yMin: number, yMax: number): [number, number][][] {
  const runs: [number, number][][] = []
  let cur: [number, number][] = []
  const same = (p: [number, number], q: [number, number]) => p[0] === q[0] && p[1] === q[1]
  for (let i = 0; i < points.length - 1; i++) {
    const seg = clipSegmentY(points[i], points[i + 1], yMin, yMax)
    if (!seg) {
      if (cur.length >= 2) runs.push(cur)
      cur = []
      continue
    }
    if (cur.length === 0) cur.push(seg[0])
    else if (!same(cur[cur.length - 1], seg[0])) {
      // The previous segment stopped somewhere else: that is a gap.
      if (cur.length >= 2) runs.push(cur)
      cur = [seg[0]]
    }
    if (!same(cur[cur.length - 1], seg[1])) cur.push(seg[1])
  }
  if (cur.length >= 2) runs.push(cur)
  return runs
}

/** One series per visible run of a curve. */
function curveSeries(
  points: [number, number][],
  yMin: number,
  yMax: number,
  label: string,
  tone: 0 | 1 = 0,
): PlotSeries[] {
  return clipRuns(points, yMin, yMax).map((run) => ({ points: run, label, tone }))
}

function lineSeries(
  m: number,
  b: number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  label: string,
  tone: 0 | 1 = 0,
): PlotSeries[] {
  return curveSeries([[xMin, m * xMin + b], [xMax, m * xMax + b]], yMin, yMax, label, tone)
}

/** A real minus sign, not a hyphen, for any number shown to a learner. */
function neg(n: number): string {
  return n < 0 ? `−${Math.abs(n)}` : `${n}`
}

/** The x term as a person would write it: `x`, `−x`, `3x` — never `1x`. */
function xTerm(m: number): string {
  if (m === 1) return 'x'
  if (m === -1) return '−x'
  return `${neg(m)}x`
}

/**
 * A linear equation in the notation a teacher would accept. Generated algebra
 * drifts into `y = -1x + 0` the moment the coefficients are interpolated raw,
 * and a learner who is being taught to read these is exactly the person who
 * should never see it.
 */
function linearExpr(m: number, b: number): string {
  if (m === 0) return `y = ${neg(b)}`
  if (b === 0) return `y = ${xTerm(m)}`
  return `y = ${xTerm(m)} ${b < 0 ? '−' : '+'} ${Math.abs(b)}`
}

// -------------------------------------------------- slope and intercept

/**
 * One control, one invariant. Tilting a line never moves where it crosses the
 * vertical axis; sliding it never changes its steepness. Both facts are
 * obvious once seen and routinely confused when only read.
 */
const exploreLine = tpl(
  {
    id: 'explore-line',
    name: 'Explore: what tilts a line, what slides it',
    skillIds: ['m-linfunc'],
    bucket: 'math',
    difficulty: 2,
    variants: 5,
    minutes: 4,
    kind: 'multi',
  },
  (rng, seed) => {
    // An explicit variant table rather than random draws: five declared
    // variants have to BE five, and `cycle` is how this bank guarantees that.
    const plan = cycle(seed, [
      { mode: 'slope', v: 1 },
      { mode: 'intercept', v: 1 },
      { mode: 'slope', v: 2 },
      { mode: 'intercept', v: 2 },
      { mode: 'slope', v: 3 },
    ] as const)
    const xMin = -4
    const xMax = 4
    const yMin = -8
    const yMax = 8

    if (plan.mode === 'slope') {
      const b = plan.v
      const slopes = [-2, -1, 0, 1, 2, 3]
      const stops: ExploreStop[] = slopes.map((m) => ({
        value: `m = ${neg(m)}`,
        caption:
          m === 0
            ? `${linearExpr(0, b)}. The line is flat: going right 1 changes y by 0.`
            : `${linearExpr(m, b)}. Going right 1 changes y by ${neg(m)} — ${m > 0 ? `up ${m}` : `down ${-m}`}.`,
        plot: {
          xMin,
          xMax,
          yMin,
          yMax,
          xLabel: 'x',
          yLabel: 'y',
          series: lineSeries(m, b, xMin, xMax, yMin, yMax, linearExpr(m, b)),
        },
      }))
      return {
        title: 'Tilting a line',
        prompt: `A straight line is written **y = mx + ${b}**. You can change **m**.`,
        hints: [
          'Move the slider to both ends before deciding anything.',
          'Ask what the line does at x = 0 specifically.',
          'The number in front of x sets the tilt; the number on its own sets the height at x = 0.',
        ],
        explanation: `In y = mx + b, m tilts the line and b sets where it crosses the vertical axis. Changing m pivots the line about (0, ${b}); changing b would slide it without turning it.`,
        transferBridge:
          'Any time a formula has a term multiplied by the input, that term vanishes when the input is zero — which is what makes the constant readable straight off the graph.',
        parts: [
          part('Notice', {
            study: `Every line below is y = mx + ${b}. Only m changes.`,
            explore: {
              label: 'the slope m',
              stops,
              initial: 3,
              invitation:
                'Drag it from one end to the other, then back. Watch for the one thing that never moves.',
            },
            prompt: 'Across every value of m you tried, one feature of the line stayed exactly where it was. Which?',
            answer: mcq(rng, `The point where it crosses the vertical axis, at y = ${b}`, [
              'The point where it crosses the horizontal axis',
              'The steepness, which stayed the same while the line slid up and down',
              'Nothing stayed fixed — changing m moves the whole line',
            ]),
            explanation: `At x = 0 the term mx is 0 whatever m is, so y = ${b} every time. The line pivots about **(0, ${b})** like a hand on a clock. Its crossing of the HORIZONTAL axis does move — that is x = −${b}/m, which changes with m and does not exist at all when m = 0.`,
          }),
          part('Predict', {
            prompt: `The slider stopped at m = 3. If **m = 10**, at what value of y does the line **y = 10x + ${b}** cross the vertical axis?`,
            answer: numeric(b),
            hints: [
              'Crossing the vertical axis means x = 0. Put 0 in for x.',
              `10 × 0 = 0, so all that is left is + ${b}.`,
              `Worked path: y = 10(0) + ${b} = **${b}**.`,
            ],
            explanation: `**${b}**. The pivot does not care how steep the line is; m = 10 or m = 1000 crosses at the same place. In y = mx + b, m is the tilt and b is the height of the pivot.`,
          }),
        ],
      }
    }

    const m = plan.v
    const intercepts = [-3, -2, -1, 0, 1, 2, 3]
    const stops: ExploreStop[] = intercepts.map((b) => ({
      value: `b = ${neg(b)}`,
      caption: `${linearExpr(m, b)}. At x = 0 the line is at y = ${neg(b)}.`,
      plot: {
        xMin,
        xMax,
        yMin,
        yMax,
        xLabel: 'x',
        yLabel: 'y',
        series: lineSeries(m, b, xMin, xMax, yMin, yMax, linearExpr(m, b)),
      },
    }))
    return {
      title: 'Sliding a line',
      prompt: `A straight line is written **y = ${xTerm(m)} + b**. You can change **b**.`,
      hints: [
        'Move the slider to both ends before deciding anything.',
        'Pick two points one step apart and see how much y climbs between them.',
        'A constant added to every output shifts the graph; it cannot bend it.',
      ],
      explanation: `In y = mx + b, b slides the line up and down and never changes its steepness. Every version here is parallel to every other, because they all share the ${m} in front of x.`,
      transferBridge:
        'Same idea outside graphs: a fixed joining fee changes what a plan costs, never how fast the cost grows per month.',
      parts: [
        part('Notice', {
          study: `Every line below is y = ${xTerm(m)} + b. Only b changes.`,
          explore: {
            label: 'the constant b',
            stops,
            initial: 3,
            invitation: 'Drag it from end to end. Watch what changes and what refuses to.',
          },
          prompt: 'Across every value of b you tried, one feature of the line never changed. Which?',
          answer: mcq(rng, `Its steepness — going right 1 always changed y by ${m}`, [
            'The point where it crosses the vertical axis',
            'The point where it crosses the horizontal axis',
            'Its direction reversed once b passed zero',
          ]),
          explanation: `Changing b lifts or drops the whole line without turning it: every version is parallel to every other. The steepness is set by the number multiplying x — here ${m} — and b never touches it. Both crossings DO move — passing through zero is not special, it is just the moment the line happens to go through the origin.`,
        }),
        part('Predict', {
          prompt: `The slider stopped at b = 3. For the line **y = ${xTerm(m)} + 40**, if x increases by 1, by how much does y increase?`,
          answer: numeric(m),
          hints: [
            'The + 40 is the same amount at every x, so it cancels out of a change.',
            `Compare y at x and at x + 1: the difference is the number multiplying x.`,
            `Worked path: the increase is **${m}**.`,
          ],
          explanation: `**${m}**. A constant added to every output shifts the graph but cannot bend it. This is why parallel lines have the same number in front of x, and why "+ 40" tells you nothing about steepness.`,
        }),
      ],
    }
  },
)

// ------------------------------------------------------- scaling and area

/**
 * The single most durable geometry misconception: that doubling the sides
 * doubles the area. Reading that it does not is famously ineffective; watching
 * a rectangle grow against a fixed grid is a different experience, which is
 * the whole argument for this mechanic.
 */
const exploreAreaScale = tpl(
  {
    id: 'explore-area-scale',
    name: 'Explore: scaling sides versus scaling area',
    skillIds: ['m-scale'],
    bucket: 'math',
    difficulty: 2,
    variants: 4,
    minutes: 4,
    kind: 'multi',
  },
  (rng, seed) => {
    const w = cycle(seed, [2, 3, 2, 3])
    const h = cycle(seed, [3, 4, 4, 3])
    const base = w * h
    const factors = [1, 1.5, 2, 2.5, 3]
    // Axes fixed across every stop. If the grid rescaled with the rectangle,
    // the rectangle would appear not to grow at all.
    const xMax = w * 3 + 1
    const yMax = h * 3 + 1
    const stops: ExploreStop[] = factors.map((k) => {
      const sw = r2(w * k)
      const sh = r2(h * k)
      const area = r2(sw * sh)
      return {
        value: `k = ${k}`,
        caption: `Sides ${sw} by ${sh}. Area ${area} squares.`,
        plot: {
          xMin: 0,
          xMax,
          yMin: 0,
          yMax,
          aspectSquare: true,
          xLabel: 'width',
          yLabel: 'height',
          series: [],
          rect: { x: 0, y: 0, w: sw, h: sh, label: `${area}` },
        },
      }
    })
    return {
      title: 'Growing a rectangle',
      prompt: `A rectangle starts **${w} by ${h}**. A scale factor **k** multiplies BOTH sides.`,
      hints: [
        'Read the area off two different stops and divide one by the other.',
        'Write the new area as (k × width) × (k × height) before simplifying.',
        'Both factors of k survive the multiplication, so the area ratio is k × k.',
      ],
      explanation: `Scaling every side by k multiplies the area by k², because area is a product of two lengths and both of them grew. Sides scale by k, areas by k², volumes by k³.`,
      transferBridge:
        'Sides scale by k, areas by k², volumes by k³. A pizza with double the diameter is four times the pizza, not two.',
      parts: [
        part('Notice', {
          study: `The grid stays the same size the whole time. Only the rectangle grows.`,
          explore: {
            label: 'the scale factor k',
            stops,
            initial: 0,
            invitation:
              'Step it up one notch at a time and read the area each time. Compare k = 1 with k = 2, then with k = 3.',
          },
          prompt: `You multiplied both sides by 3. The area went from ${base} to ${base * 9}. That is how many times bigger?`,
          answer: mcq(rng, '9 times — the area grows by the factor multiplied by itself', [
            '3 times — the area grows by the same factor as the sides',
            '6 times — the two sides tripled, so 3 + 3',
            '27 times — the factor applies to each of the three dimensions',
          ]),
          explanation: `Both sides grew by 3, and area is width × height, so the area grew by 3 × 3 = **9**. Adding the factors (3 + 3 = 6) treats area as if it were a perimeter; cubing it (27) is the rule for VOLUME, where three lengths multiply instead of two.`,
        }),
        part('Predict', {
          prompt: `The slider stopped at k = 3. If every side is multiplied by **10**, the area becomes how many times the original?`,
          answer: numeric(100),
          hints: [
            'Write the new area as (10 × width) × (10 × height).',
            'Pull the two 10s out to the front and multiply them together.',
            'Worked path: 10 × 10 = **100** times.',
          ],
          explanation: `**100**. (10w) × (10h) = 100 × (w × h). The rule is area ratio = k², always — a map at 1:10 scale hides a hundredfold difference in ground area, which is why scaled-up ingredient costs and paint quantities surprise people.`,
        }),
      ],
    }
  },
)

// ------------------------------------------------- exponential vs linear

/**
 * Whether an exponential eventually overtakes a line is not a matter of the
 * rate being large enough — it always does, and the rate only sets when. The
 * slider makes the "when" move while the "whether" refuses to.
 */
const exploreGrowth = tpl(
  {
    id: 'explore-growth',
    name: 'Explore: steady growth versus compounding',
    skillIds: ['m-exponential'],
    bucket: 'math',
    difficulty: 3,
    variants: 4,
    minutes: 4.5,
    kind: 'multi',
  },
  (rng, seed) => {
    const step = cycle(seed, [10, 12, 15, 8])
    const start = 10
    const nMax = 12
    const yMax = start + step * nMax
    const rates = [1.05, 1.1, 1.2, 1.35, 1.5]

    /** First whole step at which compounding is strictly ahead, or null. */
    const crossAt = (rate: number): number | null => {
      for (let n = 0; n <= nMax; n++) {
        if (start * rate ** n > start + step * n) return n
      }
      return null
    }

    const linear: PlotSeries = {
      points: [[0, start], [nMax, start + step * nMax]],
      label: `steady: +${step} each step`,
      tone: 1,
    }

    const stops: ExploreStop[] = rates.map((rate) => {
      const pts: [number, number][] = []
      for (let n = 0; n <= nMax; n += 0.25) pts.push([r2(n), r2(start * rate ** n)])
      const at12 = Math.round(start * rate ** nMax)
      const cross = crossAt(rate)
      return {
        value: `×${rate} per step`,
        caption:
          `After ${nMax} steps: steady reaches ${start + step * nMax}, compounding reaches ${at12}.` +
          (cross === null ? ' Still behind inside this window.' : ` It passes the steady line at step ${cross}.`),
        plot: {
          xMin: 0,
          xMax: nMax,
          yMin: 0,
          yMax,
          xLabel: 'steps',
          yLabel: 'amount',
          series: [linear, ...curveSeries(pts, 0, yMax, `compounding ×${rate}`, 0)],
        },
      }
    })

    // Computed, not asserted: the smallest offered rate that has not overtaken
    // the line by the end of the window. Every rate here is chosen so one exists.
    const laggard = rates.find((rt) => crossAt(rt) === null) ?? rates[0]

    return {
      title: 'Steady versus compounding',
      prompt: `Two amounts both start at **${start}**. One gains **+${step} every step**. The other is **multiplied** by a fixed rate every step.`,
      hints: [
        'Compare the two amounts at the far right of the chart, not at the start.',
        'Ask what each one ADDS in a single late step, rather than what it totals.',
        'A fixed addition stays fixed; a percentage of a growing amount grows with it.',
      ],
      explanation: `Repeated multiplying overtakes repeated adding for any rate above 1 — the rate only decides when, never whether. A slow rate pushes the crossing off the edge of the chart, which looks like "never" and is not.`,
      transferBridge:
        'Compare RATES against RATES, not a percentage against an absolute amount. "1% a year" and "+5 a year" are not comparable until you know the size of the thing being grown.',
      parts: [
        part('Notice', {
          study: `The straight line never changes. Only the growth rate of the curve does.`,
          explore: {
            label: 'the growth rate',
            stops,
            initial: 0,
            // "Whether", not "where": at the fastest rate the arithmetic
            // crossing happens while the two are still a fraction of a pixel
            // apart, so asking the learner to read the crossing POINT off the
            // picture would be asking for something the picture cannot show.
            // Whether it catches up at all is both visible and the actual
            // question.
            invitation:
              'Start at the slowest rate and work up. Watch whether the curve ever catches the straight line — and how that answer changes as the rate grows.',
          },
          prompt: 'At the slowest rates, the curve spends most of the window BELOW the straight line. What does that tell you about which one wins in the long run?',
          answer: mcq(
            rng,
            'Nothing — a slow rate only delays the crossing, it does not prevent it',
            [
              'The steady gain wins permanently whenever the rate is small enough',
              'They stay level forever once the curve falls behind early',
              'Whichever is ahead at the halfway point stays ahead',
            ],
          ),
          explanation: `Multiplying repeatedly beats adding repeatedly eventually, for ANY rate above 1 — the window just has to be long enough. At ×${laggard} the crossing happens after step ${nMax}, off the right-hand edge of this chart, which looks exactly like "never" and is not. Being behind at the halfway point is the normal state of a compounding quantity.`,
        }),
        part('Predict', {
          prompt: `A quantity of 100 grows by **1% per year** (×1.01). Another starts at 100 and gains **+5 per year**. Does the compounding one ever overtake the steady one?`,
          answer: mcq(rng, 'Yes, eventually — though it takes well over a century', [
            'No — 1% is smaller than 5 per year, so it never catches up',
            'No — they both grow forever, so neither can overtake',
            'Only if the starting amount is increased',
          ]),
          hints: [
            'The steady one adds the SAME 5 every year forever. What does the other one add in year 200?',
            'Once the compounding amount passes 500, its 1% is already more than 5 per year — and it keeps rising.',
            'Worked path: any rate above 1 overtakes any straight line eventually. **Yes.**',
          ],
          explanation:
            // Two distinct moments, and conflating them is the easy mistake:
            // the compounding quantity out-GAINS the steady one at year ~162
            // (1% of 500 = 5) while still far behind it, and only draws level
            // at year ~269. Both figures computed, not estimated.
            'Yes. The steady quantity adds a fixed 5 each year however large it gets; the compounding one adds 1% of a number that keeps growing. Around year 162 it reaches 500, where 1% is exactly 5 — from then on it gains more each year than the steady one and starts closing a gap it is still deep inside (501 against 910). It draws level near year 269, and after that the lead grows without limit. A rate that looks negligible beside a fixed amount is a claim about the near term only, which is the reasoning error behind underestimating both compound interest and slow epidemics.',
        }),
      ],
    }
  },
)

export const exploreItems: ItemTemplate[] = [exploreLine, exploreAreaScale, exploreGrowth]
