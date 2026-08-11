/**
 * The adaptive session planner.
 *
 * A deliberately SIMPLE, INSPECTABLE priority system — weighted, explainable
 * factors over derived evidence. No opaque model, no pretended certainty:
 * every selection carries a plain-language "why", and with <3 sessions of
 * history the planner says it is still calibrating and stays conservative.
 */
import type {
  AppState,
  AttemptEvent,
  AttemptMode,
  BucketId,
  CheckIn,
  ItemTemplate,
  PlannedActivity,
  PlannedBlock,
  SessionPlan,
  SkillEvidence,
  SkillNode,
} from '../domain/types'
import { ACADEMIC_BUCKETS, BUCKET_BY_ID, ERROR_TAGS } from '../domain/types'
import type { ContentIndex } from './content-index'
import { difficultyForRate, evidenceFor, stateRank } from './mastery'
import { effectiveGrade } from './effectiveGrade'
import { dueForms, dueReviews } from './scheduler'
import { relativeDebt, type AllocationReport } from './allocation'
import { effectiveAllocation } from './allocationPlus'
import { uid } from './rng'
import { explainSeedFor, lastExplainedAt, pickExplainTarget } from '../content/items/methodDrills'
import { activeMission, missionPriority, missionReadiness } from './mission'
import type { RepairTarget } from './errors'
import { calendarDaysUntil } from './time'
import { calibrationGap } from './calibration'
import { stretchSignal } from './stretch'
import { isPflTemplate } from './pfl'
import { TRACK_BY_ID, type MathTrack } from '../content/tracks'
import { getReadyReport } from './getReady'
import {
  buildTemplateCoverage,
  coverageAdjustment,
  dailyRoute,
  dailyTemplateScore,
  exploreExhausted,
  type TemplateCoverage, withoutTooEarlyNonRoutine,} from './plannerPolicy'

export interface PlannerContext {
  index: ContentIndex
  evidence: Map<string, SkillEvidence>
  state: AppState
  now: number
  checkIn: CheckIn
}

// ---------------------------------------------------------------- helpers

/** Is ONE prerequisite satisfied — by earned evidence or a routing signal? */
function prereqSatisfied(
  prereqId: string,
  evidence: Map<string, SkillEvidence>,
  state: AppState,
): boolean {
  if (stateRank(evidenceFor(evidence, prereqId).state) >= stateRank('independent')) return true
  const sig = state.placement?.signals.find((s) => s.skillId === prereqId)
  return sig?.signal === 'ok' || sig?.signal === 'strong'
}

/** A skill is frontier-eligible when every prereq is independent-or-better,
 *  or the placement judged the prereq 'ok'/'strong' (routing signal only). */
export function prereqsMet(
  skill: SkillNode,
  evidence: Map<string, SkillEvidence>,
  state: AppState,
): boolean {
  return skill.prereqs.every((p) => prereqSatisfied(p, evidence, state))
}

/**
 * How much is ACTUALLY waiting on this skill — dependents that are both unowned
 * and still blocked *by this skill*.
 *
 * The old version counted every unowned dependent, whether or not this skill
 * was what stood in its way. That sounds like a rounding error and is not: once
 * a skill is owned, its dependents are unlocked, so nothing is waiting on it —
 * yet it kept claiming the full leverage bonus (capped at 2.5, the largest term
 * in the scorer after a due review) forever. The root of the tree has the most
 * dependents, so the root won every tie for the rest of the learner's life.
 *
 * Measured over 365 simulated days at ~100% first-try accuracy: the core block
 * landed on `m-integers` — the first skill in the tree, long since Retained —
 * **215 times out of 365**, the learner touched 59 of 122 skills all year, and
 * 18 skills sat eligible-but-never-served. The scorer was not choosing badly
 * among the candidates; it was scoring an already-open door as if it were shut.
 *
 * The same reasoning was already written down one screen below for the
 * `alreadyCapable` case ("the dependents are ALREADY unlocked, so counting the
 * leverage again just pins the plan to the easiest foundational skill in the
 * tree"). It was simply never applied to a skill the learner had EARNED.
 *
 * This also makes the learner-facing `why` true. "4 skills are waiting on it"
 * was printed for a skill exactly 1 was waiting on.
 */
export function prereqLeverage(
  skillId: string,
  index: ContentIndex,
  evidence: Map<string, SkillEvidence>,
  state: AppState,
): number {
  // Nothing is waiting on a prerequisite that is already satisfied.
  if (prereqSatisfied(skillId, evidence, state)) return 0
  let n = 0
  for (const s of index.skillList) {
    if (!s.prereqs.includes(skillId)) continue
    if (stateRank(evidenceFor(evidence, s.id).state) < stateRank('independent')) n++
  }
  return n
}

function recentlyUsedForms(events: AttemptEvent[], now: number): Set<string> {
  const cutoff = now - 7 * 86_400_000
  const used = new Set<string>()
  for (const e of events) if (e.t >= cutoff) used.add(`${e.templateId}:${e.seed}`)
  return used
}

const recentTemplateUse = buildTemplateCoverage

/** Pick a seed whose rendered form was not used recently (best effort). */
/**
 * True when every FORM this template has is already planned for this session.
 *
 * `pickSeed` tries 24 random seeds and takes one whose variant is unused —
 * which silently gives up and serves a duplicate when there is nothing left to
 * find. For a single-form template that is every time: `seed % 1` is always 0,
 * so all 24 candidates collide and the 25th line hands one back anyway.
 *
 * Measured over 40 simulated sessions, one served `s-blinding` twice in a row
 * in the same warm-up — the identical question, back to back — because two due
 * skills both resolved to it. Repeating a template with DIFFERENT numbers is
 * ordinary interleaving and happened in 17 of those 40 sessions; repeating the
 * identical question is the bug.
 */
export function formsExhausted(template: ItemTemplate, used: Set<string>): boolean {
  const forms = Math.max(1, template.variants)
  for (let v = 0; v < forms; v++) {
    if (!used.has(`${template.id}:${v}`)) return false
  }
  return true
}

/**
 * How long a skill rests before a review may retrieve it again. HEURISTIC.
 *
 * A skill that is struggling or blocked by a misconception is marked due
 * IMMEDIATELY rather than on an interval, which is the right intent — it
 * should come back soon. But "due now" plus two sessions in one day means it
 * comes back three hours later, and re-testing a repair that fast reads
 * working memory rather than whether anything was repaired. Measured over 21
 * simulated days at two sessions a day, 16 reviews were same-day repeats.
 *
 * Twelve hours keeps "soon" (tomorrow morning) while refusing "again this
 * afternoon". It does nothing at all to a once-a-day learner.
 */
export const MIN_REVIEW_GAP_MS = 12 * 3_600_000

function retriedTooSoon(evidence: Map<string, SkillEvidence>, skillId: string, now: number): boolean {
  const last = evidence.get(skillId)?.lastAttemptAt ?? null
  return last !== null && now - last < MIN_REVIEW_GAP_MS
}

export function pickSeed(template: ItemTemplate, used: Set<string>): number {
  for (let i = 0; i < 24; i++) {
    const seed = Math.floor(Math.random() * 0x7fffffff)
    if (!used.has(`${template.id}:${seed % Math.max(1, template.variants)}`) && !used.has(`${template.id}:${seed}`)) {
      return seed
    }
  }
  return Math.floor(Math.random() * 0x7fffffff)
}

/**
 * Target item difficulty for a skill's current evidence.
 *
 * `placement` is the routing signal for this skill, and it matters most in the
 * first sessions. Without it every skill starts at 1.5 because it has no
 * practice evidence yet — which is exactly right for material the learner has
 * never met, and exactly wrong straight after a diagnostic that just watched
 * them handle it. Reported from real use as "the sessions are too easy".
 *
 * The signal only sets a FLOOR, and only until real evidence exists: practice
 * always outranks the interview.
 */
/** Predicted success rate the planner aims each item at. HEURISTIC. */
export const ABILITY_TARGET_RATE = 0.6

export function targetDifficulty(
  ev: SkillEvidence,
  energy: CheckIn['energy'],
  conservative: boolean,
  placement?: 'gap' | 'ok' | 'strong' | 'skipped',
  /**
   * Global stretch adjustment from recent unaided accuracy (see
   * `engine/stretch.ts`). Per-skill evidence says where a skill sits; this says
   * whether the whole diet is currently under or over the learner. Without it,
   * a simulated learner at 95% first-try accuracy was still being served
   * difficulty 2.4 four months in.
   */
  stretch = 0,
): number {
  /*
   * ABILITY FIRST, RUNG AS FALLBACK.
   *
   * The rung answers "what has this learner proved?" and was doing double duty
   * as "what problem should they get next" — a five-value lookup that cannot
   * see a learner who is Retained on a skill and still failing its hard items.
   * Once there are enough unaided outcomes at known difficulties, the fitted
   * ability answers the second question directly (mastery.ts), and the target
   * is the difficulty they are predicted to clear about 70% of the time.
   *
   * Measured against the rung-only version over simulated years, at five
   * learner abilities: second-half first-try accuracy moved from 19/34/46/59/77%
   * to 55/62/70/74/79% — into the productive band at every level instead of
   * only the top. See RESEARCH.md §37.
   *
   * 0.6 is a HEURISTIC, and it was SWEPT rather than picked. At 0.7 the
   * calibration gain came with a real coverage cost (a mid learner reached 62
   * skills instead of 71); at 0.6 that cost disappears and most of the gain
   * remains. It also sits toward the demanding end of the band `stretchSignal`
   * already calls healthy (0.5-0.82), which is the side this app leans on
   * anyway — comfortable practice is pleasant and teaches little.
   */
  // `!== null` is not enough: a SkillEvidence built anywhere but `finalize`
  // — an older cached shape, a hand-made fixture, anything imported — can
  // carry `undefined` here, and `difficultyForRate(undefined)` is NaN, which
  // then silently poisons every difficulty comparison downstream. Same
  // defence the calibration readouts take: check for a usable number, not for
  // the absence of one particular empty value.
  const fromAbility =
    typeof ev.ability === 'number' && Number.isFinite(ev.ability)
      ? difficultyForRate(ev.ability, ABILITY_TARGET_RATE)
      : null
  const fromEvidence =
    fromAbility !== null
      ? fromAbility
      : ev.state === 'transferred'
      ? 5
      : ev.state === 'retained'
        ? 4
        : ev.state === 'independent'
          ? 3
          : ev.state === 'guided'
            ? 2
            : 1.5
  // A placement floor applies only where practice has not yet spoken.
  const placementFloor = stateRank(ev.state) >= stateRank('independent') ? 0 : placement === 'strong' ? 3 : placement === 'ok' ? 2.5 : 0
  const base = Math.max(fromEvidence, placementFloor)
  const adjusted =
    base +
    stretch +
    (energy === 'high' && !conservative ? 0.5 : 0) -
    (energy === 'low' ? 0.5 : 0) -
    // Recent misses on THIS skill still pull down even while the global signal
    // pushes up: struggling here is more specific information than cruising
    // everywhere, so it wins locally.
    (ev.recentMisses >= 2 ? 1 : 0)
  // The early-sessions cap exists so a cold planner does not overreach. It
  // lifts when placement actually saw the skill go well — capping a strong
  // placement at 3 is what made the first real sessions feel like review — and
  // it lifts again once sustained accuracy says the caution is unwarranted.
  const ceiling = conservative ? (placement === 'strong' || stretch >= 1 ? 4 : 3) : 5
  return Math.max(1, Math.min(ceiling, adjusted))
}

