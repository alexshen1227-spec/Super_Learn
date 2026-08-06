/**
 * "Which method?" drills + Explain-it-back.
 *
 * Method drills show REAL problem stems from the academic banks — the job is
 * to name the strategy, not solve. This trains the discrimination step that
 * interleaving research targets (Rohrer et al.): on mixed tests the failure
 * is usually method-SELECTION, not method-execution.
 *
 * Evidence honesty: drill events log under 'x-method' (strategy recognition),
 * never under the stem skills — naming a method is not solving evidence.
 * Explain-back pairs an UNGRADED written explanation with a real graded
 * problem from the target skill's own bank. The written half is never scored;
 * the problem is. Both log under 'x-explain', with the target skill carried
 * only as an extra id for coverage display — a single exit-ticket problem is
 * not independence, so it must not claim to be.
 */
import type { ItemPart, ItemTemplate, RenderedItem } from '../../domain/types'
import { mulberry32, shuffle } from '../../engine/rng'
import { MATH_NUMBER_TEMPLATES } from './mathNumber'
import { MATH_ALGEBRA_TEMPLATES } from './mathAlgebra'
import { PHYSICS_TEMPLATES } from './physics'
import { ADVANCED_CURRICULUM_TEMPLATES } from './advancedCurriculum'
import { SKILLS } from '../skills'
import { KB_BY_SKILL } from '../kb'
import { stateRank } from '../../engine/mastery'
import type { SkillEvidence } from '../../domain/types'

/** The method name a skill's problems call for — the drill's answer key. */
export const STRATEGY_LABELS: Record<string, string> = {
  'm-integers': 'Signed-number arithmetic (number-line moves, sign rules)',
  'm-fractions': 'Fraction arithmetic (common denominators / reciprocals)',
  'm-decimals': 'Convert between fraction, decimal, and percent forms',
  'm-exponents': 'Exponent rules (count the factors)',
  'm-roots': 'Square roots & bracketing between perfect squares',
  'm-ratio': 'Unit rates (divide to “per one”)',
  'm-proportion': 'Set up a proportion / scale factor',
  'm-percent': 'Percent of a base (identify the base first)',
  'm-units': 'Unit conversion (multiply by a factor equal to 1)',
  'm-stats': 'Mean / median summaries (total ÷ count, or middle position)',
  'm-variability': 'Compare distributions by center AND spread (IQR / range)',
  'm-counting': 'Multiplication principle (choices multiply)',
  'm-prob': 'Probability = favorable ÷ total (complements for “not”)',
  'm-ev': 'Expected value (payoff × probability, summed)',
  'm-expressions': 'Combine like terms / substitute carefully',
  'm-lineq1': 'Undo operations in reverse order (two-step equation)',
  'm-lineqmulti': 'Collect x-terms, then constants (multi-step equation)',
  'm-inequal': 'Solve as an equation; flip on negative division',
  'm-wordeq': 'Translate the story into an equation (name the unknown)',
  'm-coord': 'Coordinate reading (across, then up)',
  'm-linear': 'Slope = rise over run (a rate in disguise)',
  'm-linfunc': 'y = mx + b (rate + starting value)',
  'm-systems': 'Two equations, two unknowns (substitute or eliminate)',
  'm-polys': 'Factor: product-and-sum pair (or expand every term)',
  'm-quadratic': 'Set to zero; factor and use the zero product',
  'm-exponential': 'Repeated multiplication (initial × growth factor^time)',
  'm-angles': 'Angle facts (180° line, triangle sum, vertical pairs)',
  'm-triangles': 'Pythagorean theorem (right angle → a² + b² = c²)',
  'm-area': 'Area decomposition (split or subtract shapes)',
  'm-circles': 'Circle formulas (C = πd, A = πr²)',
  'm-volume': 'Volume = base area × height',
  'p-motion': 'd = v·t (steady motion triangle)',
  'p-accel': 'a = Δv/t (velocity change over time)',
  'p-forces': 'Net force first, then F = ma',
  'p-energy': 'Work/energy accounting (W = F·d, KE = ½mv²)',
  'p-density': 'Density = mass ÷ volume',
  'p-circuits': 'Ohm’s law (V = IR)',
  'p-waves': 'Wave equation v = fλ (track what stays fixed)',
  'c-complexity': 'Count how work scales as input grows',
  's-design': 'Experimental design (randomize, blind, replicate)',
}

