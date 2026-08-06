/**
 * Spatial assembly puzzles. Each is authored as a SOLVED layout drawing
 * (letters = pieces), so solvability is guaranteed by construction; the
 * content audit re-verifies via solutionValid().
 */
import type { ItemTemplate, RenderedItem } from '../../domain/types'
import { specFromDrawing } from '../../engine/polyomino'

const COLORS: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5 }

interface PuzzleDef {
  id: string
  name: string
  rows: string[]
  difficulty: 1 | 2 | 3 | 4 | 5
  minutes: number
  intro: string
}

const PUZZLES: PuzzleDef[] = [
  {
    id: 'poly-square-4',
    name: 'Four-piece square',
    rows: ['AABB', 'ABBC', 'ADCC', 'DDDC'],
    difficulty: 1,
    minutes: 3,
    intro: 'Four pieces, one 4×4 square. Rotate freely; every cell must be covered.',
  },
  {
    id: 'poly-rect-5',
    name: 'Five-piece rectangle',
    rows: ['AABBB', 'AACBD', 'CCCDD', 'EEEED'],
    difficulty: 2,
    minutes: 4,
    intro: 'Five pieces into a 5×4 rectangle. Corners first is usually right — but not always.',
  },
  {
    id: 'poly-band-6',
    name: 'Six-piece band',
    rows: ['AAABBB', 'ACCCCB', 'DDDEEE', 'DFFFFE'],
    difficulty: 2,
    minutes: 4,
    intro: 'Six pieces, 6×4. The long bars constrain everything — place them with care.',
  },
  {
    id: 'poly-pent-5',
    name: 'Pentomino square',
    rows: ['AAABB', 'ACABB', 'CCCDB', 'ECDDD', 'EEEED'],
    difficulty: 3,
    minutes: 6,
    intro: 'Five 5-cell pieces into a 5×5 square. Awkward shapes go first; easy shapes keep options open.',
  },
  {
    id: 'poly-pent-6',
    name: 'Pentomino panel',
    rows: ['AAABBB', 'ACABDB', 'CCCDDD', 'ECFFFD', 'EEEEFF'],
    difficulty: 4,
    minutes: 8,
    intro: 'Six pentominoes, 6×5. The U-shapes create pockets only certain pieces can fill — find those forced placements first.',
  },
]

export const POLYOMINO_TEMPLATES: ItemTemplate[] = PUZZLES.map((p) => {
  const spec = specFromDrawing(p.rows, COLORS, true)
  return {
    id: p.id,
    version: 1,
    kind: 'polyomino',
    name: p.name,
    skillIds: ['z-spatial'],
    bucket: 'puzzle',
    difficulty: p.difficulty,
    variants: 1,
    minutes: p.minutes,
    provenance: 'Original layout composed for Axiom Lab; solvable by construction (audited).',
    generate: (seed: number): RenderedItem => ({
      templateId: p.id,
      version: 1,
      seed,
      kind: 'polyomino',
      title: p.name,
      prompt: p.intro,
      polyomino: spec,
      hints: [
        'Corners and edges admit the fewest shapes — start where options are scarce.',
        'Rotate a piece BEFORE dragging: plan the orientation, then place.',
        'If two pieces both fit a pocket, place the awkward one — the flexible one will find a home later.',
      ],
      explanation:
        'Solved. The strategy that generalizes: work where constraints are tightest (corners, pockets), commit awkward pieces early, and keep flexible pieces in reserve. That is constraint-first ordering — the same move order that cracks logic grids and scheduling problems.',
      transferBridge:
        'You just used "most-constrained first". Where else does that ordering win? (Scheduling the fixed appointment before the flexible ones; solving the crossword\'s crossing letters first…)',
    }),
  }
})
