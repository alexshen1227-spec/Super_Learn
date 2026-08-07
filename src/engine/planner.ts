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
import { evidenceFor, stateRank } from './mastery'
import { dueForms, dueReviews } from './scheduler'
import { relativeDebt, type AllocationReport } from './allocation'
import { effectiveAllocation } from './allocationPlus'
import { uid } from './rng'
import { explainSeedFor, pickExplainTarget } from '../content/items/methodDrills'
import { activeMission, missionPriority, missionReadiness } from './mission'
import type { RepairTarget } from './errors'
import { calendarDaysUntil } from './time'
import { calibrationGap } from './calibration'
import { stretchSignal } from './stretch'
import { isPflTemplate } from './pfl'

export interface PlannerContext {
  index: ContentIndex
  evidence: Map<string, SkillEvidence>
  state: AppState
  now: number
  checkIn: CheckIn
}

// ---------------------------------------------------------------- helpers

/** A skill is frontier-eligible when every prereq is independent-or-better,
 *  or the placement judged the prereq 'ok'/'strong' (routing signal only). */
export function prereqsMet(
  skill: SkillNode,
  evidence: Map<string, SkillEvidence>,
  state: AppState,
): boolean {
  return skill.prereqs.every((p) => {
    const ev = evidenceFor(evidence, p)
    if (stateRank(ev.state) >= stateRank('independent')) return true
    const sig = state.placement?.signals.find((s) => s.skillId === p)
    return sig?.signal === 'ok' || sig?.signal === 'strong'
  })
}

