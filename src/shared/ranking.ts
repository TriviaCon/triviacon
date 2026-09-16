import type { Team } from './types/quiz'

/**
 * Teams grouped into place tiers by equal score, best → worst (dense ranking).
 * Tied teams share a tier; each distinct score is the next place. So
 * [50, 50, 40, 25, 25] → tiers at ranks 1, 2, 3 (the 50-pair, the 40, the 25-pair).
 * Within a tier, teams are ordered by tiebreak sub-score (best first) so a
 * resolved tie reads in finishing order.
 */
export function placeGroups(teams: Team[]): Team[][] {
  const sorted = [...teams].sort(
    (a, b) => b.score - a.score || b.tiebreakScore - a.tiebreakScore
  )
  const groups: Team[][] = []
  for (const team of sorted) {
    const last = groups[groups.length - 1]
    if (last && last[0].score === team.score) last.push(team)
    else groups.push([team])
  }
  return groups
}

/** A rendered ranking row: one place, shared by 1+ teams. */
export interface PlacementRow {
  place: number
  score: number
  /** Teams on this row, best tiebreak sub-score first. >1 = genuinely tied. */
  teams: Team[]
  /** This row came from a score-tier a tiebreaker ordered (badge the split). */
  tiebroken: boolean
}

const PODIUM_PLACES = 3

/**
 * Ranking rows for display. Below the podium a score-tie stays one shared row
 * (stacked in tiebreak order). On the podium a score-tie the tiebreaker resolved
 * (distinct sub-scores) splits into separate placements, pushing lower teams
 * down — prize positions must be unambiguous. An unresolved tie (equal sub-scores)
 * always shares its row.
 */
export function placementRows(teams: Team[]): PlacementRow[] {
  const rows: PlacementRow[] = []
  let place = 1
  for (const tier of placeGroups(teams)) {
    const resolved = new Set(tier.map((t) => t.tiebreakScore)).size > 1
    if (place <= PODIUM_PLACES && resolved) {
      for (let i = 0; i < tier.length; ) {
        let j = i + 1
        while (j < tier.length && tier[j].tiebreakScore === tier[i].tiebreakScore) j++
        rows.push({ place, score: tier[i].score, teams: tier.slice(i, j), tiebroken: true })
        place += 1
        i = j
      }
    } else {
      rows.push({ place, score: tier[0].score, teams: tier, tiebroken: resolved })
      place += 1
    }
  }
  return rows
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

/**
 * Print a score. Hosts can award halves, and the decimal separator is a
 * language matter (3,5 in Polish, 3.5 in English), so every place that shows a
 * score goes through here rather than interpolating the raw number.
 */
export function formatScore(score: number, language = 'en'): string {
  return new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(score)
}
