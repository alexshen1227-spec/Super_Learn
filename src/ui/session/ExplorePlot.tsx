/**
 * A diagram the learner drags before being asked anything.
 *
 * The pedagogy (RESEARCH.md §37c): manipulate, watch it respond, form the
 * intuition — then face a question that is only answerable if you noticed.
 * Everything else in this app is retrieval-first; nothing outside the puzzle
 * players was manipulable.
 *
 * Three deliberate choices:
 *
 *  - **A native `<input type="range">`.** Arrow keys, Home/End, page keys and
 *    touch dragging all come free and correct. A hand-built slider would have
 *    to re-earn every one of those, and the founding brief asks for a keyboard
 *    route to everything.
 *  - **`aria-valuetext` and a described plot.** A range that announces "3 of 7"
 *    tells a screen-reader user nothing. It announces "m = 2", and the figure
 *    carries the caption as its label, so the state is legible without seeing
 *    it. The caption describes the state and never the conclusion — that is
 *    the learner's job.
 *  - **Precomputed stops.** The generator hands over one finished picture per
 *    position, so there is no formula to evaluate at render time and the audit
 *    can check every frame that can ever appear.
 */
import { useMemo, useRef, useState } from 'react'
import type { ExploreSpec, PlotSpec } from '../../domain/types'
import { Button, Card } from '../components'

/** Viewbox units. Fixed so the SVG scales cleanly at any width. */
const W = 320
const H_FULL = 200
const PAD_L = 34
const PAD_B = 26
const PAD_T = 10
const PAD_R = 10

function Plot({ spec, label }: { spec: PlotSpec; label: string }) {
  // A plot with no vertical scale is a strip, not a square: keeping the full
  // height leaves a large empty band above the data that reads as missing
  // content rather than as breathing room.
  const H = spec.hideY ? 128 : H_FULL
  const sx = (x: number) => PAD_L + ((x - spec.xMin) / (spec.xMax - spec.xMin || 1)) * (W - PAD_L - PAD_R)
  const sy = (y: number) => H - PAD_B - ((y - spec.yMin) / (spec.yMax - spec.yMin || 1)) * (H - PAD_T - PAD_B)

  // Gridlines at whole-number-ish intervals, capped so they never turn to mush.
  const xStep = niceStep(spec.xMin, spec.xMax)
  const yStep = niceStep(spec.yMin, spec.yMax)
  const xTicks: number[] = []
  for (let v = Math.ceil(spec.xMin / xStep) * xStep; v <= spec.xMax + 1e-9; v += xStep) xTicks.push(round(v))
  const yTicks: number[] = []
  for (let v = Math.ceil(spec.yMin / yStep) * yStep; v <= spec.yMax + 1e-9; v += yStep) yTicks.push(round(v))

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label={label}
      preserveAspectRatio="xMidYMid meet"
    >
      {xTicks.map((v) => (
        <line key={`gx${v}`} x1={sx(v)} y1={PAD_T} x2={sx(v)} y2={H - PAD_B} className="stroke-line" strokeWidth={1} />
      ))}
      {(spec.hideY ? [] : yTicks).map((v) => (
        <line key={`gy${v}`} x1={PAD_L} y1={sy(v)} x2={W - PAD_R} y2={sy(v)} className="stroke-line" strokeWidth={1} />
      ))}

      {/* Axes drawn at zero when zero is in range, at the edge otherwise. */}
      <line
        x1={PAD_L}
        y1={sy(clamp(0, spec.yMin, spec.yMax))}
        x2={W - PAD_R}
        y2={sy(clamp(0, spec.yMin, spec.yMax))}
        className="stroke-line-strong"
        strokeWidth={1.5}
      />
      {spec.hideY ? null : (
        <line
          x1={sx(clamp(0, spec.xMin, spec.xMax))}
          y1={PAD_T}
          x2={sx(clamp(0, spec.xMin, spec.xMax))}
          y2={H - PAD_B}
          className="stroke-line-strong"
          strokeWidth={1.5}
        />
      )}

      {xTicks.map((v) => (
        <text key={`tx${v}`} x={sx(v)} y={H - PAD_B + 13} textAnchor="middle" className="fill-muted text-[9px]">
          {v}
        </text>
      ))}
      {(spec.hideY ? [] : yTicks).map((v) => (
        <text key={`ty${v}`} x={PAD_L - 5} y={sy(v) + 3} textAnchor="end" className="fill-muted text-[9px]">
          {v}
        </text>
      ))}

      {spec.rect ? (
        <>
          <rect
            x={sx(spec.rect.x)}
            y={sy(spec.rect.y + spec.rect.h)}
            width={Math.max(0, sx(spec.rect.x + spec.rect.w) - sx(spec.rect.x))}
            height={Math.max(0, sy(spec.rect.y) - sy(spec.rect.y + spec.rect.h))}
            className="fill-accent/25 stroke-accent"
            strokeWidth={1.5}
          />
          <text
            x={(sx(spec.rect.x) + sx(spec.rect.x + spec.rect.w)) / 2}
            y={(sy(spec.rect.y) + sy(spec.rect.y + spec.rect.h)) / 2 + 3}
            textAnchor="middle"
            className="fill-ink text-[10px] font-semibold"
          >
            {spec.rect.label}
          </text>
        </>
      ) : null}

      {(spec.dots ?? []).map((d, i) => (
        <circle
          key={`d${i}`}
          cx={sx(d.x)}
          cy={sy(d.y)}
          r={3.5}
          className={d.tone === 1 ? 'fill-warn' : 'fill-accent'}
          opacity={0.75}
        />
      ))}

      {spec.series.map((s, i) => (
        <polyline
          key={`${s.label}-${i}`}
          points={s.points.map(([x, y]) => `${sx(x)},${sy(clamp(y, spec.yMin, spec.yMax))}`).join(' ')}
          fill="none"
          className={s.tone === 1 ? 'stroke-warn' : 'stroke-accent'}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}

      {/* Markers last, so a mean line is never buried under the data. */}
      {(spec.marks ?? []).map((mk, i) => (
        <g key={`mk${i}`}>
          <line
            x1={sx(mk.x)}
            y1={PAD_T}
            x2={sx(mk.x)}
            y2={H - PAD_B}
            className={mk.tone === 1 ? 'stroke-warn' : 'stroke-accent'}
            strokeWidth={2}
            strokeDasharray="4 3"
          />
          {/*
            The label sits BESIDE its own line and points inward, rather than
            centred on it. Centred labels straddle their line and reach across
            a neighbouring marker, which is exactly what two markers a few
            units apart do to each other.
          */}
          <text
            x={sx(mk.x) > W / 2 ? sx(mk.x) - 4 : sx(mk.x) + 4}
            y={PAD_T + 9 + i * 11}
            textAnchor={sx(mk.x) > W / 2 ? 'end' : 'start'}
            className={`${mk.tone === 1 ? 'fill-warn' : 'fill-accent'} text-[9px] font-semibold`}
          >
            {mk.label}
          </text>
        </g>
      ))}

      {spec.xLabel ? (
        <text x={W - PAD_R} y={H - 4} textAnchor="end" className="fill-muted text-[9px]">
          {spec.xLabel}
        </text>
      ) : null}
      {spec.yLabel ? (
        <text x={2} y={PAD_T + 2} className="fill-muted text-[9px]">
          {spec.yLabel}
        </text>
      ) : null}
    </svg>
  )
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}
function round(v: number): number {
  return Math.round(v * 100) / 100
}
/** A gridline interval that yields roughly 4-8 lines and stays readable. */
function niceStep(min: number, max: number): number {
  const span = Math.abs(max - min) || 1
  const raw = span / 5
  const mag = 10 ** Math.floor(Math.log10(raw))
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (raw <= m * mag) return m * mag
  }
  return 10 * mag
}

