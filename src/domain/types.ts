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
  { id: 'math', name: 'Mathematics', short: 'Math', defaultPercent: 26, blurb: 'Core math from arithmetic through algebra, geometry, and data — the spine of high-school readiness.' },
  { id: 'physics', name: 'Physics', short: 'Physics', defaultPercent: 7, blurb: 'Quantitative physics: motion, forces, energy, estimation.' },
  { id: 'coding', name: 'Coding', short: 'Coding', defaultPercent: 7, blurb: 'Computational thinking: tracing, debugging, algorithms.' },
  { id: 'science', name: 'Scientific reasoning', short: 'Sci-Reason', defaultPercent: 8, blurb: 'Experiments, evidence, statistics traps, Fermi estimates.' },
  { id: 'observer', name: 'Observer', short: 'Observer', defaultPercent: 9, blurb: 'Observation vs inference, recall, listening, calibration.' },
  { id: 'investigator', name: 'Investigator', short: 'Investigator', defaultPercent: 11, blurb: 'Logic, Bayesian updating, hypotheses, forecasting.' },
  { id: 'strategist', name: 'Strategist', short: 'Strategist', defaultPercent: 9, blurb: 'Planning, decision trees, estimation, ethical strategy.' },
  { id: 'puzzle', name: 'Puzzle Lab', short: 'Puzzles', defaultPercent: 7, blurb: 'Chess tactics, spatial fitting, logic grids — with transfer bridges.' },
  { id: 'insight', name: 'Human Insight', short: 'Insight', defaultPercent: 7, blurb: 'Perspective-taking, influence defense, boundaries, de-escalation.' },
  { id: 'meta', name: 'Meta Lab', short: 'Meta', defaultPercent: 9, blurb: 'Learning how to learn, calibration, source literacy, explanation.' },
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
  | StepsAnswer
  | DraftAnswer
  | ConstructAnswer

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

/** A single link in a worked chain. Deliberately simple, non-recursive types. */
export type StepAnswerSpec = NumericAnswer | FractionAnswer | TextAnswer | McqAnswer

/**
 * A worked chain: show your intermediate values, each machine-checked.
 *
 * One answer box can only tell the app WHETHER you were right. A chain tells it
 * WHERE the reasoning broke — and because each step carries the misconception a
 * miss there implies, the error tag becomes DERIVED rather than self-reported.
 * That matters: self-tagging your own mistake is exactly the kind of
 * self-assessment the evidence model refuses everywhere else.
 *
 * Evidence: `firstCorrect` requires every step right on the first submission.
 * Partial chains earn partial `score` for display only — never a rung.
 */
export interface StepsAnswer {
  type: 'steps'
  steps: {
    /** What this box is asking for, e.g. "Net force (N)". */
    label: string
    answer: StepAnswerSpec
    /** The misconception a miss HERE implies. Becomes the event's error tag. */
    diagnoses: ErrorTag
    /** One line shown after the attempt explaining this link. */
    why: string
  }[]
}

/**
 * A written artifact: drafted from memory, then compared against a model.
 * NEVER scored — not by the app, and not by the learner either. It exists for
 * the generation effect; the EVIDENCE comes from the deterministically graded
 * probe that follows it in the same item. A draft part contributes no
 * `correct`, no `firstCorrect`, and no `score` to its attempt event, so it can
 * never advance a skill on its own (audited).
 */
export interface DraftAnswer {
  type: 'draft'
  /** What a strong response contains — shown WITH the model, to read, not to rate. */
  criteria: string[]
  /** A model answer shown AFTER the draft is written. */
  model: string
  /** Minimum honest draft length before the model is revealed. */
  minWords?: number
  /** Deliverable-specific prompt for the drafting area. */
  placeholder?: string
}

/**
 * A CONSTRUCTED answer: the learner builds an object, and it is judged by
 * whether it satisfies stated constraints — not by matching one stored key.
 *
 * This exists to answer a real criticism. A generator with 18 variants makes a
 * procedure automatic; after the third variant nothing is being *solved*,
 * because the method is visible from the shape of the question. Construction
 * problems invert that: the method is trivial to state ("make the mean 7") and
 * the work is search. There is no shape to recognise, because the learner is
 * building the shape.
 *
 * It also widens what the app can assess. Everything else here is a number or
 * a choice; this takes an object the learner invented and still grades it
 * deterministically, offline, with no model and no server.
 *
 * Constraints are DATA, never functions, so a rendered item stays JSON — the
 * session draft mirrors it, the content audit re-checks it, and `sanitize`
 * can validate an imported one.
 */
