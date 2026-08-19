/**
 * Coach: the heart. Beliefs with evidence and uncertainty, the bottleneck,
 * decision history, forecast ledger, and knowledge-base search — all
 * deterministic, all explainable, no generative filler.
 */
import { useMemo, useState } from 'react'
import { useEvidence, useStore } from '../../store/store'
import { buildContentIndex } from '../../content/registry'
import { activityIntake, coachBeliefs, findBottleneck, weeklyObjective } from '../../engine/coach'
import { brierScore } from '../../engine/calibration'
import { searchKb, type KbCard } from '../../content/kb'
import { uid } from '../../engine/rng'
import type { CoachTone, Forecast } from '../../domain/types'
import { Button, Card, Chip, EmptyState, HeaderBar, Modal, SectionTitle, Segmented } from '../components'
import { Rich } from '../richtext'
import { useNav } from '../nav'
import { addLocalDaysISO, calendarDaysUntil } from '../../engine/time'

export function CoachScreen() {
  const { state, dispatch } = useStore()
  const evidence = useEvidence()
  const { go } = useNav()
  const index = useMemo(() => buildContentIndex(state.customPacks), [state.customPacks])
  const now = Date.now()
  const beliefs = useMemo(() => coachBeliefs(index, evidence, state, now), [index, evidence, state, now])
  const bottleneck = useMemo(() => findBottleneck(index, evidence, state), [index, evidence, state])
  const objective = useMemo(() => weeklyObjective(index, evidence, state, now), [index, evidence, state, now])
  const intake = useMemo(() => activityIntake(state.events, now), [state.events, now])
  const [query, setQuery] = useState('')
  const results = useMemo(() => (query.trim() ? searchKb(query) : []), [query])
  const [forecastOpen, setForecastOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)

  const openForecasts = state.forecasts.filter((f) => !f.resolved)
  const casesAwaitingResolution = state.reasoningCases.filter((reasoningCase) => reasoningCase.status === 'committed')
  const brier = brierScore(state.forecasts)

  return (
    <div>
      <HeaderBar title="Coach" subtitle="Every decision shows its evidence" />

      <Card className="mt-3 p-4 border-accent/30">
        <p className="text-[12px] font-semibold text-accent uppercase tracking-wide">This week</p>
        <p className="text-[15px] font-medium mt-1 leading-relaxed">{objective.replace(/^This week:\s*/i, '')}</p>
        {bottleneck ? (
          <>
            <p className="text-[13px] text-muted mt-2">
              <span className="font-semibold text-ink">Bottleneck:</span> {bottleneck.why}
            </p>
            {/* Naming the highest-leverage skill and then making the learner go
                find it is friction between insight and practice. One tap. */}
            <Button
              className="w-full mt-3"
              onClick={() => go({ name: 'session', launch: { kind: 'focus', skillId: bottleneck.skillId } })}
            >
              Work on {bottleneck.name} now
            </Button>
          </>
        ) : null}
      </Card>

      {casesAwaitingResolution.length ? (
        <Card className="mt-3 p-4 border-good/30" onClick={() => go({ name: 'practice', openWorkbench: true })}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold text-good uppercase tracking-wide">Close the loop</p>
              <p className="text-[14px] font-medium mt-1">
                {casesAwaitingResolution.length} reasoning case{casesAwaitingResolution.length === 1 ? '' : 's'} waiting for reality
              </p>
              <p className="text-[12px] text-muted mt-0.5">Compare the commitment with what happened before memory edits the prediction.</p>
            </div>
            <span className="text-accent text-lg" aria-hidden>→</span>
          </div>
        </Card>
      ) : null}

      <SectionTitle>What the coach is counting</SectionTitle>
      <Card className="p-4">
        {intake.total === 0 ? (
          <p className="text-[13px] text-muted leading-relaxed">
            Nothing in the last {intake.days} days yet. Every attempt counts here the moment it happens — daily
            sessions, anything launched from Practice, reviews, puzzles, and case files all feed the same evidence log.
          </p>
        ) : (
          <>
            <p className="text-[14px] leading-relaxed">
              Last {intake.days} days: <span className="font-semibold">{intake.total} attempts</span> across{' '}
              <span className="font-semibold">{intake.skillsTouched} skills</span> — every one counted, whether it came
              from a daily session, a Practice launch, a review, or a puzzle.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {intake.academic > 0 ? <Chip tone="accent">{intake.academic} academic</Chip> : null}
              {intake.labs > 0 ? <Chip tone="accent">{intake.labs} thinking-lab</Chip> : null}
              {intake.puzzles > 0 ? <Chip tone="accent">{intake.puzzles} puzzle</Chip> : null}
              {intake.reviews > 0 ? <Chip tone="warn">{intake.reviews} review</Chip> : null}
              {intake.transfers > 0 ? <Chip tone="good">{intake.transfers} transfer</Chip> : null}
              {intake.written > 0 ? <Chip tone="neutral">{intake.written} written</Chip> : null}
            </div>
            <p className="text-[12px] text-faint mt-2">
              {intake.graded} were deterministically graded — the only kind of attempt that can move a skill. Written
              artifacts are drafted, compared with a model, and never scored by the app or by you.
            </p>
          </>
        )}
      </Card>

      <SectionTitle>Model of you</SectionTitle>
      <div className="space-y-2.5">
        {beliefs.map((b) => (
          <Card key={b.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-[15px] leading-snug">{b.statement}</p>
              <Chip tone={b.confidence === 'high' ? 'good' : b.confidence === 'medium' ? 'accent' : 'warn'}>
                {b.confidence} conf.
              </Chip>
            </div>
            <ul className="mt-2 space-y-1">
              {b.evidence.map((e, i) => (
                <li key={i} className="text-[13px] text-muted flex gap-1.5">
                  <span className="text-faint shrink-0">·</span> {e}
                </li>
              ))}
            </ul>
            {b.unknown ? (
              <p className="text-[13px] text-faint mt-1.5">
                <span className="font-medium">Unknown:</span> {b.unknown}
              </p>
            ) : null}
            {b.resolve ? (
              <p className="text-[13px] text-accent/90 mt-1.5">
                <span className="font-medium">What would change this:</span> {b.resolve}
              </p>
            ) : null}
          </Card>
        ))}
      </div>

      <SectionTitle
        right={
          <button type="button" className="text-[13px] text-accent underline min-h-11 -my-2 px-1" onClick={() => setLogOpen(true)}>
            full log
          </button>
        }
      >
        Recent decisions
      </SectionTitle>
      {state.coachLog.length === 0 ? (
        <Card>
          <EmptyState title="No decisions yet" body="The coach logs every plan, difficulty change, and promotion here — with the evidence used." />
        </Card>
      ) : (
        <div className="space-y-2">
          {[...state.coachLog]
            .reverse()
            .slice(0, 3)
            .map((d) => (
              <Card key={d.id} className="p-3.5">
                <div className="flex items-center gap-2">
                  <Chip tone="neutral">{d.kind}</Chip>
                  <span className="text-[11px] text-faint">{new Date(d.t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <p className="text-[14px] mt-1.5">{d.summary}</p>
              </Card>
            ))}
        </div>
      )}

      <SectionTitle
        right={
          <button type="button" className="text-[13px] text-accent underline min-h-11 -my-2 px-1" onClick={() => setForecastOpen(true)}>
            new forecast
          </button>
        }
      >
        Forecast ledger
      </SectionTitle>
      <Card className="p-4">
        {state.forecasts.length === 0 ? (
          <p className="text-[13px] text-muted leading-relaxed">
            Make predictions with probabilities ("I'll score 85%+ on Friday's test — 70%") and resolve them when
            reality answers. Over time your Brier score shows whether your 70%s behave like 70%s.
          </p>
        ) : (
          <>
            {brier ? (
              <p className="text-[13px] text-muted mb-3">
                Brier score <span className="font-mono font-semibold text-ink">{brier.score.toFixed(2)}</span> across{' '}
                {brier.n} resolved (0 = oracle, 0.25 = coin-flip guessing).
              </p>
            ) : null}
            <div className="space-y-2.5">
              {[...state.forecasts]
                .reverse()
                .slice(0, 4)
                .map((f) => (
                  <ForecastRow
                    key={f.id}
                    f={f}
                    onResolve={(outcome) => dispatch({ type: 'resolve-forecast', id: f.id, outcome, note: '' })}
                    onRevise={(probability) => dispatch({ type: 'revise-forecast', id: f.id, probability })}
                  />
                ))}
            </div>
            {openForecasts.length === 0 && state.forecasts.length > 0 ? (
              <p className="text-[12px] text-faint mt-2">All resolved — add the next one.</p>
            ) : null}
          </>
        )}
      </Card>

      <SectionTitle>Ask the knowledge base</SectionTitle>
      <Card className="p-4 mb-2">
        <input
          type="search"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search concepts — slope, base rates, pre-mortem…"
          aria-label="Search the knowledge base"
          className="w-full bg-surface2 border border-line rounded-xl px-4 py-3 text-[15px] outline-none focus:border-accent"
        />
        {results.length ? (
          <div className="mt-3 space-y-2.5">
            {results.map((r) => (
              <KbResult key={r.skillId} card={r} onPractice={() => go({ name: 'session', launch: { kind: 'focus', skillId: r.skillId } })} />
            ))}
          </div>
        ) : query.trim() ? (
          <p className="text-[13px] text-faint mt-3">No card matches — the knowledge base covers the skills on your Path.</p>
        ) : null}
      </Card>

      <SectionTitle>Coach style</SectionTitle>
      <Card className="p-4 mb-6">
        <p className="text-[13px] text-muted mb-2">Tone shapes wording, never the evidence.</p>
        <Segmented<CoachTone>
          ariaLabel="Coach tone"
          value={state.profile.coachTone}
          onChange={(v) => dispatch({ type: 'update-profile', profile: { coachTone: v } })}
          options={[
            { value: 'concise', label: 'Concise' },
            { value: 'socratic', label: 'Socratic' },
            { value: 'supportive', label: 'Supportive' },
            { value: 'balanced', label: 'Balanced' },
          ]}
        />
      </Card>

      <NewForecast open={forecastOpen} onClose={() => setForecastOpen(false)} />
      <DecisionLog open={logOpen} onClose={() => setLogOpen(false)} />
    </div>
  )
}

function ForecastRow({
  f,
  onResolve,
  onRevise,
}: {
  f: Forecast
  onResolve: (outcome: boolean) => void
  onRevise: (probability: number) => void
}) {
  const overdue = !f.resolved && calendarDaysUntil(f.dueISO, Date.now()) < 0
  const [editing, setEditing] = useState(false)
  const [nextProbability, setNextProbability] = useState(Math.round(f.probability * 100))
  return (
    <div className="border border-line rounded-xl p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[14px] leading-snug">{f.question}</p>
        <Chip tone={f.resolved ? (f.resolved.outcome ? 'good' : 'bad') : overdue ? 'warn' : 'accent'}>
          {f.resolved ? (f.resolved.outcome ? 'happened' : 'did not') : `${Math.round(f.probability * 100)}%`}
        </Chip>
      </div>
      {f.resolved ? (
        <p className="text-[12px] text-faint mt-1">
          Brier {( (f.probability - (f.resolved.outcome ? 1 : 0)) ** 2 ).toFixed(2)}
          {f.resolved.note ? ` · ${f.resolved.note}` : ''}
        </p>
      ) : (
        <>
          {editing ? (
            <div className="mt-2 p-2.5 rounded-lg bg-surface2 border border-line">
              <div className="flex items-center justify-between text-[12px] text-muted">
                <span>Revised estimate</span>
                <span className="font-mono text-ink">{nextProbability}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={95}
                step={5}
                value={nextProbability}
                aria-label="Revised forecast probability"
                onChange={(event) => setNextProbability(Number(event.target.value))}
                className="w-full mt-2 accent-accent"
              />
              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  className="text-[12px] text-accent underline min-h-11"
                  onClick={() => {
                    onRevise(nextProbability / 100)
                    setEditing(false)
                  }}
                >
                  Save revision
                </button>
                <button type="button" className="text-[12px] text-faint underline min-h-11" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : null}
          <div className="flex gap-2 mt-2 flex-wrap items-center">
            <button type="button" className="text-[13px] text-good underline min-h-11" onClick={() => onResolve(true)}>
              It happened
            </button>
            <button type="button" className="text-[13px] text-bad underline min-h-11" onClick={() => onResolve(false)}>
              It didn't
            </button>
            <button type="button" className="text-[12px] text-accent underline min-h-11" onClick={() => setEditing(true)}>
              Revise estimate
            </button>
            <span className="text-[12px] text-faint ml-auto">due {f.dueISO}</span>
          </div>
          {f.revisions.length ? <p className="text-[11px] text-faint">{f.revisions.length} earlier revision{f.revisions.length === 1 ? '' : 's'} kept in the ledger</p> : null}
        </>
      )}
    </div>
  )
}

function KbResult({ card, onPractice }: { card: KbCard; onPractice: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-line rounded-xl overflow-hidden">
      <button type="button" className="w-full min-h-11 text-left px-3.5 py-2.5 flex items-center justify-between" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="font-medium text-[14px]">{card.title}</span>
        <span className={`text-faint transition-transform ${open ? 'rotate-90' : ''}`} aria-hidden>›</span>
      </button>
      {open ? (
        <div className="px-3.5 pb-3 border-t border-line pt-2.5">
          <Rich text={card.card} className="text-[14px]" />
          <button type="button" className="text-[13px] text-accent underline mt-2 min-h-11" onClick={onPractice}>
            Practice this skill
          </button>
        </div>
      ) : null}
    </div>
  )
}

function NewForecast({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dispatch } = useStore()
  const [question, setQuestion] = useState('')
  const [prob, setProb] = useState(70)
  const [due, setDue] = useState(() => addLocalDaysISO(Date.now(), 7))
  return (
    <Modal open={open} onClose={onClose} title="New forecast">
      <p className="text-[13px] text-muted">
        Make it checkable: a clear event, a date, a probability. Vague predictions can't teach calibration.
      </p>
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value.slice(0, 200))}
        placeholder='e.g. "I will finish the essay by Sunday night"'
        className="mt-3 w-full bg-surface2 border border-line rounded-xl px-4 py-3 text-[15px] outline-none focus:border-accent"
      />
      <label className="block mt-4">
        <span className="text-[13px] text-muted font-medium">
          Probability: <span className="font-mono text-ink">{prob}%</span>
        </span>
        <input type="range" min={5} max={95} step={5} value={prob} onChange={(e) => setProb(Number(e.target.value))} className="w-full mt-1" aria-label="Probability" />
      </label>
      <label className="block mt-3">
        <span className="text-[13px] text-muted font-medium">Resolves by</span>
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="mt-1 w-full bg-surface2 border border-line rounded-xl px-4 py-2.5 text-[15px] outline-none focus:border-accent" />
      </label>
      <Button
        className="w-full mt-4"
        disabled={question.trim().length < 8}
        onClick={() => {
          dispatch({
            type: 'add-forecast',
            forecast: { id: uid('fc'), createdAt: Date.now(), question: question.trim(), probability: prob / 100, dueISO: due, resolved: null, revisions: [] },
          })
          setQuestion('')
          onClose()
        }}
      >
        Log it
      </Button>
    </Modal>
  )
}

function DecisionLog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useStore()
  return (
    <Modal open={open} onClose={onClose} title="Coach decision log" wide>
      {state.coachLog.length === 0 ? (
        <p className="text-muted text-sm">Nothing yet.</p>
      ) : (
        <div className="space-y-2.5">
          {[...state.coachLog].reverse().map((d) => (
            <div key={d.id} className="border border-line rounded-xl p-3.5">
              <div className="flex items-center gap-2">
                <Chip tone="neutral">{d.kind}</Chip>
                <Chip tone={d.confidence === 'high' ? 'good' : d.confidence === 'medium' ? 'accent' : 'warn'}>{d.confidence}</Chip>
                <span className="text-[11px] text-faint ml-auto">{new Date(d.t).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
              </div>
              <p className="text-[14px] mt-1.5 font-medium">{d.summary}</p>
              {d.evidence.length ? (
                <ul className="mt-1 space-y-0.5">
                  {d.evidence.map((e, i) => (
                    <li key={i} className="text-[13px] text-muted">
                      · {e}
                    </li>
                  ))}
                </ul>
              ) : null}
              {d.wouldChange ? <p className="text-[12px] text-faint mt-1">Would change if: {d.wouldChange}</p> : null}
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