/** The placement's routing signal for a skill, if it has one. */
export function placementSignal(state: AppState, skillId: string): 'gap' | 'ok' | 'strong' | 'skipped' | undefined {
  return state.placement?.signals.find((s) => s.skillId === skillId)?.signal
}

function pickTemplates(
  candidates: ItemTemplate[],
  wantDifficulty: number,
  count: number,
  templateUse: Map<string, TemplateCoverage>,
  opts: {
    transferOnly?: boolean
    excludeKinds?: string[]
    preferCalibration?: boolean
    prioritizeTemplateId?: string
    easing?: boolean
    /** Already planned this session — drop anything with no fresh form left. */
    used?: Set<string>
  } = {},
): ItemTemplate[] {
  const pool = candidates
    .filter((t) => !opts.used || !formsExhausted(t, opts.used))
    .filter((t) => (opts.transferOnly ? t.transfer : true))
    .filter((t) => !(opts.excludeKinds ?? []).includes(t.kind))
    // Long-form simulations have their own Practice mode. Quietly squeezing a
    // 20-minute project into a 7-minute daily block breaks both the plan and
    // the realism of the work.
    .filter((t) => dailyRoute(t) === 'daily-practice')
    // Preparation-for-future-learning probes are excluded from ordinary pools
    // for two reasons. They teach an idea the tree never covers, so serving one
    // as practice for the skill it is attached to would be teaching the wrong
    // thing; and a probe re-served is a probe wasted, because the second time
    // it measures memory rather than pick-up. They are launched deliberately.
    .filter((t) => !isPflTemplate(t.id))
    // A manipulable diagram is exposure, and exposure does not repeat well.
    // Without this a struggling learner was served ONE diagram 45 times in a
    // simulated year while never meeting the other fourteen.
    .filter((t) => !exploreExhausted(t.id, templateUse.get(t.id)))
  const scored = pool
    .map((t) => ({
      t,
      score:
        // ASYMMETRIC on purpose: slightly hard is productive; repeatedly easy
        // is pleasant but does not move the frontier. Coverage debt only breaks
        // the fair fight among work that is already near the right level.
        dailyTemplateScore(t, wantDifficulty, templateUse.get(t.id), opts.preferCalibration, opts.easing) +
        (opts.prioritizeTemplateId === t.id ? 100 : 0),
    }))
    .sort((a, b) => b.score - a.score)
  const out: ItemTemplate[] = []
  for (const { t } of scored) {
    if (out.length >= count) break
    out.push(t)
  }
  return out
}

/** Fill an activity budget with distinct templates first, then fresh variants
 * of reusable generators. Fixed one-off items are never repeated. */
function pickTemplatesForBudget(
  candidates: ItemTemplate[],
  wantDifficulty: number,
  budgetMinutes: number,
  templateUse: Map<string, TemplateCoverage>,
  opts: {
    maxCount: number
    minCount?: number
    transferOnly?: boolean
    excludeKinds?: string[]
    preferCalibration?: boolean
    prioritizeTemplateId?: string
    maxPerTemplate?: number
    easing?: boolean
    /** Already planned this session — drop anything with no fresh form left. */
    used?: Set<string>
  },
): ItemTemplate[] {
  const ranked = pickTemplates(candidates, wantDifficulty, candidates.length, templateUse, opts)
  if (!ranked.length) return []
  const reusable = ranked.filter((t) => t.variants > 1)
  const out: ItemTemplate[] = []
  const timesUsed = new Map<string, number>()
  let minutes = 0
  let cursor = 0
  const minCount = opts.minCount ?? 1
  // A skill with a single template used to fill an entire block with clones of
  // itself — measured at seven copies of one family in one core block. Fresh
  // VARIANTS are legitimate practice, but a block that is all one family is
  // monotonous and narrow. Cap the repeats and return short instead; the
  // session tops itself up from elsewhere (see buildExtensionBlock).
  const maxPerTemplate = opts.maxPerTemplate ?? 2
  while (out.length < opts.maxCount) {
    const template = cursor < ranked.length ? ranked[cursor] : reusable.length ? reusable[(cursor - ranked.length) % reusable.length] : null
    if (!template) break
    cursor++
    const seen = timesUsed.get(template.id) ?? 0
    if (seen >= maxPerTemplate) {
      // Nothing left to rotate through — every candidate is exhausted.
      if (cursor > ranked.length + reusable.length * maxPerTemplate) break
      continue
    }
    const next = minutes + template.minutes
    if (out.length >= minCount && next > budgetMinutes * 1.15) break
    out.push(template)
    timesUsed.set(template.id, seen + 1)
    minutes = next
    if (out.length >= minCount && minutes >= budgetMinutes * 0.9) break
  }
  return out
}

/** Pick one substantial application whose PRIMARY category is currently
 * under-served. These are scheduled as whole workflows, never squeezed into
 * a short block. A focus request is authoritative: if that category has no
 * suitable studio, the normal focused plan wins instead. */
function pickAuthenticApplication(
  ctx: PlannerContext,
  report: AllocationReport,
  availableMinutes: number,
  templateUse: Map<string, TemplateCoverage>,
): ItemTemplate | null {
  const candidates = [...ctx.index.templates.values()].filter((template) => {
    if (!template.authentic) return false
    if (template.minutes > availableMinutes || template.minutes < availableMinutes - 6) return false
    const primary = evidenceFor(ctx.evidence, template.skillIds[0])
    return stateRank(primary.state) >= stateRank('guided')
  })
  const focused = ctx.checkIn.focus
    ? candidates.filter((template) => template.bucket === ctx.checkIn.focus)
    : candidates
  return focused
    .map((template) => ({
      template,
      score:
        relativeDebt(report, template.bucket) * 8 +
        coverageAdjustment(templateUse.get(template.id), template.variants) -
        Math.abs(availableMinutes - template.minutes) * 0.15,
    }))
    .sort((a, b) => b.score - a.score)[0]?.template ?? null
}

// ---------------------------------------------------------------- skill scoring

export interface SkillScore {
  skill: SkillNode
  score: number
  reasons: string[]
}

/** Score frontier candidates within a bucket for the core block. */
/**
 * The math-course tilt. Same law as onboarding goals: a BOUNDED, OPENLY-STATED
 * nudge, never a filter. `TRACK_BONUS` sits below a due review (3) and a
 * mission (2+), so course membership can break ties but cannot crowd out what
 * the evidence says matters; everything outside the track keeps its full score
 * and keeps being scheduled. `TRACK_UNIT_BONUS` is a smaller second nudge for
 * the EARLIEST unit that still has unfinished skills — that is what "where
 * your class is" means in course terms.
 */
export const TRACK_BONUS = 1.2
export const TRACK_UNIT_BONUS = 0.5
/**
 * A course whose skills all sit behind prerequisite chains would otherwise
 * tilt nothing a beginner can actually reach — measured: a fresh learner on
 * the algebra-readiness track owned 2 of 18 course skills after a simulated
 * year, because the tilt pointed only at locked doors. Unmet prereqs of
 * course skills get this smaller boost, the same move the mission system
 * makes, so the tilt reaches the learner wherever they stand on the ladder.
 */
export const TRACK_PREREQ_BONUS = 0.8

/**
 * THE GATEWAY BONUS — for a skill that is locking another bucket out entirely.
 *
 * Found by simulation, not by reading the code: every physics skill sits behind
 * a MATH prerequisite (`p-measure` needs `m-units`, four links deep in the math
 * chain), so a learner promised 8% physics was served 1.2% of it after 180
 * simulated days — and `m-units` was still `unseen`. It was not blocked; it was
 * eligible the whole time and scored 2.0, losing the tie-break to twenty other
 * math skills every single session for six months.
 *
 * Nothing looked wrong anywhere: allocation reported a healthy 8% target, the
 * planner reported a valid choice with a real reason, and the balance card
 * showed "Physics 8% / 0%" as though it were an ordinary shortfall. The
 * allocation system cannot fix this on its own, because its nudge applies to
 * skills in the starved bucket and there were none to nudge.
 *
 * So a skill gets this bounded, stated bonus when NOT owning it is what blocks
 * a bucket that is genuinely behind its target. Below a due review (3), like
 * every other tilt, and it disappears the moment the gate opens.
 */
export const GATEWAY_BONUS = 1.6

