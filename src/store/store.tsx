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
import { deriveEvidence, STATE_LABEL, stateRank } from '../engine/mastery'
import { uid } from '../engine/rng'
import { sanitizeState } from './sanitize'
import { SKILL_BY_ID } from '../content/skills'
import {
  checkpointBackup,
  clearRealStash,
  loadState,
  readRealStash,
  requestPersistence,
  saveState,
  stashRealState,
  wipeAll,
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
    const skillName = SKILL_BY_ID.get(skillId)?.name ?? skillId
    if (stateRank(a.state) > bRank && stateRank(a.state) >= 3) {
      out.push({
        id: uid('cd'),
        t: Date.now(),
        kind: 'promotion',
        summary: `${skillName} advanced to ${STATE_LABEL[a.state]}.`,
        evidence:
          a.state === 'independent'
            ? [`Two unaided first-attempt successes on distinct forms (${a.independentForms.length} total).`]
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

function reducer(state: AppState, action: Action): AppState {
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
      if (!action.events.length) return state
      const events = [...state.events, ...action.events]
      const decisions = promotionDecisions(state, action.events, events)
      return {
        ...state,
        events,
        coachLog: decisions.length ? [...state.coachLog, ...decisions].slice(-300) : state.coachLog,
      }
    }
    case 'complete-session':
      return { ...state, sessions: [...state.sessions, action.record].slice(-2000) }
    case 'log-decision':
      return { ...state, coachLog: [...state.coachLog, action.decision].slice(-300) }
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
  enterSample: () => Promise<void>
  exitSample: () => Promise<void>
  resetAll: () => Promise<void>
  /** Force a durable checkpoint (called after session completion). */
  checkpoint: () => void
}

const StoreCtx = createContext<StoreApi | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const [ready, setReady] = useState(false)
  const stateRef = useRef(state)
  stateRef.current = state
  const dirty = useRef(false)
  const persistScheduled = useRef(false)

  // hydrate once
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const loaded = await loadState()
      if (cancelled) return
      if (loaded) {
        try {
          dispatch({ type: 'hydrate', state: sanitizeState(JSON.parse(loaded.json)) })
        } catch {
          /* fresh start */
        }
      }
      setReady(true)
      void requestPersistence()
    })()
    return () => {
      cancelled = true
    }
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
    await stashRealState(JSON.stringify(stateRef.current))
    const sample = buildSampleState()
    dispatch({ type: 'replace', state: sample })
  }, [])

  const exitSample = useCallback(async () => {
    const real = await readRealStash()
    if (real !== null) {
      try {
        dispatch({ type: 'replace', state: sanitizeState(JSON.parse(real)) })
      } catch {
        dispatch({ type: 'replace', state: initialState() })
      }
    } else {
      dispatch({ type: 'replace', state: initialState() })
    }
    await clearRealStash()
  }, [])

  const resetAll = useCallback(async () => {
    await wipeAll()
    dispatch({ type: 'replace', state: initialState() })
  }, [])

  const checkpoint = useCallback(() => {
    void checkpointBackup(JSON.stringify(stateRef.current))
  }, [])

  const api = useMemo<StoreApi>(
    () => ({ state, ready, dispatch, enterSample, exitSample, resetAll, checkpoint }),
    [state, ready, enterSample, exitSample, resetAll, checkpoint],
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
