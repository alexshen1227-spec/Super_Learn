/**
 * GENERATED puzzles — the fix for the one bucket that genuinely ran dry.
 *
 * The hand-authored puzzle bank is excellent but finite: 42 templates holding
 * 53 distinct forms, against roughly 660 focused minutes a year at the default
 * 8% allocation. That is the same few dozen puzzles three times over, which is
 * recall of the puzzle rather than practice of the skill.
 *
 * These generators are unbounded and still fully verified:
 *  - Spatial layouts are partitioned from a solved rectangle, so solvability
 *    is guaranteed BY CONSTRUCTION exactly as the authored drawings are, and
 *    `solutionValid` re-checks every generated form in the audit.
 *  - Logic grids are generated solution-first, then clues are added and PRUNED
 *    against the real brute-force solver until exactly one solution survives.
 *    Uniqueness is proven at generation time, not asserted.
 *
 * Determinism: every generator is driven solely by its seeded RNG, so
 * (templateId, seed) → identical puzzle, forever.
 */
import type { ItemTemplate, LogicGridClue, LogicGridSpec, PolyominoSpec, RenderedItem } from '../../domain/types'
import { mulberry32, shuffle, type Rng } from '../../engine/rng'
import { countSolutions } from '../../engine/logicGrid'
import { solutionValid, specFromDrawing } from '../../engine/polyomino'

// ================================================================ spatial

const LETTERS = 'ABCDEFGHIJ'
const COLORS: Record<string, number> = Object.fromEntries([...LETTERS].map((c, i) => [c, i % 6]))

interface Shape {
  w: number
  h: number
  /** Piece sizes must sum to w*h; 4s and 5s keep shapes interesting. */
  sizes: number[]
}

/** Cell index helpers on a w×h grid. */
const idx = (x: number, y: number, w: number) => y * w + x
const neighbours = (i: number, w: number, h: number): number[] => {
  const x = i % w
  const y = Math.floor(i / w)
  const out: number[] = []
  if (x > 0) out.push(idx(x - 1, y, w))
  if (x < w - 1) out.push(idx(x + 1, y, w))
  if (y > 0) out.push(idx(x, y - 1, w))
  if (y < h - 1) out.push(idx(x, y + 1, w))
  return out
}

/**
 * Partition a w×h rectangle into connected pieces of the given sizes.
 *
 * Growth is deliberately only PART greedy. Always taking the most-constrained
 * cell never strands a pocket, but it also converges on the same handful of
 * tilings — a 4×4 yielded just 8 distinct layouts. So each step takes the
 * most-constrained cell only about half the time and picks freely otherwise,
 * which multiplies the distinct layouts several-fold. The cost is that a walk
 * can now strand cells; that returns null and the caller simply retries, so
 * variety is bought with retries rather than with unsolvable puzzles.
 */
function partition(rng: Rng, shape: Shape): string[] | null {
  const { w, h, sizes } = shape
  const total = w * h
  const owner = new Array<number>(total).fill(-1)
  const freeNeighbourCount = (i: number) => neighbours(i, w, h).filter((n) => owner[n] === -1).length
  /** Most-constrained candidate, or a free choice — the source of variety. */
  const choose = (candidates: number[]): number => {
    const pool = shuffle(rng, [...new Set(candidates)])
    if (rng() < 0.45) return pool[0]
    let best = pool[0]
    let bestScore = Infinity
    for (const i of pool) {
      const s = freeNeighbourCount(i)
      if (s < bestScore) {
        bestScore = s
        best = i
      }
    }
    return best
  }

  for (let p = 0; p < sizes.length; p++) {
    const free = owner.map((o, i) => (o === -1 ? i : -1)).filter((i) => i >= 0)
    if (!free.length) return null
    owner[choose(free)] = p
    let grown = 1
    while (grown < sizes[p]) {
      const frontier: number[] = []
      for (let i = 0; i < total; i++) {
        if (owner[i] !== p) continue
        for (const n of neighbours(i, w, h)) if (owner[n] === -1) frontier.push(n)
      }
      if (!frontier.length) return null
      owner[choose(frontier)] = p
      grown++
    }
  }
  if (owner.some((o) => o === -1)) return null
  const rows: string[] = []
  for (let y = 0; y < h; y++) {
    let row = ''
    for (let x = 0; x < w; x++) row += LETTERS[owner[idx(x, y, w)]]
    rows.push(row)
  }
  return rows
}

