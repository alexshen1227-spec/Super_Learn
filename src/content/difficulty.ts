import type { ItemTemplate } from '../domain/types'

export type Difficulty = ItemTemplate['difficulty']

export const DIFFICULTY_INFO: Record<Difficulty, { name: string; description: string }> = {
  1: { name: 'Foundation', description: 'One idea in a familiar form; direct recall or recognition.' },
  2: { name: 'Guided', description: 'One or two connected steps in a familiar context.' },
  3: { name: 'Independent', description: 'Combine ideas without scaffolding or choose the method yourself.' },
  4: { name: 'Advanced', description: 'Multi-step reasoning or transfer into a less familiar context.' },
  5: { name: 'Expert', description: 'Synthesize several constraints under uncertainty; never a speed trick.' },
}

export function difficultyInfo(difficulty: number) {
  const safe = Math.max(1, Math.min(5, Math.round(difficulty))) as Difficulty
  return { level: safe, ...DIFFICULTY_INFO[safe] }
}