/**
 * A non-math academic bucket served below this fraction of its target claims
 * the core block outright. `relativeDebt` returns (target − actual) / target,
 * so 0.5 means "served less than half of what was promised" — a shortfall the
 * ordinary score nudge has already failed to close. HEURISTIC.
 */
export const STARVED_DEBT = 0.5

/** How hard a starved bucket pushes for the core block. Below a due review (3)
 *  on purpose: retention still outranks balance. HEURISTIC. */
export const STARVED_BOOST = 3.4

/** Placement-cleared material is deprioritised so the frontier moves on. */
const CAPABLE_PENALTY = 2
const CAPABLE_REASON = 'placement already saw this go well, so the next gain is further on'

/**
 * Math's incumbency on the core block. It carries by far the largest default
 * allocation (31% against 7-8% for the other academic buckets), so it holds
 * the core unless another bucket clearly outranks it or is starving. This is
 * the intent the old early-`break` was serving crudely — stated as a number
 * now, so it can be reasoned about instead of being a control-flow accident.
 */
export const MATH_CORE_MARGIN = 2

/** The first unit in the track with any skill not yet independent. */
export function trackFrontierUnit(
  track: MathTrack,
  evidence: Map<string, SkillEvidence>,
): { name: string; skillIds: string[] } | null {
  for (const unit of track.units) {
    const unfinished = unit.skillIds.some(
      (sid) => stateRank(evidenceFor(evidence, sid).state) < stateRank('independent'),
    )
    if (unfinished) return unit
  }
  return null
}

export function scoreSkills(
  bucket: BucketId,
  ctx: PlannerContext,
  report: AllocationReport,
): SkillScore[] {
  const { index, evidence, state, now } = ctx
  const out: SkillScore[] = []
  // Is the learner currently cruising? If so, owned skills come back into play
  // for DEPTH rather than being retired.
  const cruising = stretchSignal(state.events, now).adjust > 0
  const track = state.profile.mathTrack ? TRACK_BY_ID.get(state.profile.mathTrack) ?? null : null
  const trackSkills = track ? new Set(track.units.flatMap((u) => u.skillIds)) : null
  const frontierUnit = track ? trackFrontierUnit(track, evidence) : null

  /**
   * What fraction of a bucket is still behind a locked prerequisite. Computed
   * once per call — the gateway check below needs it per candidate, and
   * recomputing inside that loop would make scoring quadratic.
   */
  const lockedCache = new Map<BucketId, number>()
  const lockedShare = (b: BucketId): number => {
    const hit = lockedCache.get(b)
    if (hit !== undefined) return hit
    let total = 0
    let locked = 0
    for (const s of index.skillList) {
      if (s.bucket !== b) continue
      total++
      if (stateRank(evidenceFor(evidence, s.id).state) < stateRank('independent') && !prereqsMet(s, evidence, state)) {
        locked++
      }
    }
    const share = total ? locked / total : 0
    lockedCache.set(b, share)
    return share
  }
  for (const skill of ctx.index.skillList) {
    if (skill.bucket !== bucket) continue
    const ev = evidenceFor(evidence, skill.id)
    const owned = stateRank(ev.state) >= stateRank('retained')
    /*
     * Retained used to mean "retired": the skill left the pool for good unless
     * it fell due. That is why difficulty flatlined — a learner was always at
     * the frontier of NEW material, and new material starts easy by definition,
     * so four months of practice produced the same difficulty as week three.
     *
     * An owned skill now stays eligible while the learner is cruising, where it
     * competes on a deliberately low base score (below) so it deepens the
     * program rather than crowding out new ground. A skill that has reached
     * Transferred is genuinely done and still retires.
     */
    if (owned && !ev.needsReview && !(cruising && ev.state === 'retained')) continue
    if (!prereqsMet(skill, evidence, state)) continue
    if (!(index.bySkill.get(skill.id) ?? []).length) continue
    const reasons: string[] = []
    let score = 0
    if (owned && !ev.needsReview) {
      // Low, so new material still wins a fair fight — but non-zero, so the
      // hardest available work on a solid skill is reachable at all.
      score += 0.7
      reasons.push('you own this one, so it comes back at a harder level rather than being retired')
    }
    if (ev.needsReview) {
      score += 3
      reasons.push(ev.blockedByMisconception ? 'has an unrepaired confident error' : 'is due for review')
    }
    const sig = state.placement?.signals.find((s) => s.skillId === skill.id)
    // Placement saw this go well and practice has not contradicted it yet.
    const alreadyCapable = sig?.signal === 'strong' && stateRank(ev.state) < stateRank('independent')
    const lev = prereqLeverage(skill.id, index, evidence, state)
    // Leverage says "things are waiting on this". That argument dies when the
    // learner is already capable here, because `prereqsMet` treats a strong
    // placement as satisfying the prerequisite — the dependents are ALREADY
    // unlocked, so counting the leverage again just pins the plan to the
    // easiest foundational skill in the tree.
    if (lev > 0 && !alreadyCapable) {
      score += Math.min(2.5, lev * 0.8)
      reasons.push(`${lev} skill${lev > 1 ? 's are' : ' is'} waiting on it`)
    }
    if (sig?.signal === 'gap') {
      score += 2
      reasons.push('placement flagged a gap here')
    }
    if (alreadyCapable) {
      // Reported from real use: the first sessions after a diagnostic read as
      // too easy. This was why — the frontier stayed parked on material the
      // placement had already watched the learner handle.
      score -= CAPABLE_PENALTY
      reasons.push(CAPABLE_REASON)
      // When placement judged EVERYTHING strong, the penalty above is uniform
      // and something still has to be picked. Break that tie upward: prefer
      // the most advanced material the learner is cleared for, capped just
      // above their stated grade so "start high" never becomes "start lost".
      // effectiveGrade, not the typed year: the cap used to bite hardest on an
      // accelerated learner, pinning reach one rung above their school year
      // while their own chosen track taught two rungs higher.
      const reach = Math.min(skill.gradeBand, effectiveGrade(state.profile) + 1)
      score += Math.max(0, reach - 6) * 0.5
    }
    if (ev.recentMisses > 0) {
      score += 1
      reasons.push('recent misses suggest a weakness')
    }
    if (ev.state === 'guided' || ev.state === 'introduced') {
      score += 1.5
      reasons.push(`it is at your frontier (${ev.state})`)
    } else if (ev.state === 'independent') {
      score += 0.6
      reasons.push('it is ready for retention and transfer evidence')
    } else if (ev.state === 'unseen' && sig?.signal !== 'strong') {
      score += 0.8
    }
    // Exact learning-mission relevance (selected target or an unmet prereq).
    const mission = missionPriority(skill.id, state, index, now)
    if (mission.boost > 0) {
      score += mission.boost
      if (mission.reason) reasons.push(mission.reason)
    }
    // Course membership: a small open tilt toward the learner's actual class.
    if (track && trackSkills!.has(skill.id)) {
      score += TRACK_BONUS
      if (frontierUnit && frontierUnit.skillIds.includes(skill.id)) {
        score += TRACK_UNIT_BONUS
        reasons.push(`up next in your ${track.name} course (${frontierUnit.name})`)
      } else {
        reasons.push(`part of your ${track.name} course`)
      }
    } else if (track) {
      // Not in the course, but directly unlocking something that is: the tilt
      // has to reach learners still climbing toward their course's material.
      const unlocks = ctx.index.skillList.find(
        (s2) =>
          trackSkills!.has(s2.id) &&
          s2.prereqs.includes(skill.id) &&
          stateRank(evidenceFor(evidence, s2.id).state) < stateRank('independent') &&
          !prereqsMet(s2, evidence, state),
      )
      if (unlocks) {
        score += TRACK_PREREQ_BONUS
        reasons.push(`unlocks ${unlocks.name} in your ${track.name} course`)
      }
    }
    // Legacy broad-subject deadline relevance.
    for (const d of state.deadlines) {
      const days = calendarDaysUntil(d.dateISO, now)
      if (!(d.skillIds?.length) && d.bucket === skill.bucket && days >= 0 && days <= 14) {
        score += days <= 5 ? 2 : 1
        reasons.push(`${d.title} is in ${days} day${days === 1 ? '' : 's'}`)
      }
    }
    // Small allocation nudge between academic buckets.
    score += relativeDebt(report, skill.bucket) * 0.8

    /*
     * Cross-bucket gateway (see GATEWAY_BONUS). Only fires while this skill is
     * unowned AND a dependent in ANOTHER bucket is blocked AND that bucket is
     * either behind its target OR still mostly locked — so it cannot become a
     * permanent thumb on the scale.
     *
     * Weighting by minutes-debt ALONE was not enough: physics has one skill
     * reachable without any prerequisite (`p-estimate`), which quietly filled
     * the bucket's minutes, cleared the debt, and let the gateway bonus fade
     * while the other ten physics skills stayed locked forever. Minutes-
     * starvation and BREADTH-starvation are different failures, and only the
     * second one explains a learner doing the same physics skill for a year.
     */
    if (stateRank(ev.state) < stateRank('independent')) {
      let bestDebt = 0
      let bestBucket: BucketId | null = null
      for (const dep of index.skillList) {
        if (dep.bucket === skill.bucket) continue
        if (!dep.prereqs.includes(skill.id)) continue
        if (stateRank(evidenceFor(evidence, dep.id).state) >= stateRank('independent')) continue
        // Already reachable — then this skill is not what is holding it back.
        if (prereqsMet(dep, evidence, state)) continue
        const need = Math.max(relativeDebt(report, dep.bucket), lockedShare(dep.bucket))
        if (need > bestDebt) {
          bestDebt = need
          bestBucket = dep.bucket
        }
      }
      if (bestBucket && bestDebt > 0) {
        score += GATEWAY_BONUS * bestDebt
        reasons.push(`${BUCKET_BY_ID[bestBucket].name} is behind and every route into it waits on this`)
      }
    }
    out.push({ skill, score, reasons })
  }
  /*
   * A UNIFORM penalty reorders nothing — it only handicaps the whole bucket.
   *
   * The `alreadyCapable` −2 exists to push the frontier past material the
   * placement already cleared. When a diagnostic marks EVERY skill in a bucket
   * strong, that penalty lands on every candidate equally: the ranking within
   * the bucket is unchanged, but the bucket's best score drops (measured: math
   * fell to −0.50 while untouched physics sat at 3.20) and the bucket loses the
   * core block outright. That was invisible while an early `break` in
   * buildSessionPlan happened to pick math before anything else was scored.
   *
   * Cancelling it when it applies to everyone keeps the intended within-bucket
   * reordering and drops the accidental cross-bucket handicap.
   */
  if (out.length > 1 && out.every((s) => s.reasons.includes(CAPABLE_REASON))) {
    for (const s of out) s.score += CAPABLE_PENALTY
  }
  return out.sort((a, b) => b.score - a.score)
}

