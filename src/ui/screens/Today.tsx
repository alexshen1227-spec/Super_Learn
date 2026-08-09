/**
 * Today: one dominant action, honest context around it. No feed, no streaks —
 * a deliberate daily entry point that explains itself.
 */
import { useEffect, useMemo } from 'react'
import { useEvidence, useStore } from '../../store/store'
import { useNav } from '../nav'
import { buildContentIndex } from '../../content/registry'
import { dueReviews, nextReviewAt } from '../../engine/scheduler'
import { effectiveAllocation } from '../../engine/allocationPlus'
import { todayInsight, weeklyObjective } from '../../engine/coach'
import { scoreSkills } from '../../engine/planner'
import { clearDraft, loadDraftSync } from '../../store/draft'
import { ACADEMIC_BUCKETS, BUCKET_BY_ID, BUCKETS } from '../../domain/types'
import { Button, Card, Chip, HeaderBar, SectionTitle, StateBadge } from '../components'
import { evidenceFor } from '../../engine/mastery'
import { WeekReviewModal } from '../WeekReview'
import { useState } from 'react'
import { activeMission, missionReadiness } from '../../engine/mission'
import { checkpointAvailable, checkpointSkills } from '../../engine/checkpoint'
import { TRACK_BY_ID } from '../../content/tracks'
import { calendarDaysUntil } from '../../engine/time'

function greeting(name: string): string {
  const h = new Date().getHours()
  const part = h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  return name ? `${part}, ${name}` : part
}

/** ~3 months. A course check-in cadence, not a nag — see the card below. */
const TRACK_CHECKIN_MS = 90 * 24 * 60 * 60 * 1000

