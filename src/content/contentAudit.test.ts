/**
 * CONTENT AUDIT — release blocker.
 * Loads every seed template and proves, per item:
 *  - required fields, valid skill references, versioned provenance
 *  - deterministic generation (same seed → identical render)
 *  - the computed correct answer PASSES the real validator, a wrong one FAILS
 *  - hint ladder + explanation present, no unsafe markup
 *  - chess: legal FEN, mate goals verified by exhaustive search, lines legal
 *    and material-winning
 *  - polyomino: authored solution actually solves the puzzle
 *  - logic grids: exactly one solution, equal to the stored one
 * Plus graph checks: prereqs exist, no cycles, every skill reachable and
 * covered by at least one template.
 */
import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { BUILTIN_TEMPLATES, DEFAULT_INDEX } from './registry'
import { COURSES, SKILLS, SKILL_BY_ID } from './skills'
import { KB_BY_SKILL } from './kb'
import { correctResponse, validate, wrongResponse } from '../engine/validate'
import { matingMoves, movesKeepingMate } from '../engine/chessTools'
import { puzzleValid } from '../engine/logicGrid'
import { solutionValid } from '../engine/polyomino'
import type { AnswerSpec, RenderedItem } from '../domain/types'
import { MATH_LADDER, BREADTH_PROBES } from '../engine/placement'

const UNSAFE = /<\s*(script|iframe|object|embed|img|svg|style)/i

function checkAnswer(spec: AnswerSpec, where: string) {
  const good = validate(spec, correctResponse(spec))
  expect(good.ok, `${where}: correct answer must validate (got ${JSON.stringify(good)})`).toBe(true)
  if (spec.type !== 'rubric') {
    const bad = validate(spec, wrongResponse(spec))
    expect(bad.ok, `${where}: wrong answer must fail`).toBe(false)
  }
  if (spec.type === 'mcq') {
    expect(spec.options.length, `${where}: mcq needs ≥2 options`).toBeGreaterThanOrEqual(2)
    expect(new Set(spec.options).size, `${where}: mcq options must be unique`).toBe(spec.options.length)
    expect(spec.correct).toBeGreaterThanOrEqual(0)
    expect(spec.correct).toBeLessThan(spec.options.length)
  }
  if (spec.type === 'order') {
    expect([...spec.correct].sort((a, b) => a - b), `${where}: order must be a permutation`).toEqual(
      spec.options.map((_, i) => i),
    )
  }
  if (spec.type === 'multi') {
    expect(spec.correct.length).toBeGreaterThan(0)
    expect(spec.correct.every((c) => c >= 0 && c < spec.options.length)).toBe(true)
  }
  if (spec.type === 'numeric') {
    expect(Number.isFinite(spec.answer), `${where}: numeric answer must be finite`).toBe(true)
  }
}

function checkRendered(item: RenderedItem, where: string) {
  expect(item.prompt.length, `${where}: prompt required`).toBeGreaterThan(8)
  expect(item.hints.length, `${where}: hint ladder required`).toBeGreaterThanOrEqual(2)
  expect(item.explanation.length, `${where}: explanation required`).toBeGreaterThan(20)
  const allText = [item.prompt, item.explanation, ...item.hints, item.title].join(' ')
  expect(UNSAFE.test(allText), `${where}: unsafe markup`).toBe(false)
  if (item.kind === 'single') {
    expect(item.answer, `${where}: single item needs answer`).toBeTruthy()
    checkAnswer(item.answer!, where)
  }
  if (item.kind === 'multi') {
    expect(item.parts && item.parts.length, `${where}: multi item needs parts`).toBeTruthy()
    for (const [i, part] of item.parts!.entries()) {
      expect(part.prompt.length, `${where} part ${i}: prompt`).toBeGreaterThan(4)
      expect(part.explanation.length, `${where} part ${i}: explanation`).toBeGreaterThan(10)
      checkAnswer(part.answer, `${where} part ${i}`)
    }
  }
}

