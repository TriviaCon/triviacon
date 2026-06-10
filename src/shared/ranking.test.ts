import { describe, it, expect } from 'vitest'
import { placeGroups, revealUnits, totalRevealSteps, revealedGroups, tieGroups } from './ranking'
import type { Team } from './types/quiz'

const team = (id: string, score: number): Team => ({ id, name: id, score })

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
