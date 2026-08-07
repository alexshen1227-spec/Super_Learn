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
import { correctResponse, firstFailedStep, serializeSteps, validate, wrongResponse } from '../engine/validate'
import { matingMoves, movesKeepingMate } from '../engine/chessTools'
import { puzzleValid } from '../engine/logicGrid'
import { solutionValid } from '../engine/polyomino'
import type { AnswerSpec, RenderedItem } from '../domain/types'
import { MATH_LADDER, BREADTH_PROBES } from '../engine/placement'

const UNSAFE = /<\s*(script|iframe|object|embed|img|svg|style)/i

function checkAnswer(spec: AnswerSpec, where: string) {
  if (spec.type === 'draft') {
    // A draft has no answer key by design. What must hold is that it can never
    // become partial credit: whatever is written, the score stays zero.
    expect(validate(spec, 'an excellent and complete response').score, `${where}: a draft must never score`).toBe(0)
    expect(validate(spec, '').score, `${where}: a draft must never score`).toBe(0)
    return
  }
  const good = validate(spec, correctResponse(spec))
  expect(good.ok, `${where}: correct answer must validate (got ${JSON.stringify(good)})`).toBe(true)
  {
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

/** A draft carries no key, so its criteria and model must carry the weight. */
function checkDraftShape(spec: Extract<AnswerSpec, { type: 'draft' }>, where: string) {
  expect(spec.criteria.length, `${where}: draft needs concrete criteria`).toBeGreaterThanOrEqual(3)
  expect(spec.model.length, `${where}: draft needs a substantive model`).toBeGreaterThan(40)
  if (spec.minWords !== undefined) {
    expect(spec.minWords, `${where}: minimum draft length must be meaningful`).toBeGreaterThanOrEqual(3)
    expect(spec.minWords, `${where}: minimum draft length must remain phone-usable`).toBeLessThanOrEqual(300)
  }
}

function checkRendered(item: RenderedItem, where: string) {
  expect(item.prompt.length, `${where}: prompt required`).toBeGreaterThan(8)
  expect(item.hints.length, `${where}: hint ladder required`).toBeGreaterThanOrEqual(2)
  expect(item.explanation.length, `${where}: explanation required`).toBeGreaterThan(20)
  const partText = (item.parts ?? []).flatMap((part) => [
    part.stage ?? '',
    part.study ?? '',
    part.prompt,
    part.explanation,
    ...(part.hints ?? []),
    ...(part.answer.type === 'draft' ? [part.answer.model, ...part.answer.criteria] : []),
  ])
  const allText = [item.prompt, item.explanation, ...item.hints, item.title, ...partText].join(' ')
  expect(UNSAFE.test(allText), `${where}: unsafe markup`).toBe(false)
  if (item.kind === 'single') {
    expect(item.answer, `${where}: single item needs answer`).toBeTruthy()
    // THE EVIDENCE LAW: a draft is never scored, so an item whose only answer
    // is a draft could never produce evidence — it must not exist.
    expect(item.answer!.type, `${where}: a draft can never be a single item's whole answer`).not.toBe('draft')
    checkAnswer(item.answer!, where)
  }
  if (item.kind === 'multi') {
    expect(item.parts && item.parts.length, `${where}: multi item needs parts`).toBeTruthy()
    const parts = item.parts!
    parts.forEach((part, i) => {
      if (part.answer.type !== 'draft') return
      checkDraftShape(part.answer, `${where} part ${i}`)
      // Every draft must be FOLLOWED by something that actually grades. A
      // draft at the end of an item is a checkpoint that proves nothing.
      const gradedAfter = parts.slice(i + 1).some((p) => p.answer.type !== 'draft')
      expect(gradedAfter, `${where} part ${i}: a draft must be followed by a graded probe in the same item`).toBe(true)
    })
    expect(
      parts.some((p) => p.answer.type !== 'draft'),
      `${where}: a multi item needs at least one deterministically graded part`,
    ).toBe(true)
    // Every graded checkpoint can now fail into the repair fork, which offers
    // hints. A part-level ladder is optional (the item's own is the fallback),
    // but a declared one must be a real ladder, not a single throwaway line.
    parts.forEach((part, i) => {
      if (!part.hints) return
      expect(part.hints.length, `${where} part ${i}: a part hint ladder needs ≥2 rungs`).toBeGreaterThanOrEqual(2)
      for (const [h, hint] of part.hints.entries()) {
        expect(hint.trim().length, `${where} part ${i} hint ${h}: empty hint`).toBeGreaterThan(8)
      }
    })
    for (const [i, part] of parts.entries()) {
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
      if (t.authentic) {
        expect(t.kind, `${t.id}: authentic work must preserve staged structure`).toBe('multi')
        expect(t.minutes, `${t.id}: authentic work must have an honest time budget`).toBeGreaterThanOrEqual(10)
        expect(t.authentic.deliverable.length, `${t.id}: authentic work needs a deliverable`).toBeGreaterThan(12)
        expect(t.authentic.simulationNote.length, `${t.id}: simulation limits must be explicit`).toBeGreaterThan(30)
      }
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

/**
 * THE NO-SELF-GRADING LAW.
 *
 * Written work is real practice and must stay in the app, but it cannot be
 * evidence: nobody — not the app, not the learner — grades it. Anything that
 * moves a skill was machine-graded. These tests are the lock on that.
 */
describe('no self-grading (evidence law)', () => {
  const rendered = BUILTIN_TEMPLATES.flatMap((t) => {
    const seeds = t.variants === 1 ? [0] : Array.from({ length: Math.min(t.variants, 8) }, (_, i) => i)
    return seeds.map((seed) => ({ t, seed, item: t.generate(seed) }))
  })

  it('no rendered item is graded by anything but the validator', () => {
    for (const { t, seed, item } of rendered) {
      const answers = item.parts?.length ? item.parts.map((p) => p.answer) : item.answer ? [item.answer] : []
      for (const a of answers) {
        // The only ungraded type permitted is `draft`, and a draft always
        // scores zero — so no answer type can yield self-assessed credit.
        if (a.type === 'draft') {
          expect(validate(a, 'a thorough, well-argued response').score, `${t.id}@${seed}`).toBe(0)
          expect(validate(a, 'a thorough, well-argued response').ok, `${t.id}@${seed}`).toBe(true)
        }
      }
    }
  })

  it('every template carrying a draft still produces graded evidence', () => {
    const withDrafts = rendered.filter(({ item }) => item.parts?.some((p) => p.answer.type === 'draft'))
    expect(withDrafts.length, 'the draft mechanism should still be in use').toBeGreaterThan(0)
    for (const { t, seed, item } of withDrafts) {
      const graded = item.parts!.filter((p) => p.answer.type !== 'draft')
      expect(graded.length, `${t.id}@${seed}: draft item must carry graded parts`).toBeGreaterThan(0)
      // and each graded part must really be checkable
      for (const [i, part] of graded.entries()) {
        const v = validate(part.answer, correctResponse(part.answer))
        expect(v.ok, `${t.id}@${seed} graded part ${i} must accept its own key`).toBe(true)
      }
    }
  })

  it('no skill can reach independence on ungraded work alone', () => {
    // Any template whose ONLY answers are drafts would be able to advance a
    // skill under a scoring rule. There must be none.
    for (const { t, seed, item } of rendered) {
      // chess / polyomino / logic-grid items carry no AnswerSpec; their own
      // players grade them against a search-verified solution.
      if (item.kind !== 'single' && item.kind !== 'multi') continue
      const answers = item.parts?.length ? item.parts.map((p) => p.answer) : item.answer ? [item.answer] : []
      expect(answers.length, `${t.id}@${seed}: item needs at least one answer`).toBeGreaterThan(0)
      expect(
        answers.every((a) => a.type === 'draft'),
        `${t.id}@${seed}: an item made only of drafts could never produce evidence`,
      ).toBe(false)
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

/**
 * Generated puzzles carry the puzzle bucket's supply, so their promises have
 * to hold across the WHOLE declared variant range, not just seed 0: every form
 * solvable, every form genuinely different, and generation fast enough to run
 * on a phone at render time.
 */
describe('generated puzzles', () => {
  const generated = BUILTIN_TEMPLATES.filter(
    (t) => t.id.includes('-gen-') && (t.kind === 'polyomino' || t.kind === 'logicgrid'),
  )

  it('exists and carries real variant supply', () => {
    expect(generated.length).toBeGreaterThanOrEqual(6)
    expect(generated.reduce((a, t) => a + t.variants, 0)).toBeGreaterThanOrEqual(200)
  })

  it('every declared variant is solvable and unique', () => {
    for (const t of generated) {
      for (let seed = 0; seed < t.variants; seed++) {
        const item = t.generate(seed)
        if (item.polyomino) {
          expect(solutionValid(item.polyomino), `${t.id}@${seed}: not solvable`).toBe(true)
          const cells = item.polyomino.pieces.reduce((a, p) => a + p.cells.length, 0)
          expect(cells, `${t.id}@${seed}: pieces must tile the region exactly`).toBe(item.polyomino.region.length)
          expect(item.polyomino.pieces.length, `${t.id}@${seed}: too few pieces`).toBeGreaterThanOrEqual(4)
        }
        if (item.logicgrid) {
          const verdict = puzzleValid(item.logicgrid)
          expect(verdict.ok, `${t.id}@${seed}: ${verdict.reason}`).toBe(true)
          expect(item.logicgrid.clues.length, `${t.id}@${seed}: too few clues`).toBeGreaterThanOrEqual(3)
        }
      }
    }
  })

  it('declared variants are actually distinct — no padded counts', () => {
    for (const t of generated) {
      const seen = new Set<string>()
      for (let seed = 0; seed < t.variants; seed++) {
        const item = t.generate(seed)
        seen.add(
          item.polyomino
            ? JSON.stringify(item.polyomino.pieces.map((p) => p.cells))
            : JSON.stringify(item.logicgrid!.clues.map((c) => c.text).sort()),
        )
      }
      // `variants` drives novelty tracking and the auto-graded-forms count, so
      // an inflated number is a quiet lie about how much material exists.
      expect(
        seen.size / t.variants,
        `${t.id}: only ${seen.size} distinct of ${t.variants} declared variants`,
      ).toBeGreaterThanOrEqual(0.95)
    }
  })

  it('generates fast enough for a phone', () => {
    const start = performance.now()
    let n = 0
    for (const t of generated) {
      for (let seed = 0; seed < t.variants; seed++) {
        t.generate(seed)
        n++
      }
    }
    const perItem = (performance.now() - start) / n
    expect(perItem, `${perItem.toFixed(1)} ms per generated puzzle`).toBeLessThan(25)
  })

  it('generated lab families deliver the variety they declare', () => {
    const labs = BUILTIN_TEMPLATES.filter(
      (t) => t.id.includes('-gen-') && t.kind !== 'polyomino' && t.kind !== 'logicgrid',
    )
    expect(labs.length, 'generated lab families should exist').toBeGreaterThanOrEqual(4)
    // Canonicalize: reshuffling the SAME options is not new content, so option
    // order is sorted away before comparing. Otherwise a generator could look
    // varied while asking one question over and over.
    const canonical = (spec: AnswerSpec | undefined): unknown => {
      if (!spec) return null
      if (spec.type === 'mcq' || spec.type === 'multi' || spec.type === 'order') return [...spec.options].sort()
      if (spec.type === 'classify') return [...spec.statements.map((s) => s.text)].sort()
      return spec
    }
    for (const t of labs) {
      const seen = new Set<string>()
      for (let seed = 0; seed < t.variants; seed++) {
        const item = t.generate(seed)
        seen.add(
          JSON.stringify([
            item.prompt,
            canonical(item.answer),
            item.parts?.map((p) => [p.prompt, p.study ?? '', canonical(p.answer)]),
          ]),
        )
      }
      expect(
        seen.size / t.variants,
        `${t.id}: only ${seen.size} distinct of ${t.variants} declared variants`,
      ).toBeGreaterThanOrEqual(0.95)
    }
  })
})

/**
 * Every graded checkpoint can fail into the corrective repair fork, so the
 * content has to be able to support a repair: something to say when the
 * learner asks for help, and a real explanation once they have finished.
 */
describe('repair loop coverage', () => {
  const multi = BUILTIN_TEMPLATES.filter((t) => t.generate(0).kind === 'multi')

  it('every graded checkpoint can explain itself after an error', () => {
    for (const t of multi) {
      const item = t.generate(0)
      for (const [i, part] of (item.parts ?? []).entries()) {
        if (part.answer.type === 'draft') continue
        expect(part.explanation.trim().length, `${t.id} part ${i}: needs a real explanation`).toBeGreaterThan(20)
        // Either its own ladder or the item's — the repair fork always offers hints.
        const ladder = part.hints?.length ? part.hints : item.hints
        expect(ladder.length, `${t.id} part ${i}: no hint ladder available`).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('the method drill scaffolds each checkpoint separately', () => {
    // Its six checkpoints are six different problems, so one shared ladder
    // could not scaffold any of them — this is the largest multi-part family.
    const drill = BUILTIN_TEMPLATES.find((t) => t.id === 'x-method-drill')
    expect(drill, 'x-method-drill should exist').toBeTruthy()
    for (const seed of [0, 3, 17, 59]) {
      const item = drill!.generate(seed)
      for (const [i, part] of item.parts!.entries()) {
        expect(part.hints?.length ?? 0, `x-method-drill@${seed} part ${i}: needs its own hints`).toBeGreaterThanOrEqual(2)
      }
      // and the ladders must differ between checkpoints, or they are not per-part
      const ladders = new Set(item.parts!.map((p) => JSON.stringify(p.hints)))
      expect(ladders.size, `x-method-drill@${seed}: per-part hints should differ`).toBeGreaterThan(1)
    }
  })
})

/**
 * ANSWERABILITY AND FAIRNESS.
 *
 * These catch defect classes that shipped undetected because the original
 * audit only asked "does the key validate?" — never "can a learner type this
 * answer?", "are two options secretly the same number?", or "could someone
 * score without reading the question?". Each rule below exists because a real
 * item failed it.
 */
describe('items are answerable and fair', () => {
  const renders = BUILTIN_TEMPLATES.flatMap((t) => {
    const seeds = Array.from({ length: Math.max(1, Math.min(t.variants, 24)) }, (_, i) => i)
    return seeds.map((seed) => ({ t, seed, item: t.generate(seed) }))
  })

  const specsOf = (item: RenderedItem): AnswerSpec[] =>
    item.parts?.length ? item.parts.map((p) => p.answer) : item.answer ? [item.answer] : []

  /** Every string a learner can actually read. */
  const visibleText = (item: RenderedItem): string[] => {
    const out = [item.prompt, item.explanation, item.title, ...item.hints]
    for (const p of item.parts ?? []) out.push(p.prompt, p.explanation, p.study ?? '', ...(p.hints ?? []))
    for (const spec of specsOf(item)) {
      if (spec.type === 'mcq' || spec.type === 'multi' || spec.type === 'order') out.push(...spec.options)
      if (spec.type === 'classify') out.push(...spec.statements.map((s) => s.text))
      if (spec.type === 'draft') out.push(spec.model, ...spec.criteria)
      if (spec.type === 'text') out.push(...spec.accept)
    }
    return out
  }

  it('never shows binary floating-point dust to the learner', () => {
    // 8+ decimals is unambiguously an artifact — it leaves real constants
    // like pi ~ 3.14159 alone. "0.3999999999999999 higher than control"
    // shipped in a studio prompt, its options, and its model report.
    const dust = /\d+\.\d{8,}/
    for (const { t, seed, item } of renders) {
      for (const text of visibleText(item)) {
        const hit = text?.match(dust)
        expect(hit?.[0], `${t.id}@${seed}: float dust "${hit?.[0]}" in visible text`).toBeUndefined()
      }
    }
  })

  it('every numeric answer can actually be typed', () => {
    for (const { t, seed, item } of renders) {
      for (const spec of specsOf(item)) {
        if (spec.type !== 'numeric') continue
        expect(Number.isFinite(spec.answer), `${t.id}@${seed}: non-finite numeric answer`).toBe(true)
        const decimals = String(spec.answer).includes('.') ? String(spec.answer).split('.')[1].length : 0
        // Without a tolerance, a repeating decimal is unanswerable: the item
        // demands a value no keyboard can produce exactly.
        if (!spec.tolerance) {
          expect(decimals, `${t.id}@${seed}: answer ${spec.answer} needs a tolerance`).toBeLessThanOrEqual(4)
        }
      }
    }
  })

  it('no two choices are secretly the same value', () => {
    const numish = (raw: string): number | null => {
      let s = raw.trim().replace(/[$,\s]/g, '')
      if (s.endsWith('%')) s = s.slice(0, -1)
      if (!s || /[a-zA-Z]/.test(s)) return null
      const frac = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/)
      if (frac) return Number(frac[2]) === 0 ? null : Number(frac[1]) / Number(frac[2])
      return /^-?\d*\.?\d+$/.test(s) ? Number(s) : null
    }
    for (const { t, seed, item } of renders) {
      for (const spec of specsOf(item)) {
        if (spec.type !== 'mcq') continue
        const vals = spec.options.map(numish)
        for (let i = 0; i < vals.length; i++) {
          for (let j = i + 1; j < vals.length; j++) {
            const a = vals[i]
            const b = vals[j]
            if (a === null || b === null) continue
            // String-distinct is not enough: "0.75" and "3/4" are one option
            // wearing two hats, and one of them is silently also correct.
            expect(
              Math.abs(a - b) > 1e-9,
              `${t.id}@${seed}: options "${spec.options[i]}" and "${spec.options[j]}" are the same value`,
            ).toBe(true)
          }
        }
      }
    }
  })

  /**
   * Identity of an answer with presentation stripped out.
   *
   * The first version of the variant check hashed the answer spec as-is, which
   * meant a RESHUFFLED OPTION LIST counted as a brand-new question — so a
   * template with three real questions could claim thirty-six variants and
   * pass. Sorting the options and naming the correct one by its text (not its
   * index) makes the key measure the question, not the ordering.
   */
  function answerIdentity(a: unknown): unknown {
    if (!a || typeof a !== 'object') return a
    const spec = a as { type?: string; options?: string[]; correct?: number | number[] }
    if (spec.type === 'mcq' && spec.options && typeof spec.correct === 'number') {
      return ['mcq', [...spec.options].sort(), spec.options[spec.correct]]
    }
    if (spec.type === 'multi' && spec.options && Array.isArray(spec.correct)) {
      return ['multi', [...spec.options].sort(), spec.correct.map((i) => spec.options![i]).sort()]
    }
    return a
  }

  it('declared variant counts are not inflated', () => {
    // `variants` drives the planner's novelty tracking, the auto-graded-forms
    // count, and every content-supply estimate. A template claiming 16 forms
    // while producing 7 is a quiet lie about how much material exists — and
    // it was true of 99 templates before this rule went in.
    let declared = 0
    let actual = 0
    for (const t of BUILTIN_TEMPLATES) {
      const n = Math.max(1, t.variants)
      const seen = new Set<string>()
      for (let seed = 0; seed < n; seed++) {
        const item = t.generate(seed)
        seen.add(
          JSON.stringify([
            item.prompt,
            answerIdentity(item.answer),
            item.parts?.map((p) => [p.prompt, p.study ?? '', answerIdentity(p.answer)]),
            item.polyomino?.pieces.map((x) => x.cells),
            item.logicgrid?.clues.map((c) => c.text),
            item.chess?.fen,
          ]),
        )
      }
      declared += n
      actual += seen.size
      // Per-template floor. Some slack is unavoidable: a generator drawing
      // parameters at random will occasionally repeat itself.
      expect(
        seen.size / n,
        `${t.id}: declares ${n} variants but produces only ${seen.size} distinct forms`,
      ).toBeGreaterThanOrEqual(0.7)
    }
    expect(actual / declared, `bank-wide: ${actual} real forms against ${declared} declared`).toBeGreaterThanOrEqual(0.9)
  })

  it('cannot be beaten by picking the longest option', () => {
    // Test-wiseness check. Correct answers are naturally the careful, hedged,
    // fully-specified ones, and distractors are naturally terse — which let a
    // learner who knew nothing score 52.8% by always choosing the longest
    // option, against a 25% guessing baseline. That corrupts "independent
    // evidence" at the source, so it is gated bank-wide.
    let mcqs = 0
    let chance = 0
    let strategyWins = 0
    for (const { item } of renders) {
      for (const spec of specsOf(item)) {
        if (spec.type !== 'mcq') continue
        mcqs++
        chance += 1 / spec.options.length
        const lens = spec.options.map((o) => o.length)
        const max = Math.max(...lens)
        if (lens.filter((l) => l === max).length === 1 && lens.indexOf(max) === spec.correct) strategyWins++
      }
    }
    const strategy = strategyWins / mcqs
    const baseline = chance / mcqs
    expect(
      strategy,
      `"always pick the longest" scores ${(strategy * 100).toFixed(1)}% against a ${(baseline * 100).toFixed(1)}% baseline — rebalance distractor lengths`,
      // Tightened from 0.45 after a rebalancing pass took the real figure from
      // 52.8% to ~30%. The floor is the ~25% guessing baseline; the gap that
      // remains is mostly items where the correct answer is genuinely the one
      // that needs a qualifying clause.
    ).toBeLessThan(0.34)
  })

  it('worked chains diagnose the step that broke', () => {
    // A chain exists to locate the failure, so every link needs a distinct
    // diagnosis and an explanation of its own. Without those the item is just
    // a longer answer box.
    let chains = 0
    for (const { t, seed, item } of renders) {
      for (const spec of specsOf(item)) {
        if (spec.type !== 'steps') continue
        chains++
        expect(spec.steps.length, `${t.id}@${seed}: a chain needs 2+ links`).toBeGreaterThanOrEqual(2)
        for (const [i, step] of spec.steps.entries()) {
          expect(step.label.trim().length, `${t.id}@${seed} step ${i}: needs a label`).toBeGreaterThan(3)
          expect(step.why.trim().length, `${t.id}@${seed} step ${i}: needs its own explanation`).toBeGreaterThan(15)
          // Each link must be independently checkable, or the diagnosis lies.
          const good = validate(step.answer, correctResponse(step.answer))
          expect(good.ok, `${t.id}@${seed} step ${i}: must accept its own key`).toBe(true)
          const bad = validate(step.answer, wrongResponse(step.answer))
          expect(bad.ok, `${t.id}@${seed} step ${i}: must reject a wrong value`).toBe(false)
        }
        // A chain whose links all blame the same thing cannot separate anything.
        const tags = new Set(spec.steps.map((st) => st.diagnoses))
        expect(tags.size, `${t.id}@${seed}: links must diagnose different errors`).toBeGreaterThan(1)
      }
    }
    expect(chains, 'the worked-chain mechanism should be in use').toBeGreaterThan(0)
  })

  it('a broken link is located at the right index', () => {
    for (const { t, seed, item } of renders) {
      for (const spec of specsOf(item)) {
        if (spec.type !== 'steps') continue
        // Break exactly one link at a time and confirm the diagnosis points there.
        for (let broken = 0; broken < spec.steps.length; broken++) {
          const submitted = serializeSteps(
            spec.steps.map((st, i) => (i === broken ? wrongResponse(st.answer) : correctResponse(st.answer))),
          )
          expect(
            firstFailedStep(spec, submitted),
            `${t.id}@${seed}: breaking step ${broken} should be reported at ${broken}`,
          ).toBe(broken)
        }
        const clean = serializeSteps(spec.steps.map((st) => correctResponse(st.answer)))
        expect(firstFailedStep(spec, clean), `${t.id}@${seed}: a correct chain reports no failure`).toBeNull()
      }
    }
  })

  it('no sentence starts in lower case where a value was interpolated', () => {
    // Templates that open a sentence with `${something}` produced text like
    // "on-time returns was 58%" and "library text reminders improves…" — a
    // lower-case start AND a subject-verb mismatch, because the interpolated
    // phrase is a plural noun the author could not see while writing.
    const badStart = /(?:^|[.!?]\s+|\n\n)([a-z][a-z-]{3,}\s+(?:was|is|were|are|has|have|improves?|causes?)\s)/
    for (const { t, seed, item } of renders) {
      for (const text of visibleText(item)) {
        if (!text) continue
        // Skip fenced code and table rows, where lower-case starts are normal.
        const prose = text.replace(/```[\s\S]*?```/g, '').replace(/^\|.*$/gm, '')
        const hit = prose.match(badStart)
        expect(
          hit?.[1],
          `${t.id}@${seed}: sentence starts lower-case — "${hit?.[1]?.slice(0, 50)}"`,
        ).toBeUndefined()
      }
    }
  })

  it('multiple choice offers a real choice', () => {
    for (const { t, seed, item } of renders) {
      for (const spec of specsOf(item)) {
        if (spec.type === 'mcq') {
          // Two options is a coin flip, which cannot distinguish knowing from guessing.
          expect(spec.options.length, `${t.id}@${seed}: mcq needs 3+ options`).toBeGreaterThanOrEqual(3)
        }
        if (spec.type === 'multi') {
          expect(spec.correct.length, `${t.id}@${seed}: multi with no correct answer`).toBeGreaterThan(0)
          expect(
            spec.correct.length,
            `${t.id}@${seed}: every option correct makes selection meaningless`,
          ).toBeLessThan(spec.options.length)
        }
      }
    }
  })
})

describe('content volume targets', () => {
  it('meets the V1 seed targets', () => {
    const academic = BUILTIN_TEMPLATES.filter((t) => ['math', 'physics', 'coding', 'science'].includes(t.bucket))
    expect(academic.length).toBeGreaterThanOrEqual(90)
    const academicSkills = SKILLS.filter((s) => ['math', 'physics', 'coding', 'science'].includes(s.bucket))
    expect(academicSkills.length).toBeGreaterThanOrEqual(40)
    // There is deliberately NO ceiling on skill count. The V1 brief named 40-60
    // as a seed target, and an upper bound was once asserted here to stop
    // breadth crowding out depth — but a raw count is a bad proxy for that.
    // What actually matters is whether each skill carries enough question
    // families for its evidence ladder to be REACHABLE, which is tested below.
    // Growing the curriculum should never require editing this file.
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

  /**
   * Breadth is only harmful when it outruns depth, so measure depth directly.
   *
   * Independent needs two distinct FORMS (`templateId:seed`), so a skill needs
   * at least two reachable variants. Transferred additionally needs a template
   * family the learner has never practiced on this skill, so a skill whose
   * every item lives in one family can never reach the top rung — its ladder is
   * structurally capped no matter how well the learner performs.
   */
  it('gives every skill a reachable evidence ladder', () => {
    const shallow: string[] = []
    const cappedAtIndependent: string[] = []
    for (const s of SKILLS) {
      const templates = DEFAULT_INDEX.bySkill.get(s.id) ?? []
      const forms = templates.reduce((a, t) => a + Math.max(1, t.variants), 0)
      if (forms < 2) shallow.push(`${s.id} (${forms} form)`)
      if (templates.length < 2) cappedAtIndependent.push(`${s.id} (${templates.length} family)`)
    }
    expect(shallow, `these skills cannot reach Independent: ${shallow.join(', ')}`).toEqual([])
    // Transfer reachability is reported as a ratio rather than an absolute:
    // a brand-new skill legitimately starts with one family, but the bank as a
    // whole must not drift toward single-family skills.
    const reach = 1 - cappedAtIndependent.length / SKILLS.length
    expect(
      reach,
      `${cappedAtIndependent.length}/${SKILLS.length} skills cannot reach Transferred: ${cappedAtIndependent.join(', ')}`,
    ).toBeGreaterThanOrEqual(0.8)
  })
})
