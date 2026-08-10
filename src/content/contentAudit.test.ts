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
import { DIFFICULTY_INFO } from './difficulty'
import { MATH_TRACKS, TRACK_BY_ID } from './tracks'
import { formsRequired, STATE_LABEL } from '../engine/mastery'
import { dailyRoute } from '../engine/plannerPolicy'
import { isPflTemplate } from '../engine/pflId'
import { KB_BY_SKILL } from './kb'
import { correctResponse, firstFailedStep, serializeSteps, validate, wrongResponse } from '../engine/validate'
import { matingMoves, movesKeepingMate } from '../engine/chessTools'
import { puzzleValid } from '../engine/logicGrid'
import { solutionValid } from '../engine/polyomino'
import { clippedMarks, overlappingDots, overlappingLabels } from '../engine/plotGeometry'
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

  /**
   * The renderer is markdown-LITE, and it fails silently.
   *
   * `ui/richtext.tsx` parses exactly: **bold**, `code`, fenced blocks, tables,
   * > quotes, blank-line paragraphs, and simple "1." / "-" lists. Anything
   * else is emitted as literal characters, so a prompt written with
   * `_emphasis_` shows the learner the underscores. Caught in the browser
   * rather than by any test: a new item read
   * "_(Just read the table — no calculation beyond finding the right cell.)_".
   *
   * Deliberately narrow, to stay free of false positives: `*single asterisks*`
   * are not flagged because arithmetic legitimately uses `*`, and underscores
   * inside code spans and fenced blocks are stripped before matching because
   * identifiers like `MATH_TEMPLATES` are not emphasis.
   */
  it('uses no markup the renderer cannot render', () => {
    const stripCode = (s: string): string => s.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '')
    const offenders: string[] = []
    for (const { t, seed, item } of renders) {
      for (const raw of visibleText(item)) {
        const text = stripCode(raw ?? '')
        // Word-boundary rule, as real markdown uses: `log_b(y)` is subscript
        // notation and renders correctly as literal text, while ` _phrase_ `
        // is someone reaching for emphasis the renderer does not have.
        const italic = text.match(/(^|[\s("'])_[^_\s][^_]{0,120}_(?=[\s.,!?;:)"']|$)/)
        if (italic) offenders.push(`${t.id}@${seed}: underscore emphasis "${italic[0].trim().slice(0, 44)}"`)
        const star = text.match(/(^|[\s("'])\*[^*\s][^*]{0,120}\*(?=[\s.,!?;:)"']|$)/)
        if (star) offenders.push(`${t.id}@${seed}: single-asterisk emphasis "${star[0].trim().slice(0, 44)}"`)
        const link = text.match(/\[[^\]]{1,60}\]\([^)]{1,120}\)/)
        if (link) offenders.push(`${t.id}@${seed}: markdown link "${link[0].slice(0, 48)}"`)
        const heading = text.match(/(^|\n)#{1,6}\s+\S/)
        if (heading) offenders.push(`${t.id}@${seed}: markdown heading`)
      }
    }
    // Deduped by template: one generator produces the same fault on every
    // seed, and a list of forty identical lines hides how many families are
    // actually affected.
    const byTemplate = [...new Map(offenders.map((o) => [o.split('@')[0], o])).values()]
    expect(byTemplate, `unsupported markup reaches the learner: ${byTemplate.join(' | ')}`).toEqual([])
  })

  /**
   * Observer and Human Insight must train DISCERNMENT, not suspicion.
   *
   * Measured before this gate: of 55 families in those two buckets, exactly
   * ONE ever had "nothing is wrong here" as the correct answer. Everywhere
   * else the right answer was that something WAS an inference or a pressure
   * tactic — so a learner who answered "suspicious" every single time would
   * have scored close to full marks without holding the skill at all.
   *
   * The misinformation-assessment literature names this failure directly
   * (RESEARCH.md §29f): scoring only the rejection of bad content confounds
   * genuine skill with blanket scepticism, and the standard is to mix true and
   * false items. It matters more here than anywhere else in the app — a
   * teenager taught to read every direct request as manipulation has not been
   * made safer, and a detector that fires on everything carries no information.
   *
   * The floor is deliberately low (a handful of families, not a ratio) because
   * plenty of Observer work — scene recall, choosing the best question — has no
   * "nothing is wrong" shape at all and should not be forced into one. What it
   * forbids is the state this was in: zero.
   */
  it('Observer and Insight let "nothing is wrong" be the right answer', () => {
    // The authoring convention for a benign key: it opens with "Nothing", or
    // says plainly that what is described is ordinary or fine. Matching a
    // convention rather than a vibe stops the gate passing on a stray word in
    // some unrelated option.
    const BENIGN = /^nothing\b|nothing is wrong|\bordinary\b|stays inside what the scene|perfectly (normal|fine)|no pressure|is fine\b/i
    for (const bucket of ['observer', 'insight'] as const) {
      const families = BUILTIN_TEMPLATES.filter((t) => t.bucket === bucket)
      const withBenignKey = families.filter((t) =>
        [0, 1, 2, 3, 5, 8].some((seed) => {
          let item: RenderedItem
          try {
            item = t.generate(seed)
          } catch {
            return false
          }
          const specs = item.parts?.length ? item.parts.map((p) => p.answer) : item.answer ? [item.answer] : []
          return specs.some((s) => {
            if (s.type === 'mcq') return BENIGN.test(s.options[s.correct])
            if (s.type === 'text') return s.accept.some((a) => BENIGN.test(a))
            return false
          })
        }),
      )
      expect(
        withBenignKey.length,
        `${bucket}: ${withBenignKey.length} of ${families.length} families can ever answer "nothing is wrong". ` +
          `At zero, answering "suspicious" every time scores full marks.`,
      ).toBeGreaterThanOrEqual(2)
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

  /**
   * A transfer item may not tell the learner which principle to apply.
   *
   * Detterman's standard (Transfer on Trial, 1993): transfer has to be
   * spontaneous — an experiment that hints which principle applies measures
   * application, not transfer. Four templates violated this, all of them the
   * `bridge-*-spot` family, which opened "The pattern: X" and then asked the
   * learner to find an instance while carrying `transfer: true`. They could
   * therefore grant the app's top rung for cued application.
   *
   * This is a release gate rather than a comment because the failure mode is
   * so easy to reintroduce: naming the principle makes an item easier to write
   * AND easier to answer, so it is exactly what a hurried author reaches for.
   */
  it('no transfer item names the principle it is testing', () => {
    const CUES = [/\bthe pattern:/i, /\busing the (idea|principle|rule) (of|that)\b/i, /\bapply (the|this) (idea|principle|rule)\b/i]
    const offenders: string[] = []
    for (const t of BUILTIN_TEMPLATES) {
      if (!t.transfer) continue
      for (let seed = 0; seed < Math.min(3, Math.max(1, t.variants)); seed++) {
        const prompt = t.generate(seed).prompt ?? ''
        if (CUES.some((re) => re.test(prompt))) {
          offenders.push(`${t.id}@${seed}`)
          break
        }
      }
    }
    expect(
      offenders,
      `these carry transfer:true but name the principle in the prompt, which is cued application: ${offenders.join(', ')}`,
    ).toEqual([])
  })

  it('declared variant counts are not inflated', () => {
    // `variants` drives the planner's novelty tracking, the auto-graded-forms
    // count, and every content-supply estimate. A template claiming 16 forms
    // while producing 7 is a quiet lie about how much material exists — and
    // it was true of 99 templates before this rule went in.
    let declared = 0
    let actual = 0
    const inflated: string[] = []
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
      if (seen.size / n < 0.7) inflated.push(`${t.id} (${seen.size}/${n})`)
    }
    expect(inflated, `inflated variant declarations: ${inflated.join(', ')}`).toEqual([])
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
   * Independent needs distinct template FAMILIES: two for ordinary skills and
   * three for the four Paths. Randomised variants of one generator do not add
   * a family. Transfer additionally needs a planner-reachable transfer task;
   * where that does not exist yet, the UI states Retained as the honest ceiling.
   */
  it('gives every skill a reachable evidence ladder', () => {
    const shallow: string[] = []
    const withoutTransferRoute: string[] = []
    for (const s of SKILLS) {
      const templates = DEFAULT_INDEX.bySkill.get(s.id) ?? []
      const required = formsRequired(s.bucket)
      if (templates.length < required) shallow.push(`${s.id} (${templates.length}/${required} families)`)
      if (!templates.some((template) => template.transfer)) withoutTransferRoute.push(s.id)
    }
    expect(shallow, `these skills cannot reach Independent: ${shallow.join(', ')}`).toEqual([])
    // Transfer coverage is still a bank-health ratio rather than an overclaim
    // that every current skill supports the top rung. `nextProofForSkill`
    // exposes the per-skill ceiling, while this floor prevents coverage drift.
    const reach = 1 - withoutTransferRoute.length / SKILLS.length
    expect(
      reach,
      `${withoutTransferRoute.length}/${SKILLS.length} skills have no transfer route: ${withoutTransferRoute.join(', ')}`,
    ).toBeGreaterThanOrEqual(0.65)
  })

  /**
   * The ladder must be reachable through the block the learner actually gets.
   *
   * The check above counts EVERY template attached to a skill. The planner's
   * ordinary pools do not: `pickTemplates` drops authentic work (it has its own
   * application-day route) and PFL probes (deliberately one-time). So a skill
   * whose second family was a 14-minute case file passed the audit while being
   * unpromotable in daily practice — the learner could work at it every day
   * forever and never reach Independent.
   *
   * That is not hypothetical. `m-data`, `s-graphs` and `i-forecast` were all in
   * this state, and because an unpromotable skill keeps the `guided` frontier
   * bonus permanently, `m-data` won the core block on 228 of 365 simulated days
   * and its single family was served 611 times — about a fifth of the learner's
   * whole year. A skill that cannot graduate does not merely stall; it captures
   * the plan.
   *
   * Same rule as above, applied to the pool the daily plan can really see.
   */
  it('every skill can reach Independent through ordinary daily practice', () => {
    const dailyPool = new Map<string, number>()
    for (const t of BUILTIN_TEMPLATES) {
      if (dailyRoute(t) !== 'daily-practice') continue
      if (isPflTemplate(t.id)) continue
      for (const id of t.skillIds) dailyPool.set(id, (dailyPool.get(id) ?? 0) + 1)
    }
    const unpromotable: string[] = []
    for (const s of SKILLS) {
      const required = formsRequired(s.bucket)
      const have = dailyPool.get(s.id) ?? 0
      if (have < required) unpromotable.push(`${s.id} (${have}/${required} daily families)`)
    }
    expect(
      unpromotable,
      `these skills can never reach Independent from a daily block: ${unpromotable.join(', ')}`,
    ).toEqual([])
  })

  /**
   * Every skill needs a way IN.
   *
   * The difficulty dial can ask for 1★, but it can only be answered by content
   * that exists. Measured before this gate: 44 of 122 skills offered nothing
   * easier than 3★ ("combine ideas without scaffolding, or choose the method
   * yourself") and 14 started at 4★ — so on those skills the first thing a
   * learner ever met was an advanced problem.
   *
   * The consequence was measured, not assumed. Simulating a learner whose
   * accuracy responds to difficulty: a struggling learner sat at 14-19%
   * first-try accuracy for twelve straight months while `stretchSignal` asked
   * for its maximum easing every month, and the mean difficulty actually served
   * ROSE from 2.6 to 2.9. The dial was hard over with nowhere to go.
   *
   * The ceiling is 2★: every skill offers a Foundation or Routine task a
   * learner can actually start from. Lowering it further is fine; raising it
   * is not, and would mean a skill somewhere has lost its way in.
   */
  it('every skill has an entry point a struggling learner can reach', () => {
    const easiest = new Map<string, number>()
    for (const t of BUILTIN_TEMPLATES) {
      if (dailyRoute(t) !== 'daily-practice') continue
      if (isPflTemplate(t.id)) continue
      for (const id of t.skillIds) easiest.set(id, Math.min(easiest.get(id) ?? 99, t.difficulty))
    }
    // Lowered from 3 to 2 once `onRampsB.ts` closed the last thirty skills.
    // 3★ is "combine ideas without scaffolding", which is the rung AFTER the
    // one a learner meeting an idea for the first time needs.
    const ENTRY_CEILING = 2
    const unreachable = SKILLS.filter((s) => (easiest.get(s.id) ?? 99) > ENTRY_CEILING).map(
      (s) => `${s.id} (easiest ${easiest.get(s.id) ?? '—'}★)`,
    )
    expect(
      unreachable,
      `these skills have no entry task at ${ENTRY_CEILING}★ or below: ${unreachable.join(', ')}`,
    ).toEqual([])
  })
})

/**
 * Difficulty tiers name the TASK; evidence rungs name what the learner PROVED.
 * When the two scales shared words ("Guided", "Independent"), a hinted 3-star
 * problem displayed the word "Independent" — the exact claim this app exists to
 * refuse. They must stay disjoint.
 */
describe('the difficulty scale and the evidence ladder do not share vocabulary', () => {
  it('no difficulty tier is named after an evidence rung', () => {
    const rungs = new Set(Object.values(STATE_LABEL).map((s) => s.toLowerCase()))
    for (const [level, info] of Object.entries(DIFFICULTY_INFO)) {
      expect(
        rungs.has(info.name.toLowerCase()),
        `difficulty ${level} is named "${info.name}", which is also an evidence rung`,
      ).toBe(false)
    }
  })
})

/**
 * Math tracks are course maps: every skill they name must exist, be math, and
 * be reachable content; broken pointers here would silently hollow out the
 * course-progress readout and the planner tilt.
 */
describe('math tracks resolve against the tree', () => {
  it('every track skill exists, is math, and has content', () => {
    for (const track of MATH_TRACKS) {
      for (const unit of track.units) {
        expect(unit.skillIds.length, `${track.id}/${unit.name}: empty unit`).toBeGreaterThan(0)
        for (const sid of unit.skillIds) {
          const skill = SKILL_BY_ID.get(sid)
          expect(skill, `${track.id}/${unit.name}: unknown skill ${sid}`).toBeTruthy()
          expect(skill!.bucket, `${track.id}: ${sid} is not a math skill`).toBe('math')
          const items = BUILTIN_TEMPLATES.filter((t) => t.skillIds.includes(sid))
          expect(items.length, `${track.id}: ${sid} has no content`).toBeGreaterThan(0)
        }
      }
    }
  })

  it('next pointers resolve and do not cycle', () => {
    for (const track of MATH_TRACKS) {
      const seen = new Set<string>([track.id])
      let cur = track.next
      while (cur) {
        expect(TRACK_BY_ID.has(cur), `${track.id}: next points at unknown track ${cur}`).toBe(true)
        expect(seen.has(cur), `${track.id}: next chain cycles at ${cur}`).toBe(false)
        seen.add(cur)
        cur = TRACK_BY_ID.get(cur)!.next
      }
    }
  })

  it('track ids are unique', () => {
    expect(new Set(MATH_TRACKS.map((t) => t.id)).size).toBe(MATH_TRACKS.length)
  })
})

/**
 * NO TEST-WISE SHORTCUT.
 *
 * Measured 2026-08-09: the correct option was UNIQUELY the longest in 39.8% of
 * multiple-choice checkpoints against a 25.3% chance baseline — a learner who
 * always picked the longest option would have scored ~40% without reading, and
 * the app would have banked that as independent evidence. Nothing looked wrong
 * in the code or on screen; the bias came from a writing habit where the right
 * answer carries its qualifier and the distractors stay terse.
 *
 * This caps it PER TEMPLATE, which is where the habit lives and where it is
 * fixable. Sometimes the true answer genuinely needs more words, so the bar is
 * not zero — but a template that does it every single time is cueing.
 */
describe('multiple choice does not leak the answer through option length', () => {
  const SAMPLE_SEEDS = 8
  /**
   * A length cue is only exploitable if a learner can SEE it. Being longest by
   * three characters is invisible; being longest by half again is a billboard.
   * So "cued" means longest by at least this margin over the runner-up.
   *
   * Measured 2026-08-09 (and the first attempt at this measurement was wrong,
   * which is why the margin exists): counting ANY length lead put the exploit
   * at 38.2% against a 25.3% chance baseline and looked alarming. At a 25%
   * margin the exploit scores 25.0% — chance exactly. The genuine excess sits
   * around five points at a 15% margin, which is what this gate holds.
   */
  const CUE_MARGIN = 0.15
  const MAX_GLOBAL_SHARE = 0.32

  it('a learner picking the longest option cannot score far above chance', () => {
    let n = 0
    let hits = 0
    let chance = 0
    const perTemplate = new Map<string, { n: number; hits: number }>()
    for (const t of BUILTIN_TEMPLATES) {
      for (let seed = 0; seed < Math.min(SAMPLE_SEEDS, Math.max(1, t.variants)); seed++) {
        let item
        try {
          item = t.generate(seed)
        } catch {
          continue
        }
        for (const part of item.parts ?? [{ answer: item.answer }]) {
          const a = part.answer ?? item.answer
          if (!a || a.type !== 'mcq' || a.options.length < 3) continue
          n++
          chance += 1 / a.options.length
          const lens = a.options.map((o) => o.length)
          const runnerUp = Math.max(...lens.filter((_, i) => i !== a.correct))
          const cued = lens[a.correct] > runnerUp * (1 + CUE_MARGIN)
          if (cued) hits++
          const e = perTemplate.get(t.id) ?? { n: 0, hits: 0 }
          e.n++
          if (cued) e.hits++
          perTemplate.set(t.id, e)
        }
      }
    }
    const share = hits / n
    const worst = [...perTemplate.entries()]
      .map(([id, e]) => ({ id, excess: e.hits - e.n / 4 }))
      .sort((a, b) => b.excess - a.excess)
      .slice(0, 8)
      .map((x) => x.id)
      .join(', ')
    expect(
      share,
      `longest-option shortcut scores ${(100 * share).toFixed(1)}% (chance ${((100 * chance) / n).toFixed(1)}%). Worst offenders: ${worst}`,
    ).toBeLessThanOrEqual(MAX_GLOBAL_SHARE)
  })
})

/**
 * MANIPULABLE DIAGRAMS.
 *
 * A diagram the learner drags is the only content in the app whose *frames*
 * can be wrong while its *answer* is right, so the ordinary answer checks say
 * nothing about it. These gates cover the ways a slider lies:
 *
 *  - a point outside the plot box, which the renderer would clamp and thereby
 *    draw a straight line as a bent one;
 *  - axes that rescale between stops, which makes a growing rectangle appear
 *    not to grow — the most misleading thing an interactive graph can do, and
 *    easy to introduce by accident;
 *  - two stops that draw the same picture, so dragging does nothing;
 *  - a caption that hands over the answer, turning manipulation back into
 *    reading;
 *  - and the evidence law: exploring is a study phase, so it must be attached
 *    to a graded checkpoint and followed by one that has no diagram at all.
 */
describe('manipulable diagrams', () => {
  const withExplore = BUILTIN_TEMPLATES.filter((t) =>
    Array.from({ length: Math.max(1, t.variants) }, (_, s) => t.generate(s)).some((r) =>
      (r.parts ?? []).some((p) => p.explore),
    ),
  )

  it('there is at least one, and it is registered like any other template', () => {
    expect(withExplore.length).toBeGreaterThanOrEqual(3)
  })

  it('every frame the learner can reach is drawable and inside its own axes', () => {
    for (const t of withExplore) {
      for (let seed = 0; seed < Math.max(1, t.variants); seed++) {
        const item = t.generate(seed)
        for (const [pi, p] of (item.parts ?? []).entries()) {
          if (!p.explore) continue
          const where = `${t.id} seed ${seed} part ${pi}`
          const spec = p.explore
          expect(spec.stops.length, `${where}: a slider needs at least 3 positions`).toBeGreaterThanOrEqual(3)
          expect(Number.isInteger(spec.initial), `${where}: initial must be an index`).toBe(true)
          expect(spec.initial, `${where}: initial out of range`).toBeGreaterThanOrEqual(0)
          expect(spec.initial, `${where}: initial out of range`).toBeLessThan(spec.stops.length)
          expect(spec.label.length, `${where}: the control needs a label`).toBeGreaterThan(2)
          expect(spec.invitation.length, `${where}: say what to try`).toBeGreaterThan(10)

          for (const [si, stop] of spec.stops.entries()) {
            const at = `${where} stop ${si}`
            const pl = stop.plot
            expect(stop.value.length, `${at}: needs a readable value`).toBeGreaterThan(0)
            expect(stop.caption.length, `${at}: needs a caption`).toBeGreaterThan(4)
            for (const n of [pl.xMin, pl.xMax, pl.yMin, pl.yMax]) {
              expect(Number.isFinite(n), `${at}: non-finite axis bound`).toBe(true)
            }
            expect(pl.xMax, `${at}: x axis has no width`).toBeGreaterThan(pl.xMin)
            expect(pl.yMax, `${at}: y axis has no height`).toBeGreaterThan(pl.yMin)

            const EPS = 1e-6
            for (const s of pl.series) {
              expect(s.points.length, `${at}: series "${s.label}" has nothing to draw`).toBeGreaterThanOrEqual(2)
              for (const [x, y] of s.points) {
                expect(Number.isFinite(x) && Number.isFinite(y), `${at}: non-finite point`).toBe(true)
                expect(
                  x >= pl.xMin - EPS && x <= pl.xMax + EPS && y >= pl.yMin - EPS && y <= pl.yMax + EPS,
                  `${at}: point (${x}, ${y}) falls outside the box — clip it in the generator, or the renderer draws a bend that is not in the function`,
                ).toBe(true)
              }
            }
            if (pl.rect) {
              const rc = pl.rect
              expect(rc.w, `${at}: rect has no width`).toBeGreaterThan(0)
              expect(rc.h, `${at}: rect has no height`).toBeGreaterThan(0)
              expect(
                rc.x >= pl.xMin - EPS &&
                  rc.x + rc.w <= pl.xMax + EPS &&
                  rc.y >= pl.yMin - EPS &&
                  rc.y + rc.h <= pl.yMax + EPS,
                `${at}: rect escapes the box`,
              ).toBe(true)
            }
            for (const d of pl.dots ?? []) {
              expect(Number.isFinite(d.x) && Number.isFinite(d.y), `${at}: non-finite dot`).toBe(true)
              expect(
                d.x >= pl.xMin - EPS && d.x <= pl.xMax + EPS && d.y >= pl.yMin - EPS && d.y <= pl.yMax + EPS,
                `${at}: dot (${d.x}, ${d.y}) falls outside the box and would be drawn over the axes`,
              ).toBe(true)
            }
            for (const ci of pl.circles ?? []) {
              expect(
                Number.isFinite(ci.cx) && Number.isFinite(ci.cy) && Number.isFinite(ci.r),
                `${at}: non-finite circle`,
              ).toBe(true)
              expect(ci.r, `${at}: a circle needs a positive radius`).toBeGreaterThan(0)
              expect(
                ci.cx - ci.r >= pl.xMin - EPS &&
                  ci.cx + ci.r >= pl.xMin - EPS &&
                  ci.cx + ci.r <= pl.xMax + EPS &&
                  ci.cy - ci.r >= pl.yMin - EPS &&
                  ci.cy + ci.r <= pl.yMax + EPS,
                `${at}: circle escapes the box and would be clipped by the frame`,
              ).toBe(true)
              // A circle drawn on stretched axes is an ellipse, which quietly
              // contradicts any item whose lesson is that circles are round.
              expect(pl.aspectSquare, `${at}: a plot with circles must set aspectSquare`).toBe(true)
            }
            for (const mk of pl.marks ?? []) {
              expect(Number.isFinite(mk.x), `${at}: non-finite marker`).toBe(true)
              expect(mk.label.length, `${at}: an unlabelled marker is a mystery line`).toBeGreaterThan(0)
              expect(
                mk.x >= pl.xMin - EPS && mk.x <= pl.xMax + EPS,
                `${at}: marker "${mk.label}" at ${mk.x} sits outside the box`,
              ).toBe(true)
            }
          }
        }
      }
    }
  })

  /**
   * Bounds are a fact about DATA; overlap is a fact about PIXELS. A dot plot
   * shipped in this bank passing every bounds assertion — seven dots, finite,
   * inside the box — while the rendered picture showed six, two values having
   * landed on the same point under a caption reading "seven values". Nothing
   * written over the data model could have seen it, so this gate projects
   * through the renderer's own layout (`engine/plotGeometry`) and checks the
   * screen positions.
   */
  it('no two dots are drawn on top of each other, and no marker label leaves the frame', () => {
    for (const t of withExplore) {
      for (let seed = 0; seed < Math.max(1, t.variants); seed++) {
        for (const p of t.generate(seed).parts ?? []) {
          if (!p.explore) continue
          for (const [si, stop] of p.explore.stops.entries()) {
            const at = `${t.id} seed ${seed} stop ${si}`
            const hidden = overlappingDots(stop.plot)
            expect(
              hidden,
              `${at}: ${hidden.length} pair(s) of dots drawn on top of each other — the chart shows fewer values than it has`,
            ).toEqual([])
            expect(clippedMarks(stop.plot), `${at}: a marker label runs off the frame`).toEqual([])
            expect(
              overlappingLabels(stop.plot),
              `${at}: text printed on top of other text`,
            ).toEqual([])
          }
        }
      }
    }
  })

  it('the axes never move while the learner drags', () => {
    for (const t of withExplore) {
      for (let seed = 0; seed < Math.max(1, t.variants); seed++) {
        for (const p of t.generate(seed).parts ?? []) {
          if (!p.explore) continue
          const boxes = new Set(
            p.explore.stops.map((s) => `${s.plot.xMin},${s.plot.xMax},${s.plot.yMin},${s.plot.yMax}`),
          )
          expect(
            boxes.size,
            `${t.id} seed ${seed}: the axes change between stops (${[...boxes].join(' | ')}). A grid that rescales with the drawing hides the very change the learner is meant to see`,
          ).toBe(1)
        }
      }
    }
  })

  it('every stop draws something different, and says something different', () => {
    for (const t of withExplore) {
      for (let seed = 0; seed < Math.max(1, t.variants); seed++) {
        for (const p of t.generate(seed).parts ?? []) {
          if (!p.explore) continue
          const stops = p.explore.stops
          const drawings = stops.map((s) =>
            JSON.stringify([
              s.plot.series,
              s.plot.rect ?? null,
              s.plot.dots ?? null,
              s.plot.marks ?? null,
              s.plot.circles ?? null,
            ]),
          )
          expect(
            new Set(drawings).size,
            `${t.id} seed ${seed}: two positions of the slider draw an identical picture`,
          ).toBe(stops.length)
          expect(new Set(stops.map((s) => s.value)).size, `${t.id} seed ${seed}: duplicate stop labels`).toBe(
            stops.length,
          )
          expect(new Set(stops.map((s) => s.caption)).size, `${t.id} seed ${seed}: duplicate captions`).toBe(
            stops.length,
          )
        }
      }
    }
  })

  it('no caption hands over the answer to its own question', () => {
    for (const t of withExplore) {
      for (let seed = 0; seed < Math.max(1, t.variants); seed++) {
        for (const p of t.generate(seed).parts ?? []) {
          if (!p.explore || p.answer.type !== 'mcq') continue
          const correct = p.answer.options[p.answer.correct].toLowerCase()
          // Compare on content words: an accidental shared "the" is not a leak.
          const key = correct.split(/\W+/).filter((w) => w.length > 4)
          for (const stop of p.explore.stops) {
            const cap = stop.caption.toLowerCase()
            const hits = key.filter((w) => cap.includes(w))
            expect(
              hits.length,
              `${t.id} seed ${seed}: caption "${stop.caption}" repeats ${hits.join('/')} from the correct option — describe the state, not the conclusion`,
            ).toBeLessThan(Math.max(2, Math.ceil(key.length / 2)))
          }
        }
      }
    }
  })

  it('exploring earns nothing on its own, and is always followed by a question without a diagram', () => {
    for (const t of withExplore) {
      for (let seed = 0; seed < Math.max(1, t.variants); seed++) {
        const parts = t.generate(seed).parts ?? []
        const exploreAt = parts.findIndex((p) => p.explore)
        expect(exploreAt, `${t.id}: explore must live on a part`).toBeGreaterThanOrEqual(0)
        // The diagram is a study phase bolted to a graded checkpoint, exactly
        // like a scene description. It cannot be a checkpoint by itself.
        expect(
          parts[exploreAt].answer.type,
          `${t.id}: the exploring part must still be graded — a draft would make the whole activity evidence-free`,
        ).not.toBe('draft')
        expect(
          parts.length,
          `${t.id}: needs a second checkpoint so the learner is tested away from the picture`,
        ).toBeGreaterThanOrEqual(2)
        expect(
          parts.slice(exploreAt + 1).some((p) => !p.explore),
          `${t.id}: every later checkpoint still has a diagram — nothing tests whether the intuition survives without it`,
        ).toBe(true)
      }
    }
  })
})