/** A curated fallback per shape, so generation can never fail to produce a puzzle. */
const FALLBACKS: Record<string, string[]> = {
  '4x4': ['AABB', 'AABB', 'CCDD', 'CCDD'],
  '5x4': ['AABBB', 'AABCC', 'DDECC', 'DDEEE'],
  '6x4': ['AABBCC', 'AABBCC', 'DDEEFF', 'DDEEFF'],
  '5x5': ['AAABB', 'AACBB', 'DACCB', 'DDDCE', 'DEEEE'],
  '6x5': ['AAABBB', 'AACCBB', 'DDCCEE', 'DDDFEE', 'FFFFEE'],
}

function buildSpatial(rng: Rng, shape: Shape): PolyominoSpec {
  for (let attempt = 0; attempt < 60; attempt++) {
    const rows = partition(rng, shape)
    if (!rows) continue
    const spec = specFromDrawing(rows, COLORS, true)
    // Re-verify with the same function the audit uses. Belt and braces: a
    // puzzle that cannot be solved must never reach a learner.
    if (spec.pieces.length >= 4 && solutionValid(spec)) return spec
  }
  return specFromDrawing(FALLBACKS[`${shape.w}x${shape.h}`] ?? FALLBACKS['4x4'], COLORS, true)
}

function spatialTemplate(def: {
  id: string
  name: string
  shape: Shape
  difficulty: 1 | 2 | 3 | 4 | 5
  minutes: number
  variants: number
  intro: string
  lesson: string
}): ItemTemplate {
  return {
    id: def.id,
    version: 1,
    kind: 'polyomino',
    name: def.name,
    skillIds: ['z-spatial'],
    bucket: 'puzzle',
    difficulty: def.difficulty,
    variants: def.variants,
    minutes: def.minutes,
    provenance:
      'Generated: a solved rectangle partitioned into connected pieces, so a solution exists by construction; re-verified by solutionValid() in the content audit.',
    generate: (seed: number): RenderedItem => {
      const folded = seed % def.variants
      const rng = mulberry32(folded * 2654435761 + 40503)
      const polyomino = buildSpatial(rng, def.shape)
      return {
        templateId: def.id,
        version: 1,
        seed,
        kind: 'polyomino',
        title: def.name,
        prompt: `${def.intro}\n\n**${polyomino.pieces.length} pieces**, ${def.shape.w}×${def.shape.h}. Rotate freely; every cell must be covered exactly once.`,
        polyomino,
        hints: [
          'Start in a corner: corner cells have the fewest ways to be covered, so they force the most.',
          'Place the most awkward shape early — regular shapes stay flexible, awkward ones do not.',
          'If a gap of one or two cells appears that no piece can fill, undo the LAST placement, not the first.',
        ],
        explanation: def.lesson,
      }
    },
  }
}

