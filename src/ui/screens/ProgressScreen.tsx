/**
 * Progress: evidence-grade analytics. Distinguishes independent / retained /
 * transferred, shows calibration honestly, and never displays a single
 * global "intelligence" number — because no such number is measured.
 */
import { useMemo } from 'react'
import { useEvidence, useStore } from '../../store/store'
import { buildContentIndex } from '../../content/registry'
import { effectiveAllocation } from '../../engine/allocationPlus'
import { brierScore, calibrationBands, calibrationGap, highConfidenceErrors } from '../../engine/calibration'
import { reviewBurden } from '../../engine/scheduler'
import { findBottleneck } from '../../engine/coach'
import { stateRank } from '../../engine/mastery'
import { ERROR_TAGS, BUCKETS } from '../../domain/types'
import { Button, Card, Chip, EmptyState, HeaderBar, SectionTitle } from '../components'
import { BarPair, CalibrationChart, TrendColumns } from '../charts'
import { WeekReviewModal } from '../WeekReview'
import { useState } from 'react'
import { learningQualityReport, outcomeReport } from '../../engine/outcomes'

const DAY = 86_400_000

function compactMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

export function ProgressScreen() {
  const { state } = useStore()
  const evidence = useEvidence()
  const index = useMemo(() => buildContentIndex(state.customPacks), [state.customPacks])
  const now = Date.now()
  const events = useMemo(() => state.events.filter((e) => e.mode !== 'placement'), [state.events])

  const stateCounts = useMemo(() => {
    const counts = { independent: 0, retained: 0, transferred: 0, guided: 0, needsReview: 0 }
    for (const ev of evidence.values()) {
      if (ev.state === 'transferred') counts.transferred++
      else if (ev.state === 'retained') counts.retained++
      else if (stateRank(ev.state) >= 3) counts.independent++
      else if (ev.state === 'guided') counts.guided++
      if (ev.needsReview) counts.needsReview++
    }
    return counts
  }, [evidence])

  const weekly = useMemo(() => {
    const weeks: { label: string; independent: number; hinted: number; minutes: number }[] = []
    for (let w = 3; w >= 0; w--) {
      const start = now - (w + 1) * 7 * DAY
      const end = now - w * 7 * DAY
      const inWeek = events.filter((e) => e.t >= start && e.t < end)
      const graded = inWeek.filter((e) => e.firstCorrect !== null)
      weeks.push({
        label: w === 0 ? 'this wk' : `${w} wk ago`,
        independent: graded.length ? Math.round((graded.filter((e) => e.firstCorrect && e.hintLevel === 0).length / graded.length) * 100) : 0,
        hinted: inWeek.length ? Math.round((inWeek.filter((e) => e.hintLevel > 0).length / inWeek.length) * 100) : 0,
        minutes: Math.round(inWeek.reduce((a, e) => a + e.elapsedSec, 0) / 60),
      })
    }
    return weeks
  }, [events, now])

  const bands = useMemo(() => calibrationBands(events), [events])
  const gap = useMemo(() => calibrationGap(events.filter((e) => e.t > now - 28 * DAY)), [events, now])
  const hce = useMemo(() => highConfidenceErrors(events).filter((e) => e.t > now - 28 * DAY), [events, now])
  const alloc = useMemo(() => effectiveAllocation(state, evidence, index, now), [state, evidence, index, now])
  const report = alloc.report
  const burden = useMemo(() => reviewBurden(evidence, now, 7), [evidence, now])
  const bottleneck = useMemo(() => findBottleneck(index, evidence, state), [index, evidence, state])
  const brier = brierScore(state.forecasts)
  const outcome = useMemo(() => outcomeReport(state, now), [state, now])
  const quality = useMemo(() => learningQualityReport(events, now), [events, now])

  const errorPattern = useMemo(() => {
    const cutoff = now - 28 * DAY
    const counts = new Map<string, number>()
    for (const e of events) {
      if (e.t < cutoff) continue
      for (const t of e.errorTags) counts.set(t, (counts.get(t) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [events, now])

  if (events.length === 0) {
    return (
      <div>
        <HeaderBar title="Progress" subtitle="Evidence, not scores" />
        <Card className="mt-4">
          <EmptyState
            icon="◔"
            title="Nothing measured yet"
            body="Progress here is built from real attempts — independent solves, delayed retention, transfer. It starts with your first session. (Curious what it looks like populated? Settings → Load sample data.)"
          />
        </Card>
      </div>
    )
  }

  return (
    <div>
      <HeaderBar title="Progress" subtitle="Evidence, not scores" />

      <div className="grid grid-cols-3 gap-3 mt-3">
        <StatCard label="Independent" value={stateCounts.independent + stateCounts.retained + stateCounts.transferred} sub="skills" tone="text-accent" />
        <StatCard label="Retained" value={stateCounts.retained + stateCounts.transferred} sub="≥48h later" tone="text-good" />
        <StatCard label="Transferred" value={stateCounts.transferred} sub="novel context" tone="text-good" />
      </div>
      {stateCounts.needsReview > 0 ? (
        <p className="text-[13px] text-warn mt-2 px-1">
          {stateCounts.needsReview} skill{stateCounts.needsReview === 1 ? '' : 's'} flagged for review — earlier
          achievement stays on record while you re-prove it.
        </p>
      ) : null}

      <SectionTitle>30-minute training signal · 28 days</SectionTitle>
      <Card className="p-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Practice days', value: outcome.daysPracticed, sub: 'of 28', tone: 'text-accent' },
            { label: 'Focused dose', value: compactMinutes(outcome.focusedMinutes), sub: `${outcome.dosePercent}% of 30m/day`, tone: 'text-accent' },
            { label: 'Durable gains', value: outcome.newRetained + outcome.newTransferred, sub: 'retained/transfer', tone: 'text-good' },
          ].map((m) => (
            <div key={m.label} className="text-center">
              <p className={`font-display text-xl font-bold ${m.tone}`}>{m.value}</p>
              <p className="text-[11px] text-muted font-medium mt-0.5">{m.label}</p>
              <p className="text-[10px] text-faint">{m.sub}</p>
            </div>
          ))}
        </div>
        <div className="h-2 rounded bg-surface2 overflow-hidden mt-3" aria-label={`${outcome.dosePercent}% of the 30 minute daily practice target`}>
          <div className="h-full rounded bg-accent" style={{ width: `${Math.min(100, outcome.dosePercent)}%` }} />
        </div>
        <p className={`text-[13px] mt-3 ${outcome.enoughEvidence ? 'text-muted' : 'text-faint'}`}>{outcome.verdict}</p>
        <p className="text-[11px] text-faint mt-1.5">
          Outcome = unaided independence, delayed retention, and novel-context transfer. This is evidence of specific learning—not an IQ score or a causal claim from screen time alone.
        </p>
      </Card>

      <SectionTitle>What's holding you back</SectionTitle>
      <Card className="p-4">
        {bottleneck ? (
          <>
            <p className="font-medium text-[15px]">{bottleneck.name}</p>
            <p className="text-[13px] text-muted mt-1">{bottleneck.why}</p>
          </>
        ) : (
          <p className="text-[13px] text-muted">No single blocker right now — the frontier is open in several directions.</p>
        )}
        {burden > 0 ? <p className="text-[12px] text-faint mt-2">Review load: {burden} skill{burden === 1 ? '' : 's'} due within 7 days.</p> : null}
      </Card>

      <SectionTitle>Independence trend</SectionTitle>
      <Card className="p-4">
        <TrendColumns
          points={weekly.map((w) => ({ label: w.label, value: w.independent }))}
          unit="% of graded attempts correct, unaided, first try"
          summary={`Unaided first-try accuracy across the last four weeks: ${weekly.map((w) => `${w.label} ${w.independent}%`).join(', ')}`}
        />
        <div className="mt-3 pt-3 border-t border-line">
          <TrendColumns
            points={weekly.map((w) => ({ label: w.label, value: w.hinted }))}
            unit="% of attempts using any hint — falling is independence growing"
            summary={`Hint use trend: ${weekly.map((w) => `${w.label} ${w.hinted}%`).join(', ')}`}
          />
        </div>
        <div className="mt-3 pt-3 border-t border-line grid grid-cols-2 gap-3">
          {[
            { label: 'Spaced review', signal: quality.review },
            { label: 'Transfer probes', signal: quality.transfer },
          ].map(({ label, signal }) => (
            <div key={label}>
              <p className="text-[11px] uppercase tracking-wide text-faint font-medium">{label}</p>
              <p className="text-[15px] font-semibold mt-0.5">
                {signal.rate === null ? `${signal.n}/3 checks` : `${Math.round(signal.rate * 100)}% unaided`}
              </p>
              <p className="text-[10px] text-faint">{signal.rate === null ? 'rate appears at 3' : `${signal.n} checks · first try`}</p>
            </div>
          ))}
        </div>
        {quality.matched ? (
          <p className="text-[12px] text-muted mt-3 pt-3 border-t border-line">
            Like-for-like practice: <span className="font-medium text-ink">{Math.round(quality.matched.early.rate! * 100)}%</span> unaided first-try accuracy in days 15–28 versus{' '}
            <span className="font-medium text-ink">{Math.round(quality.matched.recent.rate! * 100)}%</span> in the last 14 days, across {quality.matched.templateCount} repeated activity families.
          </p>
        ) : (
          <p className="text-[11px] text-faint mt-3 pt-3 border-t border-line">Like-for-like trend appears after at least 5 attempts in each half across 2 repeated activity families.</p>
        )}
      </Card>

      <SectionTitle>Confidence calibration</SectionTitle>
      <Card className="p-4">
        <CalibrationChart bands={bands} />
        {gap !== null ? (
          <p className="text-[13px] mt-3 pt-3 border-t border-line text-muted">
            {Math.abs(gap) < 0.08 ? (
              <>Overall: <span className="text-good font-medium">well calibrated</span> — confidence tracks reality within {Math.round(Math.abs(gap) * 100)} points.</>
            ) : gap > 0 ? (
              <>Overall: confidence runs <span className="text-warn font-medium">{Math.round(gap * 100)} points above</span> accuracy — worth slowing down before committing.</>
            ) : (
              <>Overall: confidence runs <span className="text-accent font-medium">{Math.round(-gap * 100)} points below</span> accuracy — you know more than you claim.</>
            )}
          </p>
        ) : null}
        {hce.length ? (
          <div className="mt-3 pt-3 border-t border-line">
            <p className="text-[13px] font-medium text-warn">
              {hce.length} high-confidence error{hce.length === 1 ? '' : 's'} in 28 days — the most expensive kind:
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {[...new Set(hce.flatMap((e) => e.skillIds))].slice(0, 6).map((s) => (
                <Chip key={s} tone="warn">
                  {index.skills.get(s)?.name ?? s}
                </Chip>
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      {errorPattern.length ? (
        <>
          <SectionTitle>Error patterns (28 days)</SectionTitle>
          <Card className="p-4">
            <div className="space-y-2">
              {errorPattern.map(([tag, count]) => {
                const meta = ERROR_TAGS.find((t) => t.id === tag)
                const max = errorPattern[0][1]
                return (
                  <div key={tag} className="flex items-center gap-2.5">
                    <span className="text-[12px] w-28 shrink-0 text-muted font-medium">{meta?.name ?? tag}</span>
                    <div className="flex-1 h-2 rounded bg-surface2 overflow-hidden">
                      <div className="h-full bg-warn/70 rounded" style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                    <span className="text-[11px] font-mono text-faint w-6 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
            <p className="text-[12px] text-faint mt-2.5">Filed by cause, not topic — because the cause picks the cure (Error Clinic works from this).</p>
          </Card>
        </>
      ) : null}

      <SectionTitle>Balance · 28 days{alloc.tuned ? ' · coach-tuned' : ''}</SectionTitle>
      <Card className="p-4">
        {alloc.tuned && alloc.notes.length ? (
          <div className="mb-3 bg-warn-soft border border-warn/30 rounded-lg px-3 py-2">
            {alloc.notes.map((n, i) => (
              <p key={i} className="text-[12px] text-warn leading-snug">
                {n}
              </p>
            ))}
          </div>
        ) : null}
        <BarPair
          rows={BUCKETS.filter((b) => report.target[b.id] > 0).map((b) => ({
            name: b.short,
            a: report.actual[b.id] * 100,
            b: report.target[b.id] * 100,
          }))}
          aLabel="actual"
          bLabel="target"
        />
        <p className="text-[12px] text-faint mt-2.5">{Math.round(report.totalMinutes)} focused minutes counted — task time only, never browsing.</p>
      </Card>

      {brier ? (
        <>
          <SectionTitle>Forecast accuracy</SectionTitle>
          <Card className="p-4">
            <p className="text-[15px]">
              Brier score <span className="font-mono font-semibold">{brier.score.toFixed(2)}</span>
              <span className="text-muted text-[13px]"> · {brier.n} resolved forecasts (0 = oracle, 0.25 ≈ coin-flips)</span>
            </p>
          </Card>
        </>
      ) : null}

      <WeekReviewLauncher />

      <SectionTitle>Session history</SectionTitle>
      <div className="space-y-2 mb-6">
        {[...state.sessions]
          .reverse()
          .slice(0, 8)
          .map((s) => (
            <Card key={s.id} className="p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium">
                  {new Date(s.startedAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span className="text-[12px] text-faint font-mono">
                  {s.activeMinutes}m · {s.correctFirst}/{s.attempts} first-try
                </span>
              </div>
              {s.learned.length ? <p className="text-[12px] text-good mt-1">↑ {s.learned.join(' · ')}</p> : null}
              {s.exitPrinciple ? <p className="text-[12px] text-muted mt-1 italic">“{s.exitPrinciple}”</p> : null}
            </Card>
          ))}
        {state.sessions.length === 0 ? <p className="text-[13px] text-faint px-1">No completed sessions yet.</p> : null}
      </div>
    </div>
  )
}

function WeekReviewLauncher() {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-6">
      <Button kind="secondary" className="w-full" onClick={() => setOpen(true)}>
        Open the week in review
      </Button>
      <WeekReviewModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

function StatCard({ label, value, sub, tone }: { label: string; value: number; sub: string; tone: string }) {
  return (
    <Card className="p-3.5 text-center">
      <p className={`font-display text-2xl font-bold ${tone}`}>{value}</p>
      <p className="text-[11px] text-muted font-medium mt-0.5">{label}</p>
      <p className="text-[10px] text-faint">{sub}</p>
    </Card>
  )
}
