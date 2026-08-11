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
import type { AttemptEvent, SkillEvidence } from '../../domain/types'
import { cycle, mcq, tpl } from '../lib'

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

/**
 * A second question family for method selection. The mixed drill asks learners
 * to label a whole problem; this family asks which STRUCTURAL CUE separates two
 * tempting methods. Repeating randomised versions of one drill is not
 * independent evidence.
 */
const methodContrast = tpl(
  {
    id: 'x-method-contrast',
    name: 'Which clue chooses the method?',
    skillIds: ['x-method'],
    bucket: 'meta',
    difficulty: 3,
    variants: 8,
    minutes: 2.5,
    calibration: true,
  },
  (rng, seed) => {
    const scenario = cycle(seed, [
      {
        prompt: 'Two price problems both mention 20%. One asks for 20% of $60; the other says $60 is 20% of an unknown price. What clue changes the method?',
        correct: 'Whether the whole (the percent base) is known or unknown',
        wrong: ['Whether a dollar sign appears anywhere in the wording', 'Whether the number 20 happens to be an even one', 'Whether the final answer will end up larger than 100'],
        why: '“Percent of” gives the base; reverse percent hides the base and asks you to reconstruct it.',
      },
      {
        prompt: 'One motion problem gives speed and time. Another gives starting speed, ending speed, and time. What clue separates their methods?',
        correct: 'Whether the speed is steady or changing',
        wrong: ['Whether time is measured in seconds', 'Whether the object is a vehicle', 'Whether distance is mentioned in the story'],
        why: 'Steady motion uses distance = speed × time; changing velocity points to acceleration.',
      },
      {
        prompt: 'Two geometry problems show triangles. One marks a right angle and asks for a missing side; the other gives angles and asks for an exterior angle. What selects the method?',
        correct: 'The marked relationships: right angle versus angle sums',
        wrong: ['The overall size of the drawing on the page', 'Which of the sides happens to look the longest', 'Whether the triangle happens to be pointing upward'],
        why: 'The diagram’s structure—not its appearance—selects Pythagoras or an angle-sum fact.',
      },
      {
        prompt: 'One probability problem asks for exactly one red draw. Another asks for at least one red draw over several draws. What clue suggests using a complement?',
        correct: '“At least one” is often easier as 1 minus none',
        wrong: ['The color red', 'Having more than two numbers in the problem', 'The word “draw”'],
        why: '“At least one” bundles several cases; its opposite, “none,” is often one clean calculation.',
      },
      {
        prompt: 'Two equations contain x. In one, x appears once; in the other, x appears on both sides. What clue changes the first move?',
        correct: 'x on both sides means collect the x-terms first',
        wrong: ['The equation with more digits is always harder', 'A negative sign means use a graph', 'The side containing the equals sign'],
        why: 'The location of the variable terms determines whether ordinary undoing is enough or collection comes first.',
      },
      {
        prompt: 'One data question asks for a typical value. Another asks which group is more consistent. What clue chooses mean/median versus spread?',
        correct: '“Typical” asks about center; “consistent” asks about spread',
        wrong: ['Whichever of the two lists happens to have more values in it', 'Whether any decimals appear in the values', 'Always calculate the mean of the list first'],
        why: 'Center and spread answer different questions even when they use the same data.',
      },
      {
        prompt: 'One physics problem gives mass and volume. Another gives voltage and resistance. Both require division. Why are their methods still different?',
        correct: 'The quantities and units identify the governing relationship',
        wrong: ['Any division problem at all uses the very same physics law', 'The larger number must always be divided by the smaller one', 'Physics methods are chosen by the final unit and nothing else'],
        why: 'Surface arithmetic can match while the relationship—density or Ohm’s law—does not.',
      },
      {
        prompt: 'One word problem describes equal groups. Another describes a fixed starting amount plus the same increase each hour. What clue separates multiplication from a linear model?',
        correct: 'A starting value plus repeated additive change needs a linear model',
        wrong: ['Longer word problems always need equations of one kind or another', 'The word “each” always means multiplication only', 'Hours can never be multiplied by anything at all'],
        why: 'A fixed intercept plus a constant rate has two parts; equal groups alone has one multiplication structure.',
      },
    ] as const)
    return {
      title: 'Find the deciding clue',
      prompt: scenario.prompt,
      answer: mcq(rng, scenario.correct, [...scenario.wrong]),
      hints: [
        'Ignore the topic nouns. Compare what is known, what changes, and what the question asks you to produce.',
        'The deciding clue is a relationship in the problem, not a visual detail or a particular number.',
        `The deciding clue is: **${scenario.correct}**.`,
      ],
      explanation: `${scenario.why} Method choice comes from structure, not from a chapter label or a familiar-looking number.`,
    }
  },
)

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

/**
 * When each skill was last explained back.
 *
 * Read from `aboutSkillIds`, which the explain-back event carries as CONTEXT
 * (never as mastery evidence — a self-written explanation must not advance an
 * academic skill). Decoding the seed against `EXPLAIN_TARGETS` would also work
 * today and would silently mean something else the moment that list changes
 * order, which is exactly the kind of drift a saved event should not be exposed
 * to.
 */
export function lastExplainedAt(events: readonly AttemptEvent[]): Map<string, number> {
  const out = new Map<string, number>()
  for (const e of events) {
    if (e.templateId !== 'x-explain-back') continue
    for (const id of e.aboutSkillIds ?? []) out.set(id, Math.max(out.get(id) ?? 0, e.t))
  }
  return out
}

/**
 * Which retained skill to ask the learner to explain back.
 *
 * LEAST RECENTLY EXPLAINED first, oldest-retained breaking ties.
 *
 * It used to be oldest-retained alone, and that never rotated: explaining a
 * skill does not change when it was retained, so the oldest retained skill
 * stays the oldest retained skill and gets picked every third session forever.
 * Measured over a simulated year, a learner at 30-60% accuracy met the SAME
 * explain-back 89 times while the other 50 eligible skills were never checked
 * once — about 3% of their year on one repeated question, and a retention
 * check that only ever checks one thing.
 *
 * Never-explained skills sort first (their timestamp is 0), so a learner who
 * has never done one still gets their oldest retained skill, exactly as before.
 */
export function pickExplainTarget(
  evidence: Map<string, SkillEvidence>,
  lastExplained: ReadonlyMap<string, number> = new Map(),
): string | null {
  const eligible = [...evidence.values()].filter(
    (ev) => stateRank(ev.state) >= stateRank('retained') && EXPLAIN_TARGETS.includes(ev.skillId),
  )
  eligible.sort((a, b) => {
    const ea = lastExplained.get(a.skillId) ?? 0
    const eb = lastExplained.get(b.skillId) ?? 0
    if (ea !== eb) return ea - eb
    return (a.retainedAt ?? 0) - (b.retainedAt ?? 0)
  })
  return eligible[0]?.skillId ?? null
}

export const METHOD_DRILL_TEMPLATES: ItemTemplate[] = [methodDrill, methodContrast, explainBack]
