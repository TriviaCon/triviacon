import { describe, it, expect } from 'vitest'
import {
  placeGroups,
  placementRows,
  revealUnits,
  totalRevealSteps,
  revealedGroups,
  tieGroups
} from './ranking'
import type { Team } from './types/quiz'

const team = (id: string, score: number, tiebreakScore = 0): Team => ({
  id,
  name: id,
  score,
  tiebreakScore
})

describe('placeGroups', () => {
  it('returns nothing for no teams', () => {
    expect(placeGroups([])).toEqual([])
  })

  it('puts each distinct score in its own tier, best first', () => {
    const groups = placeGroups([team('a', 1), team('b', 3), team('c', 2)])
    expect(groups.map((g) => g[0].score)).toEqual([3, 2, 1])
    expect(groups.every((g) => g.length === 1)).toBe(true)
  })

  it('merges equal scores into a shared tier (dense ranking)', () => {
    const groups = placeGroups([
      team('a', 50),
      team('b', 50),
      team('c', 40),
      team('d', 25),
      team('e', 25)
    ])
    expect(groups.map((g) => g.length)).toEqual([2, 1, 2])
    expect(groups.map((g) => g[0].score)).toEqual([50, 40, 25])
  })

  it('orders within a tier by tiebreak sub-score, best first', () => {
    const groups = placeGroups([team('a', 50, 1), team('b', 50, 3), team('c', 50, 2)])
    expect(groups[0].map((t) => t.id)).toEqual(['b', 'c', 'a'])
  })
})

describe('placementRows', () => {
  const shape = (rows: ReturnType<typeof placementRows>) =>
    rows.map((r) => ({ place: r.place, teams: r.teams.map((t) => t.id), tiebroken: r.tiebroken }))

  it('gives each distinct score its own place', () => {
    expect(shape(placementRows([team('a', 50), team('b', 40), team('c', 25)]))).toEqual([
      { place: 1, teams: ['a'], tiebroken: false },
      { place: 2, teams: ['b'], tiebroken: false },
      { place: 3, teams: ['c'], tiebroken: false }
    ])
  })

  it('shares a row for an unresolved tie (equal sub-scores)', () => {
    expect(shape(placementRows([team('a', 50), team('b', 40), team('c', 40)]))).toEqual([
      { place: 1, teams: ['a'], tiebroken: false },
      { place: 2, teams: ['b', 'c'], tiebroken: false }
    ])
  })

  it('splits a resolved podium tie into distinct places, pushing lower teams down', () => {
    expect(
      shape(placementRows([team('a', 50), team('b', 40, 1), team('c', 40, 0), team('d', 25)]))
    ).toEqual([
      { place: 1, teams: ['a'], tiebroken: false },
      { place: 2, teams: ['b'], tiebroken: true },
      { place: 3, teams: ['c'], tiebroken: true },
      { place: 4, teams: ['d'], tiebroken: false }
    ])
  })

  it('splits a tie for first — the tiebreaker crowns a single winner', () => {
    expect(shape(placementRows([team('a', 50, 2), team('b', 50, 1)]))).toEqual([
      { place: 1, teams: ['a'], tiebroken: true },
      { place: 2, teams: ['b'], tiebroken: true }
    ])
  })

  it('keeps a below-podium tie shared even when a tiebreaker ordered it', () => {
    const rows = placementRows([
      team('a', 90),
      team('b', 80),
      team('c', 70),
      team('d', 20, 1),
      team('e', 20, 0)
    ])
    expect(shape(rows)[3]).toEqual({ place: 4, teams: ['d', 'e'], tiebroken: true })
    expect(rows).toHaveLength(4)
  })

  it('partially splits a podium tier: sub-score ties share, the rest split', () => {
    expect(
      shape(placementRows([team('a', 50), team('b', 40, 2), team('c', 40, 2), team('d', 40, 1)]))
    ).toEqual([
      { place: 1, teams: ['a'], tiebroken: false },
      { place: 2, teams: ['b', 'c'], tiebroken: true },
      { place: 3, teams: ['d'], tiebroken: true }
    ])
  })
})

describe('revealUnits', () => {
  it('returns nothing for zero tiers', () => {
    expect(revealUnits(0)).toEqual([])
  })

  it('reveals each tier individually for 1-3 tiers, worst first', () => {
    expect(revealUnits(1)).toEqual([[0]])
    expect(revealUnits(2)).toEqual([[1], [0]])
    expect(revealUnits(3)).toEqual([[2], [1], [0]])
  })

  it('groups rank-4-and-below tiers into one block, then 3/2/1', () => {
    expect(revealUnits(4)).toEqual([[3], [2], [1], [0]])
    expect(revealUnits(6)).toEqual([[3, 4, 5], [2], [1], [0]])
  })

  it('always ends with the winning tier [0]', () => {
    for (const n of [1, 2, 3, 4, 10]) {
      const units = revealUnits(n)
      expect(units[units.length - 1]).toEqual([0])
    }
  })
})

describe('totalRevealSteps', () => {
  it('caps at 4 (block + podium tiers)', () => {
    expect(totalRevealSteps(0)).toBe(0)
    expect(totalRevealSteps(1)).toBe(1)
    expect(totalRevealSteps(3)).toBe(3)
    expect(totalRevealSteps(4)).toBe(4)
    expect(totalRevealSteps(25)).toBe(4)
  })
})

describe('revealedGroups', () => {
  it('reveals nothing at step 0', () => {
    expect(revealedGroups(6, 0)).toEqual(new Set())
  })

  it('reveals bottom-up and monotonically for 6 tiers', () => {
    expect(revealedGroups(6, 1)).toEqual(new Set([3, 4, 5]))
    expect(revealedGroups(6, 2)).toEqual(new Set([2, 3, 4, 5]))
    expect(revealedGroups(6, 3)).toEqual(new Set([1, 2, 3, 4, 5]))
    expect(revealedGroups(6, 4)).toEqual(new Set([0, 1, 2, 3, 4, 5]))
  })

  it('clamps steps beyond the total', () => {
    expect(revealedGroups(3, 99)).toEqual(new Set([0, 1, 2]))
  })
})

describe('tieGroups', () => {
  it('returns no groups when all scores are distinct', () => {
    expect(tieGroups([team('a', 3), team('b', 2), team('c', 1)])).toEqual([])
  })

  it('keeps only 2+ member tiers, best → worst', () => {
    const groups = tieGroups([
      team('a', 2),
      team('b', 2),
      team('c', 7),
      team('d', 7),
      team('e', 5)
    ])
    expect(groups.map((g) => g[0].score)).toEqual([7, 2])
    expect(groups.map((g) => g.length)).toEqual([2, 2])
  })

  it('handles a 3-way tie', () => {
    const groups = tieGroups([team('a', 4), team('b', 4), team('c', 4)])
    expect(groups).toHaveLength(1)
    expect(groups[0]).toHaveLength(3)
  })
})
