/**
 * State sanitization: every path that loads external JSON (disk import, IDB
 * after a version change, localStorage mirror) rebuilds a valid AppState
 * field by field. Malformed entries are DROPPED, not passed through — every
 * validated field is assigned unconditionally, because spreading unknown
 * input and overriding conditionally silently re-admits exactly the bad
 * values this exists to reject.
 */
import type {
  AgeBand,
  AppSettings,
  AppState,
  AttemptEvent,
  AttemptMode,
  BucketId,
  CoachDecision,
  CoachTone,
  ContentPackJson,
  Deadline,
  ErrorTag,
  Forecast,
  PlacementResult,
  ProblemReport,
  Profile,
  SessionRecord,
} from '../domain/types'
import {
  BUCKETS,
  DEFAULT_ALLOCATIONS,
  STATE_VERSION,
  defaultProfile,
  defaultSettings,
  initialState,
} from '../domain/types'
import { validatePack } from '../engine/contentSchema'

const BUCKET_IDS = new Set<string>(BUCKETS.map((b) => b.id))
const MODES = new Set<AttemptMode>(['guided', 'independent', 'review', 'transfer', 'placement'])
const TONES = new Set<CoachTone>(['concise', 'socratic', 'challenging', 'supportive', 'balanced'])
const AGE_BANDS = new Set<AgeBand>(['under13', '13-17', '18plus', 'unspecified'])
const ERROR_TAG_SET = new Set<ErrorTag>([
  'concept', 'strategy', 'slip', 'misread', 'representation', 'inference',
  'overconfident', 'underconfident', 'incomplete', 'unknown',
])
const SESSION_MINUTES = new Set([10, 20, 25, 30, 45])

const str = (v: unknown, fallback = '', max = 4000): string =>
  typeof v === 'string' ? v.slice(0, max) : fallback
const num = (v: unknown, lo: number, hi: number, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback)
const strArray = (v: unknown, maxItems = 50, maxLen = 400): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, maxItems).map((s) => s.slice(0, maxLen)) : []

function sanitizeProfile(raw: unknown): Profile {
  const d = defaultProfile()
  if (typeof raw !== 'object' || raw === null) return d
  const p = raw as Record<string, unknown>
  return {
    name: str(p.name, '', 60),
    ageBand: AGE_BANDS.has(p.ageBand as AgeBand) ? (p.ageBand as AgeBand) : d.ageBand,
    gradeLevel: p.gradeLevel === null ? null : num(p.gradeLevel, 5, 12, 8),
    courses: strArray(p.courses, 12, 80),
    goals: strArray(p.goals, 12, 200),
    strongAreas: strArray(p.strongAreas, 12, 80),
    weakAreas: strArray(p.weakAreas, 12, 80),
    chessExperience: ['none', 'casual', 'experienced'].includes(p.chessExperience as string)
      ? (p.chessExperience as Profile['chessExperience'])
      : d.chessExperience,
    coachTone: TONES.has(p.coachTone as CoachTone) ? (p.coachTone as CoachTone) : d.coachTone,
    sessionMinutes: SESSION_MINUTES.has(p.sessionMinutes as number)
      ? (p.sessionMinutes as Profile['sessionMinutes'])
      : d.sessionMinutes,
    activeDays: Array.isArray(p.activeDays)
      ? [...new Set(p.activeDays.filter((x): x is number => Number.isInteger(x) && (x as number) >= 0 && (x as number) <= 6))]
      : d.activeDays,
  }
}

function sanitizeSettings(raw: unknown): AppSettings {
  const d = defaultSettings()
  if (typeof raw !== 'object' || raw === null) return d
  const s = raw as Record<string, unknown>
  const allocations = { ...DEFAULT_ALLOCATIONS }
  if (typeof s.allocations === 'object' && s.allocations !== null) {
    for (const [k, v] of Object.entries(s.allocations as Record<string, unknown>)) {
      if (BUCKET_IDS.has(k)) allocations[k as BucketId] = num(v, 0, 100, DEFAULT_ALLOCATIONS[k as BucketId])
    }
  }
  const qh = s.quietHours as Record<string, unknown> | null | undefined
  return {
    theme: ['light', 'dark', 'system'].includes(s.theme as string) ? (s.theme as AppSettings['theme']) : d.theme,
    textSpacing: bool(s.textSpacing, d.textSpacing),
    allocations,
    confidencePrompts: ['normal', 'minimal'].includes(s.confidencePrompts as string)
      ? (s.confidencePrompts as AppSettings['confidencePrompts'])
      : d.confidencePrompts,
    quietHours:
      typeof qh === 'object' && qh !== null
        ? { start: num(qh.start, 0, 23, 21), end: num(qh.end, 0, 23, 7) }
        : null,
  }
}

