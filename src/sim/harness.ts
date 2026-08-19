/**
 * Multi-year learner simulation.
 *
 * The planner's worst bugs have all been invisible at unit level: every single
 * decision defensible, the aggregate broken. A skill starved behind another
 * bucket's prerequisite, a frontier the session builder could never satisfy, a
 * diagram served seven times against a cap of three — none of those showed up
 * in a unit test, and all of them showed up the moment a simulated learner was
 * played forward through real `buildSessionPlan` calls.
 *
 * This harness exists so that a FIVE-YEAR run is as cheap to ask for as a
 * one-day one, across the shapes real use actually takes: short sessions, long
 * sessions, several sessions in a day, weeks missed, goals that lean hard on
 * one area, and a learner whose accuracy moves over time.
 *
 * It is deliberately NOT a test. It reports; the assertions live beside it in
 * `*.sim.ts` files so a regression is a failed expectation rather than a number
 * someone has to notice.
 */
import { buildSessionPlan } from '../engine/planner'
import { DEFAULT_INDEX } from '../content/registry'
import { deriveEvidence } from '../engine/mastery'
import { northStar } from '../engine/northStar'
import { isPflTemplate } from '../engine/pflId'
import { isSpontaneousTemplate } from '../engine/probeId'
import { initialState, type AppState, type AttemptEvent, type BucketId, type ErrorTag, type SessionRecord, type SkillEvidence } from '../domain/types'

const DAY = 86_400_000

/** Deterministic PRNG. A simulation that moves under you cannot be a gate. */
export function rng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export interface AttemptContext {
  /** How many times this learner has met the hardest skill on this item. */
  priorAttempts: number
  /** 1-5. */
  difficulty: number
  /** Days since the run started. */
  day: number
  /** Total graded attempts so far. */
  attempts: number
  /**
   * The area the item belongs to.
   *
   * Every learner spec before this one was uniformly able across all ten
   * areas, which is the single case where a global difficulty signal cannot
   * be caught being wrong. Real learners are lopsided — this app's owner is
   * a strong maths student — and the mis-aim only appears once the model can
   * express that.
   */
  bucket: BucketId
  /** The skills the item carries evidence for. */
  skillIds: readonly string[]
}

export interface LearnerSpec {
  name: string
  /** Probability of a first-submission, zero-hint success. */
  p: (ctx: AttemptContext) => number
  /**
   * Probability the hint ladder is opened at all (blocks unaided credit).
   *
   * Receives the full AttemptContext, so a spec CAN condition hint use on
   * `ctx.difficulty`, area, or day. Every spec written before 2026-08-19
   * ignores the argument, which models hint use as independent of difficulty
   * — that independence is a property of THOSE SPECS, not of the harness,
   * and real learners presumably reach for hints more on harder items.
   */
  hintRate: (ctx: AttemptContext) => number
  /** Session lengths in minutes for a given day; [] means the day is skipped. */
  daySessions: (day: number, rand: () => number) => number[]
  goals: string[]
  mathTrack: string | null
  grade: number
  seed: number
  /**
   * OPTIONAL — probability that a first-try miss is corrected on the app's
   * corrective retry. A repaired attempt is written exactly the way the
   * player writes one: `firstCorrect: false, correct: true`, which earns
   * guided credit in `deriveEvidence` and can never count as independence.
   *
   * Absent = no miss is ever repaired, which is precisely the pre-2026-08-19
   * behaviour: the extra PRNG draw happens only when this field exists (and
   * only on misses), so every spec without it replays a byte-identical
   * event stream — verified by hashing streams before and after the field
   * was added. The same holds for `confidence` and `errorTag` below.
   */
  repair?: (ctx: AttemptContext) => number
  /**
   * OPTIONAL — stated confidence for this attempt, 0-100, or null to leave
   * the item unrated. The app records confidence in five steps —
   * 20/40/60/80/95 (CONFIDENCE_STEPS in ItemPlayer.tsx / PlacementScreen.tsx)
   * — so realistic specs should return one of those. `willBeCorrect` is the
   * already-drawn first-try outcome, letting a spec model any correlation
   * between confidence and accuracy, including none. Draws nothing from the
   * shared PRNG (a spec wanting noise closes over its own `rng`). Absent =
   * every event carries `confidence: null`, as before.
   */
  confidence?: (ctx: AttemptContext, willBeCorrect: boolean) => number | null
  /**
   * OPTIONAL — the cause tag the learner attaches to a MISS (first try
   * wrong); null = left untagged, exactly like a learner skipping the
   * why-did-this-go-wrong picker. Called only on misses. Draws nothing from
   * the shared PRNG. Absent = every event carries `errorTags: []`, as before.
   */
  errorTag?: (ctx: AttemptContext) => ErrorTag | null
}

