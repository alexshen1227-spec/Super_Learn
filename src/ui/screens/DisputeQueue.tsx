/**
 * Resolving the attempts you contested.
 *
 * Everything here is already out of the numbers — quarantine happens the
 * moment a dispute is raised, not when it is settled. So this screen has no
 * urgency attached to it and deliberately no nagging: nothing is being harmed
 * while a dispute sits open, and the one thing worse than an unresolved
 * dispute would be pressuring the learner into calling it "my error" to make a
 * badge go away.
 *
 * The three outcomes are genuinely different and only one restores the attempt.
 */
import { useMemo, useState } from 'react'
import { useStore } from '../../store/store'
import { OUTCOME_LABEL, openDisputes } from '../../engine/dispute'
import type { DisputeOutcome } from '../../domain/types'
import { Button, Card } from '../components'
import { uid } from '../../engine/rng'

export function DisputeQueue() {
  const { state, dispatch } = useStore()
  const open = useMemo(() => openDisputes(state.disputes), [state.disputes])
  const [busy, setBusy] = useState<string | null>(null)
  if (!open.length) return null

  const resolve = (attemptId: string, templateId: string, outcome: DisputeOutcome) => {
    setBusy(attemptId)
    dispatch({
      type: 'resolve-dispute',
      dispute: { id: uid('dp'), t: Date.now(), kind: 'resolved', attemptId, templateId, outcome, note: '' },
    })
    setBusy(null)
  }

  return (
    <Card className="p-4">
      <h2 className="text-[15px] font-semibold">Attempts you contested</h2>
      <p className="text-[13px] text-muted leading-snug mt-1">
        {open.length} attempt{open.length === 1 ? '' : 's'} already excluded from your progress, difficulty and
        practice balance. Settle them whenever you like — nothing is being counted against you in the meantime.
      </p>
      <div className="mt-3 space-y-3">
        {open.map((d) => (
          <div key={d.id} className="bg-surface2 border border-line rounded-xl p-3">
            <p className="text-[13px] font-mono text-muted">{d.templateId}</p>
            {d.kind === 'raised' && d.note ? <p className="text-[14px] leading-snug mt-1">{d.note}</p> : null}
            <div className="mt-2.5 flex flex-col gap-1.5">
              {(Object.keys(OUTCOME_LABEL) as DisputeOutcome[]).map((outcome) => (
                <Button
                  key={outcome}
                  kind="ghost"
                  className="justify-start text-left !py-2.5"
                  disabled={busy === d.attemptId}
                  onClick={() => resolve(d.attemptId, d.templateId, outcome)}
                >
                  {OUTCOME_LABEL[outcome]}
                </Button>
              ))}
            </div>
            <p className="text-[12px] text-faint leading-snug mt-2">
              Only the first puts this attempt back into your record — including if it counts against you. The other
              two keep it out for good.
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}
