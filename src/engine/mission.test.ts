import { describe, expect, it } from 'vitest'
import { initialState, type Deadline } from '../domain/types'
import { DEFAULT_INDEX } from '../content/registry'
import { activeMission, missionPrerequisiteIds, missionPriority, missionReadiness } from './mission'

const NOW = Date.UTC(2026, 7, 6, 12)

function due(days: number) {
  return new Date(NOW + days * 86_400_000).toISOString().slice(0, 10)
}

describe('learning missions', () => {
  it('selects the nearest mission and exposes exact target readiness', () => {
    const state = initialState()
    const later: Deadline = { id: 'later', title: 'Later', dateISO: due(30), bucket: 'math', note: '', skillIds: ['m-quadratic'], dailyMinutes: 30 }
    const next: Deadline = { id: 'next', title: 'Growth unit', dateISO: due(12), bucket: 'math', note: '', skillIds: ['m-exponential'], dailyMinutes: 30 }
    state.deadlines = [later, next]
    expect(activeMission(state, NOW)?.id).toBe('next')
    const report = missionReadiness(next, state, DEFAULT_INDEX, new Map(), NOW)
    expect(report.targetIds).toEqual(['m-exponential'])
    expect(report.retained).toBe(0)
    expect(report.plannedMinutes).toBeGreaterThan(0)
    expect(report.nextSkillIds.length).toBeGreaterThan(0)
  })

  it('boosts both exact targets and the prerequisites that unlock them', () => {
    const state = initialState()
    const mission: Deadline = { id: 'm', title: 'Growth unit', dateISO: due(10), bucket: 'math', note: '', skillIds: ['m-exponential'], dailyMinutes: 30 }
    state.deadlines = [mission]
    const prereqs = missionPrerequisiteIds(mission, DEFAULT_INDEX)
    expect(prereqs).toContain('m-functions')
    expect(prereqs).toContain('m-exponents')
    const target = missionPriority('m-exponential', state, DEFAULT_INDEX, NOW)
    const prereq = missionPriority('m-functions', state, DEFAULT_INDEX, NOW)
    expect(target.boost).toBeGreaterThan(prereq.boost)
    expect(prereq.boost).toBeGreaterThan(0)
  })
})
