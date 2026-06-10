import { describe, it, expect } from 'vitest'
import { revealGroups, totalRevealSteps, revealedIndices, tieGroups } from './ranking'
import type { Team } from './types/quiz'

const team = (id: string, score: number): Team => ({ id, name: id, score })

describe('revealGroups', () => {
  it('returns nothing for zero teams', () => {
    expect(revealGroups(0)).toEqual([])
  })

  it('reveals each place individually for 1-3 teams, lowest first', () => {
    expect(revealGroups(1)).toEqual([[0]])
    expect(revealGroups(2)).toEqual([[1], [0]])
    expect(revealGroups(3)).toEqual([[2], [1], [0]])
  })

  it('groups 4th-and-below into one block, then 3/2/1', () => {
    expect(revealGroups(4)).toEqual([[3], [2], [1], [0]])
    expect(revealGroups(6)).toEqual([[3, 4, 5], [2], [1], [0]])
  })

  it('always ends with first place [0]', () => {
    for (const n of [1, 2, 3, 4, 10]) {
      const groups = revealGroups(n)
      expect(groups[groups.length - 1]).toEqual([0])
    }
  })
})

describe('totalRevealSteps', () => {
  it('is 0 for no teams and caps at 4 for podium + block', () => {
    expect(totalRevealSteps(0)).toBe(0)
    expect(totalRevealSteps(1)).toBe(1)
    expect(totalRevealSteps(2)).toBe(2)
    expect(totalRevealSteps(3)).toBe(3)
    expect(totalRevealSteps(4)).toBe(4)
    expect(totalRevealSteps(25)).toBe(4)
  })
})

describe('revealedIndices', () => {
  it('reveals nothing at step 0', () => {
    expect(revealedIndices(6, 0)).toEqual(new Set())
  })

  it('reveals bottom-up and monotonically for 6 teams', () => {
    expect(revealedIndices(6, 1)).toEqual(new Set([3, 4, 5]))
    expect(revealedIndices(6, 2)).toEqual(new Set([2, 3, 4, 5]))
    expect(revealedIndices(6, 3)).toEqual(new Set([1, 2, 3, 4, 5]))
    expect(revealedIndices(6, 4)).toEqual(new Set([0, 1, 2, 3, 4, 5]))
  })

  it('clamps steps beyond the total', () => {
    expect(revealedIndices(3, 99)).toEqual(new Set([0, 1, 2]))
  })
})

describe('tieGroups', () => {
  it('returns no groups when all scores are distinct', () => {
    expect(tieGroups([team('a', 3), team('b', 2), team('c', 1)])).toEqual([])
  })

  it('ignores singletons and keeps only 2+ member ties', () => {
    const groups = tieGroups([team('a', 5), team('b', 5), team('c', 3)])
    expect(groups).toEqual([[team('a', 5), team('b', 5)]])
  })

  it('handles a 3-way tie', () => {
    const groups = tieGroups([team('a', 4), team('b', 4), team('c', 4)])
    expect(groups).toHaveLength(1)
    expect(groups[0]).toHaveLength(3)
  })

  it('returns multiple tie groups ordered by score descending', () => {
    const groups = tieGroups([
      team('a', 2),
      team('b', 2),
      team('c', 7),
      team('d', 7),
      team('e', 5)
    ])
    expect(groups.map((g) => g[0].score)).toEqual([7, 2])
  })
})
