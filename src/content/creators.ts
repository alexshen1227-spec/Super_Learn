/**
 * Challenge Creator — the learner writes the problem instead of solving one.
 *
 * Inspired by Desmos Activity Builder's Challenge Creator (RESEARCH.md §37c),
 * with support from the invention literature: attempting to CONSTRUCT a case
 * before being told the rule prepares you to learn the rule (Schwartz &
 * Martin, §29c). What that literature does not license is treating the
 * construction as proof of anything, so nothing here moves a rung.
 *
 * The hard problem with learner-authored content is quality, and this app has
 * no server and no model to judge it with. The answer is CONSTRAINED
 * authoring: the learner picks the numbers, and the shape knows how to
 * compute its own answer and how to recognise its own degenerate cases. That
 * makes three things possible with plain code —
 *
 *  - the answer is computed, never typed, exactly as `contentAudit` demands of
 *    every other item in this bank;
 *  - `flaw()` can say WHY a combination makes a pointless problem, which is
 *    the part a learner actually learns from; and
 *  - every shape carries a PREDICTION whose most tempting answer is wrong,
 *    so building one is not merely arranging numbers.
 *
 * The prediction is the point. Each shape hides a trap that survives being
 * told — averaging two speeds, doubling a bill that has a fixed fee in it —
 * and the learner meets it in a problem they built themselves, which is
 * harder to dismiss than meeting it in one handed to them.
 */

export interface CreatorSlot {
  key: string
  label: string
  min: number
  max: number
  step: number
  /** Shown after the number, e.g. "%" or " km". */
  suffix?: string
}

export interface CreatorPrediction {
  question: string
  options: string[]
  correct: number
  /** Why the tempting answer is tempting, shown after the reveal. */
  why: string
}

export interface CreatorShape {
  id: string
  name: string
  blurb: string
  skillId: string
  slots: CreatorSlot[]
  /**
   * Why these values make a POINTLESS problem — one that asks nothing. Blocks.
   * Kept narrow on purpose: an early version also blocked awkward-but-valid
   * combinations and ended up refusing 72% of the ratio shape's own space,
   * which reads as a broken feature rather than as a standard.
   */
  flaw: (s: Record<string, number>) => string | null
  /**
   * Why these values make an UGLY problem — one that works and reads badly.
   * Advises, never blocks. "Your answer will come out as pennies" is worth
   * saying and is not worth stopping someone over.
   */
  note?: (s: Record<string, number>) => string | null
  render: (s: Record<string, number>) => string
  solve: (s: Record<string, number>) => number
  unit: string
  answerLabel: string
  predict: (s: Record<string, number>) => CreatorPrediction
}

function round2(v: number): number {
  return Math.round(v * 100) / 100
}

/** Markup then discount: the same percent both ways does not come back. */
const priceSwing: CreatorShape = {
  id: 'price-swing',
  name: 'A price that goes up, then down',
  blurb: 'Set a starting price, a rise, and a fall. The trap is what happens when they are equal.',
  skillId: 'm-percent',
  slots: [
    { key: 'start', label: 'Starting price', min: 10, max: 500, step: 5, suffix: ' £' },
    { key: 'up', label: 'Then it rises by', min: 5, max: 60, step: 5, suffix: '%' },
    { key: 'down', label: 'Then it falls by', min: 5, max: 60, step: 5, suffix: '%' },
  ],
  flaw: () => null,
  render: (s) =>
    `A jacket costs £${s.start}. The shop raises the price by ${s.up}%, then later takes ${s.down}% off the new price. What does it cost now?`,
  solve: (s) => round2(s.start * (1 + s.up / 100) * (1 - s.down / 100)),
  unit: '£',
  answerLabel: 'Final price',
  predict: (s) => {
    const final = s.start * (1 + s.up / 100) * (1 - s.down / 100)
    const options = [
      'Higher than it started',
      'Lower than it started',
      'Exactly back to the starting price',
    ]
    const correct = final > s.start + 1e-9 ? 0 : final < s.start - 1e-9 ? 1 : 2
    return {
      question: `Before working it out: after rising ${s.up}% and then falling ${s.down}%, where does the price end up?`,
      options,
      correct,
      why:
        s.up === s.down
          ? 'Equal percentages feel like they should cancel, and they never do. The rise is a percentage of the ORIGINAL price and the fall is a percentage of the larger one, so the fall is worth more in pounds and the price always finishes lower.'
          : 'A percentage is always a percentage OF something, and the something changed in between. Comparing the two percentages directly ignores that the second one acts on a different amount.',
    }
  },
}