/** Direct dependents not yet independent — "how much is waiting on this". */
export function prereqLeverage(
  skillId: string,
  index: ContentIndex,
  evidence: Map<string, SkillEvidence>,
): number {
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

function recentTemplateUse(events: AttemptEvent[], now: number): Map<string, number> {
  const cutoff = now - 3 * 86_400_000
  const m = new Map<string, number>()
  for (const e of events) {
    if (e.t >= cutoff) m.set(e.templateId, (m.get(e.templateId) ?? 0) + 1)
  }
  return m
}

/** Pick a seed whose rendered form was not used recently (best effort). */
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
  const fromEvidence =
    ev.state === 'transferred'
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
  templateUse: Map<string, number>,
  opts: { transferOnly?: boolean; excludeKinds?: string[]; preferCalibration?: boolean } = {},
): ItemTemplate[] {
  const pool = candidates
    .filter((t) => (opts.transferOnly ? t.transfer : true))
    .filter((t) => !(opts.excludeKinds ?? []).includes(t.kind))
    // Long-form simulations have their own Practice mode. Quietly squeezing a
    // 20-minute project into a 7-minute daily block breaks both the plan and
    // the realism of the work.
    .filter((t) => !t.authentic)
    // Preparation-for-future-learning probes are excluded from ordinary pools
    // for two reasons. They teach an idea the tree never covers, so serving one
    // as practice for the skill it is attached to would be teaching the wrong
    // thing; and a probe re-served is a probe wasted, because the second time
    // it measures memory rather than pick-up. They are launched deliberately.
    .filter((t) => !isPflTemplate(t.id))
  const scored = pool
    .map((t) => ({
      t,
      score:
        // ASYMMETRIC on purpose. A symmetric distance penalty treats "one rung
        // too easy" and "one rung too hard" as equally bad, but they are not:
        // slightly-too-hard is where learning happens, while too-easy produces
        // a pleasant session that teaches nothing. Erring upward is the whole
        // point of aiming at the frontier.
        -(t.difficulty < wantDifficulty ? 2.6 : 1.4) * Math.abs(t.difficulty - wantDifficulty) -
        (templateUse.get(t.id) ?? 0) * 1.5 +
        Math.min(1, t.variants / 4) * 0.5 +
        // Confidence data was being collected and displayed but never acted on.
        // When the learner is measurably miscalibrated, favour items that ask
        // for a confidence rating so the gap has a chance to close.
        (opts.preferCalibration && t.calibration ? 1.2 : 0) +
        // A worked chain locates WHERE reasoning broke rather than only whether
        // it did, so it is worth a nudge when a skill is being repaired.
        (t.kind === 'single' ? 0 : 0),
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
  templateUse: Map<string, number>,
  opts: {
    maxCount: number
    minCount?: number
    transferOnly?: boolean
    excludeKinds?: string[]
    preferCalibration?: boolean
    maxPerTemplate?: number
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
  templateUse: Map<string, number>,
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
        relativeDebt(report, template.bucket) * 8 -
        (templateUse.get(template.id) ?? 0) * 2 -
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
    const lev = prereqLeverage(skill.id, index, evidence)
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
      score -= 2
      reasons.push('placement already saw this go well, so the next gain is further on')
      // When placement judged EVERYTHING strong, the penalty above is uniform
      // and something still has to be picked. Break that tie upward: prefer
      // the most advanced material the learner is cleared for, capped just
      // above their stated grade so "start high" never becomes "start lost".
      const reach = Math.min(skill.gradeBand, (state.profile.gradeLevel ?? 8) + 1)
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
    out.push({ skill, score, reasons })
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
  for (const t of pickTemplates(pool, 3, pool.length, templateUse, {})) {
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
  const { index, evidence, state, now, checkIn } = ctx
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
  const total = checkIn.minutes
  const short = total <= 12
  const exitBudget = short ? 2 : total >= 25 ? 3 : 2
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
  const warmBudget = short ? 3 : Math.min(6, Math.max(4, Math.round(total * 0.18)))
  let warmMin = 0
  const warmSkills: string[] = []
  // FAMILY-LEVEL first. Asking for the exact question family that lapsed is
  // the whole point: choosing by difficulty-match let a strong family satisfy
  // the skill's review while the weak one stayed untested.
  const forms = dueForms(evidence, now)
  const coveredSkills = new Set<string>()
  let lapsedTargeted = 0
  for (const f of forms) {
    if (warmActs.length >= 3 || warmMin >= warmBudget) break
    // One family per skill per session — the point is coverage of weak spots,
    // not drilling a single skill into the ground.
    if (coveredSkills.has(f.skillId)) continue
    const template = index.templates.get(f.templateId)
    // A family can vanish when content is renamed; fall through to the
    // skill-level path rather than dropping the review.
    if (!template || template.authentic) continue
    coveredSkills.add(f.skillId)
    warmActs.push(act(template, 'review', used))
    warmMin += template.minutes
    warmSkills.push(index.skills.get(f.skillId)?.name ?? f.skillId)
    if (f.reason === 'lapsed') lapsedTargeted++
  }
  // Then any skill that is due without a specific family to blame.
  for (const d of due) {
    if (warmActs.length >= 3 || warmMin >= warmBudget) break
    if (coveredSkills.has(d.skillId)) continue
    const ev = evidenceFor(evidence, d.skillId)
    const picks = pickTemplates(
      index.bySkill.get(d.skillId) ?? [],
      Math.min(stretch.adjust > 0 ? 4 : 3, targetDifficulty(ev, checkIn.energy, conservative, placementSignal(state, d.skillId), stretch.adjust)),
      1,
      templateUse,
    )
    if (picks.length) {
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
      .sort((a, b) => (a.lastCorrectAt ?? 0) - (b.lastCorrectAt ?? 0))
    for (const ev of independents.slice(0, 2)) {
      const picks = pickTemplates(index.bySkill.get(ev.skillId) ?? [], 2, 1, templateUse)
      if (picks.length && warmMin < warmBudget) {
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
  let coreChoice: SkillScore | null = null
  let coreBucket: BucketId = 'math'
  for (const bucket of academicDebtOrder) {
    const scored = scoreSkills(bucket, ctx, report)
    if (scored.length && (coreChoice === null || scored[0].score > coreChoice.score + 0.5)) {
      coreChoice = scored[0]
      coreBucket = bucket
    }
    if (coreChoice && bucket === 'math') break // math wins ties by allocation weight
  }
  if (coreChoice) {
    const ev = evidenceFor(evidence, coreChoice.skill.id)
    const diff = targetDifficulty(ev, checkIn.energy, conservative, placementSignal(state, coreChoice.skill.id), stretch.adjust)
    const coreBudget = short ? Math.max(4, total - warmMin - exitBudget) : Math.max(6, total - warmMin - labBudget - exitBudget)
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
        minutes: Math.max(5, Math.min(coreBudget, minutesOf(picks))),
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
          { maxCount: short ? 1 : total >= 40 ? 4 : 3, minCount: 1 },
        ),
      )
    } else {
      // No skill-scored candidate (all retained): pick any bucket template for upkeep.
      labTemplates.push(
        ...pickTemplatesForBudget(index.byBucket.get(labBucket) ?? [], 2, labBudget, templateUse, {
          maxCount: total >= 40 ? 4 : 3,
          minCount: 1,
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
  const explainTarget = state.sessions.length % 3 === 2 ? pickExplainTarget(evidence) : null
  const explainSeed = explainTarget !== null ? explainSeedFor(explainTarget) : null
  if (explainTarget !== null && explainSeed !== null && index.templates.has('x-explain-back')) {
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
  const coreSkillId = explainTarget === null || explainSeed === null ? coreChoice?.skill.id : undefined
  if (coreSkillId) {
    const usedInCore = new Set(blocks.flatMap((b) => b.activities.map((a) => a.templateId)))
    const exitPick = pickTemplates(
      (index.bySkill.get(coreSkillId) ?? []).filter((t) => !usedInCore.has(t.id)),
      2,
      1,
      templateUse,
    )
    const fallback = exitPick.length
      ? exitPick
      : pickTemplates(index.bySkill.get(coreSkillId) ?? [], 2, 1, templateUse)
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

  if (!blocks.length) {
    rationale.push('Not enough content matches your current state — showing mixed practice instead.')
  }
  return { id: uid('s'), createdAt: now, targetMinutes: total, blocks, rationale }
}

// ---------------------------------------------------------------- practice modes

/** Focus-topic plan: a mini-session on one chosen skill. */
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
    if (failedTemplate) repairUse.set(failedTemplate.id, -100)
    const picks = pickTemplatesForBudget(preferred, Math.max(1, targetDifficulty(ev, checkIn.energy, false, placementSignal(state, target.skillId)) - 0.5), perTargetBudget, repairUse, {
      maxCount: Math.min(6, Math.max(2, Math.ceil(perTargetBudget / 2))),
      minCount: Math.min(2, preferred.length),
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
    const picks = pickTemplates(index.bySkill.get(ev.skillId) ?? [], 2.5, 99, templateUse)
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
      ...pickTemplates(pool.filter((t) => !dueFamilies.has(t.id)), 3, 99, templateUse),
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
    const picks = pickTemplates(hard, 4.5, 99, templateUse)
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