// ---------------------------------------------------------------- session plan

function minutesOf(templates: ItemTemplate[]): number {
  return templates.reduce((a, t) => a + t.minutes, 0)
}

function act(t: ItemTemplate, mode: AttemptMode, used: Set<string>): PlannedActivity {
  const seed = pickSeed(t, used)
  used.add(`${t.id}:${seed}`)
  used.add(`${t.id}:${seed % Math.max(1, t.variants)}`)
  return { templateId: t.id, seed, mode }
}

/**
 * How many reviews one session actually retrieves.
 *
 * Exported because the Today screen states this number to the learner, and a
 * second copy of the rule would drift. The warm-up widens under pressure (see
 * `warmBudget`), so the answer depends on how long the queue is.
 *
 * This is what makes the "reviews due" figure honest. Left as a bare count it
 * reads as a to-do list, and a learner who owns seventy skills has a permanent
 * queue of roughly forty that no session could ever clear — a wall of debt,
 * which is exactly the fake urgency the founding brief rules out. Saying how
 * many today will take turns it back into a queue the app is working through.
 */
export function reviewsPerSession(dueCount: number, sessionMinutes: number): number {
  if (sessionMinutes <= 12) return 2
  return dueCount / 20 >= 0.75 ? 5 : 3
}

export function estimatedPlanMinutes(plan: SessionPlan): number {
  return plan.blocks.reduce((sum, block) => sum + block.minutes, 0)
}

/**
 * How close to the chosen length a session has to land before it may end.
 *
 * Planned minutes are ESTIMATES per item; a learner who works quickly can
 * exhaust a "30 minute" plan in twelve real minutes, which quietly turns a
 * deliberate dose into whatever the estimates happened to add up to. So the
 * session tops itself up until it is inside this window, and never starts work
 * that would carry it past the far edge.
 *
 * The window is symmetric on purpose: stopping early undertrains, and running
 * long breaks the promise that a session has a deliberate endpoint.
 */
export const SESSION_GRACE_MIN = 5

/**
 * Readiness-probe cadence. Both numbers are HEURISTICS, not findings — there
 * is no evidence for a specific probe interval. They are set to keep probes
 * rare enough that they never compete with practice: at most one a week, and
 * never inside a short session, where every minute is already scarce.
 */
export const PROBE_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000
export const PROBE_MIN_SESSION_MIN = 15

/**
 * Extra work to fill a session that ran short, or null when it should end.
 *
 * Deliberately NOT more of whatever came last: it prefers skills already
 * touched this session (consolidating beats scattering) and excludes every
 * form already served, so an extension can never repeat a question.
 */
export function buildExtensionBlock(
  ctx: PlannerContext,
  plan: SessionPlan,
  elapsedMinutes: number,
): PlannedBlock | null {
  const target = ctx.checkIn.minutes
  const remaining = target - elapsedMinutes
  if (remaining <= SESSION_GRACE_MIN) return null

  const used = new Set<string>()
  const seenTemplates = new Set<string>()
  const seenSkills: string[] = []
  for (const b of plan.blocks) {
    for (const a of b.activities) {
      used.add(`${a.templateId}:${a.seed}`)
      const t = ctx.index.templates.get(a.templateId)
      if (!t) continue
      used.add(`${a.templateId}:${a.seed % Math.max(1, t.variants)}`)
      seenTemplates.add(a.templateId)
      for (const s of t.skillIds) if (!seenSkills.includes(s)) seenSkills.push(s)
    }
  }

  // Skills already worked this session first, then anything else the learner
  // has at least been introduced to. Never brand-new material: an extension is
  // for using the remaining minutes well, not for opening a new front at the
  // end of a session when attention is lowest.
  const pool: ItemTemplate[] = []
  const push = (t: ItemTemplate) => {
    if (t.authentic || seenTemplates.has(t.id) || pool.includes(t)) return
    pool.push(t)
  }
  for (const skillId of seenSkills) for (const t of ctx.index.bySkill.get(skillId) ?? []) push(t)
  for (const [skillId, ev] of ctx.evidence) {
    if (stateRank(ev.state) < stateRank('guided')) continue
    for (const t of ctx.index.bySkill.get(skillId) ?? []) push(t)
  }
  if (!pool.length) return null

  const templateUse = recentTemplateUse(ctx.state.events, ctx.now)
  const activities: PlannedActivity[] = []
  let minutes = 0
  for (const t of pickTemplates(pool, 3, pool.length, templateUse, { used })) {
    if (activities.length >= 4) break
    // Never overshoot the far edge of the window.
    if (minutes + t.minutes > remaining + SESSION_GRACE_MIN) continue
    activities.push(act(t, 'independent', used))
    minutes += t.minutes
    if (minutes >= remaining) break
  }
  if (!activities.length) return null

  return {
    id: uid('b'),
    kind: 'core',
    bucket: ctx.index.templates.get(activities[0].templateId)?.bucket ?? 'math',
    label: 'Time remaining · extra practice',
    minutes,
    why: `You chose ${target} minutes and there ${remaining === 1 ? 'is' : 'are'} about ${Math.round(remaining)} left, so the session keeps going rather than ending early on the estimates.`,
    activities,
  }
}

/**
 * Within-session difficulty adjustment: pick a replacement for the activity at
 * `at`, one difficulty rung above or below, based on the session's recent
 * graded outcomes (most recent first).
 *
 * Lives here rather than in the player because it is selection logic and needs
 * to be testable without a DOM. It also has a trap worth naming: candidates
 * come from the SAME skill as the activity being replaced, so anything already
 * planned or answered this session must be excluded. Skipping that shipped a
 * real bug — two proportional-reasoning families swapped places and handed the
 * learner the same problem twice in a row.
 *
 * Returns null when no adjustment is warranted or no clean candidate exists.
 */
export function adaptiveSwap(
  plan: SessionPlan,
  index: ContentIndex,
  at: { block: number; act: number },
  outcomes: boolean[],
): { templateId: string; seed: number; direction: 'eased' | 'stepped-up' } | null {
  const target = plan.blocks[at.block]?.activities[at.act]
  if (!target) return null
  const current = index.templates.get(target.templateId)
  if (!current) return null

  if (outcomes.length < 2) return null
  const struggling = outcomes.slice(0, 2).every((ok) => !ok)
  const cruising = outcomes.length >= 3 && outcomes.slice(0, 3).every((ok) => ok)
  if (!struggling && !cruising) return null

  const wanted = Math.max(1, Math.min(5, current.difficulty + (struggling ? -1 : 1)))
  if (wanted === current.difficulty) return null

  const usedForms = new Set<string>()
  const usedTemplates = new Set<string>()
  plan.blocks.forEach((b, bi) =>
    b.activities.forEach((a, ai) => {
      if (bi === at.block && ai === at.act) return
      usedTemplates.add(a.templateId)
      usedForms.add(`${a.templateId}:${a.seed}`)
      const t = index.templates.get(a.templateId)
      if (t) usedForms.add(`${a.templateId}:${a.seed % Math.max(1, t.variants)}`)
    }),
  )

  const siblings = (index.bySkill.get(current.skillIds[0]) ?? []).filter(
    (t) => !t.authentic && t.kind === current.kind && t.id !== current.id && !usedTemplates.has(t.id),
  )
  if (!siblings.length) return null
  const best = siblings.map((t) => ({ t, d: Math.abs(t.difficulty - wanted) })).sort((a, b) => a.d - b.d)[0]
  // Only swap when it actually moves toward the level we want.
  if (!best || Math.abs(best.t.difficulty - wanted) >= Math.abs(current.difficulty - wanted)) return null

  return {
    templateId: best.t.id,
    seed: pickSeed(best.t, usedForms),
    direction: struggling ? 'eased' : 'stepped-up',
  }
}

/**
 * Build the daily session plan.
 * Structure: retrieval warm-up → academic core → rotating lab block → exit.
 */