/** Two legs at different speeds: the average speed is not the average of the speeds. */
const twoLegJourney: CreatorShape = {
  id: 'two-leg-journey',
  name: 'A journey with two different speeds',
  blurb: 'Set two legs of a trip. The trap is what the average speed for the whole thing turns out to be.',
  skillId: 'm-ratio',
  slots: [
    { key: 'd1', label: 'First leg distance', min: 10, max: 200, step: 10, suffix: ' km' },
    { key: 'v1', label: 'First leg speed', min: 20, max: 120, step: 10, suffix: ' km/h' },
    { key: 'd2', label: 'Second leg distance', min: 10, max: 200, step: 10, suffix: ' km' },
    { key: 'v2', label: 'Second leg speed', min: 20, max: 120, step: 10, suffix: ' km/h' },
  ],
  flaw: (s) =>
    s.v1 === s.v2
      ? 'Both legs are at the same speed, so the average speed is just that speed and there is nothing to notice. Make the two speeds different.'
      : null,
  render: (s) =>
    `A car drives ${s.d1} km at ${s.v1} km/h, then ${s.d2} km at ${s.v2} km/h. What is its average speed for the whole journey?`,
  solve: (s) => round2((s.d1 + s.d2) / (s.d1 / s.v1 + s.d2 / s.v2)),
  unit: ' km/h',
  answerLabel: 'Average speed',
  predict: (s) => {
    const mean = (s.v1 + s.v2) / 2
    const real = (s.d1 + s.d2) / (s.d1 / s.v1 + s.d2 / s.v2)
    const options = [
      `Exactly halfway between them, at ${round2(mean)} km/h`,
      `Below halfway — closer to the slower speed`,
      `Above halfway — closer to the faster speed`,
    ]
    const correct = Math.abs(real - mean) < 1e-9 ? 0 : real < mean ? 1 : 2
    return {
      question: `Before working it out: your two speeds are ${s.v1} and ${s.v2} km/h. Where will the average speed for the whole journey land?`,
      options,
      correct,
      why:
        'Averaging the two speeds treats them as if they lasted equally long, and they do not — you spend MORE TIME on the slow leg, so it gets more weight. Averaging works over time, not over distance, which is why equal distances at different speeds always average below the halfway point.',
    }
  },
}

/** A bill with a fixed fee: doubling the months does not double the bill. */
const feePlusRate: CreatorShape = {
  id: 'fee-plus-rate',
  name: 'A bill with a joining fee',
  blurb: 'Set a one-off fee and a monthly cost. The trap is what happens when you double the months.',
  skillId: 'm-linfunc',
  slots: [
    { key: 'fee', label: 'One-off joining fee', min: 0, max: 100, step: 5, suffix: ' £' },
    { key: 'rate', label: 'Cost each month', min: 5, max: 60, step: 5, suffix: ' £' },
    { key: 'months', label: 'Number of months', min: 2, max: 24, step: 1 },
  ],
  flaw: (s) =>
    s.fee === 0
      ? 'With no joining fee this is just repeated multiplication, and doubling the months really does double the bill. Add a fee to make the question worth asking.'
      : null,
  render: (s) =>
    `A gym charges a one-off £${s.fee} joining fee and then £${s.rate} a month. What is the total cost after ${s.months} months?`,
  solve: (s) => round2(s.fee + s.rate * s.months),
  unit: '£',
  answerLabel: 'Total cost',
  predict: (s) => {
    const single = s.fee + s.rate * s.months
    const doubled = s.fee + s.rate * s.months * 2
    const options = [
      'Exactly double the first total',
      'Less than double, because the fee is only paid once',
      'More than double, because costs build up over time',
    ]
    const correct = Math.abs(doubled - 2 * single) < 1e-9 ? 0 : doubled < 2 * single ? 1 : 2
    return {
      question: `Before working it out: if you stayed for ${s.months * 2} months instead of ${s.months}, what would the total be?`,
      options,
      correct,
      why: `The fee is paid once whatever happens, so only the monthly part doubles. £${round2(single)} becomes £${round2(doubled)}, which is less than £${round2(single * 2)}. This is exactly why a cost with a fixed part is not proportional, and why its graph does not go through the origin.`,
    }
  },
}

