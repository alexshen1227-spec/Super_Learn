/**
 * App state: one reducer, append-only events, derived everything.
 * Persistence: every dispatch schedules an IndexedDB write (debounced to the
 * microtask queue); localStorage only mirrors small states and preferences.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type {
  AppSettings,
  AppState,
  AttemptEvent,
  CoachDecision,
  ContentPackJson,
  Deadline,
  Forecast,
  PlacementResult,
  FieldPlan,
  ProblemReport,
  Profile,
  SessionRecord,
} from '../domain/types'
import { initialState } from '../domain/types'
import { deriveEvidence, formsRequired, STATE_LABEL, stateRank } from '../engine/mastery'
import { uid } from '../engine/rng'
import { sanitizeState } from './sanitize'
import { SKILL_BY_ID } from '../content/skills'
import {
  checkpointBackup,
  appendEventJournal,
  clearRealStash,
  loadEventJournal,
  loadState,
  readRealStash,
  requestPersistence,
  saveState,
  stashRealState,
  wipeAll,
  TAB_ID,
} from './persist'
import { buildSampleState } from '../content/sample'

export type Action =
  | { type: 'hydrate'; state: AppState }
  | { type: 'onboard'; profile: Profile; settings: AppSettings }
  | { type: 'update-profile'; profile: Partial<Profile> }
  | { type: 'update-settings'; settings: Partial<AppSettings> }
  | { type: 'add-deadline'; deadline: Deadline }
  | { type: 'remove-deadline'; id: string }
  | { type: 'append-events'; events: AttemptEvent[] }
  | { type: 'complete-session'; record: SessionRecord }
  | { type: 'log-decision'; decision: CoachDecision }
  | { type: 'add-forecast'; forecast: Forecast }
  | { type: 'revise-forecast'; id: string; probability: number }
  | { type: 'resolve-forecast'; id: string; outcome: boolean; note: string }
  | { type: 'add-report'; report: ProblemReport }
  | { type: 'clear-reports' }
  | { type: 'add-plan'; plan: FieldPlan }
  | { type: 'answer-plan'; id: string; outcome: FieldPlan['outcome']; t: number }
  | { type: 'set-placement'; placement: PlacementResult }
  | { type: 'add-pack'; pack: ContentPackJson }
  | { type: 'remove-pack'; id: string }
  | { type: 'replace'; state: AppState }

/**
 * Promotions are derived, but we log them as coach decisions when they
 * happen so the decision history reads as a narrative. Pure: computed by
 * diffing evidence before/after the appended events.
 */
function promotionDecisions(prev: AppState, nextEvents: AttemptEvent[], all: AttemptEvent[]): CoachDecision[] {
  const before = deriveEvidence(prev.events, Date.now())
  const after = deriveEvidence(all, Date.now())
  const out: CoachDecision[] = []
  const touched = new Set(nextEvents.flatMap((e) => e.skillIds))
  for (const skillId of touched) {
    const b = before.get(skillId)
    const a = after.get(skillId)
    if (!a) continue
    const bRank = b ? stateRank(b.state) : 0
    const skill = SKILL_BY_ID.get(skillId)
    const skillName = skill?.name ?? skillId
    if (stateRank(a.state) > bRank && stateRank(a.state) >= 3) {
      out.push({
        id: uid('cd'),
        t: Date.now(),
        kind: 'promotion',
        summary: `${skillName} advanced to ${STATE_LABEL[a.state]}.`,
        evidence:
          a.state === 'independent'
            ? [`${formsRequired(skill?.bucket ?? null)} unaided first-attempt successes on distinct question families (${a.independentForms.length} total).`]
            : a.state === 'retained'
              ? ['An unaided success at least 48 hours after the previous one.']
              : ['Success on a transfer item crossing two kinds of distance.'],
        confidence: 'medium',
        wouldChange: 'Misses on review would flag this skill for repair (the history stays visible).',
      })
    }
    if (b && !b.blockedByMisconception && a.blockedByMisconception) {
      out.push({
        id: uid('cd'),
        t: Date.now(),
        kind: 'review',
        summary: `${skillName}: a high-confidence miss now blocks promotion until repaired.`,
        evidence: ['Wrong first answer with stated confidence ≥ 80%.'],
        confidence: 'high',
        wouldChange: 'A fresh unaided success on this skill clears the block.',
      })
    }
  }
  return out
}

