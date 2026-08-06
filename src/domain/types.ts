/**
 * Axiom Lab domain types.
 *
 * Design rules encoded here:
 *  - Learning evidence is APPEND-ONLY (`AttemptEvent[]`); every progress
 *    number is derived by replaying events, never stored as truth.
 *  - Every activity has exactly ONE primary allocation bucket.
 *  - Skill state is a ladder of evidence, not a single percentage.
 *  - Content templates are deterministic: (templateId, seed) → same item.
 */

export const STATE_VERSION = 1

// ---------------------------------------------------------------- allocation

export type BucketId =
  | 'math'
  | 'physics'
  | 'coding'
  | 'science'
  | 'observer'
  | 'investigator'
  | 'strategist'
  | 'puzzle'
  | 'insight'
  | 'meta'

export interface BucketMeta {
  id: BucketId
  name: string
  short: string
  /** Default share of focused practice. Defaults sum to exactly 100%. */
  defaultPercent: number
  /** One-line description used in Practice and Settings. */
  blurb: string
}

/**
 * Default allocation (user-editable in Settings). Weighted toward math and
 * the academic core because middle-grade mastery and algebra readiness are
 * well-evidenced levers on later school success (see docs/RESEARCH.md §16)
 * — a design judgment, labeled as such.
 */
export const BUCKETS: BucketMeta[] = [
  { id: 'math', name: 'Mathematics', short: 'Math', defaultPercent: 31, blurb: 'Core math from arithmetic through algebra, geometry, and data — the spine of high-school readiness.' },
  { id: 'physics', name: 'Physics', short: 'Physics', defaultPercent: 8, blurb: 'Quantitative physics: motion, forces, energy, estimation.' },
  { id: 'coding', name: 'Coding', short: 'Coding', defaultPercent: 8, blurb: 'Computational thinking: tracing, debugging, algorithms.' },
  { id: 'science', name: 'Scientific reasoning', short: 'Sci-Reason', defaultPercent: 7, blurb: 'Experiments, evidence, statistics traps, Fermi estimates.' },
  { id: 'observer', name: 'Observer', short: 'Observer', defaultPercent: 8, blurb: 'Observation vs inference, recall, listening, calibration.' },
  { id: 'investigator', name: 'Investigator', short: 'Investigator', defaultPercent: 10, blurb: 'Logic, Bayesian updating, hypotheses, forecasting.' },
  { id: 'strategist', name: 'Strategist', short: 'Strategist', defaultPercent: 10, blurb: 'Planning, decision trees, estimation, ethical strategy.' },
  { id: 'puzzle', name: 'Puzzle Lab', short: 'Puzzles', defaultPercent: 8, blurb: 'Chess tactics, spatial fitting, logic grids — with transfer bridges.' },
  { id: 'insight', name: 'Human Insight', short: 'Insight', defaultPercent: 5, blurb: 'Perspective-taking, influence defense, boundaries, de-escalation.' },
  { id: 'meta', name: 'Meta Lab', short: 'Meta', defaultPercent: 5, blurb: 'Learning how to learn, calibration, source literacy, explanation.' },
]

export const BUCKET_BY_ID: Record<BucketId, BucketMeta> = Object.fromEntries(
  BUCKETS.map((b) => [b.id, b]),
) as Record<BucketId, BucketMeta>

export const ACADEMIC_BUCKETS: BucketId[] = ['math', 'physics', 'coding', 'science']

/**
 * Ten 5% floors reserve half of practice for breadth and leave the other half
 * available for learner priorities and disclosed coach adjustments.
 */
export const MIN_ALLOCATION_PERCENT = 5

// ---------------------------------------------------------------- skills

/** Evidence ladder. `needs-review` overlays a previously reached rung. */
export type SkillState =
  | 'unseen'
  | 'introduced'
  | 'guided'
  | 'independent'
  | 'retained'
  | 'transferred'

export interface SkillNode {
  id: string
  name: string
  bucket: BucketId
  courseId: string
  unitId: string
  /** Skill ids that should be independent before this is frontier-eligible. */
  prereqs: string[]
  /** One-line learner-facing description. */
  blurb: string
  /** Concept-card ids in the knowledge base. */
  kbIds: string[]
  /** Rough grade band for placement routing (e.g. 6, 7, 8, 9, 10). */
  gradeBand: number
}

export interface Course {
  id: string
  name: string
  bucket: BucketId
  units: Unit[]
}