describe('skill graph', () => {
  it('all prereqs exist and the graph is acyclic', () => {
    for (const s of SKILLS) {
      for (const p of s.prereqs) {
        expect(SKILL_BY_ID.has(p), `${s.id} prereq ${p} missing`).toBe(true)
      }
    }
    // cycle detection via DFS
    const visiting = new Set<string>()
    const done = new Set<string>()
    function dfs(id: string) {
      if (done.has(id)) return
      expect(visiting.has(id), `cycle at ${id}`).toBe(false)
      visiting.add(id)
      for (const p of SKILL_BY_ID.get(id)!.prereqs) dfs(p)
      visiting.delete(id)
      done.add(id)
    }
    for (const s of SKILLS) dfs(s.id)
  })
  it('every skill sits in exactly one unit and every unit skill exists', () => {
    const seen = new Map<string, number>()
    for (const c of COURSES) {
      for (const u of c.units) {
        for (const id of u.skillIds) {
          expect(SKILL_BY_ID.has(id), `unit ${u.id} references missing ${id}`).toBe(true)
          seen.set(id, (seen.get(id) ?? 0) + 1)
        }
      }
    }
    for (const s of SKILLS) {
      expect(seen.get(s.id), `${s.id} must appear in exactly one unit`).toBe(1)
    }
  })
  it('every skill has at least one template and a knowledge-base card', () => {
    for (const s of SKILLS) {
      const templates = DEFAULT_INDEX.bySkill.get(s.id) ?? []
      expect(templates.length, `${s.id} has no items`).toBeGreaterThan(0)
      expect(KB_BY_SKILL.has(s.id), `${s.id} has no KB card`).toBe(true)
    }
  })
  it('placement probes reference real skills with content', () => {
    for (const id of [...MATH_LADDER, ...BREADTH_PROBES]) {
      expect(SKILL_BY_ID.has(id), `placement skill ${id}`).toBe(true)
      expect((DEFAULT_INDEX.bySkill.get(id) ?? []).length, `placement ${id} needs items`).toBeGreaterThan(0)
    }
  })
})

describe('template registry', () => {
  it('ids are unique; fields are sane', () => {
    const ids = new Set<string>()
    for (const t of BUILTIN_TEMPLATES) {
      expect(ids.has(t.id), `duplicate template id ${t.id}`).toBe(false)
      ids.add(t.id)
      expect(t.version).toBeGreaterThan(0)
      expect(t.provenance.length, `${t.id}: provenance required`).toBeGreaterThan(10)
      expect(t.minutes).toBeGreaterThan(0)
      expect(t.variants).toBeGreaterThanOrEqual(1)
      expect(t.skillIds.length).toBeGreaterThan(0)
      for (const s of t.skillIds) expect(SKILL_BY_ID.has(s), `${t.id}: unknown skill ${s}`).toBe(true)
      const skillBuckets = t.skillIds.map((s) => SKILL_BY_ID.get(s)!.bucket)
      expect(skillBuckets, `${t.id}: primary skill bucket must match template bucket`).toContain(t.bucket)
    }
    expect(BUILTIN_TEMPLATES.length).toBeGreaterThanOrEqual(100)
  })

  it('generation is deterministic per seed', () => {
    for (const t of BUILTIN_TEMPLATES) {
      const a = JSON.stringify(t.generate(5))
      const b = JSON.stringify(t.generate(5))
      expect(a, `${t.id}: nondeterministic generation`).toBe(b)
    }
  })

  it('every rendered variant is complete and self-consistent', () => {
    for (const t of BUILTIN_TEMPLATES) {
      const seeds = t.variants === 1 ? [0] : Array.from({ length: Math.min(t.variants, 12) }, (_, i) => i)
      // also probe two large seeds to catch modulo mistakes
      seeds.push(9973, 104729)
      for (const seed of seeds) {
        const item = t.generate(seed)
        checkRendered(item, `${t.id}@${seed}`)
      }
    }
  })
})

