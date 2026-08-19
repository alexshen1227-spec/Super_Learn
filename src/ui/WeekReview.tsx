/**
 * Week in Review — a Sunday ritual (available any day from Progress).
 * Everything derived from the evidence log; nothing stored, nothing judged.
 */
import { useMemo } from 'react'
import { useEvidence, useStore } from '../store/store'
import { buildContentIndex } from '../content/registry'
import { deriveEvidence, STATE_LABEL, stateRank } from '../engine/mastery'
import { weeklyObjective } from '../engine/coach'
import { BUCKET_BY_ID, type BucketId } from '../domain/types'
import { Button, Chip, Modal } from './components'
import { useMinuteClock } from './useMinuteClock'

const DAY = 86_400_000

export function WeekReviewModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useStore()
  const evidence = useEvidence()
  const index = useMemo(() => buildContentIndex(state.customPacks), [state.customPacks])
  const now = useMinuteClock()

  const data = useMemo(() => {
    const weekEvents = state.events.filter((e) => e.t > now - 7 * DAY && e.mode !== 'placement')
    const beforeEvidence = deriveEvidence(state.events.filter((e) => e.t <= now - 7 * DAY), now - 7 * DAY)
    const advanced: string[] = []
    const decayed: string[] = []
    for (const [skillId, ev] of evidence) {
      const b = beforeEvidence.get(skillId)
      const bRank = b ? stateRank(b.state) : 0
      if (stateRank(ev.state) > bRank && stateRank(ev.state) >= 2) {
        advanced.push(`${index.skills.get(skillId)?.name ?? skillId} → ${STATE_LABEL[ev.state]}`)
      }
      if (ev.needsReview && b && !b.needsReview) {
        decayed.push(index.skills.get(skillId)?.name ?? skillId)
      }
    }
    const minutes = Math.round(weekEvents.reduce((a, e) => a + e.elapsedSec, 0) / 60)
    const byBucket = new Map<BucketId, number>()
    for (const e of weekEvents) byBucket.set(e.bucket, (byBucket.get(e.bucket) ?? 0) + e.elapsedSec / 60)
    const sessions = state.sessions.filter((s) => s.startedAt > now - 7 * DAY)
    const principle = [...sessions].reverse().find((s) => s.exitPrinciple)?.exitPrinciple ?? null
    const graded = weekEvents.filter((e) => e.firstCorrect !== null)
    const accuracy = graded.length ? Math.round((graded.filter((e) => e.firstCorrect).length / graded.length) * 100) : null
    return { advanced, decayed, minutes, byBucket, sessions: sessions.length, principle, accuracy, attempts: weekEvents.length }
  }, [state.events, state.sessions, evidence, index, now])

  const objective = useMemo(() => weeklyObjective(index, evidence, state, now), [index, evidence, state, now])

  return (
    <Modal open={open} onClose={onClose} title="Week in review" wide>
      {data.attempts === 0 ? (
        <p className="text-muted text-sm leading-relaxed">
          A quiet week — nothing logged in the last 7 days. No shame in that; the review will be here when the work is.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="font-display text-2xl font-bold">{data.sessions}</p>
              <p className="text-[11px] text-muted">sessions</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{data.minutes}m</p>
              <p className="text-[11px] text-muted">focused</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{data.accuracy !== null ? `${data.accuracy}%` : '—'}</p>
              <p className="text-[11px] text-muted">first-try</p>
            </div>
          </div>

          <div>
            <p className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-1.5">Moved up</p>
            {data.advanced.length ? (
              <ul className="space-y-1">
                {data.advanced.slice(0, 8).map((a) => (
                  <li key={a} className="text-[14px] flex gap-2">
                    <span className="text-good">↑</span> {a}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-faint">No state changes — evidence accumulated toward the next rungs, which also counts.</p>
            )}
          </div>

          {data.decayed.length ? (
            <div>
              <p className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-1.5">Asking for review</p>
              <div className="flex flex-wrap gap-1.5">
                {data.decayed.slice(0, 8).map((d) => (
                  <Chip key={d} tone="warn">
                    {d}
                  </Chip>
                ))}
              </div>
              <p className="text-[12px] text-faint mt-1">Decay is the system working — these resurface in warm-ups automatically.</p>
            </div>
          ) : null}

          <div>
            <p className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-1.5">Where the minutes went</p>
            <div className="flex flex-wrap gap-1.5">
              {[...data.byBucket.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([bucket, min]) => (
                  <Chip key={bucket} tone="accent">
                    {BUCKET_BY_ID[bucket].short} {Math.round(min)}m
                  </Chip>
                ))}
            </div>
          </div>

          {data.principle ? (
            <div>
              <p className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-1">Best banked principle</p>
              <p className="text-[14px] italic">“{data.principle}”</p>
            </div>
          ) : null}

          <div className="pt-3 border-t border-line">
            <p className="text-[12px] font-semibold text-accent uppercase tracking-wide mb-1">Next week</p>
            <p className="text-[14px]">{objective}</p>
          </div>
        </div>
      )}
      <Button className="w-full mt-4" onClick={onClose}>
        Close
      </Button>
    </Modal>
  )
}