function sanitizeEvent(raw: unknown): AttemptEvent | null {
  if (typeof raw !== 'object' || raw === null) return null
  const e = raw as Record<string, unknown>
  const templateId = str(e.templateId, '', 80)
  const bucket = e.bucket as string
  if (!templateId || !BUCKET_IDS.has(bucket)) return null
  const t = num(e.t, 0, 4102444800000, NaN)
  if (Number.isNaN(t)) return null
  const skillIds = strArray(e.skillIds, 8, 60)
  if (!skillIds.length) return null
  const correct = typeof e.correct === 'boolean' ? e.correct : null
  const firstCorrect = typeof e.firstCorrect === 'boolean' ? e.firstCorrect : null
  return {
    id: str(e.id, `imp${Math.random().toString(36).slice(2, 10)}`, 40),
    t,
    sessionId: typeof e.sessionId === 'string' ? e.sessionId.slice(0, 40) : null,
    templateId,
    itemVersion: num(e.itemVersion, 0, 9999, 1),
    seed: num(e.seed, 0, 0x7fffffff, 0),
    skillIds,
    bucket: bucket as BucketId,
    mode: MODES.has(e.mode as AttemptMode) ? (e.mode as AttemptMode) : 'independent',
    firstResponse: str(e.firstResponse, '', 2000),
    finalResponse: str(e.finalResponse, '', 2000),
    correct,
    firstCorrect,
    score: e.score === null || e.score === undefined ? null : num(e.score, 0, 1, 0),
    validator: str(e.validator, 'unknown', 30),
    hintLevel: num(e.hintLevel, 0, 9, 0),
    confidence: e.confidence === null || e.confidence === undefined ? null : num(e.confidence, 0, 100, 50),
    elapsedSec: num(e.elapsedSec, 0, 3600, 30),
    errorTags: Array.isArray(e.errorTags)
      ? (e.errorTags.filter((x): x is ErrorTag => ERROR_TAG_SET.has(x as ErrorTag)) as ErrorTag[])
      : [],
    difficulty: num(e.difficulty, 1, 5, 2),
    ...(bool(e.interrupted, false) ? { interrupted: true } : {}),
  }
}

function sanitizeSession(raw: unknown): SessionRecord | null {
  if (typeof raw !== 'object' || raw === null) return null
  const s = raw as Record<string, unknown>
  const startedAt = num(s.startedAt, 0, 4102444800000, NaN)
  if (Number.isNaN(startedAt)) return null
  const ci = (typeof s.checkIn === 'object' && s.checkIn !== null ? s.checkIn : {}) as Record<string, unknown>
  const bucketMinutes: Partial<Record<BucketId, number>> = {}
  if (typeof s.bucketMinutes === 'object' && s.bucketMinutes !== null) {
    for (const [k, v] of Object.entries(s.bucketMinutes as Record<string, unknown>)) {
      if (BUCKET_IDS.has(k)) bucketMinutes[k as BucketId] = num(v, 0, 600, 0)
    }
  }
  return {
    id: str(s.id, `sess${startedAt}`, 40),
    startedAt,
    endedAt: num(s.endedAt, startedAt, 4102444800000, startedAt),
    activeMinutes: num(s.activeMinutes, 0, 600, 0),
    checkIn: {
      minutes: num(ci.minutes, 5, 120, 25),
      energy: ['low', 'ok', 'high'].includes(ci.energy as string) ? (ci.energy as 'low' | 'ok' | 'high') : 'ok',
      focus: BUCKET_IDS.has(ci.focus as string) ? (ci.focus as BucketId) : null,
    },
    attempts: num(s.attempts, 0, 500, 0),
    correctFirst: num(s.correctFirst, 0, 500, 0),
    bucketMinutes,
    learned: strArray(s.learned, 20, 200),
    exitPrinciple: typeof s.exitPrinciple === 'string' ? s.exitPrinciple.slice(0, 500) : null,
    interrupted: bool(s.interrupted, false),
  }
}

function sanitizeDecision(raw: unknown): CoachDecision | null {
  if (typeof raw !== 'object' || raw === null) return null
  const d = raw as Record<string, unknown>
  const t = num(d.t, 0, 4102444800000, NaN)
  const summary = str(d.summary, '', 400)
  if (Number.isNaN(t) || !summary) return null
  return {
    id: str(d.id, `cd${t}`, 40),
    t,
    kind: ['plan', 'difficulty', 'allocation', 'review', 'placement', 'deadline', 'promotion', 'demotion'].includes(
      d.kind as string,
    )
      ? (d.kind as CoachDecision['kind'])
      : 'plan',
    summary,
    evidence: strArray(d.evidence, 8, 300),
    confidence: ['low', 'medium', 'high'].includes(d.confidence as string)
      ? (d.confidence as CoachDecision['confidence'])
      : 'low',
    wouldChange: str(d.wouldChange, '', 300),
  }
}