export interface Unit {
  id: string
  name: string
  skillIds: string[]
}

// ---------------------------------------------------------------- answers

export type AnswerSpec =
  | NumericAnswer
  | FractionAnswer
  | TextAnswer
  | McqAnswer
  | MultiAnswer
  | OrderAnswer
  | ClassifyAnswer
  | RubricAnswer

export interface NumericAnswer {
  type: 'numeric'
  answer: number
  /** Absolute tolerance; 0 = exact. Only used when mathematically justified. */
  tolerance?: number
  /** Display unit, e.g. 'm/s'. Answers are unitless numbers in that unit. */
  unit?: string
  /** Accept fraction syntax "3/4" as 0.75 etc. Defaults true. */
  acceptFractions?: boolean
}

export interface FractionAnswer {
  type: 'fraction'
  n: number
  d: number
  /** Require lowest terms? Default false (any equivalent form accepted). */
  requireLowest?: boolean
}

export interface TextAnswer {
  type: 'text'
  /** Accepted answers, compared case/space-insensitively. */
  accept: string[]
  placeholder?: string
}

export interface McqAnswer {
  type: 'mcq'
  options: string[]
  correct: number
  /** Deterministic per-seed shuffling happens at render time; options here are final. */
}

export interface MultiAnswer {
  type: 'multi'
  options: string[]
  correct: number[]
}

export interface OrderAnswer {
  type: 'order'
  /** Options in a scrambled display order. */
  options: string[]
  /** Correct permutation as indexes into `options`. */
  correct: number[]
}

export interface ClassifyAnswer {
  type: 'classify'
  categories: string[]
  statements: { text: string; category: number }[]
}

/** Self-scored against explicit criteria; produces a 0..1 score, no auto-grade. */
export interface RubricAnswer {
  type: 'rubric'
  criteria: string[]
  /** A model answer shown AFTER the attempt for comparison. */
  model: string
  /** Minimum honest draft length before comparison is allowed. */
  minWords?: number
  /** Deliverable-specific prompt for the drafting area. */
  placeholder?: string
}

// ---------------------------------------------------------------- items

export type AuthenticFormat = 'project' | 'writing' | 'program' | 'experiment' | 'book' | 'dialogue' | 'fieldwork' | 'decision'

/**
 * Marks a compressed simulation of authentic work. These activities retain
 * real workflow structure (brief -> evidence -> artifact -> critique ->
 * revision) while being honest that the people, sources, and data are
 * simulated inside an offline app.
 */
export interface AuthenticWorkSpec {
  format: AuthenticFormat
  deliverable: string
  /** What is compressed or simulated rather than literally present. */
  simulationNote: string
}

export type ItemKind = 'single' | 'multi' | 'chess' | 'polyomino' | 'logicgrid'

export interface ItemPart {
  /** Authentic-work checkpoint label, e.g. Brief, Test, Draft, Revise. */
  stage?: string
  /** Optional study phase (scene text, data table) shown before the prompt. */
  study?: string
  /** Suggested study seconds (user-adjustable, never a hard cutoff). */
  studySeconds?: number
  prompt: string
  answer: AnswerSpec
  /** Explanation for this part, shown after the attempt. */
  explanation: string
}

export interface ChessSpec {
  fen: string
  /**
   * Solution line in SAN, starting with the player-to-move.
   * Validation kind:
   *  - mate1 / mate2: ANY move preserving forced mate is accepted (search-verified)
   *  - line: only the listed move(s) are accepted (exact-move tactic)
   */
  goal: 'mate1' | 'mate2' | 'line'
  line: string[]
  /** Why the tactic works, shown after completion. */
  explanation: string
  /** Theme label, e.g. 'fork', 'back rank'. */
  theme: string
}

export interface PolyominoSpec {
  /** Board cells as "x,y" strings forming the target region. */
  region: string[]
  /** Pieces, each a list of relative cells; placement solution exists by construction. */
  pieces: { id: string; cells: [number, number][]; color: number }[]
  /** One known solution: piece id → { x, y, rotation } (for hint/verify-solvable). */
  solution: Record<string, { x: number; y: number; rot: number }>
  allowRotation: boolean
}

/**
 * Machine-readable logic-grid clue. Category 0 is the key category (the
 * entities). References use (cat, val) pairs; cat 0 refers to a key directly.
 */
