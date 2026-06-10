import type { Team } from './types/quiz'

/**
 * Reveal groups for the Final-mode reverse reveal, ordered bottom → top.
 *
 * - More than 3 teams: the 4th-and-below positions are one block, then 3rd, 2nd, 1st individually.
 *   e.g. 5 teams → [[3, 4], [2], [1], [0]]
 * - 3 or fewer teams: each position individually from the lowest up.
 *   3 → [[2], [1], [0]]; 2 → [[1], [0]]; 1 → [[0]]; 0 → []
 *
 * Indices are into the score-descending team list. The last group is always [0] (1st place),
 * whose reveal triggers the celebration.
 */
export function revealGroups(teamCount: number): number[][] {
  if (teamCount <= 0) return []

  const groups: number[][] = []

  if (teamCount > 3) {
    groups.push(Array.from({ length: teamCount - 3 }, (_, i) => i + 3))
  }

  const podiumTop = Math.min(teamCount, 3)
  for (let idx = podiumTop - 1; idx >= 0; idx--) {
    groups.push([idx])
  }

  return groups
}

/** Total number of reveal presses to fully reveal `teamCount` teams. */
export function totalRevealSteps(teamCount: number): number {
  return revealGroups(teamCount).length
}

/** Sorted-list indices revealed after `step` presses (0 = none revealed). */
export function revealedIndices(teamCount: number, step: number): Set<number> {
  const groups = revealGroups(teamCount)
  const revealed = new Set<number>()
  for (let g = 0; g < step && g < groups.length; g++) {
    for (const idx of groups[g]) revealed.add(idx)
  }
  return revealed
}

/**
 * Teams sharing a score, grouped — only groups with 2+ members (actual ties).
 * Groups are ordered by score descending; within a group, input order is preserved.
 */
export function tieGroups(teams: Team[]): Team[][] {
  const byScore = new Map<number, Team[]>()
  for (const team of teams) {
    const bucket = byScore.get(team.score)
    if (bucket) bucket.push(team)
    else byScore.set(team.score, [team])
  }

  return [...byScore.entries()]
    .filter(([, members]) => members.length >= 2)
    .sort((a, b) => b[0] - a[0])
    .map(([, members]) => members)
}
