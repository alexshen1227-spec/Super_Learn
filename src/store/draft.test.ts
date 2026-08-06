import { beforeEach, describe, expect, it } from 'vitest'
import { clearDraft, loadDraftSync, saveDraft, type SessionDraft } from './draft'

// Node has no localStorage; a Map-backed stub is faithful for these tests.
const backing = new Map<string, string>()
globalThis.localStorage = {
  getItem: (k: string) => backing.get(k) ?? null,
  setItem: (k: string, v: string) => void backing.set(k, String(v)),
  removeItem: (k: string) => void backing.delete(k),
  clear: () => backing.clear(),
  key: (i: number) => [...backing.keys()][i] ?? null,
  get length() {
    return backing.size
  },
} as Storage

function baseDraft(over: Partial<Omit<SessionDraft, 'v' | 'savedAt'>> = {}): Omit<SessionDraft, 'v' | 'savedAt'> {
  return {
    startedAt: Date.now() - 60_000,
    plan: {
      id: 's1',
      createdAt: Date.now(),
      targetMinutes: 25,
      blocks: [
        {
          id: 'b1',
          kind: 'core',
          bucket: 'math',
          label: 'Core',
          minutes: 10,
          activities: [{ templateId: 'int-ops', seed: 1, mode: 'independent' }],
          why: 'test',
        },
      ],
      rationale: [],
    },
    checkIn: { minutes: 25, energy: 'ok', focus: null },
    blockIndex: 0,
    actIndex: 0,
    phase: 'item',
    records: {
      '0:0': {
        key: '0:0',
        hintsUsed: 0,
        firstResponse: '5',
        submitted: true,
        correct: true,
        firstCorrect: true,
        score: null,
        confidence: null,
        elapsedSec: 30,
        errorTag: null,
        retryResponse: null,
        retryCorrect: null,
        eventLogged: true,
        extra: null,
      },
    },
    scratch: '',
    activeSec: 45,
    principle: '',
    ...over,
  }
}

describe('session drafts', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  it('round-trips a mid-session draft', () => {
    saveDraft(baseDraft())
    const back = loadDraftSync()
    expect(back).not.toBeNull()
    expect(back!.records['0:0'].firstResponse).toBe('5')
    expect(back!.phase).toBe('item')
  })
  it('round-trips an exact multi-stage work checkpoint and draft', () => {
    const draft = baseDraft()
    draft.records['0:0'].extra = {
      kind: 'item-player-v1',
      partIndex: 4,
      partOutcomes: [
        { firstCorrect: true, score: 1 },
        { firstCorrect: false, score: 0 },
        { firstCorrect: true, score: 1 },
        { firstCorrect: true, score: 1 },
      ],
      phase: 'answer',
      response: 'My unfinished evidence brief keeps its exact draft.',
      rubricSelfChecked: [],
      rubricStage: 'attempt',
      firstResponse: '0',
      retryVerdictOk: null,
      confidence: null,
    }
    saveDraft(draft)
    const back = loadDraftSync()
    expect(back?.records['0:0'].extra).toMatchObject({
      kind: 'item-player-v1',
      partIndex: 4,
      response: 'My unfinished evidence brief keeps its exact draft.',
    })
  })
  it('never resumes a finished session (ghost-draft regression)', () => {
    saveDraft(baseDraft({ phase: 'summary' }))
    expect(loadDraftSync()).toBeNull()
  })
  it('drops empty just-opened sessions', () => {
    saveDraft(baseDraft({ records: {}, blockIndex: 0, actIndex: 0, phase: 'item' }))
    expect(loadDraftSync()).toBeNull()
  })
  it('drops stale drafts and clears storage', () => {
    saveDraft(baseDraft())
    const raw = JSON.parse(localStorage.getItem('axiomlab.draft')!)
    raw.savedAt = Date.now() - 20 * 3_600_000
    localStorage.setItem('axiomlab.draft', JSON.stringify(raw))
    expect(loadDraftSync()).toBeNull()
  })
  it('clearDraft removes everything', () => {
    saveDraft(baseDraft())
    clearDraft()
    expect(loadDraftSync()).toBeNull()
    expect(localStorage.getItem('axiomlab.draft')).toBeNull()
  })
})
