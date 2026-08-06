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
import { ACADEMIC_BUCKETS, BUCKET_BY_ID } from '../domain/types'
import type { ContentIndex } from './content-index'
import { evidenceFor, stateRank } from './mastery'
import { dueReviews } from './scheduler'
import { relativeDebt, type AllocationReport } from './allocation'
import { effectiveAllocation } from './allocationPlus'
import { uid } from './rng'
import { explainSeedFor, pickExplainTarget } from '../content/items/methodDrills'

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

/** Target item difficulty for a skill's current evidence. */
export function targetDifficulty(ev: SkillEvidence, energy: CheckIn['energy'], conservative: boolean): number {
  const base =
    stateRank(ev.state) >= stateRank('independent')
      ? 3
      : ev.state === 'guided'
        ? 2
        : 1.5
  const adjusted =
    base + (energy === 'high' && !conservative ? 0.5 : 0) - (energy === 'low' ? 0.5 : 0) - (ev.recentMisses >= 2 ? 1 : 0)
  return Math.max(1, Math.min(conservative ? 3 : 5, adjusted))
}

function pickTemplates(
  candidates: ItemTemplate[],
  wantDifficulty: number,
  count: number,
  templateUse: Map<string, number>,
  opts: { transferOnly?: boolean; excludeKinds?: string[] } = {},
): ItemTemplate[] {
  const pool = candidates
    .filter((t) => (opts.transferOnly ? t.transfer : true))
    .filter((t) => !(opts.excludeKinds ?? []).includes(t.kind))
  const scored = pool
    .map((t) => ({
      t,
      score:
        -Math.abs(t.difficulty - wantDifficulty) * 2 -
        (templateUse.get(t.id) ?? 0) * 1.5 +
        Math.min(1, t.variants / 4) * 0.5,
    }))
    .sort((a, b) => b.score - a.score)
  const out: ItemTemplate[] = []
  for (const { t } of scored) {
    if (out.length >= count) break
    out.push(t)
  }
  return out
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
  for (const skill of ctx.index.skillList) {
    if (skill.bucket !== bucket) continue
    const ev = evidenceFor(evidence, skill.id)
    // Frontier = not yet retained, prereqs met, and content exists.
    if (stateRank(ev.state) >= stateRank('retained') && !ev.needsReview) continue
    if (!prereqsMet(skill, evidence, state)) continue
    if (!(index.bySkill.get(skill.id) ?? []).length) continue
    const reasons: string[] = []
    let score = 0
    if (ev.needsReview) {
      score += 3
      reasons.push(ev.blockedByMisconception ? 'has an unrepaired confident error' : 'is due for review')
    }
    const lev = prereqLeverage(skill.id, index, evidence)
    if (lev > 0) {
      score += Math.min(2.5, lev * 0.8)
      reasons.push(`${lev} skill${lev > 1 ? 's are' : ' is'} waiting on it`)
    }
    const sig = state.placement?.signals.find((s) => s.skillId === skill.id)
    if (sig?.signal === 'gap') {
      score += 2
      reasons.push('placement flagged a gap here')
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
    // Deadline relevance
    for (const d of state.deadlines) {
      const days = (Date.parse(d.dateISO) - now) / 86_400_000
      if (d.bucket === skill.bucket && days >= 0 && days <= 14) {
        score += days <= 5 ? 2 : 1
        reasons.push(`${d.title} is in ${Math.max(0, Math.round(days))} day${Math.round(days) === 1 ? '' : 's'}`)
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
  return { templateId: t.id, seed: pickSeed(t, used), mode }
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
  const total = checkIn.minutes
  const short = total <= 12

  // ---- 1. Retrieval warm-up
  const due = dueReviews(evidence, now)
  const warmActs: PlannedActivity[] = []
  const warmBudget = short ? 3 : Math.min(6, Math.max(4, Math.round(total * 0.18)))
  let warmMin = 0
  const warmSkills: string[] = []
  for (const d of due) {
    if (warmActs.length >= 3 || warmMin >= warmBudget) break
    const ev = evidenceFor(evidence, d.skillId)
    const picks = pickTemplates(
      index.bySkill.get(d.skillId) ?? [],
      Math.min(3, targetDifficulty(ev, checkIn.energy, conservative)),
      1,
      templateUse,
    )
    if (picks.length) {
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
    const diff = targetDifficulty(ev, checkIn.energy, conservative)
    const coreBudget = short ? Math.max(4, total - warmMin - 3) : Math.round(total * (0.42 - (short ? 0.1 : 0)))
    const needsIntro = stateRank(ev.state) < stateRank('guided')
    const wantCount = short ? 1 : coreBudget >= 12 ? 3 : 2
    const picks = pickTemplates(index.bySkill.get(coreChoice.skill.id) ?? [], diff, wantCount, templateUse)
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
        label: `${coreChoice.skill.name}`,
        minutes: Math.max(5, Math.min(coreBudget, minutesOf(picks))),
        activities: actsCore,
        why: `${coreChoice.skill.name} because ${coreChoice.reasons.slice(0, 2).join(' and ')}.`,
      })
      rationale.push(
        `Core focus: ${coreChoice.skill.name} (${BUCKET_BY_ID[coreBucket].name}) — ${coreChoice.reasons.slice(0, 2).join('; ')}.`,
      )
    }
  }

  // ---- 3. Rotating lab block
  if (!short) {
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
        ...pickTemplates(
          index.bySkill.get(labSkill.skill.id) ?? [],
          targetDifficulty(evidenceFor(evidence, labSkill.skill.id), checkIn.energy, conservative),
          total >= 40 ? 2 : 1,
          templateUse,
        ),
      )
    } else {
      // No skill-scored candidate (all retained): pick any bucket template for upkeep.
      labTemplates.push(...pickTemplates(index.byBucket.get(labBucket) ?? [], 2, 1, templateUse))
    }
    if (labTemplates.length) {
      const debtMin = Math.round(report.debtMinutes[labBucket])
      blocks.push({
        id: uid('b'),
        kind: 'rotation',
        bucket: labBucket,
        label: BUCKET_BY_ID[labBucket].name,
        minutes: Math.min(Math.max(5, minutesOf(labTemplates)), Math.round(total * 0.3)),
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
  const diff = targetDifficulty(ev, checkIn.energy, false)
  const picks = pickTemplates(index.bySkill.get(skillId) ?? [], diff, Math.max(2, Math.round(checkIn.minutes / 4)), templateUse)
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
  for (const ev of practiced) {
    if (min >= checkIn.minutes - 2 || actsOut.length >= 8) break
    const picks = pickTemplates(index.bySkill.get(ev.skillId) ?? [], 2.5, 1, templateUse)
    if (!picks.length) continue
    actsOut.push(act(picks[0], 'review', used))
    min += picks[0].minutes
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
  for (const ev of ready) {
    if (min >= checkIn.minutes - 3 || actsOut.length >= 4) break
    const hard = (index.bySkill.get(ev.skillId) ?? []).filter((t) => t.difficulty >= 3)
    const picks = pickTemplates(hard, 4, 1, templateUse)
    if (!picks.length) continue
    actsOut.push(act(picks[0], picks[0].transfer ? 'transfer' : 'independent', used))
    min += picks[0].minutes
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
