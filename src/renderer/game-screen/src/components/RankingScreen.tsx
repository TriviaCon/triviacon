import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { Team } from '@shared/types/quiz'
import type { RankingMode } from '@shared/types/state'
import { totalRevealSteps, revealedIndices } from '@shared/ranking'

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

// ── Medal colours + sizes ────────────────────────────────────

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
  const { t } = useTranslation()
  const pts = t('gameScreen.points')
  const sorted = [...teams].sort((a, b) => b.score - a.score)

  const total = totalRevealSteps(teams.length)
  const isFinal = mode === 'final'
  const celebrate = isFinal && total > 0 && revealStep >= total
  const revealed = revealedIndices(teams.length, revealStep)

  const tiebreakerActive = !!(tiebreakerTeamIds && tiebreakerTeamIds.length > 0)

  // Fanfare on the #1 reveal; cancelled/stopped on step-back or unmount.
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
    // Just the tied group, live scores
    const tied = teams
      .filter((tm) => tiebreakerTeamIds!.includes(tm.id))
      .sort((a, b) => b.score - a.score)
    body = tied.map((team, index) => (
      <p key={team.id} className={`${sizeClasses[Math.min(index, 2)]} font-semibold text-center`}>
        {team.name}: {team.score} {pts}
      </p>
    ))
  } else if (isFinal) {
    // Placeholder slots that fill bottom-up
    const podium = [0, 1, 2].filter((i) => i < teams.length)
    body = (
      <>
        {podium.map((i) => {
          const medal = MEDAL_STYLES[i]
          const size = sizeClasses[i]
          if (revealed.has(i)) {
            const team = sorted[i]
            return (
              <p key={i} className={`${size} font-semibold text-center ${medal.color}`}>
                {medal.emoji} {i + 1}. {team.name}: {team.score} {pts}
              </p>
            )
          }
          return (
            <p key={i} className={`${size} font-semibold text-center opacity-25`}>
              {medal.emoji} {i + 1}. <span className="tracking-[0.4em]">·····</span>
            </p>
          )
        })}

        {teams.length > 3 &&
          (revealed.has(3) ? (
            <div className="mt-4 flex flex-col items-center gap-1">
              {sorted.slice(3).map((team, j) => (
                <p key={team.id} className={`${sizeClasses[3]} font-semibold text-center`}>
                  {j + 4}. {team.name}: {team.score} {pts}
                </p>
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
    // Regular mode: plain numbered list, top 3 larger, no medals
    body = sorted.map((team, index) => (
      <React.Fragment key={team.id}>
        <p className={`${sizeClasses[Math.min(index, 3)]} font-semibold text-center`}>
          {index + 1}. {team.name}: {team.score} {pts}
        </p>
        {index === 2 && sorted.length > 3 && <div className="h-8" />}
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
