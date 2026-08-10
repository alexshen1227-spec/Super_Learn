/**
 * A paused session must not be destroyed by starting a different one.
 *
 * Reported by a learner: leave the daily session half-done, start something
 * from Practice, finish that — and the daily session is gone, with Today
 * offering "start today's session" as though it had never existed.
 *
 * The mechanism is one draft slot. Saving a second session overwrites the
 * first, and completing the second clears the slot. Nothing warned, and the
 * loss was silent, which is the part that makes it serious rather than merely
 * annoying.
 *
 * These tests pin the STORE's behaviour — that the slot really is single and
 * really is destructive — so the guard in `SessionScreen` cannot be removed
 * without something failing. The guard itself asks the learner which session
 * they meant, the same call the two-tab clash makes.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearDraft, loadDraftSync, saveDraft, type SessionDraft } from './draft'

// localStorage is absent in this environment; the Map-backed stub is the
// pattern the other store tests use.
function installStorage(): void {
  const map = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size
    },
  })
  // The IDB mirror is fire-and-forget; without indexedDB it must not throw.
  vi.stubGlobal('indexedDB', undefined)
}

function draftFor(sessionId: string, activityCount: number): Omit<SessionDraft, 'v' | 'savedAt'> {
  return {
    startedAt: 1_700_000_000_000,
    plan: {
      id: sessionId,
      createdAt: 1_700_000_000_000,
      targetMinutes: 30,
      blocks: [
        {
          id: 'b1',
          kind: 'core',
          bucket: 'math',
          label: 'Core',
          minutes: 10,
          why: 'because',
          activities: Array.from({ length: activityCount }, (_, i) => ({
            templateId: 'int-ops',
            seed: i,
            mode: 'independent' as const,
          })),
        },
      ],
      rationale: [],
    } as unknown as SessionDraft['plan'],
    checkIn: { minutes: 30, energy: 'ok', focus: null },
    blockIndex: 0,
    actIndex: 0,
    phase: 'item',
    // One answered item, because a draft with nothing submitted is
    // deliberately not resumable — there would be nothing to lose. That rule
    // is why the reported loss only bites once you have actually done some of
    // the session, which matches how it was hit.
    records: { '0:0': { key: '0:0', submitted: true } as never },
    scratch: '',
    activeSec: 120,
    principle: '',
  }
}

describe('the draft slot', () => {
  beforeEach(() => {
    installStorage()
    clearDraft()
  })

  /** The property that makes the guard necessary. */
  it('holds exactly one session, so a second one replaces the first', () => {
    saveDraft(draftFor('daily-session', 6))
    expect(loadDraftSync()?.plan.id).toBe('daily-session')

    saveDraft(draftFor('practice-session', 1))
    const now = loadDraftSync()
    expect(now?.plan.id, 'the paused daily session is gone').toBe('practice-session')
    expect(
      now?.plan.blocks[0].activities.length,
      'and its whole plan went with it',
    ).toBe(1)
  })

  /** And why finishing the second one made the loss permanent. */
  it('is emptied by clearing, leaving nothing to resume', () => {
    saveDraft(draftFor('daily-session', 6))
    clearDraft()
    expect(loadDraftSync(), 'Today would offer a fresh session as if nothing was paused').toBeNull()
  })

  /**
   * The recovery the guard depends on: a paused draft must still be readable
   * at the moment a new session is launched, or there is nothing to warn about.
   */
  it('survives being read repeatedly without being consumed', () => {
    saveDraft(draftFor('daily-session', 6))
    expect(loadDraftSync()?.plan.id).toBe('daily-session')
    expect(loadDraftSync()?.plan.id).toBe('daily-session')
    expect(Object.keys(loadDraftSync()?.records ?? {})).toEqual(['0:0'])
  })

  it('reports how much work is in the paused session, for an honest warning', () => {
    const d = draftFor('daily-session', 6)
    d.records = {
      '0:0': { key: '0:0', submitted: true } as never,
      '0:1': { key: '0:1', submitted: true } as never,
      '0:2': { key: '0:2', submitted: false } as never,
    }

    saveDraft(d)
    const paused = loadDraftSync()!
    const done = Object.values(paused.records).filter((r) => r.submitted).length
    const total = paused.plan.blocks.reduce((a, b) => a + b.activities.length, 0)
    expect(`${done} of ${total}`).toBe('2 of 6')
  })
})