function sanitizeForecast(raw: unknown): Forecast | null {
  if (typeof raw !== 'object' || raw === null) return null
  const f = raw as Record<string, unknown>
  const question = str(f.question, '', 300)
  if (!question) return null
  const res = f.resolved as Record<string, unknown> | null | undefined
  return {
    id: str(f.id, `fc${Math.random().toString(36).slice(2, 8)}`, 40),
    createdAt: num(f.createdAt, 0, 4102444800000, Date.now()),
    question,
    probability: num(f.probability, 0.01, 0.99, 0.5),
    dueISO: str(f.dueISO, new Date().toISOString().slice(0, 10), 10),
    resolved:
      typeof res === 'object' && res !== null
        ? {
            outcome: bool(res.outcome, false),
            resolvedAt: num(res.resolvedAt, 0, 4102444800000, Date.now()),
            note: str(res.note, '', 300),
          }
        : null,
    revisions: Array.isArray(f.revisions)
      ? f.revisions
          .map((r) => {
            const rr = r as Record<string, unknown>
            return { t: num(rr?.t, 0, 4102444800000, 0), probability: num(rr?.probability, 0, 1, 0.5) }
          })
          .slice(0, 50)
      : [],
  }
}

function sanitizeDeadline(raw: unknown): Deadline | null {
  if (typeof raw !== 'object' || raw === null) return null
  const d = raw as Record<string, unknown>
  const title = str(d.title, '', 120)
  const dateISO = str(d.dateISO, '', 10)
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return null
  return {
    id: str(d.id, `dl${Math.random().toString(36).slice(2, 8)}`, 40),
    title,
    dateISO,
    bucket: BUCKET_IDS.has(d.bucket as string) ? (d.bucket as BucketId) : null,
    note: str(d.note, '', 300),
  }
}

function sanitizeReport(raw: unknown): ProblemReport | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const templateId = str(r.templateId, '', 80)
  if (!templateId) return null
  return {
    id: str(r.id, `pr${Math.random().toString(36).slice(2, 8)}`, 40),
    t: num(r.t, 0, 4102444800000, Date.now()),
    templateId,
    itemVersion: num(r.itemVersion, 0, 9999, 1),
    seed: num(r.seed, 0, 0x7fffffff, 0),
    note: str(r.note, '', 1000),
  }
}

function sanitizePlacement(raw: unknown): PlacementResult | null {
  if (typeof raw !== 'object' || raw === null) return null
  const p = raw as Record<string, unknown>
  const completedAt = num(p.completedAt, 0, 4102444800000, NaN)
  if (Number.isNaN(completedAt)) return null
  const signals = Array.isArray(p.signals)
    ? p.signals
        .map((s) => {
          const ss = s as Record<string, unknown>
          const skillId = str(ss?.skillId, '', 60)
          if (!skillId) return null
          return {
            skillId,
            signal: ['gap', 'ok', 'strong', 'skipped'].includes(ss.signal as string)
              ? (ss.signal as 'gap' | 'ok' | 'strong' | 'skipped')
              : 'skipped',
            fromManual: bool(ss.fromManual, false),
          }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
        .slice(0, 200)
    : []
  return {
    completedAt,
    minutes: num(p.minutes, 0, 120, 0),
    signals,
    measuredSkillIds: strArray(p.measuredSkillIds, 200, 60),
    unmeasuredNote: str(p.unmeasuredNote, '', 500),
    summary: strArray(p.summary, 12, 400),
  }
}

/** Rebuild a valid AppState from unknown JSON. Never throws. */
export function sanitizeState(raw: unknown): AppState {
  const base = initialState()
  if (typeof raw !== 'object' || raw === null) return base
  const r = raw as Record<string, unknown>
  const events = (Array.isArray(r.events) ? r.events : [])
    .map(sanitizeEvent)
    .filter((e): e is AttemptEvent => e !== null)
    .sort((a, b) => a.t - b.t)
    .slice(-50000)
  const customPacks: ContentPackJson[] = []
  if (Array.isArray(r.customPacks)) {
    for (const p of r.customPacks.slice(0, 10)) {
      const v = validatePack(p)
      if (v.ok) customPacks.push(v.pack)
    }
  }
  return {
    version: STATE_VERSION,
    createdAt: num(r.createdAt, 0, 4102444800000, Date.now()),
    onboarded: bool(r.onboarded, false),
    profile: sanitizeProfile(r.profile),
    settings: sanitizeSettings(r.settings),
    deadlines: (Array.isArray(r.deadlines) ? r.deadlines : [])
      .map(sanitizeDeadline)
      .filter((d): d is Deadline => d !== null)
      .slice(0, 40),
    events,
    sessions: (Array.isArray(r.sessions) ? r.sessions : [])
      .map(sanitizeSession)
      .filter((s): s is SessionRecord => s !== null)
      .sort((a, b) => a.startedAt - b.startedAt)
      .slice(-2000),
    coachLog: (Array.isArray(r.coachLog) ? r.coachLog : [])
      .map(sanitizeDecision)
      .filter((d): d is CoachDecision => d !== null)
      .slice(-300),
    forecasts: (Array.isArray(r.forecasts) ? r.forecasts : [])
      .map(sanitizeForecast)
      .filter((f): f is Forecast => f !== null)
      .slice(-200),
    reports: (Array.isArray(r.reports) ? r.reports : [])
      .map(sanitizeReport)
      .filter((p): p is ProblemReport => p !== null)
      .slice(-200),
    placement: sanitizePlacement(r.placement),
    customPacks,
    sampleMode: bool(r.sampleMode, false),
  }
}
