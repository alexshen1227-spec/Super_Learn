/**
 * The dashboard for the only number this app exists to produce.
 *
 * Deliberately plain. No streak, no points, no badge, no encouragement, and
 * nothing that grows just because you opened the app. If nothing has survived
 * a fortnight, this reads as a row of zeroes — which is the honest picture and
 * exactly what a progress bar is designed to hide.
 *
 * The three questions it has to answer in numbers are the ones the project
 * exists for: what can I do unaided now that I could not three months ago,
 * what has survived from three months ago, and what did each surviving skill
 * cost in focused minutes.
 */
import { useMemo } from 'react'
import { useEvidence, useStore } from '../../store/store'
import { DURABLE_GAP_DAYS, QUARTER_DAYS, durableByWeek, northStar } from '../../engine/northStar'
import { SKILL_BY_ID, SKILLS } from '../../content/skills'
import { curriculumEnd } from '../../engine/curriculumEnd'
import { spontaneityReport } from '../../engine/spontaneity'
import { DEFAULT_INDEX } from '../../content/registry'
import { Card } from '../components'
import { useMinuteClock } from '../useMinuteClock'

function Figure({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="flex-1 min-w-28">
      <p className="text-[28px] leading-none font-semibold tabular-nums">{value}</p>
      <p className="text-[13px] font-medium mt-1.5">{label}</p>
      {sub ? <p className="text-[12px] text-muted leading-snug mt-0.5">{sub}</p> : null}
    </div>
  )
}

