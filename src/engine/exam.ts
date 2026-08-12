/**
 * Exam Simulator builder — timed, cumulative, BLIND mock tests.
 *
 * Design rules:
 *  - drawn only from skills you have actually practiced (guided or better),
 *    weighted toward independent/retained ones — an exam is cumulative recall,
 *    not first instruction;
 *  - single-answer items only, one per skill, mixed order, novel variants;
 *  - no hints, no per-item feedback: grading happens at the end, like the
 *    real thing, followed by a post-mortem that feeds the Error Clinic;
 *  - the timer is a SOFT target, always adjustable — pacing awareness, never
 *    a speed penalty.
 */
import type { AppState, ItemTemplate, SkillEvidence } from '../domain/types'
import type { ContentIndex } from './content-index'
import { mulberry32, shuffle } from './rng'
import { stateRank } from './mastery'
import { count } from './plural'

export type ExamSize = 'short' | 'standard' | 'long'

export const EXAM_SIZES: Record<ExamSize, { items: number; label: string }> = {
  short: { items: 6, label: 'Quick quiz · 6 questions' },
  standard: { items: 10, label: 'Test · 10 questions' },
  long: { items: 14, label: 'Full exam · 14 questions' },
}

export interface ExamItem {
  templateId: string
  seed: number
}

export interface ExamPlan {
  items: ExamItem[]
  /** Soft time target in minutes (adjustable, never enforced). */
  suggestedMinutes: number
  note: string
}

export type ExamBuild = { ok: true; plan: ExamPlan } | { ok: false; reason: string }

const MIN_ELIGIBLE = 5

export function buildExam(
  state: AppState,
  evidence: Map<string, SkillEvidence>,
  index: ContentIndex,
  size: ExamSize,
  rngSeed: number,
): ExamBuild {
  const rng = mulberry32(rngSeed)
  // Eligible: practiced skills with at least one single-kind template.
  const eligible = [...evidence.values()]
    .filter((ev) => stateRank(ev.state) >= stateRank('guided'))
    .map((ev) => ({
      ev,
      templates: (index.bySkill.get(ev.skillId) ?? []).filter((t) => t.kind === 'single'),
    }))
    .filter((x) => x.templates.length > 0)
  if (eligible.length < MIN_ELIGIBLE) {
    return {
      ok: false,
      reason: `An exam needs at least ${MIN_ELIGIBLE} practiced skills to be a fair test — you have ${eligible.length}. A few more sessions will unlock it.`,
    }
  }
  // Cumulative weighting: independent+ first (they are what a test asks you
  // to still know), then guided; oldest-touched first within each band.
  const ranked = [...eligible].sort((a, b) => {
    const bandA = stateRank(a.ev.state) >= 3 ? 0 : 1
    const bandB = stateRank(b.ev.state) >= 3 ? 0 : 1
    return bandA - bandB || (a.ev.lastCorrectAt ?? 0) - (b.ev.lastCorrectAt ?? 0)
  })
  const recentForms = new Set(
    state.events.filter((e) => e.t > Date.now() - 7 * 86_400_000).map((e) => `${e.templateId}:${e.seed % 1000}`),
  )
  const want = EXAM_SIZES[size].items
  const picked: { template: ItemTemplate; seed: number }[] = []
  for (const cand of ranked) {
    if (picked.length >= want) break
    // Prefer mid difficulty; avoid templates already used this exam.
    const pool = cand.templates
      .filter((t) => !picked.some((p) => p.template.id === t.id))
      .sort((a, b) => Math.abs(a.difficulty - 3) - Math.abs(b.difficulty - 3))
    const template = pool[0]
    if (!template) continue
    let seed = Math.floor(rng() * 0x7fffffff)
    for (let tries = 0; tries < 10 && recentForms.has(`${template.id}:${seed % 1000}`); tries++) {
      seed = Math.floor(rng() * 0x7fffffff)
    }
    picked.push({ template, seed })
  }
  if (picked.length < MIN_ELIGIBLE) {
    return { ok: false, reason: 'Not enough distinct material for a fair exam yet — practice a few more skills first.' }
  }
  const mixed = shuffle(rng, picked)
  const suggestedMinutes = Math.max(5, Math.round(mixed.reduce((a, p) => a + p.template.minutes, 0) * 0.75))
  return {
    ok: true,
    plan: {
      items: mixed.map((p) => ({ templateId: p.template.id, seed: p.seed })),
      suggestedMinutes,
      note: `${count(mixed.length, 'question')} across ${count(mixed.length, 'skill')}, mixed order, drawn from everything you've practiced. Blind grading — answers are checked only at the end.`,
    },
  }
}
