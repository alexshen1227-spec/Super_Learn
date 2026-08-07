import type { ItemTemplate } from '../domain/types'

export type Difficulty = ItemTemplate['difficulty']

export const DIFFICULTY_INFO: Record<Difficulty, { name: string; description: string }> = {
  // Tiers 2 and 3 were once called "Guided" and "Independent" — the same two
  // words the evidence ladder uses for rungs (STATE_LABEL in engine/mastery).
  // Difficulty describes the TASK; a rung describes what the learner PROVED.
  // Sharing the words made a 3-star problem answered with three hints display
  // the word "Independent", in the one app whose central claim is that hinted
  // is not independent. Renamed so the two scales cannot be read as one.
  1: { name: 'Foundation', description: 'One idea in a familiar form; direct recall or recognition.' },
  2: { name: 'Routine', description: 'One or two connected steps in a familiar context.' },
  3: { name: 'Combining', description: 'Combine ideas without scaffolding or choose the method yourself.' },
  4: { name: 'Advanced', description: 'Multi-step reasoning or transfer into a less familiar context.' },
  5: { name: 'Expert', description: 'Synthesize several constraints under uncertainty; never a speed trick.' },
}

export function difficultyInfo(difficulty: number) {
  const safe = Math.max(1, Math.min(5, Math.round(difficulty))) as Difficulty
  return { level: safe, ...DIFFICULTY_INFO[safe] }
}