export function NorthStarPanel() {
  const { state } = useStore()
  const now = useMinuteClock()
  const star = useMemo(() => northStar(state.events, state.disputes, now), [state.events, state.disputes, now])
  const weeks = useMemo(() => durableByWeek(star, now, 12), [star, now])
  const peak = Math.max(1, ...weeks.map((w) => w.proved))
  // A full-height plot holding twelve zeroes reads as a chart that failed to
  // load, not as an honest empty one. Keep the baseline, drop the empty band.
  const anyWeek = weeks.some((w) => w.proved > 0)
  const end = useMemo(
    () => curriculumEnd(state.events, state.disputes, SKILLS, now),
    [state.events, state.disputes, now],
  )
  const evidence = useEvidence()
  const spont = useMemo(
    () => spontaneityReport(state.events, DEFAULT_INDEX, evidence),
    [state.events, evidence],
  )

  return (
    <Card className="p-4">
      <h2 className="text-[15px] font-semibold">What has actually survived</h2>
      <p className="text-[13px] text-muted leading-snug mt-1">
        A skill counts here only when you have answered it again with no hints, at least {DURABLE_GAP_DAYS} days after
        you first got it unaided, on a different question from the one you learned it on. That is a harder bar than the
        ladder on the Path screen uses, and the two are meant to disagree.
      </p>

      <div className="flex flex-wrap gap-4 mt-4">
        <Figure value={String(star.durable.length)} label="Skills that survived" sub={`out of ${star.everUnaided} ever done unaided`} />
        <Figure
          value={star.minutesPerDurableSkill === null ? '—' : String(Math.round(star.minutesPerDurableSkill))}
          label="Focused minutes each"
          sub={star.minutesPerDurableSkill === null ? 'needs 5 surviving skills before an average means anything' : 'total time on that skill, per skill that survived'}
        />
        <Figure value={String(star.transferred)} label="Used in a new context" sub="counted separately, never added in" />
      </div>

      {/*
        Where the ground runs out.
        A curriculum is finite, and the app used to say nothing when a learner
        reached the end of it — carrying on serving reviews while they assumed
        more was coming. Simulation says how finite: at an hour a day every one
        of the 150 skills is proved by year two, and years three to five hold
        almost nothing new. Nothing is celebrated here and nothing unlocks; the
        app just admits where the edge is, and what practice is for afterwards.
      */}
      {end.stage !== 'early' ? (
        <div className="mt-5 pt-4 border-t border-line">
          <h3 className="text-[14px] font-medium">
            {end.stage === 'complete' ? 'You have reached the end of what this app teaches' : 'You are near the end of what this app teaches'}
          </h3>
          <p className="text-[13px] text-muted leading-snug mt-1">
            {end.stage === 'complete' ? (
              <>
                {end.durable} of its {end.total} skills have survived the {DURABLE_GAP_DAYS}-day bar
                {end.remaining > 0 ? `, and ${end.remaining} ${end.remaining === 1 ? 'has' : 'have'} not been met yet` : ''}.
                Practice from here is maintenance rather than new ground: reviews arrive when something is due, and
                harder versions and transfer questions keep coming, but the app has no more topics to introduce. That is
                the app running out, not you — the next gain is using these somewhere real.
              </>
            ) : (
              <>
                {end.durable} of {end.total} skills have survived the {DURABLE_GAP_DAYS}-day bar, and {end.remaining}{' '}
                {end.remaining === 1 ? 'topic has' : 'topics have'} not been met yet. Worth knowing in advance: this app
                is a finite curriculum, so at some point new topics stop arriving and practice becomes maintenance.
              </>
            )}
          </p>
        </div>
      ) : null}

      {/*
        The one thing every other number here cannot tell you.
        Everything above measures answers given inside a topic's own practice,
        which shows a method can be RUN once you know to reach for it. This asks
        whether it fires when nothing points the way. It stays silent until
        there are enough probes to mean anything, and it deliberately does not
        appear as a score next to the others — it is not a rung, and nothing
        about it feeds what gets scheduled.
      */}
      {spont.summary ? (
        <div className="mt-5 pt-4 border-t border-line">
          <h3 className="text-[14px] font-medium">When nothing tells you which idea to use</h3>
          <p className="text-[13px] text-muted leading-snug mt-1">{spont.summary}</p>
          <p className="text-[12px] text-muted leading-snug mt-1.5">
            Measured over {spont.attempts} unprompted {spont.attempts === 1 ? 'question' : 'questions'}
            {spont.promptedAttempts > 0
              ? ` against ${spont.promptedAttempts} ordinary ${spont.promptedAttempts === 1 ? 'one' : 'ones'} on the same topics`
              : ''}
            . These never count toward any skill.
          </p>
        </div>
      ) : null}

      <div className="mt-5 pt-4 border-t border-line">
        <h3 className="text-[14px] font-medium">The last three months</h3>
        {star.hasQuarterOfHistory ? (
          <div className="flex flex-wrap gap-4 mt-3">
            <Figure value={String(star.gainedThisQuarter)} label="New since then" sub="learned inside the window and survived" />
            <Figure value={String(star.survivedFromLastQuarter)} label="Held from before" sub="done unaided before the window and again since" />
            <Figure
              value={String(star.untestedSinceLastQuarter)}
              label="Not asked since"
              sub="unknown, not lost — the app has not tested these"
            />
          </div>
        ) : (
          <p className="text-[13px] text-muted leading-snug mt-2">
            Not enough history yet. This comparison needs {QUARTER_DAYS} days of use before it says anything, and a
            number invented before then would only be describing the app's own newness.
          </p>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-line">
        <h3 className="text-[14px] font-medium">Skills proved per week</h3>
        <p className="text-[12px] text-muted leading-snug mt-0.5">
          {anyWeek ? 'Twelve weeks. Empty weeks are drawn empty.' : 'Twelve weeks, all of them still empty.'}
        </p>
        <div
          className={`flex items-end gap-1 mt-3 ${anyWeek ? 'h-16' : 'h-2'}`}
          role="img"
          aria-label={`Skills proved per week: ${weeks.map((w) => w.proved).join(', ')}`}
        >
          {weeks.map((w) => (
            <div key={w.weekStart} className="flex-1 flex flex-col justify-end h-full">
              <div
                className={w.proved ? 'bg-accent rounded-sm' : 'bg-line rounded-sm'}
                style={{ height: w.proved ? `${Math.max(6, (w.proved / peak) * 100)}%` : '2px' }}
              />
            </div>
          ))}
        </div>
      </div>

      {star.durable.length ? (
        <div className="mt-5 pt-4 border-t border-line">
          <h3 className="text-[14px] font-medium">Most recently proved</h3>
          <ul className="mt-2 space-y-1.5">
            {star.durable.slice(0, 6).map((d) => (
              <li key={d.skillId} className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="truncate">{SKILL_BY_ID.get(d.skillId)?.name ?? d.skillId}</span>
                <span className="text-muted tabular-nums shrink-0">
                  {Math.round(d.gapDays)}d later · {Math.round(d.seconds / 60)} min
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-[13px] text-muted leading-snug mt-5 pt-4 border-t border-line">
          Nothing has cleared the bar yet. That is expected early on — the gap alone takes {DURABLE_GAP_DAYS} days, and
          nothing here counts work you did today.
        </p>
      )}
    </Card>
  )
}