/** Sharing in a ratio: the shares are not the ratio numbers. */
const shareInRatio: CreatorShape = {
  id: 'share-in-ratio',
  name: 'Sharing an amount in a ratio',
  blurb: 'Set an amount and how it splits. The trap is what the ratio numbers actually mean.',
  skillId: 'm-ratio',
  slots: [
    { key: 'total', label: 'Amount to share', min: 20, max: 600, step: 10, suffix: ' £' },
    { key: 'a', label: 'First share', min: 1, max: 9, step: 1, suffix: ' parts' },
    { key: 'b', label: 'Second share', min: 1, max: 9, step: 1, suffix: ' parts' },
  ],
  flaw: (s) =>
    s.a === s.b
      ? 'Equal parts make this a simple halving, with nothing a ratio adds. Make the two shares different.'
      : null,
  note: (s) =>
    s.total % (s.a + s.b) !== 0
      ? `£${s.total} does not split evenly into ${s.a + s.b} parts, so the answer lands on pennies. That is a real answer — a multiple of ${s.a + s.b} just reads more cleanly.`
      : null,
  render: (s) =>
    `£${s.total} is shared between two people in the ratio ${s.a} : ${s.b}. How much does the person with the ${s.a > s.b ? 'larger' : 'smaller'} share get?`,
  solve: (s) => round2((s.total * s.a) / (s.a + s.b)),
  unit: '£',
  answerLabel: `First person's share`,
  predict: (s) => {
    const parts = s.a + s.b
    const options = [
      `${parts} parts, so I divide by ${parts} first`,
      `${Math.max(s.a, s.b)} parts, since that is the bigger number in the ratio`,
      `2 parts, because it is shared between 2 people`,
    ]
    return {
      question: `Before working it out: how many equal parts is the £${s.total} being cut into?`,
      options,
      correct: 0,
      why: `A ratio ${s.a} : ${s.b} means ${s.a} parts to ${s.b} parts — ${parts} parts in total, each worth £${round2(s.total / parts)}. Dividing by 2 because there are two people is the classic slip: the number of PEOPLE and the number of PARTS are different, and only the parts are equal.`,
    }
  },
}

export const CREATOR_SHAPES: CreatorShape[] = [priceSwing, twoLegJourney, feePlusRate, shareInRatio]

export const CREATOR_BY_ID = new Map(CREATOR_SHAPES.map((c) => [c.id, c]))

/** Slot values a shape opens with — mid-range, and deliberately not flawed. */
export function defaultSlots(shape: CreatorShape): Record<string, number> {
  const s: Record<string, number> = {}
  for (const slot of shape.slots) {
    const mid = slot.min + Math.round((slot.max - slot.min) / 2 / slot.step) * slot.step
    s[slot.key] = mid
  }
  // Nudge off any degenerate starting point so the first thing a learner sees
  // is a working problem rather than a complaint.
  for (let i = 0; i < 24 && shape.flaw(s); i++) {
    const slot = shape.slots[i % shape.slots.length]
    const next = s[slot.key] + slot.step
    s[slot.key] = next > slot.max ? slot.min : next
  }
  return s
}