export type LogicClueSpec =
  | { kind: 'is'; key: number; cat: number; val: number }
  | { kind: 'not'; key: number; cat: number; val: number }
  | { kind: 'link'; cat1: number; val1: number; cat2: number; val2: number }
  | { kind: 'notlink'; cat1: number; val1: number; cat2: number; val2: number }
  | {
      kind: 'order'
      /** Ordinal category whose value indexes are in increasing order. */
      catOrd: number
      less: { cat: number; val: number }
      greater: { cat: number; val: number }
    }

export interface LogicGridClue {
  text: string
  spec: LogicClueSpec
}

export interface LogicGridSpec {
  /** Category names, e.g. ['Student', 'Subject', 'Score']. First is the key category. */
  categories: string[]
  /** Values per category, all the same length. */
  values: string[][]
  clues: LogicGridClue[]
  /**
   * Unique solution: for each non-key category c (index ≥ 1),
   * solution[c-1][k] = index into values[c] matched with key k.
   * Uniqueness is verified by the content audit's brute-force solver.
   */
  solution: number[][]
}

/** A fully rendered, ready-to-play item. Deterministic per (templateId, seed). */
export interface RenderedItem {
  templateId: string
  version: number
  seed: number
  kind: ItemKind
  title: string
  /** Markdown-lite; rendered safely (never raw HTML). */
  prompt: string
  parts?: ItemPart[]
  answer?: AnswerSpec
  chess?: ChessSpec
  polyomino?: PolyominoSpec
  logicgrid?: LogicGridSpec
  /** Hint ladder, mildest first. Last hint = full worked path. */
  hints: string[]
  explanation: string
  /** Misconception notes keyed by error tag. */
  commonErrors?: Partial<Record<ErrorTag, string>>
  /**
   * NAMED misconceptions per MCQ distractor (option index → "name — why").
   * Lets feedback say which trap a wrong pick represents.
   */
  distractorNotes?: Record<number, string>
  /**
   * Per-VARIANT context skills (e.g. the explain-back target). Carried on the
   * event as `aboutSkillIds` — visible context, NEVER mastery evidence, so a
   * self-scored explanation can't fake independence on an academic skill.
   */
  extraSkillIds?: string[]
  /** Transfer-bridge prompt shown after completion for selected items. */
  transferBridge?: string
}

export type EvidenceTier = 'evidence' | 'heuristic'

export interface ItemTemplate {
  id: string
  version: number
  kind: ItemKind
  name: string
  skillIds: string[]
  bucket: BucketId
  /** 1 concept · 2 routine · 3 multi-step · 4 non-routine · 5 transfer-hard */
  difficulty: 1 | 2 | 3 | 4 | 5
  /** How many materially distinct variants the generator produces (≥1). */
  variants: number
  /** Deterministic generator. Fixed items ignore the seed. */
  generate: (seed: number) => RenderedItem
  provenance: string
  /** Marks items suitable as transfer probes for their skills. */
  transfer?: boolean
  /** Ask for a confidence rating on this item. */
  calibration?: boolean
  /** Approximate minutes a focused attempt takes. */
  minutes: number
  /** Present only for deliberate, multi-stage authentic-work simulations. */
  authentic?: AuthenticWorkSpec
}

// ---------------------------------------------------------------- attempts

export type AttemptMode = 'guided' | 'independent' | 'review' | 'transfer' | 'placement' | 'exam'

export type ErrorTag =
  | 'concept'
  | 'strategy'
  | 'slip'
  | 'misread'
  | 'representation'
  | 'inference'
  | 'overconfident'
  | 'underconfident'
  | 'incomplete'
  | 'unknown'

export const ERROR_TAGS: { id: ErrorTag; name: string; hint: string }[] = [
  { id: 'concept', name: 'Missing concept', hint: 'The underlying idea was not in place.' },
  { id: 'strategy', name: 'Wrong strategy', hint: 'A method was chosen that does not fit this problem.' },
  { id: 'slip', name: 'Execution slip', hint: 'Right method, small arithmetic/mechanical error.' },
  { id: 'misread', name: 'Misread the problem', hint: 'A condition or quantity in the prompt was missed.' },
  { id: 'representation', name: 'Representation error', hint: 'Diagram/equation/table did not match the situation.' },
  { id: 'inference', name: 'Unsupported inference', hint: 'A conclusion went beyond the evidence.' },
  { id: 'overconfident', name: 'Overconfident', hint: 'High confidence on a wrong answer.' },
  { id: 'underconfident', name: 'Underconfident', hint: 'Low confidence on solid knowledge.' },
  { id: 'incomplete', name: 'Incomplete explanation', hint: 'Answer without the reasoning that supports it.' },
  { id: 'unknown', name: 'Not sure yet', hint: 'Cause not identified.' },
]

