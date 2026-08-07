/**
 * The session player: arrival check → planned blocks → exit reflection →
 * deliberate end. Crash-proof: every meaningful change mirrors to the draft
 * store; evidence events are appended the moment each activity completes.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  AttemptEvent,
  AttemptMode,
  BucketId,
  CheckIn,
  ErrorTag,
  FieldPlan,
  ItemTemplate,
  SessionPlan,
} from '../../domain/types'
import { BUCKET_BY_ID } from '../../domain/types'
import { useEvidence, useStore } from '../../store/store'
import { useNav, type SessionLaunch } from '../nav'
import { buildContentIndex } from '../../content/registry'
import {
  buildChallengePlan,
  adaptiveSwap,
  buildCheckpointPlan,
  buildErrorClinicPlan,
  buildExtensionBlock,
  buildFocusPlan,
  buildMixedReviewPlan,
  buildSessionPlan,
  pickSeed,
} from '../../engine/planner'
import { deriveEvidence, STATE_LABEL, stateRank } from '../../engine/mastery'
import { nextReviewAt } from '../../engine/scheduler'
import { uid } from '../../engine/rng'
import { clearDraft, loadDraftSync, saveDraft, type ActivityRecord, type SessionDraft, type SessionPhase } from '../../store/draft'
import { useWakeLock } from '../useWakeLock'
import { planCandidate, planNeedingFollowUp } from '../../engine/fieldPlan'
import { Button, Card, Chip, Confirm, Modal, Segmented } from '../components'
import { ItemPlayer } from './ItemPlayer'
import { ChessPlayer } from './ChessPlayer'
import { PolyominoPlayer } from './PolyominoPlayer'
import { LogicGridPlayer } from './LogicGridPlayer'
import { activeMission } from '../../engine/mission'
import { openRepairTargets } from '../../engine/errors'
import { IconClock } from '../icons'
import { calendarDaysUntil } from '../../engine/time'

export interface ActivityResult {
  firstResponse: string
  finalResponse: string
  correct: boolean | null
  firstCorrect: boolean | null
  score: number | null
  hintLevel: number
  confidence: number | null
  errorTag: ErrorTag | null
  validator: string
}

function emptyRecord(key: string): ActivityRecord {
  return {
    key,
    hintsUsed: 0,
    firstResponse: null,
    submitted: false,
    correct: null,
    firstCorrect: null,
    score: null,
    confidence: null,
    elapsedSec: 0,
    errorTag: null,
    retryResponse: null,
    retryCorrect: null,
    eventLogged: false,
    extra: null,
  }
}

export function SessionScreen({ launch }: { launch: SessionLaunch }) {
  const { state, dispatch, checkpoint } = useStore()
  const evidence = useEvidence()
  const { go } = useNav()
  const index = useMemo(() => buildContentIndex(state.customPacks), [state.customPacks])

  // ---------- runtime state ----------
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null)
  const [plan, setPlan] = useState<SessionPlan | null>(null)
  const [blockIndex, setBlockIndex] = useState(0)
  const [actIndex, setActIndex] = useState(0)
  const [phase, setPhase] = useState<SessionPhase | 'checkin' | 'interstitial'>('checkin')
  const [records, setRecords] = useState<Record<string, ActivityRecord>>({})
  const [scratch, setScratch] = useState('')
  const [principle, setPrinciple] = useState('')
  const [showLeave, setShowLeave] = useState(false)
  const [parkOpen, setParkOpen] = useState(false)
  const [parkText, setParkText] = useState('')
  const startedAt = useRef(Date.now())
  const activeSec = useRef(0)
  const evidenceBefore = useRef<typeof evidence | null>(null)

  // Keep the screen on while working — thinking time is not idle time. Not
  // held on the summary screen, where reading is done and the phone may as
  // well behave normally again.
  useWakeLock(phase !== 'summary')

  /**
   * If-then plan hooks, resolved once at mount so the exit screen cannot flip
   * shape while it is on screen. Both are null in the overwhelming majority of
   * sessions — this is meant to be rare enough to stay welcome.
   */
  const followUp = useMemo(() => planNeedingFollowUp(state, Date.now()), [state])
  const planSkillId = useMemo(
    () => (followUp ? null : planCandidate(state, evidence, (id) => index.skills.get(id)?.bucket)),
    [followUp, state, evidence, index],
  )

  /** Set when the session re-picked the next item; shown once, then cleared. */
  const [adaptNote, setAdaptNote] = useState<'eased' | 'stepped-up' | null>(null)
  const [overTime, setOverTime] = useState(false)
  /** Whole minutes of active work — drives the header clock, so it is state
   *  rather than only a ref. Ticking per minute keeps re-renders to 1/60th of
   *  what a seconds display would cost during a session. */
  const [activeMin, setActiveMin] = useState(0)
  // active-time ticker (pauses when hidden)
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        activeSec.current += 1
        setActiveMin((m) => (Math.floor(activeSec.current / 60) === m ? m : Math.floor(activeSec.current / 60)))
        // A gentle nudge well past the planned time — a clean stop beats a blur.
        if (checkIn && activeSec.current > (checkIn.minutes + 12) * 60) setOverTime(true)
      }
    }, 1000)
    return () => clearInterval(id)
  }, [checkIn])

  // ---------- resume or build ----------
  useEffect(() => {
    if (launch.kind === 'resume') {
      const draft = loadDraftSync()
      // A draft can outlive an app update that renamed content — validate
      // every referenced template before trusting it.
      const valid =
        draft &&
        draft.plan.blocks.every((b) => b.activities.every((a) => index.templates.has(a.templateId)))
      if (draft && !valid) clearDraft()
      if (draft && valid) {
        setPlan(draft.plan)
        setCheckIn(draft.checkIn)
        setBlockIndex(draft.blockIndex)
        setActIndex(draft.actIndex)
        setPhase(draft.phase)
        setRecords(draft.records)
        setScratch(draft.scratch)
        setPrinciple(draft.principle)
        startedAt.current = draft.startedAt
        activeSec.current = draft.activeSec
        return
      }
      // nothing to resume — fall through to a fresh daily check-in
    }
    if (launch.kind === 'single') {
      const template = index.templates.get(launch.templateId)
      if (template) {
        const ci: CheckIn = { minutes: Math.max(5, Math.ceil(template.minutes)), energy: 'ok', focus: null }
        const p: SessionPlan = {
          id: uid('s'),
          createdAt: Date.now(),
          targetMinutes: ci.minutes,
          blocks: [
            {
              id: uid('b'),
              kind: 'core',
              bucket: template.bucket,
              label: template.name,
              minutes: template.minutes,
              activities: [{ templateId: template.id, seed: pickSeed(template, new Set()), mode: launch.mode ?? 'independent' }],
              why: 'You chose this activity.',
            },
          ],
          rationale: [`Single activity: ${template.name}.`],
        }
        setCheckIn(ci)
        setPlan(p)
        setPhase('item')
      }
      return
    }
    // daily / focus / mixed / challenge / error-clinic → check-in first
    setPhase('checkin')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const buildPlan = useCallback(
    (ci: CheckIn) => {
      const ctx = { index, evidence, state, now: Date.now(), checkIn: ci }
      let p: SessionPlan
      switch (launch.kind) {
        case 'focus':
          p = buildFocusPlan(ctx, launch.skillId)
          break
        case 'mixed':
          p = buildMixedReviewPlan(ctx)
          break
        case 'challenge':
          p = buildChallengePlan(ctx)
          break
        case 'checkpoint':
          p = buildCheckpointPlan(ctx, launch.skillIds, launch.unitName)
          break
        case 'error-clinic': {
          const repairs = openRepairTargets(state, evidence, Date.now())
          if (repairs.length) {
            p = buildErrorClinicPlan(ctx, repairs)
          } else {
            p = buildMixedReviewPlan(ctx)
            p.rationale = ['No unrepaired errors right now — running mixed review instead.']
          }
          break
        }
        default:
          p = buildSessionPlan(ctx)
      }
      if (!p.blocks.length) {
        p = buildSessionPlan(ctx)
      }
      setPlan(p)
      setCheckIn(ci)
      setPhase('interstitial')
      dispatch({
        type: 'log-decision',
        decision: {
          id: uid('cd'),
          t: Date.now(),
          kind: 'plan',
          summary: p.rationale[0] ?? 'Session planned.',
          evidence: p.rationale.slice(1, 4),
          confidence: state.sessions.length < 3 ? 'low' : 'medium',
          wouldChange: 'New evidence this session — misses, hints, or a focus request — reshapes tomorrow’s plan.',
        },
      })
      // Disclose allocation tuning as its own decision when it happened.
      const tunedLine = p.rationale.find((r) => r.startsWith('Balance tuned:'))
      if (tunedLine) {
        dispatch({
          type: 'log-decision',
          decision: {
            id: uid('cd'),
            t: Date.now(),
            kind: 'allocation',
            summary: tunedLine.replace('Balance tuned: ', 'Targets tuned: '),
            evidence: ['Your base targets in Settings are untouched; tuning recomputes from live evidence each session.'],
            confidence: 'high',
            wouldChange: 'Passing the deadline or clearing the due reviews drifts targets back to your base. A true 5% floor protects every area either way.',
          },
        })
      }
      evidenceBefore.current = deriveEvidence(state.events, Date.now())
    },
    [index, evidence, state, launch, dispatch],
  )

  // ---------- draft persistence ----------
  const persist = useCallback(() => {
    // Never persist a finished session — that would resurrect it as a ghost
    // "resume" card after completion.
    if (!plan || !checkIn || phase === 'checkin' || phase === 'summary') return
    const draft: Omit<SessionDraft, 'v' | 'savedAt'> = {
      startedAt: startedAt.current,
      plan,
      checkIn,
      blockIndex,
      actIndex,
      phase: phase === 'interstitial' ? 'item' : (phase as SessionPhase),
      records,
      scratch,
      activeSec: activeSec.current,
      principle,
    }
    saveDraft(draft)
  }, [plan, checkIn, blockIndex, actIndex, phase, records, scratch, principle])

  useEffect(() => {
    persist()
  }, [persist])
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') persist()
    }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('beforeunload', persist)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('beforeunload', persist)
    }
  }, [persist])

  // ---------- helpers ----------
  const block = plan?.blocks[blockIndex] ?? null
  const activity = block?.activities[actIndex] ?? null
  const template: ItemTemplate | null = activity ? (index.templates.get(activity.templateId) ?? null) : null
  const item = useMemo(() => (template && activity ? template.generate(activity.seed) : null), [template, activity])
  const actKey = `${blockIndex}:${actIndex}`
  const record = records[actKey] ?? emptyRecord(actKey)

  const totalActs = plan?.blocks.reduce((a, b) => a + b.activities.length, 0) ?? 0
  const doneActs = plan
    ? plan.blocks.reduce(
        (a, b, bi) => a + b.activities.filter((_, ai) => records[`${bi}:${ai}`]?.eventLogged).length,
        0,
      )
    : 0

  const updateRecord = useCallback(
    (partial: Partial<ActivityRecord>) => {
      setRecords((prev) => ({ ...prev, [actKey]: { ...(prev[actKey] ?? emptyRecord(actKey)), ...partial } }))
    },
    [actKey],
  )

  const logEvent = useCallback(
    (result: ActivityResult, elapsedSec: number) => {
      if (!template || !activity || !block) return
      if (records[actKey]?.eventLogged) return
      const mode: AttemptMode = activity.mode
      const event: AttemptEvent = {
        id: uid('e'),
        t: Date.now(),
        sessionId: plan?.id ?? null,
        templateId: template.id,
        itemVersion: template.version,
        seed: activity.seed,
        skillIds: template.skillIds,
        ...(item?.extraSkillIds?.length ? { aboutSkillIds: item.extraSkillIds.slice(0, 4) } : {}),
        bucket: template.bucket,
        mode,
        firstResponse: result.firstResponse.slice(0, 2000),
        finalResponse: result.finalResponse.slice(0, 2000),
        correct: result.correct,
        firstCorrect: result.firstCorrect,
        score: result.score,
        validator: result.validator,
        hintLevel: result.hintLevel,
        confidence: result.confidence,
        elapsedSec: Math.max(5, Math.round(elapsedSec)),
        errorTags: result.errorTag ? [result.errorTag] : [],
        difficulty: template.difficulty,
      }
      dispatch({ type: 'append-events', events: [event] })
      updateRecord({ eventLogged: true })
    },
    [template, activity, block, plan, records, actKey, dispatch, updateRecord],
  )

  /**
   * WITHIN-SESSION ADAPTATION.
   *
   * Difficulty used to be fixed when the plan was built, so a session could
   * not respond to how it was actually going: a learner drowning at minute
   * four kept getting the same level until tomorrow. This re-picks the NEXT
   * activity from the same skill when the recent run says the level is wrong.
   *
   * Deliberately conservative — it only swaps the upcoming item, never
   * rewrites the plan, and it never changes what an attempt is worth. The
   * evidence rules are untouched; only the choice of next problem moves.
   */
  const adaptNext = useCallback(
    (nextBlockIndex: number, nextActIndex: number) => {
      if (!plan) return

      // Read the last three graded outcomes of this session, most recent first.
      const outcomes: boolean[] = []
      for (let bi = plan.blocks.length - 1; bi >= 0 && outcomes.length < 3; bi--) {
        const b = plan.blocks[bi]
        for (let ai = b.activities.length - 1; ai >= 0 && outcomes.length < 3; ai--) {
          const rec = records[`${bi}:${ai}`]
          if (rec?.eventLogged && rec.firstCorrect !== null) outcomes.push(rec.firstCorrect === true)
        }
      }

      // The decision itself lives in the engine so it can be tested without a
      // DOM — including the rule that a swap must never re-serve something
      // this session already used.
      const swap = adaptiveSwap(plan, index, { block: nextBlockIndex, act: nextActIndex }, outcomes)
      if (!swap) return

      setPlan((prev) => {
        if (!prev) return prev
        const blocks = prev.blocks.map((b, bi) =>
          bi !== nextBlockIndex
            ? b
            : {
                ...b,
                activities: b.activities.map((a, ai) =>
                  ai !== nextActIndex ? a : { ...a, templateId: swap.templateId, seed: swap.seed },
                ),
              },
        )
        return { ...prev, blocks }
      })
      setAdaptNote(swap.direction)
    },
    [plan, index, records],
  )

  const advance = useCallback(() => {
    if (!plan || !block) return
    setAdaptNote(null)
    if (actIndex + 1 < block.activities.length) {
      adaptNext(blockIndex, actIndex + 1)
      setActIndex(actIndex + 1)
      setPhase('item')
    } else if (blockIndex + 1 < plan.blocks.length) {
      adaptNext(blockIndex + 1, 0)
      setBlockIndex(blockIndex + 1)
      setActIndex(0)
      setPhase('interstitial')
    } else {
      // The plan is out of work — but planned minutes are only estimates, and
      // finishing a "30 minute" session in twelve real ones is not the dose
      // that was chosen. Top it up until we are inside the grace window, at a
      // block boundary so the session still ends somewhere deliberate.
      const elapsedMin = activeSec.current / 60
      const extra = checkIn
        ? buildExtensionBlock(
            { index, evidence, state, now: Date.now(), checkIn },
            plan,
            elapsedMin,
          )
        : null
      if (extra) {
        setPlan((prev) => (prev ? { ...prev, blocks: [...prev.blocks, extra] } : prev))
        setBlockIndex(plan.blocks.length)
        setActIndex(0)
        setPhase('interstitial')
        return
      }
      setPhase('exit-reflect')
    }
  }, [plan, block, actIndex, blockIndex, adaptNext, checkIn, index, evidence, state])

  const finishSession = useCallback(
    (interrupted: boolean) => {
      if (!plan || !checkIn) return
      const after = deriveEvidence(state.events, Date.now())
      const before = evidenceBefore.current
      const learned: string[] = []
      if (before) {
        for (const [skillId, ev] of after) {
          const b = before.get(skillId)
          const bRank = b ? stateRank(b.state) : 0
          if (stateRank(ev.state) > bRank && stateRank(ev.state) >= 2) {
            learned.push(`${index.skills.get(skillId)?.name ?? skillId} → ${STATE_LABEL[ev.state]}`)
          }
        }
      }
      const bucketMinutes: Partial<Record<BucketId, number>> = {}
      let attempts = 0
      let correctFirst = 0
      plan.blocks.forEach((b, bi) =>
        b.activities.forEach((a, ai) => {
          const r = records[`${bi}:${ai}`]
          if (r?.eventLogged) {
            attempts++
            if (r.firstCorrect && r.hintsUsed === 0) correctFirst++
            const tpl = index.templates.get(a.templateId)
            if (tpl) bucketMinutes[tpl.bucket] = (bucketMinutes[tpl.bucket] ?? 0) + r.elapsedSec / 60
          }
        }),
      )
      dispatch({
        type: 'complete-session',
        record: {
          id: plan.id,
          startedAt: startedAt.current,
          endedAt: Date.now(),
          activeMinutes: Math.round(activeSec.current / 60),
          checkIn,
          attempts,
          correctFirst,
          bucketMinutes,
          learned: learned.slice(0, 8),
          exitPrinciple: principle.trim() ? principle.trim().slice(0, 400) : null,
          interrupted,
        },
      })
      clearDraft()
      checkpoint()
    },
    [plan, checkIn, state.events, records, principle, index, dispatch, checkpoint],
  )

  // ---------- screens ----------
  if (phase === 'checkin') {
    return <CheckInScreen defaultMinutes={activeMission(state, Date.now())?.dailyMinutes ?? state.profile.sessionMinutes} deadlines={state.deadlines} onStart={buildPlan} onCancel={() => go({ name: 'today' })} />
  }
  if (!plan || !checkIn) {
    return <div className="min-h-dvh grid place-items-center text-faint">Preparing…</div>
  }

  if (phase === 'exit-reflect') {
    const done = () => {
      finishSession(false)
      setPhase('summary')
    }
    return (
      <ExitScreen
        principle={principle}
        setPrinciple={setPrinciple}
        onDone={done}
        planFor={planSkillId ? (index.skills.get(planSkillId)?.name ?? null) : null}
        onPlan={(cue, action) => {
          if (planSkillId) {
            dispatch({
              type: 'add-plan',
              plan: { id: uid('fp'), t: Date.now(), skillId: planSkillId, cue, action, askedAt: null, outcome: null },
            })
          }
          done()
        }}
        followUp={followUp}
        onFollowUp={(outcome) => {
          if (followUp) dispatch({ type: 'answer-plan', id: followUp.id, outcome, t: Date.now() })
          done()
        }}
      />
    )
  }

  if (phase === 'summary') {
    const last = state.sessions[state.sessions.length - 1]
    const nextDue = nextReviewAt(deriveEvidence(state.events, Date.now()), Date.now())
    return (
      <div className="pt-safe anim-in">
        <div className="pt-10 text-center">
          <div className="text-4xl mb-3" aria-hidden>
            ✓
          </div>
          <h1 className="font-display text-2xl font-bold">You're done for today.</h1>
          <p className="text-muted mt-1 text-sm">A clean stop is part of the method — no feed follows this screen.</p>
        </div>
        <Card className="mt-6 p-5">
          <h2 className="font-semibold text-[15px] mb-3">Verified this session</h2>
          {last?.learned.length ? (
            <ul className="space-y-2">
              {last.learned.map((l) => (
                <li key={l} className="flex gap-2 text-[15px]">
                  <span className="text-good">↑</span> {l}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted text-sm">
              No state changes this time — evidence accumulated toward the next rung. That is normal and it still counts.
            </p>
          )}
          <div className="grid grid-cols-3 gap-3 mt-4 text-center">
            <div>
              <div className="font-display font-bold text-xl">{last?.attempts ?? 0}</div>
              <div className="text-[11px] text-muted">attempts</div>
            </div>
            <div>
              <div className="font-display font-bold text-xl">{last?.correctFirst ?? 0}</div>
              <div className="text-[11px] text-muted">first-try ✓</div>
            </div>
            <div>
              <div className="font-display font-bold text-xl">{last?.activeMinutes ?? 0}m</div>
              <div className="text-[11px] text-muted">focused</div>
            </div>
          </div>
        </Card>
        {last?.exitPrinciple ? (
          <Card className="mt-3 p-4">
            <p className="text-[13px] text-muted">Principle you banked:</p>
            <p className="text-[15px] mt-1 italic">“{last.exitPrinciple}”</p>
          </Card>
        ) : null}
        {scratch.trim() ? (
          <Card className="mt-3 p-4">
            <p className="text-[13px] text-muted">Parked thoughts (yours to handle now):</p>
            <p className="text-[14px] mt-1 whitespace-pre-wrap">{scratch}</p>
          </Card>
        ) : null}
        <p className="text-center text-sm text-muted mt-4">
          {nextDue ? `Next review lands ${describeWhen(nextDue)}.` : 'Reviews will schedule as skills firm up.'}
        </p>
        <Button className="w-full mt-6" onClick={() => go({ name: 'today' })}>
          Leave the lab
        </Button>
        <div className="h-10" />
      </div>
    )
  }

  if (phase === 'interstitial' && block) {
    return (
      <div className="pt-safe min-h-dvh flex flex-col">
        <SessionHeader
          label={`Block ${blockIndex + 1} of ${plan.blocks.length}`}
          done={doneActs}
          total={totalActs}
          elapsedMin={activeMin}
          targetMin={checkIn ? checkIn.minutes : null}
          onLeave={() => setShowLeave(true)}
          onPark={() => setParkOpen(true)}
        />
        <div className="flex-1 grid place-items-center px-2 pb-16">
          <Card className="p-6 w-full max-w-md anim-in">
            <Chip tone="accent">{BUCKET_BY_ID[block.bucket].name}</Chip>
            <h2 className="font-display text-[22px] font-bold mt-3">{block.label}</h2>
            <p className="text-muted mt-2 leading-relaxed text-[15px]">{block.why}</p>
            <p className="text-faint text-[13px] mt-2">
              ~{Math.round(block.minutes)} min · {block.activities.length}{' '}
              {block.activities.length === 1 ? 'activity' : 'activities'}
            </p>
            <Button className="w-full mt-5" onClick={() => setPhase('item')}>
              Begin
            </Button>
          </Card>
        </div>
        <LeaveDialog open={showLeave} onCancel={() => setShowLeave(false)} onLeave={() => { persist(); go({ name: 'today' }) }} />
        <ParkDialog open={parkOpen} text={parkText} setText={setParkText} onClose={() => setParkOpen(false)} onSave={() => { setScratch((s) => (s ? s + '\n' : '') + '• ' + parkText.trim()); setParkText(''); setParkOpen(false) }} />
      </div>
    )
  }

  // ---------- active item ----------
  if (!template || !item || !block) {
    // Content missing (should not happen) — skip forward rather than dead-end.
    return (
      <div className="pt-safe p-6 text-center">
        <p className="text-muted">That activity is unavailable.</p>
        <Button className="mt-4" onClick={advance}>
          Continue
        </Button>
      </div>
    )
  }

  const commonProps = {
    item,
    template,
    mode: activity!.mode,
    record,
    askConfidence: Boolean(template.calibration) && state.settings.confidencePrompts !== 'minimal',
    onSnapshot: updateRecord,
    onFinish: (result: ActivityResult, elapsedSec: number) => {
      updateRecord({
        submitted: true,
        correct: result.correct,
        firstCorrect: result.firstCorrect,
        score: result.score,
        confidence: result.confidence,
        elapsedSec: Math.round(elapsedSec),
        errorTag: result.errorTag,
        firstResponse: result.firstResponse,
      })
      logEvent(result, elapsedSec)
    },
    onContinue: advance,
  }

  return (
    <div className="pt-safe min-h-dvh flex flex-col">
      <SessionHeader
        label={`${block.label} · ${actIndex + 1}/${block.activities.length}`}
        done={doneActs}
        total={totalActs}
        elapsedMin={activeMin}
        targetMin={checkIn ? checkIn.minutes : null}
        onLeave={() => setShowLeave(true)}
        onPark={() => setParkOpen(true)}
      />
      {adaptNote ? (
        <div
          className="bg-accent-soft border-b border-accent/30 text-accent text-[13px] px-4 py-2 flex items-center justify-between gap-3 -mx-4"
          role="status"
        >
          <span>
            {adaptNote === 'eased'
              ? 'Two misses in a row — the next problem steps back a level. That is the plan working, not you failing.'
              : 'Three clean in a row — the next problem steps up a level.'}
          </span>
          <button type="button" className="underline shrink-0 min-h-11" onClick={() => setAdaptNote(null)}>
            Got it
          </button>
        </div>
      ) : null}
      {overTime ? (
        <div className="bg-warn-soft border-b border-warn/30 text-warn text-[13px] px-4 py-2 flex items-center justify-between gap-3 -mx-4" role="status">
          <span>Well past your planned {checkIn.minutes} min — a clean stop beats a long blur.</span>
          <button type="button" className="underline font-semibold shrink-0 min-h-11" onClick={() => setPhase('exit-reflect')}>
            Wrap up
          </button>
        </div>
      ) : null}
      <div className="flex-1 pb-8">
        {item.kind === 'chess' ? (
          <ChessPlayer key={actKey} {...commonProps} />
        ) : item.kind === 'polyomino' ? (
          <PolyominoPlayer key={actKey} {...commonProps} />
        ) : item.kind === 'logicgrid' ? (
          <LogicGridPlayer key={actKey} {...commonProps} />
        ) : (
          <ItemPlayer key={actKey} {...commonProps} scratch={scratch} setScratch={setScratch} kbIndex={index} />
        )}
      </div>
      <LeaveDialog open={showLeave} onCancel={() => setShowLeave(false)} onLeave={() => { persist(); go({ name: 'today' }) }} />
      <ParkDialog open={parkOpen} text={parkText} setText={setParkText} onClose={() => setParkOpen(false)} onSave={() => { setScratch((s) => (s ? s + '\n' : '') + '• ' + parkText.trim()); setParkText(''); setParkOpen(false) }} />
    </div>
  )
}

function describeWhen(t: number): string {
  const diff = t - Date.now()
  if (diff <= 0) return 'now'
  const hours = Math.round(diff / 3_600_000)
  if (hours < 20) return `in about ${Math.max(1, hours)} hour${hours === 1 ? '' : 's'}`
  const days = Math.round(diff / 86_400_000)
  return `in ${days} day${days === 1 ? '' : 's'}`
}

function SessionHeader({
  label,
  done,
  total,
  elapsedMin,
  targetMin,
  onLeave,
  onPark,
}: {
  label: string
  done: number
  total: number
  elapsedMin: number
  targetMin: number | null
  onLeave: () => void
  onPark: () => void
}) {
  // Minutes only, and counting UP. A ticking countdown turns thinking time
  // into time pressure, which is the opposite of what this app rewards.
  const clock = targetMin ? `${Math.floor(elapsedMin)}/${targetMin}m` : `${Math.floor(elapsedMin)}m`
  const past = targetMin !== null && elapsedMin >= targetMin
  return (
    <div className="sticky top-0 z-30 bg-bg/95 backdrop-blur pt-2 pb-2 -mx-4 px-4 border-b border-line">
      <div className="flex items-center gap-3">
        <button type="button" aria-label="Leave session" onClick={onLeave} className="h-11 w-11 grid place-items-center rounded-full text-muted hover:bg-surface2 shrink-0">
          ✕
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <div className="text-[13px] font-medium truncate flex-1 min-w-0">{label}</div>
            <span
              className={`text-[12px] font-mono shrink-0 ${past ? 'text-good' : 'text-faint'}`}
              aria-label={`${Math.floor(elapsedMin)} minutes of focused work${targetMin ? ` out of ${targetMin}` : ''}`}
            >
              {clock}
            </span>
          </div>
          <div
            className="mt-1 h-1 rounded-full bg-surface3 overflow-hidden"
            role="progressbar"
            aria-label="Session progress"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={done}
          >
            <div className="h-full bg-accent rounded-full transition-[width]" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
          </div>
        </div>
        <button
          type="button"
          aria-label="Park a distracting thought"
          title="Park a thought for later"
          onClick={onPark}
          className="min-h-11 px-3 grid place-items-center rounded-full text-muted hover:bg-surface2 text-[13px] shrink-0"
        >
          ✎ park
        </button>
      </div>
    </div>
  )
}

function LeaveDialog({ open, onCancel, onLeave }: { open: boolean; onCancel: () => void; onLeave: () => void }) {
  return (
    <Confirm
      open={open}
      onCancel={onCancel}
      onConfirm={onLeave}
      title="Pause the session?"
      body="Your progress is saved — you can resume exactly here from the Today screen, even after closing the app."
      confirmLabel="Pause & leave"
    />
  )
}

function ParkDialog({ open, text, setText, onClose, onSave }: { open: boolean; text: string; setText: (s: string) => void; onClose: () => void; onSave: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Park a thought">
      <p className="text-muted text-sm">
        Write the distracting thought down and let it go — it will be waiting on the end screen.
      </p>
      <input
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 200))}
        placeholder="e.g. reply to Sam about Saturday"
        className="mt-3 w-full bg-surface2 border border-line rounded-xl px-4 py-3 text-[16px] outline-none focus:border-accent"
      />
      <Button className="w-full mt-4" onClick={onSave} disabled={!text.trim()}>
        Park it
      </Button>
    </Modal>
  )
}