export interface SimResult {
  name: string
  days: number
  sessions: number
  attempts: number
  focusedMinutes: number
  /** Minutes served per bucket. */
  served: Record<string, number>
  share: Record<string, number>
  /** Distinct skills the learner has any evidence for. */
  skillsTouched: number
  totalSkills: number
  untouched: string[]
  rungs: Record<string, number>
  /** Skills at `independent` or above. */
  owned: number
  /**
   * WHICH skills reached Independent, not just how many.
   *
   * The five-year reach gate asks whether a learner was left holding skills
   * they were READY for, and readiness means the prerequisites were PROVED —
   * merely having been served one once is not the same thing, and a gate built
   * on the weaker signal reports gaps that are the planner correctly waiting.
   */
  ownedSkills: string[]
  /** North star: re-proved unaided after 14+ days on a different family. */
  durable: number
  everUnaided: number
  minutesPerDurable: number | null
  transferEvents: number
  distinctTemplates: number
  totalTemplates: number
  /** Highest number of times any single template was served. */
  maxTemplateServes: number
  /** The 12 most-served templates, with how worn their variant pool is. */
  topTemplates: { id: string; bucket: string; serves: number; variants: number; variantsSeen: number }[]
  medianTemplateServes: number
  /** Minutes lost to serving a template already served that same session. */
  sameSessionRepeatMinutes: number
  /** Reviews still waiting at the end — a queue that only grows is a defect. */
  dueAtEnd: number
  /** Peak review backlog seen at any point. */
  peakDue: number
  /** Days the planner could not build a session at all. */
  plannerFailures: number
  /** Templates whose whole variant pool was exhausted at least once. */
  exhaustedTemplates: number
  /**
   * Template families met for the FIRST time in each year.
   *
   * Owned-skill count is the wrong measure of whether a long run is still
   * worth doing: a diligent learner finishing a finite curriculum is success,
   * not failure, and the count necessarily flattens near the top. What would
   * make years three to five hollow is the app having nothing left to SHOW —
   * so this counts genuinely new question families, which is the thing that
   * actually runs out.
   */
  freshTemplatesByYear: number[]
  /** Focused minutes attributed to each skill (a multi-skill item counts once per skill). */
  skillMinutes: Record<string, number>
  /** Day index on which each skill was first served. */
  firstReachedDay: Record<string, number>
  /**
   * Ordered primary-skill ids (`skillIds[0]`, the key `interleaveOrder`
   * sorts by) of every core block's activities, in PLAYED order. Captured so
   * an aggregate gate can measure whether blocks that claim to interleave are
   * genuinely mixed — max same-skill run length — rather than blocked
   * practice wearing the label. Core blocks only: warm-up and lab blocks mix
   * across areas by construction and would only dilute the signal.
   */
  coreBlockSkillSequences: string[][]
  /** Graded events that earned guided credit: eventually correct, but not a first-try unaided success. */
  guidedCreditEvents: number
  /** The corrective-fork subset of guided credit: wrong first try, corrected on retry (firstCorrect false, correct true). */
  repairedEvents: number
  /** Events carrying a confidence rating — the calibration machinery's raw material. */
  confidenceRatedEvents: number
  /**
   * Misconception blocks armed: a confident miss (confidence ≥ 80, mirroring
   * HIGH_CONF in mastery.ts) on a skill that was not already blocked…
   */
  misconceptionArmed: number
  /** …and later cleared by an unaided first-attempt success on that skill. */
  misconceptionCleared: number
  /** The raw event log, for building import/export fixtures. */
  eventsForExport: AttemptEvent[]
  /** Per-year snapshots of owned / durable / skillsTouched. */
  byYear: { year: number; owned: number; durable: number; touched: number; minutes: number }[]
}

