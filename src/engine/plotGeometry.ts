/**
 * Where a diagram's data lands on screen.
 *
 * Shared deliberately between the renderer and the content audit. The audit
 * needs to check things that only exist in SCREEN space — whether two dots
 * overlap, whether a label runs off the frame — and re-deriving the projection
 * inside the test would let the two drift apart, so the check would slowly
 * stop describing the picture it is meant to be checking.
 *
 * This exists because of a defect the geometric checks could not see: a dot
 * plot passed every bounds assertion (seven dots, all finite, all inside the
 * box) while the rendered picture showed six, two values having landed on the
 * same point. Bounds are a fact about data; overlap is a fact about pixels.
 */
import type { PlotSpec } from '../domain/types'

export const PLOT_W = 320
export const PLOT_H_FULL = 200
/** A plot with no vertical scale is a strip, not a square. */
export const PLOT_H_FLAT = 128
export const PLOT_PAD = { l: 34, r: 10, t: 10, b: 26 }
/** Drawn radius of a dot, in viewBox units. */
export const DOT_R = 3.5
/** Rough advance width of the 9px label face, in viewBox units. */
export const LABEL_CHAR_W = 4.6

export interface PlotLayout {
  W: number
  H: number
  sx: (x: number) => number
  sy: (y: number) => number
}

export function plotLayout(spec: PlotSpec): PlotLayout {
  const W = PLOT_W
  const H = spec.hideY ? PLOT_H_FLAT : PLOT_H_FULL
  const innerW = W - PLOT_PAD.l - PLOT_PAD.r
  const innerH = H - PLOT_PAD.t - PLOT_PAD.b
  const xSpan = spec.xMax - spec.xMin || 1
  const ySpan = spec.yMax - spec.yMin || 1
  // One scale on both axes when the shape itself is the lesson: a square that
  // renders as a wide rectangle contradicts the item teaching about squares.
  const uniform = spec.aspectSquare ? Math.min(innerW / xSpan, innerH / ySpan) : null
  const kx = uniform ?? innerW / xSpan
  const ky = uniform ?? innerH / ySpan
  const originX = PLOT_PAD.l + (innerW - xSpan * kx) / 2
  const originY = H - PLOT_PAD.b - (innerH - ySpan * ky) / 2
  return {
    W,
    H,
    sx: (x: number) => originX + (x - spec.xMin) * kx,
    sy: (y: number) => originY - (y - spec.yMin) * ky,
  }
}

/**
 * Lay out a dot plot so every value stays countable.
 *
 * Values close enough to collide on screen — not merely EQUAL ones — are
 * stacked upward. Equality is the obvious case and not the common one: twelve
 * survey results at 46, 47, 48 are all distinct and all land inside one dot
 * width of each other on a 0-100 axis, so a stacker keyed on equality leaves
 * them a single blur.
 *
 * The x position is never moved. Binning the values sideways would make the
 * picture disagree with the numbers in the caption; stacking upward does not.
 */
export function stackDots(
  /** x axis only: without `aspectSquare` the horizontal scale is independent
   *  of the vertical one, which is what stops this from needing the height it
   *  is being used to compute. */
  values: number[],
  axis: { xMin: number; xMax: number; hideY?: boolean },
  toneOf?: (i: number) => 0 | 1,
): { x: number; y: number; tone?: 0 | 1 }[] {
  const { sx } = plotLayout({ ...axis, yMin: 0, yMax: 1, series: [] })
  const perUnit = Math.abs(sx(axis.xMin + 1) - sx(axis.xMin)) || 1
  const minGap = (2 * DOT_R) / perUnit
  // Tallest-first would bias the stack; ascending keeps rows readable.
  const order = values.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v)
  const rows: number[] = [] // right-most x already placed on each row
  const yOf = new Map<number, number>()
  for (const { v, i } of order) {
    let row = 0
    while (row < rows.length && v - rows[row] < minGap) row++
    rows[row] = v
    yOf.set(i, row)
  }
  return values.map((v, i) => ({
    x: v,
    y: Math.round((0.5 + (yOf.get(i) ?? 0) * 0.4) * 1000) / 1000,
    ...(toneOf ? { tone: toneOf(i) } : {}),
  }))
}

/** Height a stacked dot plot needs, given every set of values it will show. */
export function stackedHeight(sets: number[][], axis: { xMin: number; xMax: number; hideY?: boolean }): number {
  let tallest = 0
  for (const vals of sets) {
    for (const d of stackDots(vals, axis)) {
      const row = Math.round((d.y - 0.5) / 0.4)
      if (row > tallest) tallest = row
    }
  }
  return Math.round((0.5 + tallest * 0.4 + 0.5) * 1000) / 1000
}

/**
 * Pairs of dots drawn so close together that a reader cannot tell there are
 * two. Returned rather than thrown so the caller can report every collision at
 * once instead of the first.
 */
export function overlappingDots(spec: PlotSpec): { a: number; b: number; gap: number }[] {
  const dots = spec.dots ?? []
  const { sx, sy } = plotLayout(spec)
  const out: { a: number; b: number; gap: number }[] = []
  for (let i = 0; i < dots.length; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      const dx = sx(dots[i].x) - sx(dots[j].x)
      const dy = sy(dots[i].y) - sy(dots[j].y)
      const gap = Math.sqrt(dx * dx + dy * dy)
      // Touching is fine and normal in a dense dot plot; concentric is not.
      if (gap < DOT_R) out.push({ a: i, b: j, gap: Math.round(gap * 100) / 100 })
    }
  }
  return out
}

/** Marker labels whose drawn text would leave the frame. */
export function clippedMarks(spec: PlotSpec): { label: string; left: number; right: number }[] {
  const { sx, W } = plotLayout(spec)
  const out: { label: string; left: number; right: number }[] = []
  for (const mk of spec.marks ?? []) {
    const w = mk.label.length * LABEL_CHAR_W
    const anchorEnd = sx(mk.x) > W / 2
    const left = anchorEnd ? sx(mk.x) - 4 - w : sx(mk.x) + 4
    const right = left + w
    if (left < 1 || right > W - 1) {
      out.push({ label: mk.label, left: Math.round(left), right: Math.round(right) })
    }
  }
  return out
}