/** Stems: labeled, single-answer academic templates only (audit-checked). */
const STEM_POOL: ItemTemplate[] = [...MATH_NUMBER_TEMPLATES, ...MATH_ALGEBRA_TEMPLATES, ...PHYSICS_TEMPLATES, ...ADVANCED_CURRICULUM_TEMPLATES].filter(
  (t) => t.kind === 'single' && t.skillIds.some((s) => STRATEGY_LABELS[s]),
)

const DRILL_LEN = 6

export const methodDrill: ItemTemplate = {
  id: 'x-method-drill',
  version: 1,
  kind: 'multi',
  name: 'Which method? (mixed drill)',
  skillIds: ['x-method'],
  bucket: 'meta',
  difficulty: 2,
  variants: 60,
  minutes: 5,
  calibration: true,
  provenance: 'Original drill over Axiom Lab’s own audited problem banks; answer = the stem skill’s method label.',
  generate: (seed: number): RenderedItem => {
    const rng = mulberry32((seed % 60) * 2654435761 + 97)
    // Sample DRILL_LEN stems from distinct skills.
    const shuffled = shuffle(rng, STEM_POOL)
    const chosen: { template: ItemTemplate; skillId: string }[] = []
    const usedSkills = new Set<string>()
    for (const t of shuffled) {
      if (chosen.length >= DRILL_LEN) break
      const skillId = t.skillIds.find((s) => STRATEGY_LABELS[s])!
      if (usedSkills.has(skillId)) continue
      usedSkills.add(skillId)
      chosen.push({ template: t, skillId })
    }
    const allLabels = chosen.map((c) => STRATEGY_LABELS[c.skillId])
    const parts: ItemPart[] = chosen.map(({ template, skillId }) => {
      const stem = template.generate(Math.floor(rng() * template.variants))
      const correct = STRATEGY_LABELS[skillId]
      const distractors = shuffle(rng, allLabels.filter((l) => l !== correct)).slice(0, 3)
      const options = shuffle(rng, [correct, ...distractors])
      const skillName = SKILLS.find((s) => s.id === skillId)?.name ?? skillId
      return {
        prompt: `**Don't solve it.** Which method does this problem call for?\n\n> ${stem.prompt.replace(/\n/g, '\n> ')}`,
        answer: { type: 'mcq', options, correct: options.indexOf(correct) },
        // Per-checkpoint ladder: each part is a different problem, so an
        // item-level hint list could not scaffold any of them.
        hints: [
          'Read the QUESTION sentence first, not the story. What quantity has to exist at the end?',
          'Strip the surface details and name the structure: a rate, a part-and-whole, two unknowns, a shape, a change over time, a sequence of steps?',
          `This stem is a **${skillName}** problem — the method is: ${correct}.`,
        ],
        explanation: `This is a **${skillName}** problem: ${correct}. The cue to bank: notice what identified it — the structure, not the surface details. (Solving it happens in regular practice; this drill trains the choosing.)`,
      }
    })
    return {
      templateId: 'x-method-drill',
      version: 1,
      seed,
      kind: 'multi',
      title: 'Which method?',
      prompt:
        'Six real problems from your banks, mixed. For each: name the METHOD it calls for — do not solve. On mixed tests, picking the method IS the hard step.',
      parts,
      hints: [
        'Read the QUESTION sentence first: what quantity must exist at the end?',
        'Look for structural cues: “per”, “of”, two unknowns, a right angle, equal ratios…',
        'If two methods feel close, ask which one the given numbers can actually feed.',
      ],
      explanation:
        'Method selection is the skill mixed tests actually examine — blocked practice never trains it because the chapter title gives the method away. Naming cues out loud (“percent of a base… base is the original price”) turns recognition into a checkable habit.',
      transferBridge: 'Pick one cue you used today and name a DIFFERENT topic where the same cue appears.',
    }
  },
}

// ---------------------------------------------------------------- explain-back

/**
 * Graded probes for the explain-back drill: single-answer, deterministically
 * validated templates drawn from the same audited academic banks.
 */
const PROBE_POOL: ItemTemplate[] = [
  ...MATH_NUMBER_TEMPLATES,
  ...MATH_ALGEBRA_TEMPLATES,
  ...PHYSICS_TEMPLATES,
  ...ADVANCED_CURRICULUM_TEMPLATES,
].filter((t) => t.kind === 'single' && !t.authentic)

function probesFor(skillId: string): ItemTemplate[] {
  return PROBE_POOL.filter((t) => t.skillIds.includes(skillId))
}