export function Today() {
  const { state, dispatch } = useStore()
  const evidence = useEvidence()
  const { go } = useNav()
  const index = useMemo(() => buildContentIndex(state.customPacks), [state.customPacks])
  // Bucketed to the minute. A raw Date.now() is a new value on every render, so
  // passing it into the dependency arrays below meant this screen's four most
  // expensive computations re-ran every single time — the memos never hit.
  // Nothing here is finer-grained than a minute anyway.
  const now = useMinuteClock()
  // The draft store lives outside AppState, so a real-profile session must
  // not surface (or be resumable) inside the sample profile.
  const draft = state.sampleMode ? null : loadDraftSync()
  const due = useMemo(() => dueReviews(evidence, now), [evidence, now])
  const alloc = useMemo(() => effectiveAllocation(state, evidence, index, now), [state, evidence, index, now])
  const report = alloc.report
  const objective = useMemo(() => weeklyObjective(index, evidence, state, now), [index, evidence, state, now])
  const insight = useMemo(() => todayInsight(index, evidence, state, now), [index, evidence, state, now])
  const mission = activeMission(state, now)
  const readiness = mission?.skillIds?.length ? missionReadiness(mission, state, index, evidence, now) : null

  const frontier = useMemo(() => {
    const ctx = { index, evidence, state, now, checkIn: { minutes: mission?.dailyMinutes ?? state.profile.sessionMinutes, energy: 'ok' as const, focus: null } }
    let top: ReturnType<typeof scoreSkills>[number] | null = null
    for (const b of ACADEMIC_BUCKETS) {
      const scored = scoreSkills(b, ctx, report)
      if (scored.length && (!top || scored[0].score > top.score)) top = scored[0]
    }
    return top?.skill ?? null
  }, [index, evidence, state, now, report, mission])

  const deadline = mission
    ? { ...mission, days: Math.max(0, calendarDaysUntil(mission.dateISO, now)) }
    : null

  const checkpoint = useMemo(
    () => checkpointAvailable(state, index, evidence, now),
    [state, index, evidence, now],
  )
  const nextDue = nextReviewAt(evidence, now)
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const noPlacement = !state.placement && state.sessions.length === 0
  const [weekOpen, setWeekOpen] = useState(false)
  /*
   * Course check-in, roughly quarterly. Courses change under people — semesters
   * end, classes switch — so a stale course selection quietly mis-tilts the
   * plan. One dismissible card, shown only after ~90 days of silence (a legacy
   * profile with no stamp counts as silent), never during onboarding, and
   * confirming is one tap. No urgency theater: it waits as long as you like.
   */
  const trackCheckinDue =
    state.sessions.length > 0 &&
    !state.sampleMode &&
    (state.profile.trackConfirmedAt === null || now - state.profile.trackConfirmedAt > TRACK_CHECKIN_MS)
  const isWeekend = [0, 6].includes(new Date().getDay())
  const hasWeekData = state.events.some((e) => e.t > now - 7 * 86_400_000 && e.mode !== 'placement')

  return (
    <div>
      <HeaderBar title={greeting(state.profile.name)} subtitle={dateStr} />

      <Card className="mt-3 p-5 graph-paper !bg-surface relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-surface via-surface/85 to-transparent pointer-events-none" aria-hidden />
        <div className="relative">
          <p className="text-[13px] font-medium text-accent">{objective}</p>
          {draft ? (
            <>
              <h2 className="font-display text-xl font-bold mt-2">A session is waiting</h2>
              <p className="text-muted text-sm mt-1">Paused mid-way — pick up exactly where you left off.</p>
              <Button className="w-full mt-4" onClick={() => go({ name: 'session', launch: { kind: 'resume' } })}>
                Resume session
              </Button>
              <Button
                kind="ghost"
                className="w-full mt-1.5"
                onClick={() => {
                  clearDraft()
                  go({ name: 'session', launch: { kind: 'daily' } })
                }}
              >
                Discard & start fresh
              </Button>
            </>
          ) : (
            <>
              <h2 className="font-display text-xl font-bold mt-2">
                {noPlacement ? 'First: find your starting line' : "Today's session"}
              </h2>
              <p className="text-muted text-sm mt-1 leading-relaxed">{insight}</p>
              {noPlacement ? (
                <>
                  <Button className="w-full mt-4" onClick={() => go({ name: 'placement' })}>
                    Take the placement (~15 min)
                  </Button>
                  <Button kind="ghost" className="w-full mt-1.5" onClick={() => go({ name: 'session', launch: { kind: 'daily' } })}>
                    Skip — start a session conservatively
                  </Button>
                </>
              ) : (
                <>
                  <Button className="w-full mt-4" onClick={() => go({ name: 'session', launch: { kind: 'daily' } })}>
                    Start today's session
                  </Button>
                  <p className="text-[11px] text-faint mt-2 leading-snug">
                    Question families rotate as they become appropriate. Long projects get a whole application day; one-time readiness probes appear at most weekly.
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </Card>

      {trackCheckinDue ? (
        <Card className="mt-3 p-4">
          <p className="text-[12px] text-muted font-medium uppercase tracking-wide">Course check-in · every few months</p>
          <p className="text-[14px] mt-1.5">
            {state.profile.mathTrack
              ? `Still in ${TRACK_BY_ID.get(state.profile.mathTrack)?.name ?? 'your math course'}? Courses change — a quick confirm keeps the plan honest.`
              : 'No math course is set right now. If you have started one, telling the app tilts practice toward it — openly, never exclusively.'}
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              kind="ghost"
              className="flex-1"
              onClick={() => dispatch({ type: 'update-profile', profile: { trackConfirmedAt: Date.now() } })}
            >
              {state.profile.mathTrack ? 'Still right' : 'Still none'}
            </Button>
            <Button kind="ghost" className="flex-1" onClick={() => go({ name: 'settings' })}>
              Update course
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-3 mt-3">
        <Card className="p-4" onClick={() => go(due.length ? { name: 'session', launch: { kind: 'mixed' } } : { name: 'practice' })}>
          <p className="text-[12px] text-muted font-medium uppercase tracking-wide">Reviews due</p>
          <p className="font-display text-2xl font-bold mt-1">{due.length}</p>
          <p className="text-[12px] text-faint mt-0.5">
            {due.length
              ? due[0].reason === 'misconception'
                ? 'incl. a confident error to repair'
                : 'retrieval keeps it yours'
              : nextDue
                ? `next ${new Date(nextDue).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                : 'none scheduled yet'}
          </p>
        </Card>
        <Card className="p-4" onClick={() => go({ name: 'path' })}>
          <p className="text-[12px] text-muted font-medium uppercase tracking-wide">Frontier</p>
          {frontier ? (
            <>
              <p className="font-semibold text-[15px] mt-1 leading-tight">{frontier.name}</p>
              <div className="mt-1.5">
                <StateBadge state={evidenceFor(evidence, frontier.id).state} />
              </div>
            </>
          ) : (
            <p className="text-[13px] text-faint mt-1">Map fills in as you practice</p>
          )}
        </Card>
      </div>

      {checkpoint ? (
        <Card
          className="mt-3 p-4 border-good/40"
          onClick={() =>
            go({
              name: 'session',
              launch: {
                kind: 'checkpoint',
                skillIds: checkpointSkills(checkpoint),
                unitName: checkpoint.unitName,
              },
            })
          }
        >
          <p className="text-[12px] font-semibold text-good uppercase tracking-wide">Unit checkpoint ready</p>
          <p className="text-[15px] font-medium mt-1">{checkpoint.unitName}</p>
          <p className="text-[12px] text-muted mt-1 leading-snug">
            You own {checkpoint.ownedSkillIds.length} skills here and {checkpoint.dueSkillIds.length} have come due.
            Two questions each — enough that a lucky guess cannot carry it.
          </p>
        </Card>
      ) : null}

      {deadline ? (
        <Card className="mt-3 p-4 border-warn/40">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-warn">
                Mission · {deadline.title} · {deadline.days === 0 ? 'today' : `${deadline.days} day${deadline.days === 1 ? '' : 's'} left`}
              </p>
              {readiness && readiness.targetIds.length ? (
                <>
                  <p className="text-[12px] text-muted mt-1">
                    {readiness.retained}/{readiness.targetIds.length} targets retained · {readiness.independent} independent · {deadline.dailyMinutes ?? 30} min/day
                  </p>
                  <div
                    className="h-1.5 rounded bg-surface2 overflow-hidden mt-2"
                    role="progressbar"
                    aria-label="Mission skills retained"
                    aria-valuemin={0}
                    aria-valuemax={readiness.targetIds.length}
                    aria-valuenow={readiness.retained}
                  >
                    <div className="h-full rounded bg-good" style={{ width: `${readiness.targetIds.length ? (readiness.retained / readiness.targetIds.length) * 100 : 0}%` }} />
                  </div>
                  <p className="text-[11px] text-faint mt-1.5">
                    {readiness.nextSkillIds.length
                      ? `Next evidence: ${readiness.nextSkillIds.map((id) => index.skills.get(id)?.name ?? id).join(', ')}.`
                      : 'All selected skills are retained; sessions will rehearse transfer and keep them available.'}
                    {' '}{readiness.sessionsAvailable} planned practice day{readiness.sessionsAvailable === 1 ? '' : 's'} remain.
                  </p>
                </>
              ) : (
                <p className="text-[12px] text-muted mt-0.5">Sessions lean toward this subject until it passes — openly, not silently.</p>
              )}
            </div>
            {deadline.bucket ? <Chip tone="warn">{BUCKET_BY_ID[deadline.bucket].short}</Chip> : null}
          </div>
        </Card>
      ) : null}

      <SectionTitle
        right={
          report.totalMinutes >= 10 ? (
            <span className="text-[12px] text-faint">{Math.round(report.totalMinutes)} min · 28 days</span>
          ) : undefined
        }
      >
        Practice balance{alloc.tuned ? ' · coach-tuned' : ''}
      </SectionTitle>
      <Card className="p-4">
        {report.totalMinutes < 10 ? (
          <p className="text-[13px] text-muted">
            The 28-day balance view appears once you have ~10 focused minutes logged. Targets are yours to edit in
            Settings.
          </p>
        ) : (
          <div className="space-y-2">
            {BUCKETS.filter((b) => report.target[b.id] > 0).map((b) => (
              <div key={b.id} className="flex items-center gap-2.5">
                <span className="text-[12px] w-20 shrink-0 text-muted font-medium truncate">{b.short}</span>
                <div className="flex-1 h-2 rounded bg-surface2 relative overflow-hidden">
                  <div className="absolute inset-y-0 w-0.5 bg-line-strong z-10" style={{ left: `${report.target[b.id] * 100}%` }} aria-hidden />
                  <div
                    className={`h-full rounded ${report.actual[b.id] > report.target[b.id] * 1.4 ? 'bg-warn/70' : 'bg-accent/80'}`}
                    style={{ width: `${Math.min(100, report.actual[b.id] * 100)}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-faint w-16 text-right shrink-0">
                  {Math.round(report.actual[b.id] * 100)}% / {Math.round(report.target[b.id] * 100)}%
                </span>
              </div>
            ))}
          </div>
        )}
        {/* Adjustments belong WITH the chart they explain, and in the quiet
            palette. Sitting above the card in warning orange, a routine note
            about goals read as something being wrong. */}
        {alloc.tuned && alloc.notes.length ? (
          <div className="mt-3 pt-3 border-t border-line">
            <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">Adjusted this week</p>
            <ul className="mt-1 space-y-0.5">
              {alloc.notes.map((note, i) => (
                <li key={i} className="text-[12px] text-faint leading-snug flex gap-1.5">
                  <span className="text-accent shrink-0" aria-hidden>·</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      {isWeekend && hasWeekData ? (
        <Card className="mt-3 p-4 border-accent/30" onClick={() => setWeekOpen(true)}>
          <p className="font-semibold text-[15px]">Week in review</p>
          <p className="text-[12px] text-muted mt-0.5">What moved up, what's asking for review, and where the minutes went.</p>
        </Card>
      ) : null}

      <SectionTitle>Quick starts</SectionTitle>
      <div className="grid grid-cols-2 gap-3 mb-6 auto-rows-fr">
        <Card className="p-4 h-full" onClick={() => go({ name: 'session', launch: { kind: 'mixed' } })}>
          <p className="font-semibold text-[15px]">Mixed review</p>
          <p className="text-[12px] text-muted mt-0.5">Interleaved retrieval across everything you own</p>
        </Card>
        <Card className="p-4 h-full" onClick={() => go({ name: 'exam' })}>
          <p className="font-semibold text-[15px]">Exam simulator</p>
          <p className="text-[12px] text-muted mt-0.5">Blind, timed, cumulative — like the real thing</p>
        </Card>
      </div>
      <WeekReviewModal open={weekOpen} onClose={() => setWeekOpen(false)} />
    </div>
  )
}

/**
 * A clock that only changes once a minute, so it can be used as a memo
 * dependency. Review dues, deadlines, and coach lines all move at minute
 * resolution at best; a per-render timestamp just defeats memoization.
 */
function useMinuteClock(): number {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 60_000) * 60_000)
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 60_000) * 60_000), 30_000)
    return () => clearInterval(id)
  }, [])
  return now
}