export const GENERATED_SPATIAL: ItemTemplate[] = [
  spatialTemplate({
    id: 'poly-gen-small',
    name: 'Assembly: small frame',
    shape: { w: 4, h: 4, sizes: [4, 4, 4, 4] },
    difficulty: 2,
    minutes: 4,
    variants: 20,
    intro: 'A fresh layout every time — the shapes are never the ones you memorised.',
    lesson:
      'Constraint-first search: cover the most-constrained cell (a corner) with the least flexible piece, and the puzzle collapses quickly. The same move orders real problems — do the step with fewest options while options still exist.',
  }),
  spatialTemplate({
    id: 'poly-gen-mid',
    name: 'Assembly: wide panel',
    // A 5x4 board with five tetrominoes has too few reachable tilings to
    // support a real variant count; 6x4 opens the space up considerably.
    shape: { w: 6, h: 4, sizes: [4, 4, 4, 4, 4, 4] },
    difficulty: 3,
    minutes: 5,
    variants: 30,
    intro: 'Five pieces, twenty cells, a layout generated fresh for this attempt.',
    lesson:
      'With five pieces the search space is large enough that guessing loses. Working from the boundary inward keeps every partial placement checkable — which is exactly why engineers fix interfaces before internals.',
  }),
  spatialTemplate({
    id: 'poly-gen-large',
    name: 'Assembly: full board',
    shape: { w: 5, h: 5, sizes: [5, 5, 5, 5, 5] },
    difficulty: 4,
    minutes: 7,
    variants: 40,
    intro: 'Five pentominoes, twenty-five cells, generated fresh. No memorised solution will help here.',
    lesson:
      'Pentominoes punish greedy placement: a shape that fits locally can strand a pocket three moves later. Look one step ahead at what each placement LEAVES, not just at whether it fits — the difference between a move being legal and being good.',
  }),
  spatialTemplate({
    id: 'poly-gen-wide',
    name: 'Assembly: long board',
    shape: { w: 6, h: 5, sizes: [5, 5, 5, 5, 5, 5] },
    difficulty: 5,
    minutes: 8,
    variants: 40,
    intro: 'Six pentominoes across thirty cells — the largest board, generated fresh.',
    lesson:
      'At this size no one holds the whole board in mind at once, which is the point: you need a rule (corners first, awkward shapes first, check what each move leaves) rather than intuition. Scaling a method past what memory can carry is the transferable skill here.',
  }),
]

// ================================================================ logic grids

interface GridTheme {
  categories: [string, string, string]
  values: [string[], string[], string[]]
  /** Renders a natural sentence for an ordinal comparison in category 1 or 2. */
  ordinal: (less: string, greater: string, cat: number) => string
  link: (a: string, b: string) => string
  notLink: (a: string, b: string) => string
}

const THEMES: GridTheme[] = [
  {
    categories: ['Student', 'Project', 'Room'],
    values: [
      ['Ada', 'Bo', 'Cleo', 'Dev'],
      ['volcano', 'robot', 'garden', 'telescope'],
      ['room 1', 'room 2', 'room 3', 'room 4'],
    ],
    ordinal: (l, g) => `${l} works in a lower-numbered room than ${g}.`,
    link: (a, b) => `${a} goes with ${b}.`,
    notLink: (a, b) => `${a} does not go with ${b}.`,
  },
  {
    categories: ['Runner', 'Distance', 'Finish time'],
    values: [
      ['Iris', 'Jonah', 'Kit', 'Lena'],
      ['400 m', '800 m', '1500 m', '3000 m'],
      ['9:10', '9:40', '10:05', '10:30'],
    ],
    ordinal: (l, g) => `${l} finished before ${g}.`,
    link: (a, b) => `${a} pairs with ${b}.`,
    notLink: (a, b) => `${a} does not pair with ${b}.`,
  },
  {
    categories: ['Baker', 'Bake', 'Oven shelf'],
    values: [
      ['Mira', 'Noor', 'Otto', 'Pip'],
      ['rye loaf', 'brioche', 'focaccia', 'bagels'],
      ['shelf 1', 'shelf 2', 'shelf 3', 'shelf 4'],
    ],
    ordinal: (l, g) => `${l} used a lower shelf than ${g}.`,
    link: (a, b) => `${a} belongs with ${b}.`,
    notLink: (a, b) => `${a} does not belong with ${b}.`,
  },
  {
    categories: ['Volunteer', 'Task', 'Start time'],
    values: [
      ['Quinn', 'Rae', 'Sol', 'Tam'],
      ['sorting', 'labelling', 'delivery', 'reception'],
      ['8 am', '9 am', '10 am', '11 am'],
    ],
    ordinal: (l, g) => `${l} started earlier than ${g}.`,
    link: (a, b) => `${a} is matched with ${b}.`,
    notLink: (a, b) => `${a} is not matched with ${b}.`,
  },
  {
    categories: ['Musician', 'Instrument', 'Stage slot'],
    values: [
      ['Uma', 'Vik', 'Wren', 'Xan'],
      ['cello', 'clarinet', 'drums', 'piano'],
      ['slot 1', 'slot 2', 'slot 3', 'slot 4'],
    ],
    ordinal: (l, g) => `${l} played in an earlier slot than ${g}.`,
    link: (a, b) => `${a} performs with ${b}.`,
    notLink: (a, b) => `${a} does not perform with ${b}.`,
  },
]