export function buildSessionPlan(ctx: PlannerContext): SessionPlan {
  const { evidence, state, now, checkIn } = ctx
  // Gate non-routine constructions out of EVERY pool at once rather than at
  // each of the eight pickers, which is how one of them would eventually get
  // missed. See `nonRoutineTooEarly`: handing a search problem to someone with
  // no foothold on the skill is unassisted discovery, the one instructional
  // move with a negative effect size in the literature.
  const index = withoutTooEarlyNonRoutine(ctx.index, (s) => evidence.get(s)?.state)
  const rationale: string[] = []
  const blocks: PlannedBlock[] = []
  const alloc = effectiveAllocation(state, evidence, index, now)
  const report = alloc.report
  const conservative = state.sessions.length < 3
  const mission = activeMission(state, now)
  if (mission?.skillIds?.length) {
    const ready = missionReadiness(mission, state, index, evidence, now)
    rationale.push(
      `Mission: “${mission.title}” — ${ready.retained}/${ready.targetIds.length} target skills retained, ${ready.daysRemaining} day${ready.daysRemaining === 1 ? '' : 's'} remaining.`,
    )
  }
  if (alloc.tuned && alloc.notes.length) {
    rationale.push(`Balance tuned: ${alloc.notes[0]}`)
  }
  if (conservative) {
    rationale.push(
      'Personalization is still calibrating (fewer than 3 sessions of evidence), so difficulty stays moderate.',
    )
  }
  const used = recentlyUsedForms(state.events, now)
  const templateUse = recentTemplateUse(state.events, now)
  const recentGraded = state.events.filter((e) => e.t >= now - 28 * 86_400_000 && e.mode !== 'placement')
  // Is the diet currently under or over this learner? Silent until there is
  // enough graded evidence to say (engine/stretch.ts).
  const stretch = stretchSignal(state.events, now)
  if (stretch.why && stretch.adjust !== 0) rationale.push(stretch.why)
  /*
   * While the dial is asking for easier work, template selection has to want
   * easier work too. Without this the dial computed a lower target and the
   * selector quietly overshot it — see MISMATCH_EASING in plannerPolicy.
   */
  const easing = stretch.adjust < 0
  const total = checkIn.minutes
  const short = total <= 12
  /*
   * The exit is decided HERE, before anything spends the budget, because its
   * cost is not fixed: the every-third-session "explain it back" retention
   * check is a 4-minute activity where an ordinary exit ticket is 2.
   *
   * It used to be chosen at the end, after the core and lab blocks had already
   * been sized against a guessed `exitBudget` of 2 or 3 — so on every third
   * session the plan was silently two minutes longer than it had budgeted for.
   * On a ten-minute session that single block was 40% of the dose, which is
   * why `x-explain-back` was 8.2% of a short-session learner's entire year and
   * Meta Lab ran at 14.3% against its 5% target.
   *
   * It is also skipped outright on a short session: a 4-minute retention check
   * cannot honestly fit in ten minutes alongside a warm-up, a core and a lab
   * slot, and claiming it takes two would be a lie about the dose. The same
   * reasoning already keeps readiness probes out of short sessions.
   */
  const explainTarget =
    !short && state.sessions.length % 3 === 2
      ? pickExplainTarget(evidence, lastExplainedAt(state.events))
      : null
  const explainSeed = explainTarget !== null ? explainSeedFor(explainTarget) : null
  const explainExit = explainTarget !== null && explainSeed !== null && index.templates.has('x-explain-back')
  const exitBudget = explainExit ? 4 : short ? 2 : total >= 25 ? 3 : 2
  /*
   * Short sessions used to get NO lab block at all — `labBudget` was 0 and the
   * rotation was skipped outright. Simulated over a year at 10 minutes a day
   * that produced 73% mathematics, 19 skills touched (against 42-58 for every
   * other pattern), and the four Paths never scheduled once. A ten-minute
   * learner was quietly enrolled in a different, narrower product.
   *
   * A short session cannot hold a full rotation, but it can hold ONE item, and
   * `coreBudget` already subtracts this — so the slot displaces core time
   * rather than making the session longer than asked for. Debt ordering makes
   * it alternate on its own: a lab day clears that bucket's shortfall, so the
   * next day goes back to academic work.
   */
  const labBudget = short ? 4 : Math.max(5, Math.round(total * 0.25))

  // ---- 1. Retrieval warm-up
  const due = dueReviews(evidence, now)
  const warmActs: PlannedActivity[] = []
  /*
   * Review throughput has to answer review PRESSURE, or the queue only grows.
   *
   * A fixed ~18% warm-up serves about two retrievals a session whatever is
   * waiting, while demand scales with how many skills the learner owns: every
   * skill that reaches Retained adds its own recurring schedule. Measured over
   * a simulated year, due reviews climbed steadily at EVERY ability level —
   * 15 → 44 even for the strongest learner — because supply was constant and
   * demand was not.
   *
   * So the warm-up widens when the queue is long, and is bounded at 30% of the
   * session because the founding brief is explicit that urgent work must never
   * permanently erase the rest of the plan. It is a lean, not a takeover.
   */
  const duePressure = Math.min(1, due.length / 20)
  const warmShare = 0.18 + 0.12 * duePressure
  const warmBudget = short ? 3 : Math.min(9, Math.max(4, Math.round(total * warmShare)))
  let warmMin = 0
  const warmSkills: string[] = []
  // FAMILY-LEVEL first. Asking for the exact question family that lapsed is
  // the whole point: choosing by difficulty-match let a strong family satisfy
  // the skill's review while the weak one stayed untested.
  const forms = dueForms(evidence, now).filter((f) => !retriedTooSoon(evidence, f.skillId, now))
  const coveredSkills = new Set<string>()
  let lapsedTargeted = 0
  /*
   * `warmMin + cost > warmBudget` and not `warmMin >= warmBudget`.
   *
   * Testing the budget BEFORE adding lets the block overshoot by one whole
   * item every time: with a 3-minute budget, a 2.5-minute review passes the
   * check at 0, and the next one passes it at 2.5, landing the block at 5. On
   * a ten-minute session that single off-by-one was half the overrun. The
   * first item is always allowed — a warm-up with nothing in it is not a
   * warm-up — but nothing after it may cross the line.
   */
  const warmCap = reviewsPerSession(due.length, total)
  const warmFits = (cost: number): boolean => warmActs.length === 0 || warmMin + cost <= warmBudget
  for (const f of forms) {
    if (warmActs.length >= warmCap || warmMin >= warmBudget) break
    // One family per skill per session — the point is coverage of weak spots,
    // not drilling a single skill into the ground.
    if (coveredSkills.has(f.skillId)) continue
    const template = index.templates.get(f.templateId)
    // A family can vanish when content is renamed; fall through to the
    // skill-level path rather than dropping the review.
    if (!template || template.authentic) continue
    // Two due skills can name the same family; without this the second one
    // re-serves the identical question.
    if (formsExhausted(template, used)) continue
    if (!warmFits(template.minutes)) continue
    coveredSkills.add(f.skillId)
    warmActs.push(act(template, 'review', used))
    warmMin += template.minutes
    warmSkills.push(index.skills.get(f.skillId)?.name ?? f.skillId)
    if (f.reason === 'lapsed') lapsedTargeted++
  }
  // Then any skill that is due without a specific family to blame.
  for (const d of due) {
    if (warmActs.length >= warmCap || warmMin >= warmBudget) break
    if (coveredSkills.has(d.skillId)) continue
    if (retriedTooSoon(evidence, d.skillId, now)) continue
    const ev = evidenceFor(evidence, d.skillId)
    const picks = pickTemplates(
      index.bySkill.get(d.skillId) ?? [],
      Math.min(stretch.adjust > 0 ? 4 : 3, targetDifficulty(ev, checkIn.energy, conservative, placementSignal(state, d.skillId), stretch.adjust)),
      1,
      templateUse,
      { easing, used },
    )
    if (picks.length && warmFits(picks[0].minutes)) {
      coveredSkills.add(d.skillId)
      warmActs.push(act(picks[0], 'review', used))
      warmMin += picks[0].minutes
      warmSkills.push(index.skills.get(d.skillId)?.name ?? d.skillId)
    }
  }
  // No dues yet → retrieval practice on the oldest independent skills.
  if (warmActs.length === 0) {
    const independents = [...evidence.values()]
      .filter((ev) => stateRank(ev.state) >= stateRank('independent'))
      // Same rest as a real review: retrieving something two hours after you
      // last touched it is not retrieval practice.
      .filter((ev) => !retriedTooSoon(evidence, ev.skillId, now))
      .sort((a, b) => (a.lastCorrectAt ?? 0) - (b.lastCorrectAt ?? 0))
    // Two different skills can resolve to the SAME template, because a
    // template may list several skills — which put one family in the warm-up
    // twice. Different numbers each time, so not the same question, but still
    // a narrower warm-up than intended.
    const warmTemplates = new Set(warmActs.map((a) => a.templateId))
    for (const ev of independents.slice(0, 3)) {
      if (warmActs.length >= warmCap) break
      const picks = pickTemplates(index.bySkill.get(ev.skillId) ?? [], 2, 1, templateUse, { used }).filter(
        (t) => !warmTemplates.has(t.id),
      )
      if (picks.length && warmFits(picks[0].minutes)) {
        warmTemplates.add(picks[0].id)
        warmActs.push(act(picks[0], 'review', used))
        warmMin += picks[0].minutes
        warmSkills.push(index.skills.get(ev.skillId)?.name ?? ev.skillId)
      }
    }
  }
  if (warmActs.length) {
    blocks.push({
      id: uid('b'),
      kind: 'warmup',
      bucket: 'math',
      label: 'Retrieval warm-up',
      minutes: Math.max(2, warmMin),
      activities: warmActs,
      why: due.length
        ? `${due.length} skill${due.length > 1 ? 's are' : ' is'} due for review — retrieving before new work is what makes it stick.`
        : `Nothing is due, so this is spaced retrieval on your oldest independent skills (${warmSkills.join(', ')}).`,
    })
    if (due.length) {
      const names = due.slice(0, 3).map((d) => index.skills.get(d.skillId)?.name ?? d.skillId)
      rationale.push(`Reviews due: ${names.join(', ')}${due.length > 3 ? ` and ${due.length - 3} more` : ''}.`)
    }
    if (lapsedTargeted > 0) {
      rationale.push(
        `${lapsedTargeted} of those ${lapsedTargeted === 1 ? 'is' : 'are'} the exact question type you got wrong last time, not just the same topic — a different question from the same skill would not have tested it.`,
      )
    }
  }

  // Every fourth established 25–35 minute session can become one coherent
  // real-work application. The percentage system chooses its existing bucket,
  // its full elapsed time is logged there, and urgent missions/low-energy days
  // keep the ordinary shorter-block plan.
  const applicationDay =
    total >= 25 &&
    total <= 35 &&
    checkIn.energy !== 'low' &&
    !conservative &&
    mission === null &&
    state.sessions.length % 4 === 3
  if (applicationDay) {
    const warmPlannedMinutes = warmActs.length ? Math.max(2, warmMin) : 0
    const application = pickAuthenticApplication(ctx, report, total - warmPlannedMinutes, templateUse)
    if (application) {
      const target = Math.round(report.target[application.bucket] * 100)
      blocks.push({
        id: uid('b'),
        kind: 'core',
        bucket: application.bucket,
        label: `${BUCKET_BY_ID[application.bucket].name} · applied work`,
        minutes: application.minutes,
        activities: [act(application, 'transfer', used)],
        why: `${BUCKET_BY_ID[application.bucket].name} is selected through your ${target}% balance target; this full workflow tests whether its skills transfer into realistic work.`,
      })
      rationale.push(
        `Applied-work rotation: ${application.name} counts toward ${BUCKET_BY_ID[application.bucket].name} (${target}% target).`,
      )
      return { id: uid('s'), createdAt: now, targetMinutes: total, blocks, rationale }
    }
  }

  // ---- 2. Academic core
  const academicDebtOrder = [...ACADEMIC_BUCKETS].sort(
    (a, b) => relativeDebt(report, b) - relativeDebt(report, a),
  )
  /*
   * Pick the academic bucket for the core block.
   *
   * This loop used to `break` as soon as math had been considered, which meant
   * every bucket sitting after math in the debt order was never scored at all —
   * and because the rotation block only serves LAB buckets, the core block is
   * the ONLY route physics, coding, and science have. Measured over 365
   * simulated days: physics served 2.4% against an 8% target.
   *
   * Every academic bucket is now scored, math keeps its tie-break (it carries
   * the largest allocation), and a bucket that has fallen badly behind takes
   * the core outright — the same "urgency outranks preference" rule reviews
   * already follow, and what the ≥5% floor promise actually requires.
   */
  let coreChoice: SkillScore | null = null
  let coreBucket: BucketId = 'math'
  let coreEffective = -Infinity
  let starvedPick: BucketId | null = null
  /*
   * Starvation is a BONUS, never an override. An override hijacked the core
   * block away from the placement-informed frontier in the learner's first
   * sessions — caught by two existing tests, which is exactly what they are
   * for. As a bonus, a due review (+3) or a mission still outranks it.
   *
   * Gated on an hour of real history so a bucket cannot count as "starved"
   * before the learner has done anything at all.
   */
  const historyEnough = report.totalMinutes >= 60
  /*
   * Math's incumbency is a TIE-BREAKER, not a shield. Adding it on top of the
   * course tilt (TRACK_BONUS + TRACK_UNIT_BONUS = 1.7) put a track-boosted math
   * skill at +3.7 against a starving bucket's +3.4, and physics fell back to 0%
   * on the ca-8 track — the same starvation as before, resurrected by constants
   * that were tuned before those tracks existed. Rather than out-bid it with a
   * bigger number (whack-a-mole between four coupled constants), incumbency
   * simply stands down while another academic bucket is starving.
   */
  const anyStarving =
    historyEnough &&
    ACADEMIC_BUCKETS.some(
      (b) => b !== 'math' && relativeDebt(report, b) >= STARVED_DEBT && scoreSkills(b, ctx, report).length > 0,
    )
  for (const bucket of academicDebtOrder) {
    const scored = scoreSkills(bucket, ctx, report)
    if (!scored.length) continue
    const best = scored[0]
    const starved = historyEnough && bucket !== 'math' && relativeDebt(report, bucket) >= STARVED_DEBT
    const effective =
      best.score + (starved ? STARVED_BOOST : 0) + (bucket === 'math' && !anyStarving ? MATH_CORE_MARGIN : 0)
    if (
      coreChoice === null ||
      effective > coreEffective ||
      (effective === coreEffective && bucket === 'math')
    ) {
      coreChoice = best
      coreBucket = bucket
      coreEffective = effective
      starvedPick = starved ? bucket : null
    }
  }
  if (starvedPick) {
    rationale.push(
      `${BUCKET_BY_ID[starvedPick].name} has been served well under its target, so it leads today.`,
    )
  }
  if (coreChoice) {
    const ev = evidenceFor(evidence, coreChoice.skill.id)
    const diff = targetDifficulty(ev, checkIn.energy, conservative, placementSignal(state, coreChoice.skill.id), stretch.adjust)
    // Every block the plan is going to add has to come out of the same budget.
    // The short branch used to omit `labBudget` while the comment beside
    // `labBudget` claimed it subtracted it — so a ten-minute session was
    // planned at 15.1 minutes on 99% of days.
    const coreBudget = short
      ? Math.max(2, total - warmMin - labBudget - exitBudget)
      : Math.max(6, total - warmMin - labBudget - exitBudget)
    const needsIntro = stateRank(ev.state) < stateRank('guided')
    // Calibration steering: only once there is enough rated history to say
    // anything. calibrationGap returns null below its sample floor.
    const gap = calibrationGap(recentGraded)
    const miscalibrated = gap !== null && Math.abs(gap) >= 0.12
    // INTERLEAVING (RESEARCH.md §3). Blocked practice is right at first
    // exposure, but once a skill is acquired, mixing it with the neighbours it
    // is confusable with is what trains method SELECTION rather than method
    // execution. Below independence the core stays blocked.
    const acquired = stateRank(ev.state) >= stateRank('independent') && !short
    const neighbours = acquired
      ? scoreSkills(coreBucket, ctx, report)
          .filter((s) => s.skill.id !== coreChoice!.skill.id)
          .filter((s) => stateRank(evidenceFor(evidence, s.skill.id).state) >= stateRank('guided'))
          .slice(0, 2)
      : []
    const corePool = [
      ...(index.bySkill.get(coreChoice.skill.id) ?? []),
      ...neighbours.flatMap((n) => index.bySkill.get(n.skill.id) ?? []),
    ]
    const picks = pickTemplatesForBudget(corePool, diff, coreBudget, templateUse, {
      maxCount: short ? 2 : 8,
      minCount: short ? 1 : 3,
      preferCalibration: miscalibrated,
      easing,
      used,
    })
    const actsCore: PlannedActivity[] = picks.map((t, i) =>
      act(
        t,
        needsIntro && i === 0 ? 'guided' : stateRank(ev.state) >= stateRank('independent') && t.transfer ? 'transfer' : 'independent',
        used,
      ),
    )
    if (actsCore.length) {
      blocks.push({
        id: uid('b'),
        kind: 'core',
        bucket: coreBucket,
        label: neighbours.length ? `${coreChoice.skill.name} + interleaved` : `${coreChoice.skill.name}`,
        // Never above the budget: a floor of 5 on a 3-minute budget is how a
        // block silently grows the session past the length that was chosen.
        minutes: Math.min(coreBudget, Math.max(short ? 2 : 5, minutesOf(picks))),
        activities: actsCore,
        why: `${coreChoice.skill.name} because ${coreChoice.reasons.slice(0, 2).join(' and ')}.`,
      })
      rationale.push(
        `Core focus: ${coreChoice.skill.name} (${BUCKET_BY_ID[coreBucket].name}) — ${coreChoice.reasons.slice(0, 2).join('; ')}.`,
      )
      if (neighbours.length) {
        rationale.push(
          `Interleaved with ${neighbours.map((n) => n.skill.name).join(' and ')} — once a skill is yours, mixing it with its neighbours is what trains choosing the method, not just running it.`,
        )
      }
      if (miscalibrated) {
        rationale.push(
          `Confidence is running ${gap! > 0 ? 'ahead of' : 'behind'} accuracy by about ${Math.round(Math.abs(gap!) * 100)} points, so today favours items that ask you to rate it.`,
        )
      }
    }
  }

  // ---- 3. Rotating lab block (one item on a short day, a full block otherwise)
  {
    const labOrder = report.underserved.filter((b) => !ACADEMIC_BUCKETS.includes(b))
    let labBucket = labOrder[0] ?? 'observer'
    if (checkIn.focus && !ACADEMIC_BUCKETS.includes(checkIn.focus)) labBucket = checkIn.focus
    if (checkIn.energy === 'low' && (labBucket === 'investigator' || labBucket === 'strategist')) {
      // Heavy-reasoning labs are a poor fit for a tired session; observe/reflect instead.
      labBucket = report.underserved.find((b) => b === 'observer' || b === 'meta' || b === 'puzzle') ?? 'observer'
      rationale.push('Energy is low, so the lab block favors lighter observation/reflection work.')
    }
    const labScored = scoreSkills(labBucket, ctx, report)
    const labTemplates: ItemTemplate[] = []
    const labSkill = labScored[0]
    if (labSkill) {
      labTemplates.push(
        ...pickTemplatesForBudget(
          index.bySkill.get(labSkill.skill.id) ?? [],
          targetDifficulty(evidenceFor(evidence, labSkill.skill.id), checkIn.energy, conservative, placementSignal(state, labSkill.skill.id), stretch.adjust),
          labBudget,
          templateUse,
          { maxCount: short ? 1 : total >= 40 ? 4 : 3, minCount: 1, easing, used },
        ),
      )
    } else {
      // No skill-scored candidate (all retained): pick any bucket template for upkeep.
      labTemplates.push(
        ...pickTemplatesForBudget(index.byBucket.get(labBucket) ?? [], 2, labBudget, templateUse, {
          maxCount: total >= 40 ? 4 : 3,
          minCount: 1,
          used,
        }),
      )
    }
    if (labTemplates.length) {
      const debtMin = Math.round(report.debtMinutes[labBucket])
      blocks.push({
        id: uid('b'),
        kind: 'rotation',
        bucket: labBucket,
        label: BUCKET_BY_ID[labBucket].name,
        minutes: Math.min(short ? minutesOf(labTemplates) : Math.max(5, minutesOf(labTemplates)), labBudget),
        activities: labTemplates.map((t) => {
          const ev0 = evidenceFor(evidence, t.skillIds[0])
          return act(t, stateRank(ev0.state) >= stateRank('independent') ? 'independent' : 'guided', used)
        }),
        why:
          checkIn.focus === labBucket
            ? `You asked to focus on ${BUCKET_BY_ID[labBucket].name} today.`
            : debtMin > 3
              ? `${BUCKET_BY_ID[labBucket].name} is about ${debtMin} min under its 28-day target.`
              : `${BUCKET_BY_ID[labBucket].name} keeps your practice balanced this week.`,
      })
      if (checkIn.focus === labBucket) rationale.push(`Lab block honors your focus request: ${BUCKET_BY_ID[labBucket].name}.`)
      else if (report.totalMinutes >= 10)
        rationale.push(`Lab block: ${BUCKET_BY_ID[labBucket].name}, currently the most under-target bucket.`)
      else rationale.push(`Lab block: ${BUCKET_BY_ID[labBucket].name} — rotating through the thinking labs.`)
    }
  }

  // ---- 4. Exit: every third session, explain a retained skill back from
  // memory (self-explanation, scheduled); otherwise one unaided retrieval on
  // today's core skill.
  if (explainExit) {
    blocks.push({
      id: uid('b'),
      kind: 'exit',
      bucket: 'meta',
      label: 'Explain it back',
      minutes: 4,
      activities: [{ templateId: 'x-explain-back', seed: explainSeed, mode: 'independent' }],
      why: `${index.skills.get(explainTarget)?.name ?? explainTarget} is your oldest retained skill — explaining it from memory is the strongest cheap test of whether it is still truly yours.`,
    })
    rationale.push(`Exit: explain ${index.skills.get(explainTarget)?.name ?? explainTarget} back from memory (retention check by self-explanation).`)
  }
  const coreSkillId = explainExit ? undefined : coreChoice?.skill.id
  if (coreSkillId) {
    const usedInCore = new Set(blocks.flatMap((b) => b.activities.map((a) => a.templateId)))
    // The exit ticket asks for one unaided problem, so it must respect the same
    // easing the rest of the session does. Left un-threaded it was measured as
    // the HARDEST block in a struggling learner's day (3.0★ against a 2★ ask)
    // — the last thing they saw before the session ended.
    const exitPick = pickTemplates(
      (index.bySkill.get(coreSkillId) ?? []).filter((t) => !usedInCore.has(t.id)),
      2,
      1,
      templateUse,
      { easing, used },
    )
    const fallback = exitPick.length
      ? exitPick
      : pickTemplates(index.bySkill.get(coreSkillId) ?? [], 2, 1, templateUse, { easing, used })
    if (fallback.length) {
      blocks.push({
        id: uid('b'),
        kind: 'exit',
        bucket: coreChoice!.skill.bucket,
        label: 'Exit ticket',
        minutes: 2,
        activities: [act(fallback[0], 'independent', used)],
        why: 'One unaided problem on today’s focus — independent evidence is what advances a skill.',
      })
    }
  }

  /*
   * A readiness probe, at most weekly, always LAST.
   *
   * Placed after the exit ticket on purpose: a probe advances nothing, so it
   * must never displace practice or review, and putting it last means a
   * learner who stops early has lost only the thing that does not count. The
   * weekly cadence and the short-session guard exist for the same reason —
   * the founding brief's lesson from ten-minute sessions is that a small
   * budget must go to learning, not to instrumentation.
   *
   * Only genuinely new ideas qualify. `pflProbes` counts a learner's FIRST
   * encounter with each probe and nothing after it, so serving one twice would
   * take session time to produce no measurement at all.
   */
  if (total >= PROBE_MIN_SESSION_MIN) {
    const lastProbeAt = state.events.reduce(
      (latest, e) => (isPflTemplate(e.templateId) ? Math.max(latest, e.t) : latest),
      0,
    )
    if (now - lastProbeAt >= PROBE_INTERVAL_MS) {
      const seenProbes = new Set(state.events.filter((e) => isPflTemplate(e.templateId)).map((e) => e.templateId))
      const unseen = [...index.templates.values()]
        .filter((t) => isPflTemplate(t.id) && !seenProbes.has(t.id))
        .sort((a, b) => a.id.localeCompare(b.id))
      if (unseen.length) {
        const probe = unseen[0]
        blocks.push({
          id: uid('b'),
          kind: 'exit',
          bucket: probe.bucket,
          label: 'One new idea',
          minutes: probe.minutes,
          activities: [act(probe, 'independent', used)],
          why: 'An idea this app never teaches, explained once — this measures how fast you pick things up. It cannot advance or damage anything.',
        })
        rationale.push('Ends with a readiness probe: a brand-new idea, explained then tested. It is measured separately and changes no skill.')
      }
    }
  }

  const firstSeenFamilies = blocks
    .flatMap((block) => block.activities)
    .map((activity) => index.templates.get(activity.templateId))
    .filter((template): template is ItemTemplate => Boolean(template))
    .filter((template) => dailyRoute(template) === 'daily-practice' && !templateUse.has(template.id))
  if (firstSeenFamilies.length) {
    rationale.push(
      `Coverage rotation: ${firstSeenFamilies.slice(0, 3).map((template) => template.name).join(', ')} ${firstSeenFamilies.length === 1 ? 'is a question family' : 'are question families'} you have not met yet at this level.`,
    )
  }

  if (!blocks.length) {
    rationale.push('Not enough content matches your current state — showing mixed practice instead.')
  }
  return { id: uid('s'), createdAt: now, targetMinutes: total, blocks, rationale }
}