describe('chess tactics (exhaustive verification)', () => {
  const chessTemplates = BUILTIN_TEMPLATES.filter((t) => t.kind === 'chess')
  it('has at least 20 tactics', () => {
    expect(chessTemplates.length).toBeGreaterThanOrEqual(20)
  })
  it('every FEN is legal, every goal verified, every line playable', { timeout: 120_000 }, () => {
    for (const t of chessTemplates) {
      const item = t.generate(0)
      const spec = item.chess!
      expect(() => new Chess(spec.fen), `${t.id}: illegal FEN`).not.toThrow()
      const game = new Chess(spec.fen)
      expect(game.isCheckmate(), `${t.id}: already mate`).toBe(false)
      if (spec.goal === 'mate1') {
        const mates = matingMoves(spec.fen)
        expect(mates.length, `${t.id}: no mate in 1`).toBeGreaterThan(0)
        expect(mates, `${t.id}: listed key must be a mating move`).toContain(spec.line[0])
      } else if (spec.goal === 'mate2') {
        expect(matingMoves(spec.fen).length, `${t.id}: mate2 must not be mate1`).toBe(0)
        const keys = movesKeepingMate(spec.fen, 2)
        expect(keys.length, `${t.id}: no forced mate in 2`).toBeGreaterThan(0)
        const bare = (san: string) => san.replace(/[+#]/g, '')
        expect(keys.map(bare), `${t.id}: listed key must force mate`).toContain(bare(spec.line[0]))
      } else {
        // line tactic: replay every move; require net material gain for white
        const g = new Chess(spec.fen)
        const value = (fen: string) => {
          const vals: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
          let sum = 0
          for (const row of new Chess(fen).board()) {
            for (const cell of row) {
              if (cell) sum += (cell.color === 'w' ? 1 : -1) * vals[cell.type]
            }
          }
          return sum
        }
        const before = value(spec.fen)
        for (const san of spec.line) {
          expect(() => g.move(san), `${t.id}: illegal move ${san}`).not.toThrow()
        }
        const after = value(g.fen())
        expect(after - before, `${t.id}: line must win material`).toBeGreaterThanOrEqual(2)
      }
    }
  })
})

describe('spatial puzzles', () => {
  it('every authored layout is solvable and pieces tile the region exactly', () => {
    for (const t of BUILTIN_TEMPLATES.filter((x) => x.kind === 'polyomino')) {
      const spec = t.generate(0).polyomino!
      expect(solutionValid(spec), `${t.id}: authored solution must solve`).toBe(true)
      const cellCount = spec.pieces.reduce((a, p) => a + p.cells.length, 0)
      expect(cellCount, `${t.id}: pieces must exactly cover region`).toBe(spec.region.length)
      expect(spec.pieces.length).toBeGreaterThanOrEqual(4)
    }
  })
})

describe('logic grids', () => {
  it('every puzzle has exactly one solution, equal to the stored one', () => {
    for (const t of BUILTIN_TEMPLATES.filter((x) => x.kind === 'logicgrid')) {
      const spec = t.generate(0).logicgrid!
      const verdict = puzzleValid(spec)
      expect(verdict.ok, `${t.id}: ${verdict.reason}`).toBe(true)
      expect(spec.clues.length).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('content volume targets', () => {
  it('meets the V1 seed targets', () => {
    const academic = BUILTIN_TEMPLATES.filter((t) => ['math', 'physics', 'coding', 'science'].includes(t.bucket))
    expect(academic.length).toBeGreaterThanOrEqual(90)
    const academicSkills = SKILLS.filter((s) => ['math', 'physics', 'coding', 'science'].includes(s.bucket))
    expect(academicSkills.length).toBeGreaterThanOrEqual(40)
    expect(academicSkills.length).toBeLessThanOrEqual(65)
    const observer = BUILTIN_TEMPLATES.filter((t) => t.bucket === 'observer')
    const investigator = BUILTIN_TEMPLATES.filter((t) => t.bucket === 'investigator')
    const strategist = BUILTIN_TEMPLATES.filter((t) => t.bucket === 'strategist')
    const insightMeta = BUILTIN_TEMPLATES.filter((t) => t.bucket === 'insight' || t.bucket === 'meta')
    expect(observer.length).toBeGreaterThanOrEqual(8)
    expect(investigator.length).toBeGreaterThanOrEqual(8)
    expect(strategist.length).toBeGreaterThanOrEqual(8)
    expect(insightMeta.length).toBeGreaterThanOrEqual(8)
    expect(BUILTIN_TEMPLATES.filter((t) => t.kind === 'multi' && t.id.startsWith('case-')).length).toBeGreaterThanOrEqual(3)
  })
})