/** Every clue that is TRUE of this solution, as (spec, text) pairs. */
function candidateClues(theme: GridTheme, n: number, solution: number[][]): LogicGridClue[] {
  const keyName = (k: number) => theme.values[0][k]
  const valName = (cat: number, v: number) => theme.values[cat][v]
  const out: LogicGridClue[] = []

  for (let k = 0; k < n; k++) {
    for (let cat = 1; cat <= 2; cat++) {
      const v = solution[cat - 1][k]
      out.push({
        text: `${keyName(k)} goes with ${valName(cat, v)}.`,
        spec: { kind: 'is', key: k, cat, val: v },
      })
      // Negative clues: every value this key does NOT have.
      for (let other = 0; other < n; other++) {
        if (other === v) continue
        out.push({
          text: `${keyName(k)} is not with ${valName(cat, other)}.`,
          spec: { kind: 'not', key: k, cat, val: other },
        })
      }
    }
  }

  // Cross-category links between the two non-key categories.
  for (let k = 0; k < n; k++) {
    const v1 = solution[0][k]
    const v2 = solution[1][k]
    out.push({
      text: theme.link(valName(1, v1), valName(2, v2)),
      spec: { kind: 'link', cat1: 1, val1: v1, cat2: 2, val2: v2 },
    })
    for (let other = 0; other < n; other++) {
      if (other === v2) continue
      out.push({
        text: theme.notLink(valName(1, v1), valName(2, other)),
        spec: { kind: 'notlink', cat1: 1, val1: v1, cat2: 2, val2: other },
      })
    }
  }

  // Ordering clues on category 2 (which is always ordinal in these themes).
  for (let a = 0; a < n; a++) {
    for (let b = 0; b < n; b++) {
      if (a === b) continue
      if (solution[1][a] < solution[1][b]) {
        out.push({
          text: theme.ordinal(keyName(a), keyName(b), 2),
          spec: { kind: 'order', catOrd: 2, less: { cat: 0, val: a }, greater: { cat: 0, val: b } },
        })
        const v1a = solution[0][a]
        const v1b = solution[0][b]
        out.push({
          text: theme.ordinal(valName(1, v1a), valName(1, v1b), 2),
          spec: { kind: 'order', catOrd: 2, less: { cat: 1, val: v1a }, greater: { cat: 1, val: v1b } },
        })
      }
    }
  }
  return out
}

function randomPerm(rng: Rng, n: number): number[] {
  return shuffle(rng, Array.from({ length: n }, (_, i) => i))
}

/**
 * Build a puzzle with EXACTLY one solution.
 * Solution first, then true clues are added until the solver reports
 * uniqueness, then every redundant clue is pruned back out. The result is a
 * minimal clue set whose uniqueness was proven, not assumed.
 */
function buildGrid(rng: Rng, theme: GridTheme, n: number, maxClues: number): LogicGridSpec | null {
  const solution = [randomPerm(rng, n), randomPerm(rng, n)]
  const categories = theme.categories.slice(0, 3)
  const values: string[][] = [
    theme.values[0].slice(0, n),
    theme.values[1].slice(0, n),
    theme.values[2].slice(0, n),
  ]
  const pool = shuffle(rng, candidateClues(theme, n, solution))
  const chosen: LogicGridClue[] = []
  const spec = (clues: LogicGridClue[]): LogicGridSpec => ({ categories, values, clues, solution })

  for (const clue of pool) {
    if (chosen.length >= maxClues) break
    chosen.push(clue)
    const { count } = countSolutions(spec(chosen), 2)
    if (count === 1) {
      // Prune: drop any clue the puzzle no longer needs, hardest-first.
      const pruned = [...chosen]
      for (let i = pruned.length - 1; i >= 0; i--) {
        const without = pruned.filter((_, j) => j !== i)
        if (without.length >= 3 && countSolutions(spec(without), 2).count === 1) {
          pruned.splice(i, 1)
        }
      }
      return spec(pruned)
    }
  }
  return null
}