export interface AttemptEvent {
  id: string
  t: number
  sessionId: string | null
  templateId: string
  itemVersion: number
  seed: number
  skillIds: string[]
  /** Context-only skill references (e.g. explain-back targets) — the mastery
   *  replay ignores these entirely. */
  aboutSkillIds?: string[]
  bucket: BucketId
  mode: AttemptMode
  /** First submitted response (serialized), before any retry. */
  firstResponse: string
  finalResponse: string
  /** null for rubric/self-scored parts. */
  correct: boolean | null
  /** First-submission correctness — promotion looks at this, not eventual success. */
  firstCorrect: boolean | null
  /** Rubric score 0..1 when correct is null. */
  score: number | null
  validator: string
  /** 0 = unaided. Counts hints revealed before first submission. */
  hintLevel: number
  /** 0..100 or null when not asked. */
  confidence: number | null
  /** Active seconds on task (visibility-paused). */
  elapsedSec: number
  errorTags: ErrorTag[]
  difficulty: number
  interrupted?: boolean
}

// ---------------------------------------------------------------- mastery

export interface SkillEvidence {
  skillId: string
  state: SkillState
  needsReview: boolean
  /** Highest state ever reached (visible even when needsReview). */
  bestState: SkillState
  exposure: number
  guidedSuccesses: number
  /** First-attempt unaided successes on distinct item forms. */
  independentForms: string[]
  retainedAt: number | null
  transferredAt: number | null
  lastCorrectAt: number | null
  lastAttemptAt: number | null
  lastOutcomeCorrect: boolean | null
  /** Consecutive failed first attempts (any mode). */
  recentMisses: number
  /** Unrepaired high-confidence misconception blocks promotion. */
  blockedByMisconception: boolean
  hintDependence: number | null
  /** Review scheduling state. */
  review: { due: number; intervalIndex: number } | null
  attempts: number
}

// ---------------------------------------------------------------- sessions

export type BlockKind = 'warmup' | 'core' | 'rotation' | 'exit'

export interface PlannedActivity {
  templateId: string
  seed: number
  mode: AttemptMode
}

export interface PlannedBlock {
  id: string
  kind: BlockKind
  bucket: BucketId
  label: string
  minutes: number
  activities: PlannedActivity[]
  why: string
}

export interface SessionPlan {
  id: string
  createdAt: number
  targetMinutes: number
  blocks: PlannedBlock[]
  /** Plain-language coach rationale lines. */
  rationale: string[]
}

export interface CheckIn {
  minutes: number
  energy: 'low' | 'ok' | 'high'
  focus: BucketId | null
}

export interface SessionRecord {
  id: string
  startedAt: number
  endedAt: number
  activeMinutes: number
  checkIn: CheckIn
  attempts: number
  correctFirst: number
  bucketMinutes: Partial<Record<BucketId, number>>
  /** Verified learning summary lines (from evidence changes). */
  learned: string[]
  exitPrinciple: string | null
  interrupted: boolean
}

// ---------------------------------------------------------------- coach

export type CoachDecisionKind =
  | 'plan'
  | 'difficulty'
  | 'allocation'
  | 'review'
  | 'placement'
  | 'deadline'
  | 'promotion'
  | 'demotion'

export interface CoachDecision {
  id: string
  t: number
  kind: CoachDecisionKind
  summary: string
  evidence: string[]
  confidence: 'low' | 'medium' | 'high'
  wouldChange: string
}

export interface CoachBelief {
  id: string
  statement: string
  confidence: 'low' | 'medium' | 'high'
  evidence: string[]
  unknown?: string
  /** What observation would strengthen or overturn this belief. */
  resolve?: string
}

// ---------------------------------------------------------------- forecasts

export interface Forecast {
  id: string
  createdAt: number
  question: string
  probability: number // 0..1
  dueISO: string
  resolved: { outcome: boolean; resolvedAt: number; note: string } | null
  /** Probability history if revised before resolution. */
  revisions: { t: number; probability: number }[]
}

// ---------------------------------------------------------------- profile

export type AgeBand = 'under13' | '13-17' | '18plus' | 'unspecified'
export type CoachTone = 'concise' | 'socratic' | 'challenging' | 'supportive' | 'balanced'

