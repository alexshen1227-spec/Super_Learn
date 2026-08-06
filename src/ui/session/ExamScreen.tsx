/**
 * Exam Simulator: blind, timed (softly), cumulative. No hints, no per-item
 * feedback — grading happens at the end, followed by a post-mortem where
 * every miss gets an explanation and an error tag before the evidence lands.
 * Crash-safe via a lightweight exam draft.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useEvidence, useStore } from '../../store/store'
import { useNav } from '../nav'
import { buildContentIndex } from '../../content/registry'
import { buildExam, EXAM_SIZES, type ExamItem, type ExamSize } from '../../engine/exam'
import { describeAnswer, validate, validatorName } from '../../engine/validate'
import { uid } from '../../engine/rng'
import type { AttemptEvent, ErrorTag, RenderedItem } from '../../domain/types'
import { ERROR_TAGS } from '../../domain/types'
import { Button, Card, Chip, Confirm } from '../components'
import { Rich } from '../richtext'
import { AnswerInput } from './ItemPlayer'

const DRAFT_KEY = 'axiomlab.exam'

interface ExamDraft {
  items: ExamItem[]
  responses: string[]
  idx: number
  startedAt: number
  suggestedMinutes: number
}

function loadExamDraft(): ExamDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const d = JSON.parse(raw) as ExamDraft
    if (!Array.isArray(d.items) || !Array.isArray(d.responses) || typeof d.idx !== 'number') return null
    if (Date.now() - d.startedAt > 6 * 3_600_000) return null
    return d
  } catch {
    return null
  }
}
function saveExamDraft(d: ExamDraft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d))
  } catch {
    /* best effort */
  }
}
function clearExamDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    /* nothing */
  }
}

type Phase = 'setup' | 'run' | 'postmortem' | 'summary'

interface GradedItem {
  item: RenderedItem
  response: string
  correct: boolean
  tag: ErrorTag | null
}

