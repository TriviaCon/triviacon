import type { Team } from './types/quiz'

/**
 * Teams grouped into place tiers by equal score, best → worst (dense ranking).
 * Tied teams share a tier; each distinct score is the next place. So
 * [50, 50, 40, 25, 25] → tiers at ranks 1, 2, 3 (the 50-pair, the 40, the 25-pair).
 */
export function placeGroups(teams: Team[]): Team[][] {
  const sorted = [...teams].sort((a, b) => b.score - a.score)
  const groups: Team[][] = []
  for (const team of sorted) {
    const last = groups[groups.length - 1]
    if (last && last[0].score === team.score) last.push(team)
    else groups.push([team])
  }
  return groups
}

/**
 * Reveal order over place-group indices, bottom → top.
 *  - More than 3 tiers: rank-4-and-below tiers as one block, then 3rd, 2nd, 1st individually.
 *    e.g. 5 tiers → [[3, 4], [2], [1], [0]]
 *  - 3 or fewer tiers: each tier from worst to best.
 * The last unit is always [0] (the winning tier), whose reveal triggers the celebration.
 */
export function revealUnits(groupCount: number): number[][] {
  if (groupCount <= 0) return []

  const units: number[][] = []
  if (groupCount > 3) {
    units.push(Array.from({ length: groupCount - 3 }, (_, i) => i + 3))
  }

  const top = Math.min(groupCount, 3)
  for (let g = top - 1; g >= 0; g--) units.push([g])

  return units
}

/** Total number of reveal presses to fully reveal a ranking with `groupCount` tiers. */
export function totalRevealSteps(groupCount: number): number {
  return revealUnits(groupCount).length
}

/** Place-group indices revealed after `step` presses (0 = none revealed). */
export function revealedGroups(groupCount: number, step: number): Set<number> {
  const units = revealUnits(groupCount)
  const revealed = new Set<number>()
  for (let u = 0; u < step && u < units.length; u++) {
    for (const g of units[u]) revealed.add(g)
  }
  return revealed
}

/** Place tiers shared by 2+ teams (actual ties), best → worst. */
export function tieGroups(teams: Team[]): Team[][] {
  return placeGroups(teams).filter((group) => group.length >= 2)
}