export function reduceState(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate':
    case 'replace':
      return action.state
    case 'onboard':
      return { ...state, onboarded: true, profile: action.profile, settings: action.settings }
    case 'update-profile':
      return { ...state, profile: { ...state.profile, ...action.profile } }
    case 'update-settings':
      return { ...state, settings: { ...state.settings, ...action.settings } }
    case 'add-deadline':
      return { ...state, deadlines: [...state.deadlines, action.deadline].slice(0, 40) }
    case 'remove-deadline':
      return { ...state, deadlines: state.deadlines.filter((d) => d.id !== action.id) }
    case 'append-events': {
      const known = new Set(state.events.map((event) => event.id))
      const fresh = action.events.filter((event) => !known.has(event.id))
      if (!fresh.length) return state
      const events = [...state.events, ...fresh]
      const decisions = promotionDecisions(state, fresh, events)
      return {
        ...state,
        events,
        coachLog: decisions.length ? [...state.coachLog, ...decisions].slice(-300) : state.coachLog,
      }
    }
    case 'complete-session':
      return state.sessions.some((session) => session.id === action.record.id)
        ? state
        : { ...state, sessions: [...state.sessions, action.record].slice(-2000) }
    case 'log-decision':
      return state.coachLog.some((decision) => decision.id === action.decision.id)
        ? state
        : { ...state, coachLog: [...state.coachLog, action.decision].slice(-300) }
    case 'add-forecast':
      return { ...state, forecasts: [...state.forecasts, action.forecast].slice(-200) }
    case 'revise-forecast':
      return {
        ...state,
        forecasts: state.forecasts.map((f) =>
          f.id === action.id && !f.resolved
            ? {
                ...f,
                probability: action.probability,
                revisions: [...f.revisions, { t: Date.now(), probability: action.probability }],
              }
            : f,
        ),
      }
    case 'resolve-forecast':
      return {
        ...state,
        forecasts: state.forecasts.map((f) =>
          f.id === action.id && !f.resolved
            ? { ...f, resolved: { outcome: action.outcome, resolvedAt: Date.now(), note: action.note } }
            : f,
        ),
      }
    case 'add-plan':
      // Capped like reports: a runaway list is a storage problem, not a feature.
      return { ...state, plans: [...state.plans, action.plan].slice(-100) }
    case 'answer-plan':
      return {
        ...state,
        plans: state.plans.map((p) =>
          p.id === action.id ? { ...p, outcome: action.outcome, askedAt: action.t } : p,
        ),
      }
    case 'add-report':
      return { ...state, reports: [...state.reports, action.report].slice(-200) }
    case 'clear-reports':
      // Reports are the learner's own notes-to-self about broken items, not
      // evidence — deleting them touches nothing derived. (Attempt events, by
      // contrast, are append-only and have no delete action on purpose.)
      return { ...state, reports: [] }
    case 'set-placement':
      return { ...state, placement: action.placement }
    case 'add-pack': {
      const others = state.customPacks.filter((p) => p.meta.id !== action.pack.meta.id)
      return { ...state, customPacks: [...others, action.pack].slice(0, 10) }
    }
    case 'remove-pack':
      return { ...state, customPacks: state.customPacks.filter((p) => p.meta.id !== action.id) }
  }
}

export interface StoreApi {
  state: AppState
  ready: boolean
  dispatch: (a: Action) => void
  /** Sample-data mode transitions (stash/restore real data). */
  enterSample: () => Promise<boolean>
  exitSample: () => Promise<boolean>
  resetAll: () => Promise<void>
  /** Force a durable checkpoint (called after session completion). */
  checkpoint: () => Promise<boolean>
  /** Apply related actions as one durable, idempotent state transition. */
  commit: (actions: Action[]) => Promise<boolean>
  /**
   * Another tab has written since this one loaded, so this tab's snapshot is
   * behind. Saving from here keeps its own attempt events (the append-only
   * journal is unioned back on the next launch) but would overwrite the other
   * tab's session records, deadlines and forecasts. Surfaced rather than
   * merged: a blind union would resurrect deleted deadlines and reports.
   */
  staleTab: boolean
}

