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
import { useStore } from '../../store/store'
import { DURABLE_GAP_DAYS, QUARTER_DAYS, durableByWeek, northStar } from '../../engine/northStar'
import { SKILL_BY_ID } from '../../content/skills'
import { Card } from '../components'

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
  const now = Date.now()
  const star = useMemo(() => northStar(state.events, state.disputes, now), [state.events, state.disputes, now])
  const weeks = useMemo(() => durableByWeek(star, now, 12), [star, now])
  const peak = Math.max(1, ...weeks.map((w) => w.proved))

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
        <p className="text-[12px] text-muted leading-snug mt-0.5">Twelve weeks. Empty weeks are drawn empty.</p>
        <div className="flex items-end gap-1 mt-3 h-16" role="img" aria-label={`Skills proved per week: ${weeks.map((w) => w.proved).join(', ')}`}>
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