// ---------------------------------------------------------------- practice modes

/** Focus-topic plan: a mini-session on one chosen skill. */
/**
 * A "get ready for X" session: practice on the unmet prerequisites of a course
 * the learner is not in yet, foundations first.
 *
 * Deliberately a TEACHING session, not an assessment — the point is to close
 * the gap, so the earliest unowned skill leads and gets guided support if it
 * is still unfamiliar. Falls back to the ordinary daily plan when nothing is
 * missing, because a mini-course with no content would be a dead end.
 */
export function buildReadyPlan(ctx: PlannerContext, trackId: string): SessionPlan {
  const { index, evidence, checkIn, state, now } = ctx
  const report = getReadyReport(trackId, index.skills, evidence)
  if (!report || report.ready || !report.missing.length) return buildSessionPlan(ctx)

  const used = recentlyUsedForms(state.events, now)
  const templateUse = recentTemplateUse(state.events, now)
  const blocks: PlannedBlock[] = []
  // Two skills at most per session: a mini-course that sprays across six
  // prerequisites teaches none of them.
  const perSkill = Math.max(4, Math.floor(checkIn.minutes / 2))
  for (const skill of report.missing.slice(0, 2)) {
    const ev = evidenceFor(evidence, skill.id)
    const diff = targetDifficulty(ev, checkIn.energy, false, placementSignal(state, skill.id))
    const picks = pickTemplatesForBudget(index.bySkill.get(skill.id) ?? [], diff, perSkill, templateUse, {
      maxCount: 4,
      minCount: 2,
      used,
    })
    if (!picks.length) continue
    blocks.push({
      id: uid('b'),
      kind: blocks.length === 0 ? 'core' : 'rotation',
      bucket: skill.bucket,
      label: skill.name,
      minutes: Math.min(perSkill, minutesOf(picks)),
      activities: picks.map((t, i) =>
        act(t, stateRank(ev.state) < stateRank('guided') && i === 0 ? 'guided' : 'independent', used),
      ),
      why: `${skill.name} is a prerequisite for ${report.track.name} that you do not own yet.`,
    })
  }
  if (!blocks.length) return buildSessionPlan(ctx)
  return {
    id: uid('s'),
    createdAt: now,
    targetMinutes: checkIn.minutes,
    blocks,
    rationale: [
      `Getting ready for ${report.track.name}: ${report.summary}`,
      'Foundations first — the skills nothing else is waiting on come before the ones that build on them.',
    ],
  }
}