const StoreCtx = createContext<StoreApi | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reduceState, undefined, initialState)
  const [ready, setReady] = useState(false)
  const stateRef = useRef(state)
  stateRef.current = state
  const dirty = useRef(false)
  const persistScheduled = useRef(false)
  const [staleTab, setStaleTab] = useState(false)

  // Another tab saved. The beacon carries the writer's id, so our own writes
  // are ignored and only a genuine second instance raises the flag.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'axiomlab.writer') return
      if (e.newValue && e.newValue !== TAB_ID) setStaleTab(true)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // hydrate once
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const loaded = await loadState()
      const journal = await loadEventJournal()
      if (cancelled) return
      let hydrated = initialState()
      if (loaded) hydrated = sanitizeState(JSON.parse(loaded.json))
      // Sample mode is a sealed sandbox. The journal belongs to the real
      // profile and must never leak real attempts into a persisted demo (or
      // demo attempts back into the real profile on the next launch).
      if (journal.length && !hydrated.sampleMode) {
        const known = new Set(hydrated.events.map((event) => event.id))
        hydrated = sanitizeState({
          ...hydrated,
          events: [...hydrated.events, ...journal.filter((event) => {
            const id = typeof event === 'object' && event !== null ? (event as { id?: unknown }).id : null
            return typeof id === 'string' && !known.has(id)
          })],
        })
      }
      dispatch({ type: 'hydrate', state: hydrated })
      // Upgrade older installs in place: their snapshot events seed the new
      // append-only journal once, after which writes are incremental.
      if (!hydrated.sampleMode) void appendEventJournal(hydrated.events)
      setReady(true)
      void requestPersistence()
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const dispatchSafe = useCallback((action: Action) => {
    if (action.type === 'append-events' && !stateRef.current.sampleMode) void appendEventJournal(action.events)
    dispatch(action)
  }, [])

  // persist on change (debounced to a macrotask so bursts collapse)
  useEffect(() => {
    if (!ready) return
    dirty.current = true
    if (persistScheduled.current) return
    persistScheduled.current = true
    setTimeout(() => {
      persistScheduled.current = false
      if (!dirty.current) return
      dirty.current = false
      void saveState(JSON.stringify(stateRef.current))
    }, 120)
  }, [state, ready])

  // flush on tab hide (the moment phones kill tabs)
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === 'hidden') void saveState(JSON.stringify(stateRef.current))
    }
    document.addEventListener('visibilitychange', flush)
    return () => document.removeEventListener('visibilitychange', flush)
  }, [])

  const enterSample = useCallback(async () => {
    /*
     * REFUSE IF ALREADY IN SAMPLE MODE. Running this twice would stash the
     * SAMPLE state over the real one — the stash is the only copy of the
     * learner's profile and history while the demo is loaded, so that is
     * permanent, total loss with no recovery path.
     *
     * Settings only offers this button when `sampleMode` is false, so it is
     * not reachable today. The guard is here because the cost of being wrong
     * about that is everything the learner has ever done, and the function
     * should not depend on every caller checking first.
     */
    if (stateRef.current.sampleMode) return false
    const stashed = await stashRealState(JSON.stringify(stateRef.current))
    if (!stashed) return false
    const sample = buildSampleState()
    dispatch({ type: 'replace', state: sample })
    return true
  }, [])

  const exitSample = useCallback(async () => {
    const real = await readRealStash()
    if (!real) return false
    let restored: AppState
    try {
      restored = sanitizeState(JSON.parse(real))
    } catch {
      return false
    }
    // Put the real state back into both live persistence and a checkpoint
    // before deleting the only stash that currently contains it.
    const saved = await saveState(JSON.stringify(restored))
    if (!saved) return false
    await checkpointBackup(JSON.stringify(restored))
    dispatch({ type: 'replace', state: restored })
    await clearRealStash()
    return true
  }, [])

  const resetAll = useCallback(async () => {
    await wipeAll()
    dispatch({ type: 'replace', state: initialState() })
  }, [])

  const checkpoint = useCallback(async () => {
    const json = JSON.stringify(stateRef.current)
    const saved = await saveState(json)
    await checkpointBackup(json)
    return saved
  }, [])

  const commit = useCallback(async (actions: Action[]) => {
    let next = stateRef.current
    for (const action of actions) next = reduceState(next, action)
    const appended = actions.flatMap((action) => action.type === 'append-events' ? action.events : [])
    if (appended.length && !next.sampleMode) await appendEventJournal(appended)
    const json = JSON.stringify(next)
    const saved = await saveState(json)
    await checkpointBackup(json)
    dispatch({ type: 'replace', state: next })
    return saved
  }, [])

  const api = useMemo<StoreApi>(
    () => ({ state, ready, dispatch: dispatchSafe, enterSample, exitSample, resetAll, checkpoint, commit, staleTab }),
    [state, ready, dispatchSafe, enterSample, exitSample, resetAll, checkpoint, commit, staleTab],
  )
  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStore outside provider')
  return ctx
}

/** Evidence derived from events, refreshed each minute (review dues move). */
export function useEvidence() {
  const { state } = useStore()
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])
  return useMemo(() => deriveEvidence(state.events, Date.now()), [state.events, tick])
}
