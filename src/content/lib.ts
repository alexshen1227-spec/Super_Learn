/**
 * Content authoring helpers. The cardinal rule: ANSWERS ARE COMPUTED from the
 * generated values, never hand-typed, so a generator cannot drift out of sync
 * with its own answer key. The content audit re-renders every template across
 * many seeds and re-validates the computed answer through the real validator.
 */
import type {
  AnswerSpec,
  ErrorTag,
  FractionAnswer,
  ItemKind,
  ItemTemplate,
  McqAnswer,
  NumericAnswer,
  RenderedItem,
  StepAnswerSpec,
  TextAnswer,
} from '../domain/types'
import { mulberry32, shuffle, type Rng } from '../engine/rng'

export const PROV = 'Original — composed for Axiom Lab; answer computed by generator.'
export const PROV_FIXED = 'Original — composed for Axiom Lab; solved independently during authoring.'

export interface TplOpts {
  id: string
  name: string
  skillIds: string[]
  bucket: ItemTemplate['bucket']
  difficulty: ItemTemplate['difficulty']
  variants: number
  minutes: number
  kind?: ItemKind
  transfer?: boolean
  calibration?: boolean
  authentic?: ItemTemplate['authentic']
  provenance?: string
  version?: number
}

export type SingleBody = Omit<RenderedItem, 'templateId' | 'version' | 'seed' | 'kind'>

/** Define a template whose generator receives a seeded RNG. */
export function tpl(opts: TplOpts, gen: (rng: Rng, seed: number) => SingleBody): ItemTemplate {
  const version = opts.version ?? 1
  return {
    id: opts.id,
    version,
    kind: opts.kind ?? 'single',
    name: opts.name,
    skillIds: opts.skillIds,
    bucket: opts.bucket,
    difficulty: opts.difficulty,
    variants: opts.variants,
    minutes: opts.minutes,
    ...(opts.transfer ? { transfer: true } : {}),
    ...(opts.calibration ? { calibration: true } : {}),
    ...(opts.authentic ? { authentic: opts.authentic } : {}),
    provenance: opts.provenance ?? PROV,
    generate: (seed: number): RenderedItem => {
      // Variant-fold the seed so equal variants render identically (novelty
      // tracking keys off seed % variants).
      const folded = opts.variants > 0 ? seed % opts.variants : seed
      const body = gen(mulberry32(folded * 2654435761 + 1013904223), folded)
      return { templateId: opts.id, version, seed, kind: opts.kind ?? 'single', ...body }
    },
  }
}

/**
 * Deterministic case rotation for templates built from a list of scenarios.
 *
 * `pick(rng, cases)` draws independently, so a bank of N cases needs far more
 * than N seeds to show all N (coupon-collector): the learner meets repeats
 * before novelty, and the declared variant count overstates what the template
 * really produces. Indexing by the already-variant-folded seed guarantees
 * every case appears exactly once per cycle, which also makes the planner's
 * `seed % variants` novelty tracking line up with actual case identity.
 */
export function cycle<T>(seed: number, cases: readonly T[]): T {
  return cases[((seed % cases.length) + cases.length) % cases.length]
}

/** Fixed (non-parameterized) item. */
export function fixed(opts: Omit<TplOpts, 'variants'>, body: SingleBody): ItemTemplate {
  return tpl({ ...opts, variants: 1, provenance: opts.provenance ?? PROV_FIXED }, () => body)
}

/** Build an MCQ from a correct string + distractors (deduped, shuffled). */
export function mcq(rng: Rng, correct: string, distractors: string[]): McqAnswer {
  const uniq: string[] = []
  for (const d of distractors) {
    if (d !== correct && !uniq.includes(d)) uniq.push(d)
  }
  const options = shuffle(rng, [correct, ...uniq.slice(0, 4)])
  return { type: 'mcq', options, correct: options.indexOf(correct) }
}

/**
 * MCQ whose distractors carry NAMED misconceptions. Notes survive the
 * shuffle: the result maps final option index → "name — why it tempts".
 *
 * A third tuple element may name the error CAUSE that distractor represents.
 * Where it is present the coach can derive the cause from which wrong answer
 * the learner actually picked, instead of asking them to diagnose themselves —
 * see `engine/diagnose.ts`. It is optional because a distractor is not always
 * a single identifiable cause, and guessing one would be worse than leaving the
 * miss untagged: `malRuleProfile` counts untagged misses honestly and never
 * assigns them to the nearest pattern.
 */