export function buildFocusPlan(ctx: PlannerContext, skillId: string): SessionPlan {
  const { index, evidence, checkIn, state } = ctx
  const skill = index.skills.get(skillId)
  const ev = evidenceFor(evidence, skillId)
  const used = recentlyUsedForms(state.events, ctx.now)
  const templateUse = recentTemplateUse(state.events, ctx.now)
  const diff = targetDifficulty(ev, checkIn.energy, false, placementSignal(state, skillId))
  const picks = pickTemplatesForBudget(index.bySkill.get(skillId) ?? [], diff, checkIn.minutes, templateUse, {
    maxCount: Math.max(3, Math.min(10, Math.ceil(checkIn.minutes / 2))),
    minCount: 2,
    used,
  })
  const blocks: PlannedBlock[] = picks.length
    ? [
        {
          id: uid('b'),
          kind: 'core',
          bucket: skill?.bucket ?? 'math',
          label: skill?.name ?? skillId,
          minutes: Math.min(checkIn.minutes, minutesOf(picks)),
          activities: picks.map((t, i) =>
            act(t, stateRank(ev.state) < stateRank('guided') && i === 0 ? 'guided' : 'independent', used),
          ),
          why: `You chose to focus on ${skill?.name ?? skillId}.`,
        },
      ]
    : []
  return {
    id: uid('s'),
    createdAt: ctx.now,
    targetMinutes: checkIn.minutes,
    blocks,
    rationale: [`Focus topic: ${skill?.name ?? skillId} — difficulty near your current frontier (${ev.state}).`],
  }
}

/** Deliberate error repair across the highest-priority open mistakes. Each
 * block starts with a supported revisit for conceptual errors, then requires
 * fresh unaided variants so recognition is followed by reproof. */
