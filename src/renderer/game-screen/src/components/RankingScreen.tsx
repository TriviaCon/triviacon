import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { Team } from '@shared/types/quiz'
import type { RankingMode } from '@shared/types/state'
import {
  formatScore,
  placementRows,
  totalRevealSteps,
  revealedGroups,
  type PlacementRow
} from '@shared/ranking'

import fanfareFF5 from '../assets/FF5_Victory_(Fanfare).ogg'
import fanfareNFL from '../assets/NFL_FOX.mp3'
import fanfarePokemon from '../assets/Pokemon_1gen.mp3'

const FANFARES: Record<string, string> = {
  ff5: fanfareFF5,
  nfl: fanfareNFL,
  pokemon: fanfarePokemon
}

// ── Fireworks ───────────────────────────────────────────────

function Fireworks() {
  return (
    <div className="pyro fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <div className="before" />
      <div className="after" />
    </div>
  )
}

// ── Medal colours + sizes (by podium tier) ──────────────────

const MEDAL_STYLES = [
  { emoji: '🥇', color: 'text-yellow-400' },
  { emoji: '🥈', color: 'text-slate-300' },
  { emoji: '🥉', color: 'text-amber-500' }
]

const sizeClasses = ['text-[4.5rem]', 'text-[3.5rem]', 'text-[2.9rem]', 'text-[1.7rem]']

// ── RankingScreen ─────────────────────────────────────────────

interface Props {
  teams: Team[]
  mode: RankingMode
  revealStep: number
  tiebreakerTeamIds: string[] | null
}

const RankingScreen = ({ teams, mode, revealStep, tiebreakerTeamIds }: Props) => {
  const { t, i18n } = useTranslation()
  const pts = t('gameScreen.points')

  // A placement row: place + score anchor the first line; tied teams stack
  // beneath; a tiebroken row carries a badge so equal scores read intentionally.
  const renderRow = (row: PlacementRow, label: string, size: string, colorClass = '') => {
    const scoreSuffix = `${formatScore(row.score, i18n.language)} ${pts}`
    const badge = row.tiebroken ? (
      <p className="text-[1.3rem] font-normal text-center opacity-70">
        ⚔️ {t('gameScreen.tiebreakerResolved')}
      </p>
    ) : null
    return (
      <div className={`flex flex-col items-center leading-tight ${colorClass}`}>
        {row.teams.map((tm, i) => (
          <p key={tm.id} className={`${size} font-semibold text-center`}>
            {i === 0 ? `${label} ${tm.name}: ${scoreSuffix}` : tm.name}
          </p>
        ))}
        {badge}
      </div>
    )
  }

  const rows = placementRows(teams)
  const total = totalRevealSteps(rows.length)
  const isFinal = mode === 'final'
  const celebrate = isFinal && total > 0 && revealStep >= total
  const revealed = revealedGroups(rows.length, revealStep)

  const tiebreakerActive = !!(tiebreakerTeamIds && tiebreakerTeamIds.length > 0)

  // Fanfare on the winning-tier reveal; cancelled/stopped on step-back or unmount.
  useEffect(() => {
    if (!celebrate) return
    let cancelled = false
    let audio: HTMLAudioElement | null = null
    Promise.all([window.api.getFanfare(), window.api.getDefaultVolume()]).then(([sound, volume]) => {
      if (cancelled) return
      audio = new Audio(FANFARES[sound] ?? fanfareFF5)
      audio.volume = volume
      audio.play().catch(() => {/* autoplay blocked */})
    })
    return () => {
      cancelled = true
      audio?.pause()
    }
  }, [celebrate])

  const title = tiebreakerActive
    ? t('gameScreen.tiebreaker')
    : isFinal
      ? t('gameScreen.finalResults')
      : t('gameScreen.ranking')

  // ── Body ──────────────────────────────────────────────────
  let body: React.ReactNode

  if (teams.length === 0) {
    body = <div className="text-[4rem]">{t('gameScreen.noTeams')}</div>
  } else if (tiebreakerActive) {
    // The tied group only, ordered by their live tiebreak sub-score — the point
    // is to separate them without moving the main score.
    const tied = teams
      .filter((tm) => tiebreakerTeamIds!.includes(tm.id))
      .sort((a, b) => b.tiebreakScore - a.tiebreakScore)
    body = tied.map((team, index) => (
      <p key={team.id} className={`${sizeClasses[Math.min(index, 2)]} font-semibold text-center`}>
        {team.name}: {team.tiebreakScore}
      </p>
    ))
  } else if (isFinal) {
    // Podium rows fill bottom-up. A tiebreaker-split tie occupies distinct medal
    // steps (its rows have consecutive places 1..3); an unresolved tie shares one.
    const podium = [0, 1, 2].filter((i) => i < rows.length)
    body = (
      <>
        {podium.map((i) => {
          const medal = MEDAL_STYLES[i]
          const size = sizeClasses[i]
          if (revealed.has(i)) {
            return (
              <React.Fragment key={i}>
                {renderRow(rows[i], `${medal.emoji} ${rows[i].place}.`, size, medal.color)}
              </React.Fragment>
            )
          }
          return (
            <p key={i} className={`${size} font-semibold text-center opacity-25`}>
              {medal.emoji} {i + 1}. <span className="tracking-[0.4em]">·····</span>
            </p>
          )
        })}

        {rows.length > 3 &&
          (revealed.has(3) ? (
            <div className="mt-4 flex flex-col items-center gap-1">
              {rows.slice(3).map((row) => (
                <React.Fragment key={row.teams[0].id}>
                  {renderRow(row, `${row.place}.`, sizeClasses[3])}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <p className={`${sizeClasses[3]} font-semibold text-center opacity-25 mt-4`}>
              4+ <span className="tracking-[0.4em]">·····</span>
            </p>
          ))}
      </>
    )
  } else {
    // Regular mode: plain row list, top 3 larger, no medals; ties share a row.
    body = rows.map((row, gi) => (
      <React.Fragment key={row.teams[0].id}>
        {renderRow(row, `${row.place}.`, sizeClasses[Math.min(gi, 3)])}
        {gi === 2 && rows.length > 3 && <div className="h-8" />}
      </React.Fragment>
    ))
  }

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {celebrate && <Fireworks />}

      <h1 className="text-[4rem] font-bold text-center pt-8 pb-4 shrink-0" style={{ zIndex: 1 }}>
        {title}
      </h1>
      <hr className="border-border shrink-0 mx-8" style={{ zIndex: 1 }} />

      <div
        className="flex-1 flex flex-col items-center justify-center gap-4 px-8 py-6"
        style={{ zIndex: 1 }}
      >
        {body}
      </div>
    </div>
  )
}

export default RankingScreen
