/**
 * Session recovery, under storage that is corrupt, hostile or refusing.
 *
 * A dying tab must lose nothing, and a corrupt draft must never resume INTO a
 * position that does not exist — the player indexes straight into
 * `plan.blocks[blockIndex].activities[actIndex]`, so a draft that survives
 * validation with a bad position is a crash in the one place a learner would
 * least forgive it.
 *
 * `draft.test.ts` covers the happy path and a few named regressions. This adds
 * the matrix: sixteen shapes of corruption, a storage layer that throws on read
 * and on write, and the rule that anything which DOES load must point at a real
 * question in a plan whose templates still exist.
 *
 * Everything here passed on the first run. It is kept because the draft layer
 * is the only thing standing between a mid-session crash and lost work, and
 * "we checked once" is not a guarantee.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { clearDraft, loadDraftSync, saveDraft, type SessionDraft } from './draft'
import { DEFAULT_INDEX } from '../content/registry'
import type { SessionPlan } from '../domain/types'

// Node has no localStorage; a Map-backed stub, matching draft.test.ts.
const backing = new Map<string, string>()
const stub = {
  getItem: (k: string) => backing.get(k) ?? null,
  setItem: (k: string, v: string) => void backing.set(k, String(v)),
  removeItem: (k: string) => void backing.delete(k),
  clear: () => backing.clear(),
  key: (i: number) => [...backing.keys()][i] ?? null,
  get length() { return backing.size },
} as Storage
globalThis.localStorage = stub

const out: string[] = []
const check = (label: string, fn: () => string | null) => {
  try {
    const r = fn()
    if (r) out.push(`FINDING  ${label}: ${r}`)
  } catch (e) {
    out.push(`THREW    ${label}: ${String((e as Error)?.message ?? e).slice(0, 180)}`)
  }
}

const KEY = 'axiomlab.draft'

function samplePlan(): SessionPlan {
  return {
    id: 's1',
    createdAt: Date.now(),
    targetMinutes: 30,
    blocks: [
      { id: 'b1', kind: 'core', bucket: 'math', label: 'Core', minutes: 10, why: 'because', activities: [{ templateId: 'int-ops', seed: 3, mode: 'independent' }] },
    ],
    rationale: ['r'],
  }
}

function baseDraft(over: Partial<SessionDraft> = {}): Omit<SessionDraft, 'v' | 'savedAt'> {
  return {
    plan: samplePlan(),
    checkIn: { minutes: 30, energy: 'ok', focus: null },
    blockIndex: 0,
    actIndex: 0,
    phase: 'item',
    // A submitted record makes this a real mid-session draft. Without one, a
    // draft sitting on the very first item is DELIBERATELY discarded — there
    // is nothing to lose — which is asserted separately below.
    records: { 'b1:0': { key: 'b1:0', submitted: true, firstResponse: '4', hintsUsed: 0, correct: null, firstCorrect: null, score: null, confidence: null, elapsedSec: 5, errorTag: null, retryResponse: null, retryCorrect: null, eventLogged: false, extra: null } },
    scratch: '',
    principle: '',
    startedAt: Date.now(),
    activeSec: 12,
    ...over,
  } as Omit<SessionDraft, 'v' | 'savedAt'>
}

describe('a dying tab loses nothing, and a corrupt draft never resumes', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('survives corruption, hostile storage and impossible positions', () => {
    // ---- a corrupt draft must never resume, and never throw ----
    const corruptions: [string, string][] = [
      ['not JSON', '{{{'],
      ['null', 'null'],
      ['an array', '[]'],
      ['a number', '7'],
      ['empty object', '{}'],
      ['plan missing', JSON.stringify({ v: 3, savedAt: Date.now(), checkIn: { minutes: 30 } })],
      ['plan not an object', JSON.stringify({ v: 3, savedAt: Date.now(), plan: 'x' })],
      ['blocks not an array', JSON.stringify({ v: 3, savedAt: Date.now(), plan: { blocks: 'x' } })],
      ['activities missing', JSON.stringify({ v: 3, savedAt: Date.now(), plan: { id: 's', blocks: [{ id: 'b', kind: 'core' }] } })],
      ['negative indexes', JSON.stringify({ v: 3, savedAt: Date.now(), plan: samplePlan(), blockIndex: -1, actIndex: -5, checkIn: { minutes: 30, energy: 'ok', focus: null }, phase: 'item', records: {}, scratch: '', principle: '', startedAt: Date.now(), activeSec: 0 })],
      ['index past the end', JSON.stringify({ v: 3, savedAt: Date.now(), plan: samplePlan(), blockIndex: 99, actIndex: 99, checkIn: { minutes: 30, energy: 'ok', focus: null }, phase: 'item', records: {}, scratch: '', principle: '', startedAt: Date.now(), activeSec: 0 })],
      ['records is a string', JSON.stringify({ v: 3, savedAt: Date.now(), plan: samplePlan(), blockIndex: 0, actIndex: 0, checkIn: { minutes: 30, energy: 'ok', focus: null }, phase: 'item', records: 'nope', scratch: '', principle: '', startedAt: Date.now(), activeSec: 0 })],
      ['unknown phase', JSON.stringify({ v: 3, savedAt: Date.now(), plan: samplePlan(), blockIndex: 0, actIndex: 0, checkIn: { minutes: 30, energy: 'ok', focus: null }, phase: 'wat', records: {}, scratch: '', principle: '', startedAt: Date.now(), activeSec: 0 })],
      ['NaN activeSec', JSON.stringify({ v: 3, savedAt: Date.now(), plan: samplePlan(), blockIndex: 0, actIndex: 0, checkIn: { minutes: 30, energy: 'ok', focus: null }, phase: 'item', records: {}, scratch: '', principle: '', startedAt: Date.now(), activeSec: null })],
      ['far-future savedAt', JSON.stringify({ v: 3, savedAt: Date.now() + 1e12, plan: samplePlan(), blockIndex: 0, actIndex: 0, checkIn: { minutes: 30, energy: 'ok', focus: null }, phase: 'item', records: {}, scratch: '', principle: '', startedAt: Date.now(), activeSec: 0 })],
      ['huge scratch', JSON.stringify({ v: 3, savedAt: Date.now(), plan: samplePlan(), blockIndex: 0, actIndex: 0, checkIn: { minutes: 30, energy: 'ok', focus: null }, phase: 'item', records: {}, scratch: 'x'.repeat(500_000), principle: '', startedAt: Date.now(), activeSec: 0 })],
    ]
    for (const [label, raw] of corruptions) {
      check(`load ${label}`, () => {
        localStorage.setItem(KEY, raw)
        const d = loadDraftSync()
        if (d === null) return null // rejecting is correct
        // If it accepted, the position must be inside the plan it carries.
        const block = d.plan?.blocks?.[d.blockIndex]
        if (!block) return `resumed at block ${d.blockIndex} which does not exist`
        if (!block.activities?.[d.actIndex]) return `resumed at activity ${d.actIndex} of block ${d.blockIndex} which does not exist`
        if (!Number.isFinite(d.activeSec) || d.activeSec < 0) return `activeSec ${d.activeSec}`
        for (const a of d.plan.blocks.flatMap((b) => b.activities)) {
          if (!DEFAULT_INDEX.templates.has(a.templateId)) return `resumed a plan referencing unknown template ${a.templateId}`
        }
        return null
      })
    }

    // ---- a good draft must survive exactly ----
    check('a valid draft round-trips with its position intact', () => {
      localStorage.clear()
      saveDraft(baseDraft({ scratch: 'my working', activeSec: 99 }))
      const d = loadDraftSync()
      if (!d) return 'a valid draft failed to load'
      if (d.scratch !== 'my working') return `scratch lost: ${JSON.stringify(d.scratch).slice(0, 40)}`
      if (d.activeSec !== 99) return `activeSec became ${d.activeSec}`
      if (d.plan.blocks[0].activities[0].seed !== 3) return 'the exact question was not preserved'
      return null
    })

    // ---- a finished session is a ghost and must never come back ----
    check('a summary-phase draft never resumes', () => {
      localStorage.clear()
      saveDraft(baseDraft({ phase: 'summary' }))
      return loadDraftSync() === null ? null : 'a finished session was offered for resume'
    })

    // ---- storage refusing to write must not take the session down ----
    check('a full or blocked localStorage does not throw on write', () => {
      const original = stub.setItem
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(stub as any).setItem = () => { throw new Error('QuotaExceededError') }
      try {
        saveDraft(baseDraft())
        return null
      } finally {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(stub as any).setItem = original
      }
    })

    check('a blocked localStorage read does not throw', () => {
      const original = stub.getItem
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(stub as any).getItem = () => { throw new Error('SecurityError') }
      try {
        loadDraftSync()
        return null
      } finally {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(stub as any).getItem = original
      }
    })

    check('clearDraft is safe when there is nothing to clear', () => {
      localStorage.clear()
      clearDraft()
      return loadDraftSync() === null ? null : 'something survived clearDraft'
    })

    check('a just-opened session with nothing answered is not offered', () => {
      localStorage.clear()
      saveDraft(baseDraft({ records: {} }))
      return loadDraftSync() === null ? null : 'an empty just-opened session was offered for resume'
    })

    expect(out, `session-recovery findings:\n${out.join('\n')}`).toEqual([])
  })
})
