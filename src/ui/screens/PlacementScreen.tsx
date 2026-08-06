/**
 * Adaptive placement runner: probes route the curriculum, never prove
 * mastery. Skippable, honest about what was and wasn't measured.
 */
import { useMemo, useRef, useState } from 'react'
import { useStore } from '../../store/store'
import { useNav } from '../nav'
import { buildContentIndex } from '../../content/registry'
import {
  applyProbe,
  nextProbe,
  startPlacement,
  summarizePlacement,
  type PlacementProgress,
  PLACEMENT_MAX_ITEMS,
  MATH_LADDER,
} from '../../engine/placement'
import { validate, validatorName } from '../../engine/validate'
import { uid } from '../../engine/rng'
import type { AttemptEvent, ItemTemplate } from '../../domain/types'
import { Button, Card, Chip } from '../components'
import { Rich } from '../richtext'
import { AnswerInput } from '../session/ItemPlayer'

type Phase = 'intro' | 'probe' | 'report'

export function PlacementScreen() {
  const { state, dispatch } = useStore()
  const { go } = useNav()
  const index = useMemo(() => buildContentIndex(state.customPacks), [state.customPacks])
  const [progress, setProgress] = useState<PlacementProgress>(() => startPlacement(state.profile, Date.now()))
  const [phase, setPhase] = useState<Phase>('intro')
  const [response, setResponse] = useState('')
  const [confidence, setConfidence] = useState<number | null>(null)
  const [probeCount, setProbeCount] = useState(0)
  /** Wrong on the math ladder → one easier constructed follow-up (slip vs gap). */
  const [followUp, setFollowUp] = useState<{ skillId: string } | null>(null)
  const events = useRef<AttemptEvent[]>([])
  const itemStart = useRef(Date.now())

  const skillId = phase === 'probe' ? (followUp ? followUp.skillId : nextProbe(progress, index)) : null
  const template: ItemTemplate | null = useMemo(() => {
    if (!skillId) return null
    const singles = (index.bySkill.get(skillId) ?? []).filter((t) => t.kind === 'single')
    if (followUp) {
      // Easier form, different template when possible.
      const pool = [...singles].sort((a, b) => a.difficulty - b.difficulty)
      return pool[0] ?? null
    }
    const pool = singles.filter((t) => t.difficulty <= 2).sort((a, b) => b.difficulty - a.difficulty)
    return pool[0] ?? singles[0] ?? null
  }, [skillId, index, followUp])
  const item = useMemo(
    () => (template ? template.generate((probeCount + 1) * 7919 + (followUp ? 13 : 0)) : null),
    [template, probeCount, followUp],
  )
  const askConf = probeCount % 3 === 1 && !followUp && item?.answer?.type !== 'draft'

  const submit = (skipped: boolean) => {
    if (!skillId || !template || !item || !item.answer) return
    let correct: boolean | null = null
    if (!skipped) {
      const verdict = validate(item.answer, response)
      if (verdict.formatError && !verdict.ok && response.trim()) {
        // let format errors through as wrong only if user insists? Give one corrective nudge:
        correct = false
      } else {
        correct = verdict.ok
      }
      events.current.push({
        id: uid('e'),
        t: Date.now(),
        sessionId: 'placement',
        templateId: template.id,
        itemVersion: template.version,
        seed: item.seed,
        skillIds: [skillId],
        bucket: template.bucket,
        mode: 'placement',
        firstResponse: response.slice(0, 500),
        finalResponse: response.slice(0, 500),
        correct,
        firstCorrect: correct,
        score: null,
        validator: validatorName(item.answer),
        hintLevel: 0,
        confidence,
        elapsedSec: Math.min(600, Math.round((Date.now() - itemStart.current) / 1000)),
        errorTags: [],
        difficulty: template.difficulty,
      })
    }
    // Wrong on a math-ladder skill → one easier follow-up before routing:
    // a pass there means "slip on the harder form, concept present".
    if (!followUp && correct === false && MATH_LADDER.includes(skillId) && progress.phase === 'math') {
      setFollowUp({ skillId })
      setResponse('')
      setConfidence(null)
      setProbeCount((c) => c + 1)
      itemStart.current = Date.now()
      return
    }
    const heldLevel = followUp !== null && correct === true
    const outcomeCorrect = followUp !== null && correct === false ? false : correct
    const next = applyProbe(progress, skillId, { correct: outcomeCorrect, skipped, confidence, heldLevel })
    setFollowUp(null)
    setProgress(next)
    setResponse('')
    setConfidence(null)
    setProbeCount((c) => c + 1)
    itemStart.current = Date.now()
    if (next.phase === 'done' || nextProbe(next, index) === null) {
      finish(next)
    }
  }

  const finish = (p: PlacementProgress) => {
    const result = summarizePlacement(p, index, Date.now())
    dispatch({ type: 'append-events', events: events.current })
    dispatch({ type: 'set-placement', placement: result })
    dispatch({
      type: 'log-decision',
      decision: {
        id: uid('cd'),
        t: Date.now(),
        kind: 'placement',
        summary: result.summary[1] ?? 'Placement completed.',
        evidence: result.summary.slice(0, 3),
        confidence: 'medium',
        wouldChange: 'Placement signals fade as real practice evidence accumulates — practice always outranks the interview.',
      },
    })
    setPhase('report')
  }

  if (phase === 'intro') {
    return (
      <div className="pt-safe max-w-md mx-auto min-h-dvh flex flex-col justify-center pb-16">
        <h1 className="font-display text-2xl font-bold">Placement</h1>
        <p className="text-muted mt-2 leading-relaxed text-[15px]">
          Up to {PLACEMENT_MAX_ITEMS} short questions, starting near your grade in math and branching by how it goes,
          then quick probes across physics, code, logic, strategy, and observation.
        </p>
        <ul className="mt-4 space-y-1.5 text-sm text-muted">
          <li>· Answer without help — <span className="text-ink font-medium">skipping is honest data</span>, guessing is noise.</li>
          <li>· No time pressure; take what a question needs.</li>
          <li>· A wrong answer just routes the map — nothing here is a grade.</li>
        </ul>
        <Button className="w-full mt-6" onClick={() => { setPhase('probe'); itemStart.current = Date.now() }}>
          Begin
        </Button>
        <Button kind="ghost" className="w-full mt-2" onClick={() => go({ name: 'today' })}>
          Not now
        </Button>
      </div>
    )
  }

  if (phase === 'report') {
    const result = state.placement
    return (
      <div className="pt-safe max-w-md mx-auto pb-16 anim-in">
        <h1 className="font-display text-2xl font-bold pt-8">Your starting map</h1>
        <Card className="mt-4 p-4">
          <ul className="space-y-2.5">
            {result?.summary.map((s, i) => (
              <li key={i} className="text-[15px] leading-relaxed flex gap-2">
                <span className="text-accent shrink-0">›</span> {s}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="mt-3 p-4">
          <p className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-2">Direct signals</p>
          <div className="flex flex-wrap gap-1.5">
            {result?.signals
              .filter((s) => !s.fromManual)
              .map((s) => (
                <Chip key={s.skillId} tone={s.signal === 'gap' ? 'warn' : s.signal === 'strong' ? 'good' : s.signal === 'ok' ? 'accent' : 'neutral'}>
                  {index.skills.get(s.skillId)?.name ?? s.skillId}: {s.signal}
                </Chip>
              ))}
          </div>
        </Card>
        <p className="text-[13px] text-faint mt-3 leading-relaxed">
          {result?.unmeasuredNote} No IQ scores, no percentiles, no predictions — just a routing map that real practice
          will keep correcting.
        </p>
        <Button className="w-full mt-5" onClick={() => go({ name: 'today' })}>
          See today's plan
        </Button>
      </div>
    )
  }

  // probe phase
  if (!skillId || !template || !item) {
    // ran out of content — finish gracefully
    finish(progress)
    return null
  }
  const skill = index.skills.get(skillId)
  return (
    <div className="pt-safe max-w-xl mx-auto pb-10">
      <div className="sticky top-0 bg-bg/95 backdrop-blur pt-2 pb-2 -mx-4 px-4 border-b border-line z-30">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted font-medium">
            Placement · question {probeCount + 1}
          </span>
          <button type="button" className="text-[13px] text-faint underline min-h-11" onClick={() => finish(progress)}>
            finish early
          </button>
        </div>
        <div
          className="mt-1.5 h-1 rounded-full bg-surface3 overflow-hidden"
          role="progressbar"
          aria-label="Placement progress"
          aria-valuemin={0}
          aria-valuemax={PLACEMENT_MAX_ITEMS}
          aria-valuenow={probeCount}
        >
          <div className="h-full bg-accent rounded-full transition-[width]" style={{ width: `${Math.min(100, (probeCount / PLACEMENT_MAX_ITEMS) * 100)}%` }} />
        </div>
      </div>
      <div className="anim-in" key={probeCount}>
        <div className="flex gap-2 mt-4 mb-2">
          <Chip tone="neutral">{skill?.name}</Chip>
          {followUp ? <Chip tone="warn">quick check — simpler form</Chip> : null}
        </div>
        {followUp ? (
          <p className="text-[13px] text-muted mb-2 px-1">
            Same idea, easier version. A pass here means the concept is in place and the harder form just slipped.
          </p>
        ) : null}
        <Card className="p-4">
          <Rich text={item.prompt} className="text-[16px]" />
        </Card>
        <div className="mt-4">
          {item.answer ? (
            <AnswerInput
              spec={item.answer}
              value={response}
              onChange={setResponse}
              onSubmit={() => {
                if (response.trim() && (!askConf || confidence !== null)) submit(false)
              }}
            />
          ) : null}
        </div>
        {askConf ? (
          <div className="mt-4">
            <span className="text-[13px] text-muted font-medium">How sure are you?</span>
            <div className="flex gap-1.5 mt-1.5" role="radiogroup" aria-label="Confidence">
              {[20, 40, 60, 80, 95].map((c) => (
                <button
                  type="button"
                  key={c}
                  role="radio"
                  aria-checked={confidence === c}
                  onClick={() => setConfidence(c)}
                  className={`flex-1 min-h-11 rounded-lg border text-[13px] font-medium ${confidence === c ? 'bg-accent-soft border-accent/50 text-accent' : 'bg-surface border-line text-faint'}`}
                >
                  {c}%
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="flex gap-2 mt-4">
          <Button className="flex-1" onClick={() => submit(false)} disabled={!response.trim() || (askConf && confidence === null)}>
            Submit
          </Button>
          <Button kind="secondary" onClick={() => submit(true)}>
            Skip — not sure
          </Button>
        </div>
      </div>
    </div>
  )
}