function gridTemplate(def: {
  id: string
  name: string
  n: number
  difficulty: 1 | 2 | 3 | 4 | 5
  minutes: number
  variants: number
  lesson: string
}): ItemTemplate {
  return {
    id: def.id,
    version: 1,
    kind: 'logicgrid',
    name: def.name,
    skillIds: ['z-deduce'],
    bucket: 'puzzle',
    difficulty: def.difficulty,
    variants: def.variants,
    minutes: def.minutes,
    provenance:
      'Generated solution-first; clues added and pruned against the brute-force solver until exactly one solution remains. Uniqueness is proven at generation time and re-proven in the content audit.',
    generate: (seed: number): RenderedItem => {
      const folded = seed % def.variants
      const rng = mulberry32(folded * 2654435761 + 7717)
      const theme = THEMES[folded % THEMES.length]
      let logicgrid: LogicGridSpec | null = null
      for (let attempt = 0; attempt < 24 && !logicgrid; attempt++) {
        logicgrid = buildGrid(rng, theme, def.n, 14)
      }
      // A generator that cannot prove uniqueness must not ship a puzzle: fall
      // back to the smallest theme, which always resolves.
      if (!logicgrid) logicgrid = buildGrid(mulberry32(folded + 1), THEMES[0], 3, 16)!
      return {
        templateId: def.id,
        version: 1,
        seed,
        kind: 'logicgrid',
        title: def.name,
        prompt: `Match every ${logicgrid.categories[0].toLowerCase()} to one ${logicgrid.categories[1].toLowerCase()} and one ${logicgrid.categories[2].toLowerCase()}. Exactly one arrangement satisfies all ${logicgrid.clues.length} clues.`,
        logicgrid,
        hints: [
          'Start with the clues that name a single pairing outright — they cost nothing to apply.',
          'Every negative clue is real information: eliminating one cell often forces a whole row or column.',
          'When stuck, look for a value that only one entity can still take. Uniqueness means that always exists.',
        ],
        explanation: def.lesson,
      }
    },
  }
}

export const GENERATED_GRIDS: ItemTemplate[] = [
  gridTemplate({
    id: 'lg-gen-3',
    name: 'Deduction grid: three',
    n: 3,
    difficulty: 2,
    minutes: 4,
    variants: 50,
    lesson:
      'Constraint propagation: each fact you place removes possibilities elsewhere, and those removals cascade. Nothing here needs cleverness — only the discipline to record what has been ruled OUT as carefully as what has been ruled in.',
  }),
  gridTemplate({
    id: 'lg-gen-4',
    name: 'Deduction grid: four',
    n: 4,
    difficulty: 3,
    minutes: 6,
    variants: 50,
    lesson:
      'At four entities the negative clues carry most of the information. Elimination is not a second-best method here — it IS the method, and the same is true of diagnosis, debugging, and most real investigation.',
  }),
  gridTemplate({
    id: 'lg-gen-4-hard',
    name: 'Deduction grid: four, sparse clues',
    n: 4,
    difficulty: 4,
    minutes: 7,
    variants: 50,
    lesson:
      'Sparse clue sets force chained reasoning: no single clue resolves anything alone, so you must hold two partial conclusions together to reach a third. That "hold and combine" step is what separates deduction from lookup.',
  }),
]

export const GENERATED_PUZZLE_TEMPLATES: ItemTemplate[] = [...GENERATED_SPATIAL, ...GENERATED_GRIDS]