export function mcqNoted(
  rng: Rng,
  correct: string,
  distractors: [text: string, note: string | null, tag?: ErrorTag][],
): { answer: McqAnswer; distractorNotes: Record<number, string>; distractorTags: Record<number, ErrorTag> } {
  const uniq: [string, string | null, ErrorTag?][] = []
  for (const entry of distractors) {
    const [d] = entry
    if (d !== correct && !uniq.some(([u]) => u === d)) uniq.push(entry)
  }
  const entries: [string, string | null, ErrorTag?][] = shuffle(rng, [
    [correct, null] as [string, string | null, ErrorTag?],
    ...uniq.slice(0, 4),
  ])
  const options = entries.map(([t]) => t)
  const distractorNotes: Record<number, string> = {}
  const distractorTags: Record<number, ErrorTag> = {}
  entries.forEach(([, n, tag], i) => {
    if (n) distractorNotes[i] = n
    if (tag) distractorTags[i] = tag
  })
  return { answer: { type: 'mcq', options, correct: options.indexOf(correct) }, distractorNotes, distractorTags }
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) [a, b] = [b, a % b]
  return a || 1
}

export function simplify(n: number, d: number): [number, number] {
  const g = gcd(n, d)
  const sign = d < 0 ? -1 : 1
  return [(sign * n) / g, (sign * d) / g]
}

/** Display "n/d" (or integer when it reduces to one). */
export function fracStr(n: number, d: number): string {
  const [sn, sd] = simplify(n, d)
  return sd === 1 ? String(sn) : `${sn}/${sd}`
}

export function money(v: number): string {
  return `$${v.toFixed(2).replace(/\.00$/, '')}`
}

/** Round for display without float dust. */
export function round(v: number, places = 2): number {
  const f = 10 ** places
  return Math.round(v * f) / f
}

export const numeric = (answer: number, extras: Partial<NumericAnswer> = {}): NumericAnswer => ({
  type: 'numeric',
  answer,
  ...extras,
})

export const fraction = (n: number, d: number): FractionAnswer => {
  const [sn, sd] = simplify(n, d)
  return { type: 'fraction', n: sn, d: sd }
}

export const text = (accept: string[], placeholder?: string): TextAnswer => ({
  type: 'text',
  accept,
  ...(placeholder ? { placeholder } : {}),
})

/**
 * Multi-select built from correct + incorrect option texts. The key is
 * COMPUTED from the shuffled positions, so a generator can never drift out of
 * sync with hand-typed indexes.
 */
export function multi(rng: Rng, correct: string[], incorrect: string[]): AnswerSpec {
  const seen = new Set<string>()
  const dedupe = (xs: string[]) => xs.filter((x) => (seen.has(x) ? false : (seen.add(x), true)))
  const good = dedupe(correct)
  const bad = dedupe(incorrect)
  const options = shuffle(rng, [...good, ...bad])
  return {
    type: 'multi',
    options,
    correct: good.map((g) => options.indexOf(g)).sort((a, b) => a - b),
  }
}

/** Classify statements into named categories; display order is shuffled. */
export function classify(
  rng: Rng,
  categories: string[],
  statements: { text: string; category: number }[],
): AnswerSpec {
  return { type: 'classify', categories, statements: shuffle(rng, statements) }
}

/**
 * An ungraded written artifact. Drafted from memory, then compared against
 * the model. Never scored — the evidence comes from the graded probe that
 * must follow it in the same item (enforced by the content audit).
 */
export function draft(opts: {
  criteria: string[]
  model: string
  minWords?: number
  placeholder?: string
}): AnswerSpec {
  return {
    type: 'draft',
    criteria: opts.criteria,
    model: opts.model,
    ...(opts.minWords !== undefined ? { minWords: opts.minWords } : {}),
    ...(opts.placeholder ? { placeholder: opts.placeholder } : {}),
  }
}

/**
 * A worked chain: each intermediate value is checked on its own, and the first
 * broken link names the misconception. Use this wherever the interesting
 * failure is WHERE the reasoning went wrong, not merely whether it did.
 */
export function steps(
  chain: { label: string; answer: StepAnswerSpec; diagnoses: ErrorTag; why: string }[],
): AnswerSpec {
  return { type: 'steps', steps: chain }
}
