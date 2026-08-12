/**
 * "1 skills" is a small thing that makes an app look unfinished.
 *
 * Found in the production build: the placement summary read "Measured 1 skills
 * directly across 1 areas." A learner whose placement probes one skill — which
 * is exactly the learner who is least sure the app works — is the one who sees
 * it. Content files already handle this inline with `=== 1 ? '' : 's'`; the
 * engine and UI strings mostly did not, so this is the shared version.
 *
 * Deliberately tiny and deliberately explicit about irregulars: guessing a
 * plural from a stem is how "1 tries" and "2 childs" get shipped.
 */

/** `count(3, 'skill')` -> "3 skills"; `count(1, 'skill')` -> "1 skill". */
export function count(n: number, singular: string, plural?: string): string {
  return `${n} ${n === 1 ? singular : (plural ?? `${singular}s`)}`
}

/** Just the suffix, for sentences that already have the number in them. */
export function s(n: number): string {
  return n === 1 ? '' : 's'
}

/** `was(1)` -> "was"; `was(2)` -> "were". */
export function was(n: number): string {
  return n === 1 ? 'was' : 'were'
}

/** `has(1)` -> "has"; `has(2)` -> "have". */
export function has(n: number): string {
  return n === 1 ? 'has' : 'have'
}