export function ExplorePlot({
  spec,
  study,
  onDone,
}: {
  spec: ExploreSpec
  /** Optional text shown above the diagram. */
  study?: string
  onDone: () => void
}) {
  const stops = spec.stops.length ? spec.stops : null
  const safeInitial = clamp(Math.round(spec.initial) || 0, 0, spec.stops.length - 1)
  const [index, setIndex] = useState(safeInitial)
  // Which positions have actually been looked at. Not evidence, and never
  // recorded — it only decides how honestly the continue button is labelled.
  const visited = useRef(new Set<number>([safeInitial]))
  visited.current.add(index)
  const stop = stops ? (stops[index] ?? stops[0]) : null
  const explored = visited.current.size

  const describe = useMemo(
    () => (stop ? `${spec.label}: ${stop.value}. ${stop.caption}` : ''),
    [spec.label, stop],
  )

  // A spec with no stops cannot happen in the built-in bank (the content audit
  // rejects it) and cannot arrive from an imported pack, which has no parts at
  // all. Handled anyway rather than stranding a learner on a blank screen.
  if (!stop) {
    return (
      <Card className="p-4">
        <p className="text-[15px]">{study ?? 'Ready when you are.'}</p>
        <Button className="w-full mt-3" onClick={onDone}>
          Continue
        </Button>
      </Card>
    )
  }

  return (
    <Card className="p-4 border-accent/40">
      <p className="text-[12px] font-semibold text-accent uppercase tracking-wide">
        Try it before the question
      </p>
      {study ? <p className="text-[15px] mt-2">{study}</p> : null}
      <p className="text-[14px] text-muted mt-2">{spec.invitation}</p>

      <div className="mt-3 rounded-xl border border-line bg-surface2 p-2">
        <Plot spec={stop.plot} label={describe} />
      </div>

      <p className="text-[13px] text-muted mt-2 min-h-[2.5em]" aria-live="polite">
        <span className="font-mono font-semibold text-ink">{stop.value}</span> — {stop.caption}
      </p>

      <label className="block mt-2">
        <span className="text-[12px] text-muted font-medium">{spec.label}</span>
        <input
          type="range"
          min={0}
          max={spec.stops.length - 1}
          step={1}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          aria-label={`${spec.label} — drag or use the arrow keys`}
          aria-valuetext={stop.value}
          className="w-full mt-1 h-11 accent-accent cursor-pointer touch-manipulation"
        />
      </label>

      {/*
        No "3 of 6 seen" counter here on purpose. It was written, and it read
        as a completion meter — something to finish rather than something to
        notice, which is the machinery this app refuses. The slider thumb
        already shows the position and the arrows disable at the ends.
      */}
      <div className="flex items-center justify-between gap-2 mt-1">
        <button
          type="button"
          className="min-h-11 px-3 text-[13px] text-muted underline disabled:opacity-40 disabled:no-underline"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          aria-label={`Previous value of ${spec.label}`}
        >
          ◀ back
        </button>
        <button
          type="button"
          className="min-h-11 px-3 text-[13px] text-muted underline disabled:opacity-40 disabled:no-underline"
          onClick={() => setIndex((i) => Math.min(spec.stops.length - 1, i + 1))}
          disabled={index === spec.stops.length - 1}
          aria-label={`Next value of ${spec.label}`}
        >
          next ▶
        </button>
      </div>

      {/* Never blocked — naming what you are about to do is enough. */}
      <Button className="w-full mt-3" onClick={onDone}>
        {explored < 2 ? 'Skip the exploring — ask me anyway' : "I've seen what it does"}
      </Button>
    </Card>
  )
}
