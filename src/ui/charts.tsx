/** Small dependency-free SVG charts, each paired with a text summary for screen readers. */

export function BarPair({
  rows,
  aLabel,
  bLabel,
}: {
  rows: { name: string; a: number; b: number }[]
  aLabel: string
  bLabel: string
}) {
  const max = Math.max(0.0001, ...rows.flatMap((r) => [r.a, r.b]))
  return (
    <div>
      <div className="flex gap-4 text-xs text-muted mb-2 px-1">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-accent inline-block" /> {aLabel}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-surface3 border border-line-strong inline-block" /> {bLabel}
        </span>
      </div>
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.name}>
            <div className="flex justify-between text-[12px] mb-1">
              <span className="text-ink font-medium">{r.name}</span>
              <span className="text-muted font-mono">
                {Math.round(r.a)}% <span className="opacity-60">/ {Math.round(r.b)}%</span>
              </span>
            </div>
            <div className="h-2 rounded bg-surface2 relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-surface3 border-r border-line-strong rounded" style={{ width: `${(r.b / max) * 100}%` }} />
              <div className="absolute inset-y-0 left-0 bg-accent rounded" style={{ width: `${(r.a / max) * 100}%`, opacity: 0.85 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Calibration: stated confidence band vs actual accuracy. */
export function CalibrationChart({
  bands,
}: {
  bands: { label: string; accuracy: number | null; meanConfidence: number | null; n: number }[]
}) {
  const usable = bands.filter((b) => b.accuracy !== null)
  return (
    <div>
      <div className="space-y-2.5">
        {bands.map((b) => (
          <div key={b.label}>
            <div className="flex justify-between text-[12px] mb-1">
              <span className="font-mono text-muted">{b.label}</span>
              <span className="text-muted">
                {b.accuracy === null ? (
                  <span className="italic">not enough data ({b.n})</span>
                ) : (
                  <>
                    <span className="text-ink font-medium">{Math.round(b.accuracy * 100)}% right</span> · {b.n} items
                  </>
                )}
              </span>
            </div>
            <div className="h-2 rounded bg-surface2 relative overflow-hidden">
              {b.meanConfidence !== null ? (
                <div
                  className="absolute inset-y-0 w-0.5 bg-warn"
                  style={{ left: `${b.meanConfidence * 100}%` }}
                  title="stated confidence"
                />
              ) : null}
              {b.accuracy !== null ? <div className="absolute inset-y-0 left-0 bg-good rounded" style={{ width: `${b.accuracy * 100}%`, opacity: 0.8 }} /> : null}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[12px] text-muted mt-2 leading-snug">
        Green bar = actual accuracy in that confidence band; amber tick = average stated confidence.{' '}
        {usable.length === 0 ? 'Rate a few more answers to see your calibration.' : 'Perfect calibration puts the tick at the end of the bar.'}
      </p>
    </div>
  )
}

/** Weekly trend as simple columns with a text summary. */
export function TrendColumns({ points, unit, summary }: { points: { label: string; value: number }[]; unit: string; summary: string }) {
  const max = Math.max(0.0001, ...points.map((p) => p.value))
  return (
    <div>
      <div className="flex items-end gap-2 h-24 px-1" role="img" aria-label={summary}>
        {points.map((p) => (
          <div key={p.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <span className="text-[10px] font-mono text-muted">{Math.round(p.value)}</span>
            <div className="w-full max-w-9 rounded-t bg-accent/80" style={{ height: `${Math.max(3, (p.value / max) * 72)}px` }} />
            <span className="text-[10px] text-faint truncate w-full text-center">{p.label}</span>
          </div>
        ))}
      </div>
      <p className="text-[12px] text-muted mt-1.5 px-1">
        {summary} ({unit})
      </p>
    </div>
  )
}