const ALL_SKILLS: string[] = (() => {
  const s = new Set<string>()
  for (const t of DEFAULT_INDEX.templates.values()) for (const id of t.skillIds) s.add(id)
  return [...s]
})()

/** The area a cross-area item's minutes belong to (see allocationReport). */
function aboutSkillBucket(tpl: { generate: (s: number) => { extraSkillIds?: string[] } }, seed: number): BucketId | null {
  const about = tpl.generate(seed).extraSkillIds?.[0]
  if (!about) return null
  return (DEFAULT_INDEX.skills.get(about)?.bucket as BucketId | undefined) ?? null
}

/*
 * `Math.random` is installed ONCE and reseeded per run.
 *
 * Reassigning a built-in on every call deoptimises the hot paths that use it —
 * measured at more than a threefold slowdown of the whole matrix, from about
 * 215 seconds to over 600. Installing the replacement a single time and moving
 * only its seed costs nothing.
 */
let pinnedState = 1
function pinRandom(seed: number): void {
  pinnedState = seed >>> 0
}
Math.random = () => {
  pinnedState = (pinnedState * 1664525 + 1013904223) >>> 0
  return pinnedState / 4294967296
}

export function simulate(spec: LearnerSpec, days: number, startAt = Date.UTC(2026, 0, 5, 16)): SimResult {
  const rand = rng(spec.seed)
  /*
   * THE PLANNER USES `Math.random`, so a simulation is not reproducible
   * unless that is pinned too.
   *
   * `pickSeed` draws up to 24 random seeds looking for an unused variant, so
   * the same learner played twice meets different questions and reaches a
   * slightly different set of skills. Measured spread between two runs of the
   * same matrix: 1 skill of coverage and 0.4 points of delivered share. The
   * five-year gate was built without noticing, so a borderline assertion
   * flipped depending on what else had run first — which looked like tests
   * interfering with each other and was really just noise.
   *
   * Two consequences worth stating plainly. Any measured difference smaller
   * than that spread was never real. And a gate that flakes is worse than no
   * gate, because it teaches people to re-run until it passes.
   *
   * Pinned HERE rather than in the app: the randomness is wanted in real use,
   * so two learners on the same day do not get identical variants.
   */
  pinRandom((spec.seed ^ 0x5eed) >>> 0)
  let state: AppState = {
    ...initialState(),
    profile: { ...initialState().profile, mathTrack: spec.mathTrack, gradeLevel: spec.grade, goals: spec.goals },
    events: [],
    sessions: [],
  }
  const served: Record<string, number> = {}
  const skillTries = new Map<string, number>()
  const templateServes = new Map<string, number>()
  const seedsSeen = new Map<string, Set<number>>()
  let repeatMinutes = 0
  let plannerFailures = 0
  // Counted here, not read from `state.sessions`: the reducer keeps only the
  // most recent 2000 records, so a learner doing three a day would report 2000
  // sessions after five years instead of 5,475 — and every per-session rate
  // computed from it would be inflated by the same factor.
  let sessionsRun = 0
  let peakDue = 0
  const byYear: SimResult['byYear'] = []
  const firstSeenYear = new Map<string, number>()
  const freshTemplatesByYear = [0, 0, 0, 0, 0]
  const skillMinutes: Record<string, number> = {}
  const firstReachedDay: Record<string, number> = {}
  const coreBlockSkillSequences: string[][] = []

  for (let day = 0; day < days; day++) {
    const t0 = startAt + day * DAY
    const lengths = spec.daySessions(day, rand)
    for (let s = 0; s < lengths.length; s++) {
      // Several sessions in a day are hours apart, not milliseconds — spacing
      // and cooldowns are time-based and would read a burst as one sitting.
      const now = t0 + s * 4 * 3_600_000
      const evidence = deriveEvidence(state.events, now)
      let plan
      try {
        plan = buildSessionPlan({
          index: DEFAULT_INDEX,
          evidence,
          state,
          now,
          checkIn: { minutes: lengths[s], energy: 'ok', focus: null },
        })
      } catch {
        plannerFailures += 1
        continue
      }
      const seenThisSession = new Map<string, number>()
      const bucketMinutes: Partial<Record<BucketId, number>> = {}
      let attemptsHere = 0
      let correctHere = 0
      let minutesHere = 0

      for (const b of plan.blocks) {
        // Play order per core block (primary skill per item), for the
        // interleaving gate. Recorded as served, before any outcome is drawn,
        // so it is a fact about the plan rather than about this learner.
        const coreSeq: string[] | null = b.kind === 'core' ? [] : null
        for (const a of b.activities) {
          const tpl = DEFAULT_INDEX.templates.get(a.templateId)
          if (!tpl) continue
          if (coreSeq) coreSeq.push(tpl.skillIds[0] ?? '')
          const already = seenThisSession.get(tpl.id) ?? 0
          if (already > 0) repeatMinutes += tpl.minutes
          seenThisSession.set(tpl.id, already + 1)

          // Charged the same way `allocationReport` charges it, or the gate
          // would be grading the planner against a different ledger from the
          // one the planner optimises. The retention exit lives in Meta Lab but
          // asks about a skill from any area, and its minutes belong to that
          // area — without this, Meta reads ~4 points above target purely
          // because the exit is counted twice.
          const chargedTo = tpl.id === 'x-explain-back' ? aboutSkillBucket(tpl, a.seed) : null
          const charged = chargedTo ?? tpl.bucket
          served[charged] = (served[charged] ?? 0) + tpl.minutes
          bucketMinutes[charged] = (bucketMinutes[charged] ?? 0) + tpl.minutes
          minutesHere += tpl.minutes
          templateServes.set(tpl.id, (templateServes.get(tpl.id) ?? 0) + 1)
          if (!firstSeenYear.has(tpl.id)) {
            firstSeenYear.set(tpl.id, day)
            const y = Math.min(4, Math.floor(day / 365))
            freshTemplatesByYear[y] += 1
          }
          if (!seedsSeen.has(tpl.id)) seedsSeen.set(tpl.id, new Set())
          seedsSeen.get(tpl.id)!.add(a.seed % Math.max(1, tpl.variants))

          for (const id of tpl.skillIds) {
            skillMinutes[id] = (skillMinutes[id] ?? 0) + tpl.minutes
            if (firstReachedDay[id] === undefined) firstReachedDay[id] = day
          }
          const prior = Math.min(...tpl.skillIds.map((id) => skillTries.get(id) ?? 0))
          for (const id of tpl.skillIds) skillTries.set(id, (skillTries.get(id) ?? 0) + 1)
          const ctx: AttemptContext = {
            priorAttempts: prior,
            difficulty: tpl.difficulty,
            day,
            attempts: state.events.length,
            bucket: tpl.bucket as BucketId,
            skillIds: tpl.skillIds,
          }
          const hinted = rand() < spec.hintRate(ctx)
          const ok = rand() < spec.p(ctx)
          /*
           * The optional realism fields draw from the shared PRNG only when
           * their spec function exists, and strictly after the two draws
           * above. A spec without them therefore replays a byte-identical
           * event stream to the one it produced before these fields existed
           * — which is what keeps every gate pinned on those streams honest.
           * (`confidence` and `errorTag` are pure functions of the context
           * by contract and draw nothing here.)
           */
          const repaired = !ok && spec.repair !== undefined && rand() < spec.repair(ctx)
          const stated = spec.confidence !== undefined ? spec.confidence(ctx, ok) : null
          const confidence = stated === null ? null : Math.min(100, Math.max(0, stated))
          const missTag = !ok && spec.errorTag !== undefined ? spec.errorTag(ctx) : null
          // The explain-back exit records WHICH skill it asked about, and its
          // own rotation reads that back. A harness that omits the field pins
          // the rotation to one target forever and then reports the app
          // over-serving a single question 4,138 times — a defect in the
          // fixture, not the app. Render only where the field can exist:
          // generating every item would re-run the chess search thousands of
          // times for nothing.
          const about =
            tpl.id === 'x-explain-back' ? (tpl.generate(a.seed).extraSkillIds ?? []).slice(0, 4) : []
          attemptsHere += 1
          if (ok) correctHere += 1
          state.events.push({
            id: `e${state.events.length}`,
            t: now + state.events.length,
            sessionId: plan.id,
            templateId: tpl.id,
            itemVersion: tpl.version,
            seed: a.seed,
            skillIds: tpl.skillIds,
            bucket: tpl.bucket,
            mode: a.mode,
            firstResponse: 'x',
            finalResponse: 'x',
            correct: ok || repaired,
            firstCorrect: ok,
            score: null,
            validator: 'numeric',
            hintLevel: hinted ? 1 : 0,
            confidence,
            elapsedSec: tpl.minutes * 60,
            errorTags: missTag !== null ? [missTag] : [],
            difficulty: tpl.difficulty,
            ...(about.length ? { aboutSkillIds: about } : {}),
          })
        }
        if (coreSeq && coreSeq.length) coreBlockSkillSequences.push(coreSeq)
      }

      // The planner reads `state.sessions` — the every-third-session retention
      // exit and the "still calibrating" guard both key off its length. A
      // harness that never records one silently simulates a different app.
      sessionsRun += 1
      const record: SessionRecord = {
        id: plan.id,
        startedAt: now,
        endedAt: now + minutesHere * 60_000,
        activeMinutes: minutesHere,
        checkIn: { minutes: lengths[s], energy: 'ok', focus: null },
        attempts: attemptsHere,
        correctFirst: correctHere,
        bucketMinutes,
        learned: [],
        exitPrinciple: null,
        interrupted: false,
      }
      state = { ...state, sessions: [...state.sessions, record].slice(-2000) }
    }

    if (day % 30 === 0) {
      const ev = deriveEvidence(state.events, t0)
      peakDue = Math.max(peakDue, countDue(ev, t0))
    }
    if ((day + 1) % 365 === 0) {
      const at = startAt + (day + 1) * DAY
      const ev = deriveEvidence(state.events, at)
      const star = northStar(state.events, [], at)
      byYear.push({
        year: (day + 1) / 365,
        owned: [...ev.values()].filter((v) => rank(v.state) >= rank('independent')).length,
        durable: star.durable.length,
        touched: ev.size,
        minutes: Math.round(Object.values(served).reduce((a, b) => a + b, 0)),
      })
    }
  }

  const end = startAt + days * DAY
  const ev = deriveEvidence(state.events, end)
  const star = northStar(state.events, [], end)
  const rungs: Record<string, number> = {}
  for (const v of ev.values()) rungs[v.state] = (rungs[v.state] ?? 0) + 1
  const totalMin = Object.values(served).reduce((a, b) => a + b, 0)
  const share: Record<string, number> = {}
  for (const [b, m] of Object.entries(served)) share[b] = (100 * m) / (totalMin || 1)
  const serveCounts = [...templateServes.values()].sort((a, b) => b - a)
  let exhausted = 0
  for (const [id, seeds] of seedsSeen) {
    const tpl = DEFAULT_INDEX.templates.get(id)
    if (tpl && seeds.size >= Math.max(1, tpl.variants)) exhausted += 1
  }

  /*
   * Delivery counts for the corrective / calibration / error-tag machinery
   * (2026-08-19). Counted from the FINISHED event log — read-only, after the
   * run, so the measurement cannot perturb the thing it measures. The
   * misconception counts mirror mastery.ts: arming is a graded confident
   * miss (confidence ≥ 80 — HIGH_CONF there) on a skill not already blocked;
   * clearing is a later unaided first-attempt success on that skill. Probe
   * templates are skipped because deriveEvidence strips their verdicts
   * before they reach the ladder (asExposureIfProbe), and a mirror that
   * counted them would report blocks the engine never saw.
   */
  let guidedCreditEvents = 0
  let repairedEvents = 0
  let confidenceRatedEvents = 0
  let misconceptionArmed = 0
  let misconceptionCleared = 0
  const misconceptionLive = new Set<string>()
  for (const e of state.events) {
    if (e.confidence !== null) confidenceRatedEvents += 1
    if (e.correct === true && !(e.firstCorrect === true && e.hintLevel === 0)) guidedCreditEvents += 1
    if (e.correct === true && e.firstCorrect === false) repairedEvents += 1
    if (isPflTemplate(e.templateId) || isSpontaneousTemplate(e.templateId)) continue
    const confidentMiss = e.firstCorrect === false && e.confidence !== null && e.confidence >= 80
    const firstSuccess = e.firstCorrect === true && e.hintLevel === 0
    for (const id of e.skillIds) {
      if (confidentMiss && !misconceptionLive.has(id)) {
        misconceptionLive.add(id)
        misconceptionArmed += 1
      } else if (firstSuccess && misconceptionLive.has(id)) {
        misconceptionLive.delete(id)
        misconceptionCleared += 1
      }
    }
  }

  return {
    name: spec.name,
    days,
    sessions: sessionsRun,
    attempts: state.events.length,
    focusedMinutes: Math.round(totalMin),
    served,
    share,
    skillsTouched: ev.size,
    totalSkills: ALL_SKILLS.length,
    untouched: ALL_SKILLS.filter((s) => !ev.has(s)),
    rungs,
    owned: [...ev.values()].filter((v) => rank(v.state) >= rank('independent')).length,
    ownedSkills: [...ev.entries()].filter(([, v]) => rank(v.state) >= rank('independent')).map(([id]) => id),
    durable: star.durable.length,
    everUnaided: star.everUnaided,
    minutesPerDurable: star.minutesPerDurableSkill,
    transferEvents: star.transferred,
    distinctTemplates: templateServes.size,
    totalTemplates: DEFAULT_INDEX.templates.size,
    maxTemplateServes: serveCounts[0] ?? 0,
    topTemplates: [...templateServes.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([id, serves]) => {
        const tpl = DEFAULT_INDEX.templates.get(id)!
        return { id, bucket: tpl.bucket, serves, variants: tpl.variants, variantsSeen: seedsSeen.get(id)?.size ?? 0 }
      }),
    medianTemplateServes: serveCounts[Math.floor(serveCounts.length / 2)] ?? 0,
    sameSessionRepeatMinutes: Math.round(repeatMinutes),
    dueAtEnd: countDue(ev, end),
    peakDue,
    plannerFailures,
    exhaustedTemplates: exhausted,
    freshTemplatesByYear,
    eventsForExport: state.events,
    skillMinutes,
    firstReachedDay,
    coreBlockSkillSequences,
    guidedCreditEvents,
    repairedEvents,
    confidenceRatedEvents,
    misconceptionArmed,
    misconceptionCleared,
    byYear,
  }
}

const ORDER = ['unseen', 'introduced', 'guided', 'independent', 'retained', 'transferred']
function rank(s: string): number {
  const i = ORDER.indexOf(s)
  return i < 0 ? 0 : i
}

function countDue(ev: Map<string, SkillEvidence>, now: number): number {
  let n = 0
  for (const v of ev.values()) if (v.review && v.review.due <= now) n += 1
  return n
}