export type ConstructCmp = '=' | '!=' | '<' | '<=' | '>' | '>='

/** Summary statistics a constraint can be stated over. */
export type ConstructStat = 'mean' | 'median' | 'range' | 'min' | 'max' | 'absMax' | 'absMin' | 'sum' | 'product' | 'distinct' | 'spread'

export type ConstructCheck =
  /** A statistic of the named slots compares to a value. `spread` is max−min of |x−mean|. */
  | { kind: 'stat'; stat: ConstructStat; of: string[]; cmp: ConstructCmp; value: number; tol?: number; label: string }
  /** EVERY named slot compares to a value. */
  | { kind: 'each'; of: string[]; cmp: ConstructCmp; value: number; label: string }
  /** All named slots hold different values. */
  | { kind: 'allDifferent'; of: string[]; label: string }
  /** Named slots read left to right are strictly increasing / decreasing. */
  | { kind: 'ordered'; of: string[]; dir: 'up' | 'down'; label: string }
  /** Every slot value is a whole number. */
  | { kind: 'integer'; of: string[]; label: string }
  /** Slot values are drawn from `digits`, each usable at most / exactly once. */
  | { kind: 'digits'; of: string[]; digits: number[]; use: 'atMostOnce' | 'exactlyOnce'; label: string }
  /** Σ (coefficient × slot) compares to a value. */
  | { kind: 'linear'; terms: Record<string, number>; cmp: ConstructCmp; value: number; tol?: number; label: string }
  /** Σ (coefficient × slotA × slotB) compares to a value — torque, area, rate × time. */
  | { kind: 'bilinear'; terms: { a: string; b: string; c: number }[]; cmp: ConstructCmp; value: number; tol?: number; label: string }
  /** One named slot IS the min / max / median of the group. */
  | { kind: 'isStat'; slot: string; stat: ConstructStat; of: string[]; label: string }
  /** Two statistics of the same slots compare to each other, offset by `by`. */
  | { kind: 'relate'; left: ConstructStat; right: ConstructStat; of: string[]; cmp: ConstructCmp; by: number; tol?: number; label: string }