export interface Profile {
  name: string
  ageBand: AgeBand
  gradeLevel: number | null
  courses: string[]
  goals: string[]
  strongAreas: string[]
  weakAreas: string[]
  chessExperience: 'none' | 'casual' | 'experienced'
  coachTone: CoachTone
  sessionMinutes: 10 | 20 | 25 | 30 | 45
  activeDays: number[]
}

export interface Deadline {
  id: string
  title: string
  dateISO: string
  bucket: BucketId | null
  note: string
  /** Exact curriculum targets for a learning mission. Empty/absent keeps
   * legacy broad-subject deadline behavior. */
  skillIds?: string[]
  /** Intended focused dose. A session can still be shortened at check-in. */
  dailyMinutes?: 10 | 20 | 25 | 30 | 45
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  textSpacing: boolean
  /** LONG-RUN percent per bucket. Always normalized to exactly 100%. */
  allocations: Record<BucketId, number>
  /**
   * When true the coach may temporarily tune targets around the base —
   * bounded nudges for deadlines and review pressure, never below the 5%
   * floor, always disclosed. The base stays untouched.
   */
  coachManagedAllocations: boolean
  confidencePrompts: 'normal' | 'minimal'
  /**
   * Opt-in local review reminders (zero-server: fired by the app itself while
   * open or backgrounded). Quiet hours below are honored when set.
   */
  notifications: boolean
  /** Suppress any nudges between these local hours. */
  quietHours: { start: number; end: number } | null
}

export interface ProblemReport {
  id: string
  t: number
  templateId: string
  itemVersion: number
  seed: number
  note: string
}

export interface PlacementSkillSignal {
  skillId: string
  signal: 'gap' | 'ok' | 'strong' | 'skipped'
  fromManual: boolean
}

export interface PlacementResult {
  completedAt: number
  minutes: number
  signals: PlacementSkillSignal[]
  measuredSkillIds: string[]
  unmeasuredNote: string
  summary: string[]
}

// ---------------------------------------------------------------- content packs (import)

export interface ContentPackMeta {
  id: string
  name: string
  version: number
  description: string
  author: string
}

/** JSON-importable fixed item (no code). Validated by contentSchema. */
export interface PackItemJson {
  id: string
  version: number
  name: string
  skillIds: string[]
  bucket: BucketId
  difficulty: 1 | 2 | 3 | 4 | 5
  prompt: string
  answer: AnswerSpec
  hints: string[]
  explanation: string
  provenance: string
  minutes: number
}

export interface ContentPackJson {
  schema: 'axiomlab-pack@1'
  meta: ContentPackMeta
  items: PackItemJson[]
}

// ---------------------------------------------------------------- app state

export interface AppState {
  version: number
  createdAt: number
  onboarded: boolean
  profile: Profile
  settings: AppSettings
  deadlines: Deadline[]
  /** Append-only learning evidence. Progress is derived by replay. */
  events: AttemptEvent[]
  sessions: SessionRecord[]
  coachLog: CoachDecision[]
  forecasts: Forecast[]
  reports: ProblemReport[]
  placement: PlacementResult | null
  customPacks: ContentPackJson[]
  /** True when the sample profile is loaded (banner shown; real data kept aside). */
  sampleMode: boolean
}

export const DEFAULT_ALLOCATIONS: Record<BucketId, number> = Object.fromEntries(
  BUCKETS.map((b) => [b.id, b.defaultPercent]),
) as Record<BucketId, number>

export function defaultProfile(): Profile {
  return {
    name: '',
    ageBand: 'unspecified',
    gradeLevel: 8,
    courses: [],
    goals: [],
    strongAreas: [],
    weakAreas: [],
    chessExperience: 'none',
    coachTone: 'balanced',
    sessionMinutes: 30,
    activeDays: [0, 1, 2, 3, 4, 5, 6],
  }
}

export function defaultSettings(): AppSettings {
  return {
    theme: 'system',
    textSpacing: false,
    allocations: { ...DEFAULT_ALLOCATIONS },
    coachManagedAllocations: true,
    confidencePrompts: 'normal',
    notifications: false,
    quietHours: null,
  }
}

export function initialState(): AppState {
  return {
    version: STATE_VERSION,
    createdAt: Date.now(),
    onboarded: false,
    profile: defaultProfile(),
    settings: defaultSettings(),
    deadlines: [],
    events: [],
    sessions: [],
    coachLog: [],
    forecasts: [],
    reports: [],
    placement: null,
    customPacks: [],
    sampleMode: false,
  }
}
