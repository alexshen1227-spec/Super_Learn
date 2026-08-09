import { describe, expect, it } from 'vitest'
import { BUILTIN_TEMPLATES, DEFAULT_INDEX } from '../content/registry'
import { dailyRoute, dailyTemplateScore, type TemplateCoverage } from './plannerPolicy'

const overused: TemplateCoverage = { lifetime: 20, recent: 10, daysSince: 0 }

describe('Today template coverage policy', () => {
  it('gives every built-in question an explicit route into Today', () => {
    const routes = BUILTIN_TEMPLATES.map((template) => dailyRoute(template))
    expect(routes).toHaveLength(BUILTIN_TEMPLATES.length)
    expect(routes.every((route) => ['daily-practice', 'application-day', 'readiness-probe'].includes(route))).toBe(true)
  })

  it('lets every ordinary family win once comparable peers have had their turn', () => {
    const unreachable: string[] = []
    for (const target of BUILTIN_TEMPLATES.filter((template) => dailyRoute(template) === 'daily-practice')) {
      const peers = new Map<string, typeof target>()
      for (const skillId of target.skillIds) {
        for (const peer of DEFAULT_INDEX.bySkill.get(skillId) ?? []) {
          if (dailyRoute(peer) === 'daily-practice') peers.set(peer.id, peer)
        }
      }
      const targetScore = dailyTemplateScore(target, target.difficulty, undefined)
      const beaten = [...peers.values()].some(
        (peer) => peer.id !== target.id && dailyTemplateScore(peer, target.difficulty, overused) > targetScore,
      )
      if (beaten) unreachable.push(target.id)
    }
    expect(unreachable, `coverage could never surface: ${unreachable.join(', ')}`).toEqual([])
  })
})