function CheckInScreen({
  defaultMinutes,
  deadlines,
  onStart,
  onCancel,
}: {
  defaultMinutes: number
  deadlines: { title: string; dateISO: string }[]
  onStart: (ci: CheckIn) => void
  onCancel: () => void
}) {
  const [minutes, setMinutes] = useState(defaultMinutes)
  const [energy, setEnergy] = useState<CheckIn['energy']>('ok')
  const soon = deadlines
    .map((d) => ({ ...d, days: calendarDaysUntil(d.dateISO, Date.now()) }))
    .filter((d) => d.days >= 0 && d.days <= 10)
    .sort((a, b) => a.days - b.days)[0]
  return (
    <div className="pt-safe min-h-dvh flex flex-col">
      <div className="flex items-center pt-3">
        <button type="button" aria-label="Cancel" onClick={onCancel} className="h-11 w-11 grid place-items-center rounded-full text-muted hover:bg-surface2">
          ✕
        </button>
      </div>
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full pb-20">
        <h1 className="font-display text-2xl font-bold">Quick check-in</h1>
        <p className="text-muted text-sm mt-1">30 seconds — it shapes what the coach hands you.</p>
        <div className="mt-6">
          <span className="text-sm font-medium text-muted flex items-center gap-1.5">
            <IconClock size={15} /> Time you actually have
          </span>
          <div className="flex gap-2 mt-2">
            {[10, 20, 25, 30, 45].map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setMinutes(m)}
                aria-pressed={minutes === m}
                className={`flex-1 min-h-12 rounded-xl border font-semibold text-[15px] transition-colors ${
                  minutes === m ? 'bg-accent text-bg border-accent' : 'bg-surface border-line text-muted hover:border-line-strong'
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5">
          <span className="text-sm font-medium text-muted">Energy right now</span>
          <div className="mt-2">
            <Segmented
              ariaLabel="Energy"
              value={energy}
              onChange={setEnergy}
              options={[
                { value: 'low', label: 'Running low' },
                { value: 'ok', label: 'Normal' },
                { value: 'high', label: 'Sharp' },
              ]}
            />
          </div>
        </div>
        {soon ? (
          <p className="text-[13px] text-warn mt-4 bg-warn-soft border border-warn/30 rounded-xl px-3 py-2">
            Heads-up: {soon.title} in {soon.days} day{soon.days === 1 ? '' : 's'} — the plan will lean toward it.
          </p>
        ) : null}
        <Button className="w-full mt-7" onClick={() => onStart({ minutes: minutes as CheckIn['minutes'] & number, energy, focus: null })}>
          Build my session
        </Button>
      </div>
    </div>
  )
}

function ExitScreen({
  principle,
  setPrinciple,
  onDone,
  planFor,
  onPlan,
  followUp,
  onFollowUp,
}: {
  principle: string
  setPrinciple: (s: string) => void
  onDone: () => void
  /** Skill name to offer an if-then plan for, or null. */
  planFor: string | null
  onPlan: (cue: string, action: string) => void
  followUp: FieldPlan | null
  onFollowUp: (outcome: FieldPlan['outcome']) => void
}) {
  const [cue, setCue] = useState('')
  const [action, setAction] = useState('')

  // The follow-up takes priority: it is one tap, and it closes a loop the app
  // opened. Never both in the same session — this is an exit, not a form.
  if (followUp) {
    return (
      <div className="pt-safe min-h-dvh flex flex-col max-w-md mx-auto w-full">
        <div className="flex-1 flex flex-col justify-center pb-20">
          <h1 className="font-display text-2xl font-bold">Did this come up?</h1>
          <p className="text-muted text-sm mt-1 leading-relaxed">
            You wrote this a couple of weeks ago. No wrong answer — this is not scored and does not affect your progress.
          </p>
          <Card className="mt-4 p-4">
            <p className="text-[15px] leading-relaxed">
              If <span className="text-accent font-medium">{followUp.cue}</span>, then{' '}
              <span className="text-accent font-medium">{followUp.action}</span>.
            </p>
          </Card>
          <Button className="w-full mt-5" onClick={() => onFollowUp('used')}>
            It came up, and I did it
          </Button>
          <Button kind="secondary" className="w-full mt-2" onClick={() => onFollowUp('noticed-too-late')}>
            It came up — I saw it afterwards
          </Button>
          <Button kind="ghost" className="w-full mt-2" onClick={() => onFollowUp('not-yet')}>
            Has not come up yet
          </Button>
        </div>
      </div>
    )
  }

  if (planFor) {
    const ready = cue.trim().length >= 3 && action.trim().length >= 3
    return (
      <div className="pt-safe min-h-dvh flex flex-col max-w-md mx-auto w-full">
        <div className="flex-1 flex flex-col justify-center pb-20">
          <h1 className="font-display text-2xl font-bold">Take {planFor} outside</h1>
          <p className="text-muted text-sm mt-1 leading-relaxed">
            You have held this one long enough to use it. Name a situation that actually recurs in your week, and the
            move you want it to trigger. Writing it is the whole exercise — nothing to come back and read.
          </p>
          <label className="block mt-4">
            <span className="text-[13px] font-medium text-muted">If…</span>
            <input
              value={cue}
              onChange={(e) => setCue(e.target.value.slice(0, 240))}
              placeholder="someone pushes me to decide right now"
              className="mt-1 w-full bg-surface border border-line rounded-xl px-4 py-3 text-[16px] outline-none focus:border-accent"
            />
          </label>
          <label className="block mt-3">
            <span className="text-[13px] font-medium text-muted">…then I</span>
            <input
              value={action}
              onChange={(e) => setAction(e.target.value.slice(0, 240))}
              placeholder="say I'll give an answer tomorrow"
              className="mt-1 w-full bg-surface border border-line rounded-xl px-4 py-3 text-[16px] outline-none focus:border-accent"
            />
          </label>
          <p className="text-[12px] text-faint mt-3 leading-snug">
            Not scored, and it changes no rung — real life cannot be machine-checked, so it is never treated as
            evidence. The app will ask once, in a couple of weeks, whether the situation came up.
          </p>
          <Button className="w-full mt-4" disabled={!ready} onClick={() => onPlan(cue.trim(), action.trim())}>
            Save the plan and finish
          </Button>
          <Button kind="ghost" className="w-full mt-2" onClick={onDone}>
            Not now
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-safe min-h-dvh flex flex-col max-w-md mx-auto w-full">
      <div className="flex-1 flex flex-col justify-center pb-20">
        <h1 className="font-display text-2xl font-bold">One thing worth keeping</h1>
        <p className="text-muted text-sm mt-1 leading-relaxed">
          Compress today into a single reusable principle — the act of writing it is retrieval practice in disguise.
        </p>
        <textarea
          value={principle}
          onChange={(e) => setPrinciple(e.target.value.slice(0, 400))}
          placeholder="e.g. Percent change always divides by the ORIGINAL value."
          rows={3}
          className="mt-4 w-full bg-surface border border-line rounded-xl px-4 py-3 text-[16px] outline-none focus:border-accent resize-none"
        />
        <Button className="w-full mt-5" onClick={onDone}>
          Finish session
        </Button>
        <Button kind="ghost" className="w-full mt-2" onClick={onDone}>
          Skip the note
        </Button>
      </div>
    </div>
  )
}