export interface ConstructAnswer {
  type: 'construct'
  /** What the learner is being asked to build, e.g. "five whole numbers". */
  what: string
  /** The boxes to fill, in display order. */
  slots: { key: string; label: string }[]
  /** Every check must pass. Each carries the sentence shown when it fails. */
  checks: ConstructCheck[]
  /**
   * One solution the generator found. It proves the problem is satisfiable
   * (audited) and gives the repair screen something to show. It is NEVER the
   * only accepted answer — that is the whole point of this format.
   */
  witness: Record<string, number>
  /**
   * How many solutions exist, when the generator counted them. Shown after the
   * attempt: "there are 34 ways to do this, and you found one" is the honest
   * thing to say about a problem with no unique answer.
   */
  solutionCount?: number
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

// ------------------------------------------------- manipulable diagrams

/** One drawn curve, in data coordinates. */
export interface PlotSeries {
  /** Ordered [x, y] pairs. The player joins them; it does not interpolate. */
  points: [number, number][]
  /** Legend text, e.g. "y = 2x + 1". */
  label: string
  /** Palette slot, not a colour — themes stay in CSS. */
  tone?: 0 | 1
}

/** A small declarative diagram. No code, so the audit can check every frame. */
export interface PlotSpec {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  xLabel?: string
  yLabel?: string
  series: PlotSeries[]
  /** Optional filled rectangle in data coords — for area and scaling work. */
  rect?: { x: number; y: number; w: number; h: number; label: string }
  /**
   * Loose dots rather than a joined line — a dot plot of individual values.
   * A polyline through sample data would imply an order the data does not
   * have, which is why these are a separate field and not a series.
   */
  dots?: { x: number; y: number; tone?: 0 | 1 }[]
  /**
   * Labelled vertical markers, e.g. where a mean and a median sit. Drawn over
   * everything else so a marker can never be hidden behind a dot.
   */
  marks?: { x: number; label: string; tone?: 0 | 1 }[]
  /**
   * Drop the vertical scale entirely. A dot plot spreads its dots up and down
   * only so they stay countable; that height means nothing, and an axis
   * reading 0, 0.5, 1, 1.5, 2 beside it invites the learner to read a quantity
   * that is not there.
   */
  hideY?: boolean
  /** Circles in data units, for anything where roundness is the point. */
  circles?: { cx: number; cy: number; r: number; label?: string }[]
  /**
   * Force one pixels-per-unit scale on both axes, centred in the frame.
   *
   * Without it a plot area of 276 × 164 pixels stretches equal data spans
   * unequally, so a square renders as a wide rectangle and a circle as an
   * ellipse. On any diagram whose LESSON is a shape — "the square encloses the
   * most", "this ratio is the same for every circle" — that stretch quietly
   * contradicts the thing being taught.
   */
  aspectSquare?: boolean
}

/** One position of the control, and the picture at that position. */
export interface ExploreStop {
  /** Shown on the control, e.g. "m = 2". */
  value: string
  /**
   * One line describing THIS state — never the conclusion. The learner is
   * meant to notice the pattern across stops; a caption that announces it
   * turns manipulation back into reading.
   */
  caption: string
  plot: PlotSpec
}

/**
 * A diagram the learner drags before being asked anything.
 *
 * Brilliant's distinctive move is that you manipulate a thing and watch it
 * respond, building intuition before any explanation (RESEARCH.md §37c). This
 * app was retrieval-first everywhere but had nothing manipulable outside the
 * puzzle players.
 *
 * Deliberately PRECOMPUTED rather than a live formula: the generator produces
 * one finished picture per stop, so the whole activity stays deterministic
 * data, needs no expression evaluator, and the content audit can render and
 * check every frame the learner could ever see.
 *
 * It never carries evidence. Exploration is a study phase; the rung comes from
 * the graded checkpoint that follows it, which is the same rule drafts follow.
 */
export interface ExploreSpec {
  /** What the control changes, e.g. "the slope m". */
  label: string
  stops: ExploreStop[]
  /** Which stop to open on. */
  initial: number
  /** What to try, shown with the control. Not what to conclude. */
  invitation: string
}

export interface ItemPart {
  /** Authentic-work checkpoint label, e.g. Brief, Test, Draft, Revise. */
  stage?: string
  /** Optional study phase (scene text, data table) shown before the prompt. */
  study?: string
  /**
   * A manipulable diagram for the study phase. Shown with `study` when both
   * are present; the learner drags it before the prompt appears.
   */
  explore?: ExploreSpec
  /** Suggested study seconds (user-adjustable, never a hard cutoff). */
  studySeconds?: number
  prompt: string
  answer: AnswerSpec
  /** Explanation for this part, shown after the attempt. */
  explanation: string
  /**
   * Hint ladder for THIS checkpoint, mildest first. Multi-part activities pose
   * a different problem at every part, so a single item-level ladder cannot
   * scaffold any of them well. When absent the item's own hints are used.
   */
  hints?: string[]
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
   * The error CAUSE each named distractor represents (option index → tag).
   *
   * `distractorNotes` explains a wrong pick to the learner; this makes the same
   * information machine-readable, so the coach's cause profile can be built
   * from which wrong idea attracted them rather than from asking them to
   * classify their own mistake. See `engine/diagnose.ts` for why that
   * distinction is load-bearing. Indexes are post-shuffle and are produced by
   * `mcqNoted`, never hand-written.
   */
  distractorTags?: Record<number, ErrorTag>
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
  /**
   * Does beating this require CHOOSING a method, or only executing one?
   *
   * Most of this bank is `routine` and should be: a generator with 18 variants
   * is how a procedure becomes automatic. But it means the third variant is no
   * longer problem solving, and the app must not describe it as such. Default
   * is `routine` — non-routine has to be claimed deliberately and is audited
   * against the item actually being one (search, construction, or a structure
   * the generator varies).
   */
  novelty?: 'routine' | 'nonRoutine'
  /**
   * Minimum days before this template may be served to the same learner again.
   *
   * For hand-authored one-shot problems, whose whole value is that you have not
   * seen them. They are allowed to come back — forgetting is real — but only
   * after long enough that recall is not what is being tested.
   */
  cooldownDays?: number
  /**
   * Where the problem came from, when it is not original to this app.
   *
   * Only CC BY or public-domain sources are permitted: ShareAlike would
   * propagate to this repository, and NonCommercial-only material is a licence
   * term to honour rather than a footnote. Anything set here must also appear
   * in ATTRIBUTIONS.md, and is shown to the learner on the item.
   */
  source?: { title: string; author: string; licence: 'CC BY 4.0' | 'public domain'; url?: string; adapted: boolean }
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
  /** null only when an item had no deterministically graded part. */
  correct: boolean | null
  /** First-submission correctness — promotion looks at this, not eventual success. */
  firstCorrect: boolean | null
  /**
   * Partial credit 0..1 from deterministic grading (e.g. `classify`), for
   * display only. Never a substitute for `firstCorrect`: the mastery replay
   * ignores this field entirely, so nothing ungraded can advance a skill.
   */
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

/** One question family's review state within a skill. */
export interface FormEvidence {
  templateId: string
  /** Next scheduled retrieval, or null if never yet succeeded. */
  due: number | null
  intervalIndex: number
  successes: number
  lapses: number
  lastOutcomeCorrect: boolean | null
}

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
  /** Which transfer dimensions the qualifying attempt crossed (RESEARCH.md §21). */
  transferCrossed: string[] | null
  lastCorrectAt: number | null
  lastAttemptAt: number | null
  lastOutcomeCorrect: boolean | null
  /** Consecutive failed first attempts (any mode). */
  recentMisses: number
  /** Unrepaired high-confidence misconception blocks promotion. */
  blockedByMisconception: boolean
  hintDependence: number | null
  /**
   * Logistic ability on THIS skill, fitted from unaided outcomes at known
   * difficulties (see mastery.ts). Null under a handful of samples. Distinct
   * from the rung: the rung says what was proved, this says what is currently
   * winnable — a learner can be Retained and still fail the hardest items.
   */
  ability: number | null
  /** How many unaided graded attempts the estimate rests on. */
  abilitySamples: number
  /** Review scheduling state for the skill as a whole. */
  review: { due: number; intervalIndex: number } | null
  /**
   * Review state per QUESTION FAMILY. A skill spans many kinds of problem —
   * `m-percent` has ten — and a single skill-level interval let a strong
   * family satisfy the review while a weak one went untested. Keyed by
   * templateId; only families actually attempted appear here.
   */
  forms: FormEvidence[]
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
  /**
   * The math course the learner is actually in (or preparing for) — a track id
   * from `content/tracks.ts`, e.g. 'ca-7plus'. Null when not chosen.
   *
   * A track is more precise than gradeLevel: California's accelerated pathways
   * mean two 7th graders can be in different courses. The planner gives track
   * skills a SMALL, OPENLY-STATED score bonus (same law as goals: a bounded
   * tilt with a visible reason, never a filter) and the coach can report
   * progress through the course. Nothing outside the track is dropped.
   */
  mathTrack: string | null
  /**
   * When the learner last confirmed (or was asked about) their course. Courses
   * change — the Today screen offers a QUIET check-in when this is ~3 months
   * stale: one dismissible card, no urgency, and confirming restamps it. Null
   * on legacy profiles, which the card treats as "never asked".
   */
  trackConfirmedAt: number | null
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

/**
 * A DISPUTE: "this attempt was graded against me and it should not have been."
 *
 * Every other correction in this app is the learner changing their answer.
 * This one is the learner challenging the RECORD, and it exists because the
 * record is the product. A wrong grade that silently lowers a mastery estimate
 * teaches the app something false about its only user, shortens their review
 * intervals, and steps their difficulty down — and they have no way to say so.
 *
 * Quarantine first, adjudicate later. From the moment it is raised the attempt
 * is excluded from mastery, from the stretch signal and from allocation debt,
 * because the alternative — leaving it counted until someone decides — means
 * the disputed evidence is doing damage during exactly the window in which its
 * validity is in doubt. Resolving it is not urgent; getting it out of the
 * numbers is.
 *
 * Append-only, like everything else here: raising and resolving are separate
 * records and the current status is derived by replay. Nothing is edited, so
 * the history of what was contested stays readable.
 */
export type DisputeOutcome =
  /** The grade was right; I misread or mis-clicked. Counts normally again. */
  | 'my-error'
  /** The item is wrong. The attempt never counts, and the item is suppressed. */
  | 'item-bug'
  /** The item is fine but it is filed under the wrong skill. Attempt discarded. */
  | 'wrong-skill'

export type DisputeEvent =
  | { id: string; t: number; kind: 'raised'; attemptId: string; templateId: string; itemVersion: number; seed: number; note: string }
  | { id: string; t: number; kind: 'resolved'; attemptId: string; templateId: string; outcome: DisputeOutcome; note: string }

export interface ProblemReport {
  id: string
  t: number
  templateId: string
  itemVersion: number
  seed: number
  note: string
}

/**
 * An if-then plan: "if <cue>, then <action>".
 *
 * The one mechanism in this app aimed squarely at using a skill OUTSIDE it.
 * Naming a concrete cue and the move it should trigger is what narrows the gap
 * between knowing something and doing it (RESEARCH.md §20b).
 *
 * Two design rules, both load-bearing:
 *
 * 1. NOT EVIDENCE, EVER. Everything here is self-reported, and self-report
 *    advances no rung anywhere in this app. A plan and its outcome never reach
 *    `deriveEvidence`, never schedule a review, and never appear as mastery.
 * 2. NOTHING TO GO AND READ. Forming the plan is what does the work;
 *    re-reading it adds little. So it is written once inside a session and
 *    asked about once, later, inside another session. There is no log screen,
 *    because a log nobody opens is just a feature.
 */
export interface FieldPlan {
  id: string
  t: number
  skillId: string
  /** "if ..." — a concrete, recurring, recognisable situation. */
  cue: string
  /** "then ..." — the move, small enough to actually make. */
  action: string
  /** When the follow-up was asked; null until then. */
  askedAt: number | null
  /** Self-reported and deliberately coarse. Never graded. */
  outcome: 'used' | 'noticed-too-late' | 'not-yet' | null
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

/**
 * A problem the LEARNER wrote, kept on their device.
 *
 * Deliberately walled off from everything that measures progress: authored
 * problems never enter the planner, never generate an `AttemptEvent`, and can
 * never move a rung. They are not audited content — nothing checked their
 * wording, their difficulty or their fairness — and the one rule this app
 * refuses to bend is that evidence comes from content the audit has verified.
 * See `engine/authored.ts` for the test that keeps this true.
 *
 * `sensible` is the learner's own verdict on re-reading their problem later:
 * null until judged, then kept or deleted. That review is the only quality
 * control a serverless app can honestly offer, and it is also the part with
 * the most learning in it — noticing that something you wrote does not hold up
 * is the same skill as noticing it in someone else's work.
 */
export interface AuthoredProblem {
  id: string
  t: number
  shapeId: string
  /** The numbers the learner chose. The prompt and answer derive from these. */
  slots: Record<string, number>
  /** Rendered at creation so an edited shape cannot silently rewrite history. */
  prompt: string
  /** COMPUTED by the shape, never typed by anyone. */
  answer: number
  unit: string
  skillId: string
  /** Whether their prediction about their own problem was right. */
  predictedOk: boolean
  /** The learner's later verdict. null = not yet reviewed. */
  sensible: boolean | null
  reviewedAt: number | null
}

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
  /** Append-only challenges to the RECORD. See DisputeEvent. */
  disputes: DisputeEvent[]
  /** If-then plans. Self-reported, never evidence — see FieldPlan. */
  plans: FieldPlan[]
  placement: PlacementResult | null
  customPacks: ContentPackJson[]
  /** Problems the learner wrote. Never evidence — see AuthoredProblem. */
  authored: AuthoredProblem[]
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
    mathTrack: null,
    trackConfirmedAt: null,
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
    disputes: [],
    plans: [],
    placement: null,
    customPacks: [],
    authored: [],
    sampleMode: false,
  }
}