export function buildErrorClinicPlan(ctx: PlannerContext, targets: RepairTarget[]): SessionPlan {
  const { index, evidence, checkIn, state } = ctx
  const used = recentlyUsedForms(state.events, ctx.now)
  const templateUse = recentTemplateUse(state.events, ctx.now)
  const chosen = targets.slice(0, 3)
  const perTargetBudget = chosen.length ? Math.max(5, (checkIn.minutes - 2) / chosen.length) : checkIn.minutes
  const blocks: PlannedBlock[] = []
  for (const target of chosen) {
    const skill = index.skills.get(target.skillId)
    const ev = evidenceFor(evidence, target.skillId)
    const candidates = index.bySkill.get(target.skillId) ?? []
    const failedTemplate = index.templates.get(target.templateId)
    const preferred = failedTemplate && failedTemplate.skillIds.includes(target.skillId)
      ? [failedTemplate, ...candidates.filter((t) => t.id !== failedTemplate.id)]
      : candidates
    const repairUse = new Map(templateUse)
    const picks = pickTemplatesForBudget(preferred, Math.max(1, targetDifficulty(ev, checkIn.energy, false, placementSignal(state, target.skillId)) - 0.5), perTargetBudget, repairUse, {
      maxCount: Math.min(6, Math.max(2, Math.ceil(perTargetBudget / 2))),
      minCount: Math.min(2, preferred.length),
      prioritizeTemplateId: failedTemplate?.id,
      used,
    })
    if (!picks.length) continue
    const conceptual = target.tags.some((tag) => tag === 'concept' || tag === 'strategy' || tag === 'representation')
    const cause = target.tags.length
      ? target.tags.map((tag) => ERROR_TAGS.find((meta) => meta.id === tag)?.name ?? tag).slice(0, 2).join(' + ')
      : 'cause not tagged yet'
    blocks.push({
      id: uid('b'),
      kind: 'core',
      bucket: skill?.bucket ?? picks[0].bucket,
      label: `Repair: ${skill?.name ?? target.skillId}`,
      minutes: Math.min(perTargetBudget, Math.max(5, minutesOf(picks))),
      activities: picks.map((template, i) => act(template, conceptual && i === 0 ? 'guided' : 'review', used)),
      why: `${cause}. First reconstruct the method, then prove it on fresh variants without leaning on the old answer.`,
    })
  }
  return {
    id: uid('s'),
    createdAt: ctx.now,
    targetMinutes: checkIn.minutes,
    blocks,
    rationale: blocks.length
      ? [
          `Error Clinic: ${blocks.length} open repair${blocks.length === 1 ? '' : 's'}, ordered by confident misconception, cause, and recency.`,
          'A corrected retry is useful; a fresh unaided variant is the reproof that closes the loop.',
        ]
      : ['No unrepaired errors are currently supported by the evidence log.'],
  }
}

/** Mixed review: interleaved retrieval across everything practiced before. */
export function buildMixedReviewPlan(ctx: PlannerContext): SessionPlan {
  const { index, evidence, checkIn, state } = ctx
  const used = recentlyUsedForms(state.events, ctx.now)
  const templateUse = recentTemplateUse(state.events, ctx.now)
  const practiced = [...evidence.values()]
    .filter((ev) => stateRank(ev.state) >= stateRank('guided'))
    .sort((a, b) => (a.lastCorrectAt ?? 0) - (b.lastCorrectAt ?? 0))
  const actsOut: PlannedActivity[] = []
  let min = 0
  const seenBuckets = new Set<string>()
  const maxActivities = Math.max(4, Math.min(12, Math.ceil(checkIn.minutes / 2)))
  let cursor = 0
  let guard = 0
  while (practiced.length && min < checkIn.minutes - 2 && actsOut.length < maxActivities && guard < maxActivities * 3) {
    const ev = practiced[cursor % practiced.length]
    const round = Math.floor(cursor / practiced.length)
    cursor++
    guard++
    const picks = pickTemplates(index.bySkill.get(ev.skillId) ?? [], 2.5, 99, templateUse, { used })
    if (!picks.length) continue
    const reusable = picks.filter((t) => t.variants > 1)
    const template = picks[round] ?? (reusable.length ? reusable[round % reusable.length] : null)
    if (!template) continue
    if (actsOut.length >= 2 && min + template.minutes > checkIn.minutes * 1.1) break
    actsOut.push(act(template, 'review', used))
    min += template.minutes
    seenBuckets.add(index.skills.get(ev.skillId)?.bucket ?? '')
  }
  const blocks: PlannedBlock[] = actsOut.length
    ? [
        {
          id: uid('b'),
          kind: 'core',
          bucket: 'math',
          label: 'Mixed review',
          minutes: Math.min(checkIn.minutes, Math.max(5, min)),
          activities: actsOut,
          why: `Interleaved retrieval across ${seenBuckets.size} area${seenBuckets.size === 1 ? '' : 's'} — deciding which method applies is part of the practice.`,
        },
      ]
    : []
  return {
    id: uid('s'),
    createdAt: ctx.now,
    targetMinutes: checkIn.minutes,
    blocks,
    rationale: ['Mixed review interleaves older skills so you practice choosing the right method, not just executing it.'],
  }
}

/**
 * Unit checkpoint: a cumulative check across one unit, TWO items per skill.
 *
 * Two is the point. One question decides nothing — a lucky guess or a careless
 * slip would move a rung on its own — whereas a pair asks the same skill twice
 * in different clothes. It is the same reasoning behind this app's "two unaided
 * successes on distinct forms" rule for independence, applied to re-testing.
 */
export function buildCheckpointPlan(ctx: PlannerContext, skillIds: string[], unitName: string): SessionPlan {
  const { index, evidence, state } = ctx
  const used = recentlyUsedForms(state.events, ctx.now)
  const templateUse = recentTemplateUse(state.events, ctx.now)
  const activities: PlannedActivity[] = []
  const covered: string[] = []
  for (const skillId of skillIds) {
    const ev = evidenceFor(evidence, skillId)
    const pool = (index.bySkill.get(skillId) ?? []).filter((t) => !t.authentic)
    // Prefer a family whose retrieval is actually due, then a different one —
    // two questions on the same family would test the family, not the skill.
    const dueFamilies = new Set(
      ev.forms.filter((f) => f.due !== null && f.due <= ctx.now).map((f) => f.templateId),
    )
    const ranked = [
      ...pool.filter((t) => dueFamilies.has(t.id)),
      ...pickTemplates(pool.filter((t) => !dueFamilies.has(t.id)), 3, 99, templateUse, { used }),
    ]
    const picks = ranked.slice(0, 2)
    if (!picks.length) continue
    covered.push(index.skills.get(skillId)?.name ?? skillId)
    for (const t of picks) activities.push(act(t, 'review', used))
    // If only one family exists, ask it twice with different seeds rather than
    // silently testing the skill once.
    if (picks.length === 1) activities.push(act(picks[0], 'review', used))
  }
  const blocks: PlannedBlock[] = activities.length
    ? [
        {
          id: uid('b'),
          kind: 'core',
          bucket: index.skills.get(skillIds[0])?.bucket ?? 'math',
          label: `${unitName} checkpoint`,
          minutes: Math.max(5, activities.length * 2),
          activities,
          why: `Two questions on each of ${covered.length} skills from ${unitName}. Two rather than one because a single question cannot tell a lucky guess from something you actually still own.`,
        },
      ]
    : []
  return {
    id: uid('s'),
    createdAt: ctx.now,
    targetMinutes: ctx.checkIn.minutes,
    blocks,
    rationale: activities.length
      ? [
          `Unit checkpoint: ${unitName} — ${covered.join(', ')}.`,
          'These are skills you already own whose retrieval has come due. The point is whether the unit still holds together, not whether you can learn something new today.',
        ]
      : ['Nothing in that unit is ready for a cumulative check yet.'],
  }
}

/** Challenge: harder probes near the frontier (never below difficulty 3). */
export function buildChallengePlan(ctx: PlannerContext): SessionPlan {
  const { index, evidence, checkIn, state } = ctx
  const used = recentlyUsedForms(state.events, ctx.now)
  const templateUse = recentTemplateUse(state.events, ctx.now)
  const ready = [...evidence.values()]
    .filter((ev) => stateRank(ev.state) >= stateRank('independent'))
    .sort((a, b) => (b.lastCorrectAt ?? 0) - (a.lastCorrectAt ?? 0))
  const actsOut: PlannedActivity[] = []
  let min = 0
  const maxActivities = Math.max(3, Math.min(8, Math.ceil(checkIn.minutes / 3)))
  let cursor = 0
  let guard = 0
  while (ready.length && min < checkIn.minutes - 3 && actsOut.length < maxActivities && guard < maxActivities * 3) {
    const ev = ready[cursor % ready.length]
    const round = Math.floor(cursor / ready.length)
    cursor++
    guard++
    const hard = (index.bySkill.get(ev.skillId) ?? []).filter((t) => t.difficulty >= 3)
    const picks = pickTemplates(hard, 4.5, 99, templateUse, { used })
    if (!picks.length) continue
    const reusable = picks.filter((t) => t.variants > 1)
    const template = picks[round] ?? (reusable.length ? reusable[round % reusable.length] : null)
    if (!template) continue
    if (actsOut.length >= 2 && min + template.minutes > checkIn.minutes * 1.1) break
    actsOut.push(act(template, template.transfer ? 'transfer' : 'independent', used))
    min += template.minutes
  }
  const blocks: PlannedBlock[] = actsOut.length
    ? [
        {
          id: uid('b'),
          kind: 'core',
          bucket: 'math',
          label: 'Challenge',
          minutes: Math.min(checkIn.minutes, Math.max(6, min)),
          activities: actsOut,
          why: 'Hard probes on skills you already own independently — productive struggle, not guaranteed success.',
        },
      ]
    : []
  return {
    id: uid('s'),
    createdAt: ctx.now,
    targetMinutes: checkIn.minutes,
    blocks,
    rationale: actsOut.length
      ? ['Challenge mode selects non-routine problems on your independent skills.']
      : ['Challenge needs at least one independent skill first — build evidence in regular sessions.'],
  }
}