export function ExamScreen() {
  const { state, dispatch, checkpoint } = useStore()
  const evidence = useEvidence()
  const { go } = useNav()
  const index = useMemo(() => buildContentIndex(state.customPacks), [state.customPacks])
  const [phase, setPhase] = useState<Phase>('setup')
  const [items, setItems] = useState<ExamItem[]>([])
  const [responses, setResponses] = useState<string[]>([])
  const [idx, setIdx] = useState(0)
  const [suggestedMinutes, setSuggestedMinutes] = useState(15)
  const [buildError, setBuildError] = useState<string | null>(null)
  const [graded, setGraded] = useState<GradedItem[]>([])
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startedAt = useRef(Date.now())
  const resumable = useMemo(() => loadExamDraft(), [])

  useEffect(() => {
    if (phase !== 'run') return
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') setElapsed((e) => e + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [phase])

  const rendered: RenderedItem | null = useMemo(() => {
    const it = items[idx]
    if (!it) return null
    const t = index.templates.get(it.templateId)
    return t ? t.generate(it.seed) : null
  }, [items, idx, index])

  const start = (size: ExamSize) => {
    const result = buildExam(state, evidence, index, size, Math.floor(Math.random() * 0x7fffffff))
    if (!result.ok) {
      setBuildError(result.reason)
      return
    }
    setItems(result.plan.items)
    setResponses(new Array(result.plan.items.length).fill(''))
    setSuggestedMinutes(result.plan.suggestedMinutes)
    setIdx(0)
    setElapsed(0)
    startedAt.current = Date.now()
    saveExamDraft({ items: result.plan.items, responses: new Array(result.plan.items.length).fill(''), idx: 0, startedAt: Date.now(), suggestedMinutes: result.plan.suggestedMinutes })
    setPhase('run')
  }

  const resume = () => {
    if (!resumable) return
    const valid = resumable.items.every((it) => index.templates.has(it.templateId))
    if (!valid) {
      clearExamDraft()
      setBuildError('That paused exam referenced content from an older version — start a fresh one.')
      return
    }
    setItems(resumable.items)
    setResponses(resumable.responses)
    setIdx(resumable.idx)
    setSuggestedMinutes(resumable.suggestedMinutes)
    startedAt.current = resumable.startedAt
    setElapsed(Math.max(0, Math.round((Date.now() - resumable.startedAt) / 1000)))
    setPhase('run')
  }

  const setResponse = (v: string) => {
    setResponses((prev) => {
      const next = [...prev]
      next[idx] = v
      saveExamDraft({ items, responses: next, idx, startedAt: startedAt.current, suggestedMinutes })
      return next
    })
  }

  const next = () => {
    if (idx + 1 < items.length) {
      const ni = idx + 1
      setIdx(ni)
      saveExamDraft({ items, responses, idx: ni, startedAt: startedAt.current, suggestedMinutes })
    } else {
      grade()
    }
  }

  const grade = () => {
    const g: GradedItem[] = items.map((it, i) => {
      const t = index.templates.get(it.templateId)!
      const item = t.generate(it.seed)
      const response = responses[i] ?? ''
      // Blanks are unanswered, never graded (belt to the validator's braces).
      const ok = item.answer && response.trim() !== '' ? validate(item.answer, response).ok : false
      return { item, response, correct: ok, tag: null }
    })
    setGraded(g)
    setPhase('postmortem')
  }

  const finish = () => {
    // Evidence lands now, tags included — one honest batch.
    const perItemSec = Math.max(10, Math.round(elapsed / Math.max(1, items.length)))
    const events: AttemptEvent[] = graded.map((g, i) => {
      const t = index.templates.get(items[i].templateId)!
      return {
        id: uid('e'),
        t: Date.now(),
        sessionId: 'exam',
        templateId: t.id,
        itemVersion: t.version,
        seed: items[i].seed,
        skillIds: t.skillIds,
        bucket: t.bucket,
        mode: 'exam',
        firstResponse: g.response.slice(0, 500),
        finalResponse: g.response.slice(0, 500),
        correct: g.correct,
        firstCorrect: g.correct,
        score: null,
        validator: g.item.answer ? validatorName(g.item.answer) : 'unknown',
        hintLevel: 0,
        confidence: null,
        elapsedSec: perItemSec,
        errorTags: g.tag ? [g.tag] : [],
        difficulty: t.difficulty,
      }
    })
    dispatch({ type: 'append-events', events })
    dispatch({
      type: 'log-decision',
      decision: {
        id: uid('cd'),
        t: Date.now(),
        kind: 'review',
        summary: `Exam simulator: ${graded.filter((g) => g.correct).length}/${graded.length} under test conditions — misses feed the Error Clinic.`,
        evidence: [`${Math.round(elapsed / 60)} focused minutes, blind grading, no hints.`],
        confidence: 'high',
        wouldChange: 'Exam evidence counts like independent practice: unaided, first-attempt, novel variants.',
      },
    })
    clearExamDraft()
    checkpoint()
    setPhase('summary')
  }

  // ---------------- phases ----------------
  if (phase === 'setup') {
    return (
      <div className="pt-safe max-w-md mx-auto min-h-dvh flex flex-col justify-center pb-16">
        <h1 className="font-display text-2xl font-bold">Exam simulator</h1>
        <p className="text-muted mt-2 leading-relaxed text-[15px]">
          Test conditions: questions from <span className="text-ink font-medium">everything you've practiced</span>,
          mixed order, no hints, graded only at the end. The timer is a pacing aid — it never cuts you off.
        </p>
        {resumable ? (
          <Button className="w-full mt-5" onClick={resume}>
            Resume paused exam ({resumable.idx + 1}/{resumable.items.length})
          </Button>
        ) : null}
        <div className="space-y-2 mt-5">
          {(Object.keys(EXAM_SIZES) as ExamSize[]).map((s) => (
            <Button key={s} kind={s === 'standard' ? 'primary' : 'secondary'} className="w-full" onClick={() => start(s)}>
              {EXAM_SIZES[s].label}
            </Button>
          ))}
        </div>
        {buildError ? <p className="text-warn text-[13px] mt-3 leading-relaxed">{buildError}</p> : null}
        <Button kind="ghost" className="w-full mt-3" onClick={() => go({ name: 'practice' })}>
          Back
        </Button>
      </div>
    )
  }

  if (phase === 'run' && rendered) {
    const overSoft = elapsed > suggestedMinutes * 60
    const answered = responses.filter((r) => r.trim() !== '').length
    return (
      <div className="pt-safe min-h-dvh flex flex-col max-w-xl mx-auto w-full">
        <div className="sticky top-0 z-30 bg-bg/95 backdrop-blur pt-2 pb-2 -mx-4 px-4 border-b border-line">
          <div className="flex items-center gap-3">
            <button aria-label="Leave exam" onClick={() => setLeaveOpen(true)} className="h-9 w-9 grid place-items-center rounded-full text-muted hover:bg-surface2 shrink-0">
              ✕
            </button>
            <div className="flex-1">
              <div className="flex justify-between text-[13px] font-medium">
                <span>Question {idx + 1} of {items.length}</span>
                <span className={`font-mono ${overSoft ? 'text-warn' : 'text-muted'}`}>
                  {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')} / ~{suggestedMinutes}m
                </span>
              </div>
              <div className="mt-1 h-1 rounded-full bg-surface3 overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-[width]" style={{ width: `${((idx + 1) / items.length) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 pb-8 anim-in" key={idx}>
          <Card className="p-4 mt-4">
            <Rich text={rendered.prompt} className="text-[16px]" />
          </Card>
          <div className="mt-4">
            {rendered.answer ? (
              <AnswerInput spec={rendered.answer} value={responses[idx] ?? ''} onChange={setResponse} onSubmit={next} />
            ) : null}
          </div>
          <div className="flex gap-2 mt-4">
            {idx > 0 ? (
              <Button kind="secondary" onClick={() => setIdx(idx - 1)}>
                Back
              </Button>
            ) : null}
            <Button className="flex-1" onClick={next}>
              {idx + 1 < items.length ? (responses[idx]?.trim() ? 'Next' : 'Skip for now') : `Finish & grade (${answered}/${items.length} answered)`}
            </Button>
          </div>
          <p className="text-[12px] text-faint mt-3">
            No hints in exam mode — flag what you're unsure of in your head and keep moving, like the real thing.
          </p>
        </div>
        <Confirm
          open={leaveOpen}
          onCancel={() => setLeaveOpen(false)}
          onConfirm={() => {
            saveExamDraft({ items, responses, idx, startedAt: startedAt.current, suggestedMinutes })
            go({ name: 'practice' })
          }}
          title="Pause the exam?"
          body="Your answers so far are saved — resume from the exam screen. (Nothing is graded until you finish.)"
          confirmLabel="Pause & leave"
        />
      </div>
    )
  }

  if (phase === 'postmortem') {
    const score = graded.filter((g) => g.correct).length
    return (
      <div className="pt-safe max-w-xl mx-auto pb-10">
        <h1 className="font-display text-2xl font-bold pt-6">
          Post-mortem · {score}/{graded.length}
        </h1>
        <p className="text-muted text-sm mt-1 leading-relaxed">
          The exam isn't over at the grade — it's over when every miss has a cause. Tag your errors; they route the
          Error Clinic.
        </p>
        <div className="space-y-3 mt-4">
          {graded.map((g, i) => (
            <PostMortemItem key={i} n={i + 1} g={g} onTag={(tag) => setGraded((prev) => prev.map((x, j) => (j === i ? { ...x, tag } : x)))} />
          ))}
        </div>
        <Button className="w-full mt-5" onClick={finish}>
          Log the evidence
        </Button>
      </div>
    )
  }

  if (phase === 'summary') {
    const score = graded.filter((g) => g.correct).length
    const pct = Math.round((score / Math.max(1, graded.length)) * 100)
    return (
      <div className="pt-safe max-w-md mx-auto anim-in">
        <div className="pt-10 text-center">
          <p className="font-display text-4xl font-bold">{pct}%</p>
          <h1 className="font-display text-xl font-bold mt-1">
            {score}/{graded.length} under test conditions
          </h1>
          <p className="text-muted mt-2 text-sm leading-relaxed">
            Exam evidence is the strong kind: unaided, first-attempt, mixed context. Misses (and their tags) are now in
            the Error Clinic queue; repaired skills will return in future reviews and exams.
          </p>
        </div>
        <Button className="w-full mt-6" onClick={() => go({ name: 'today' })}>
          Done
        </Button>
        <Button kind="ghost" className="w-full mt-2" onClick={() => { setPhase('setup'); setGraded([]) }}>
          Another exam
        </Button>
      </div>
    )
  }

  return null
}

function PostMortemItem({ n, g, onTag }: { n: number; g: GradedItem; onTag: (t: ErrorTag) => void }) {
  const [open, setOpen] = useState(!g.correct)
  return (
    <Card className={`overflow-hidden ${g.correct ? '' : 'border-warn/40'}`}>
      <button className="w-full text-left px-4 py-3 flex items-center gap-3" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className={`h-6 w-6 rounded-full grid place-items-center text-[12px] font-bold shrink-0 ${g.correct ? 'bg-good-soft text-good' : 'bg-warn-soft text-warn'}`}>
          {g.correct ? '✓' : '✗'}
        </span>
        <span className="text-[14px] font-medium flex-1 truncate">Q{n} · {g.item.title}</span>
        <span className={`text-faint transition-transform ${open ? 'rotate-90' : ''}`} aria-hidden>›</span>
      </button>
      {open ? (
        <div className="px-4 pb-4 border-t border-line pt-3">
          <Rich text={g.item.prompt} className="text-[14px] text-muted" />
          <p className="text-[13px] mt-2">
            Your answer: <span className="font-mono">{g.response.trim() === '' ? '(blank)' : g.response}</span>
            {!g.correct && g.item.answer ? (
              <>
                {' · '}Correct: <span className="font-mono font-semibold">{describeAnswer(g.item.answer)}</span>
              </>
            ) : null}
          </p>
          {g.item.answer?.type === 'mcq' && !g.correct && g.item.distractorNotes?.[Number(g.response)] ? (
            <div className="mt-2 bg-warn-soft border border-warn/30 rounded-lg px-3 py-2">
              <p className="text-[11px] font-semibold text-warn uppercase tracking-wide mb-0.5">Named trap</p>
              <p className="text-[13px] text-warn leading-snug">{g.item.distractorNotes[Number(g.response)]}</p>
            </div>
          ) : null}
          <div className="mt-2 pt-2 border-t border-line">
            <Rich text={g.item.explanation} className="text-[14px]" />
          </div>
          {!g.correct ? (
            <div className="mt-3">
              <p className="text-[12px] font-medium text-muted mb-1.5">What kind of error?</p>
              <div className="flex flex-wrap gap-1.5">
                {ERROR_TAGS.filter((t) => ['concept', 'strategy', 'slip', 'misread', 'unknown'].includes(t.id)).map((t) => (
                  <button key={t.id} onClick={() => onTag(t.id)} aria-pressed={g.tag === t.id} title={t.hint}>
                    <Chip tone={g.tag === t.id ? 'warn' : 'neutral'} className="cursor-pointer !py-1.5">
                      {t.name}
                    </Chip>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  )
}