/**
 * Skills eligible for explain-back: those with a substantial KB card AND at
 * least one deterministically graded problem to prove the explanation against.
 * An explanation with nothing to test it is a claim, not evidence.
 */
const EXPLAIN_TARGETS: string[] = SKILLS.filter(
  (s) => KB_BY_SKILL.has(s.id) && probesFor(s.id).length > 0,
).map((s) => s.id)

export const explainBack: ItemTemplate = {
  id: 'x-explain-back',
  version: 2,
  kind: 'multi',
  name: 'Explain it back',
  skillIds: ['x-explain'],
  bucket: 'meta',
  difficulty: 3,
  variants: EXPLAIN_TARGETS.length,
  minutes: 5,
  provenance:
    'Original; model answer = the skill’s own audited concept card, graded probe = a real problem from that skill’s audited bank.',
  generate: (seed: number): RenderedItem => {
    const skillId = EXPLAIN_TARGETS[seed % EXPLAIN_TARGETS.length]
    const skill = SKILLS.find((s) => s.id === skillId)!
    const card = KB_BY_SKILL.get(skillId)!
    // Deterministic probe choice: same seed → same problem.
    const rng = mulberry32((seed % Math.max(1, EXPLAIN_TARGETS.length)) * 2654435761 + 31)
    const pool = probesFor(skillId)
    const probeTemplate = pool[Math.floor(rng() * pool.length) % pool.length]
    const probe = probeTemplate.generate(Math.floor(rng() * Math.max(1, probeTemplate.variants)))
    return {
      templateId: 'x-explain-back',
      version: 2,
      seed,
      kind: 'multi',
      title: `Explain it back: ${skill.name}`,
      prompt: `**${skill.name}** — explain it, then use it.`,
      parts: [
        {
          stage: 'From memory',
          prompt:
            `No peeking at the Path. Explain **${skill.name}** as if to a friend who missed that class:\n\n` +
            `1. What is it, in one plain sentence?\n2. One worked micro-example.\n3. One trap people fall into.\n\nAbout 60 seconds of writing. The concept card appears once you are done.`,
          answer: {
            type: 'draft',
            criteria: [
              'A one-sentence version capturing the core idea without circular wording',
              'An example using actual numbers or objects, and correct',
              'A trap someone would really make',
              'Written from memory before comparing',
            ],
            model: card.card,
            minWords: 25,
            placeholder: 'In one sentence… For example… The trap is…',
          },
          explanation:
            'Explaining from memory is retrieval practice and self-explanation at once, and it exposes hollow retention that recognition quizzes miss. Where your version diverged from the card is precisely what to re-study. Nothing here is scored — the next part is.',
        },
        {
          stage: 'Now use it',
          prompt: `A real ${skill.name} problem. Your explanation just claimed you have this — here is the test.\n\n${probe.prompt}`,
          answer: probe.answer!,
          explanation: `${probe.explanation}\n\nThis part is the graded one. An explanation that reads well but cannot drive a problem is exactly the hollow retention this drill exists to catch.`,
        },
      ],
      hints: [
        'Start with what the idea DOES, not what it is called.',
        'If the sentence won’t form, that is the finding — note exactly where it breaks.',
        'For the problem: use your own explanation as the method. If it does not reach, that gap is the result.',
      ],
      explanation:
        'Retention is not the feeling of familiarity — it is being able to reconstruct the idea and then run it. The written half guides your plan; the graded half is what counts as evidence, and it counts toward your explanation skill rather than the target skill, because one problem is not independence.',
      extraSkillIds: [skillId],
    }
  },
}

/** Pick the explain-back seed for a target skill (planner helper). */
export function explainSeedFor(skillId: string): number | null {
  const i = EXPLAIN_TARGETS.indexOf(skillId)
  return i >= 0 ? i : null
}

/** Oldest retained skill = the one whose explanation is most worth testing. */
export function pickExplainTarget(evidence: Map<string, SkillEvidence>): string | null {
  let best: string | null = null
  let bestAt = Infinity
  for (const ev of evidence.values()) {
    if (stateRank(ev.state) >= stateRank('retained') && EXPLAIN_TARGETS.includes(ev.skillId)) {
      const at = ev.retainedAt ?? 0
      if (at < bestAt) {
        bestAt = at
        best = ev.skillId
      }
    }
  }
  return best
}

export const METHOD_DRILL_TEMPLATES: ItemTemplate[] = [methodDrill, explainBack]
