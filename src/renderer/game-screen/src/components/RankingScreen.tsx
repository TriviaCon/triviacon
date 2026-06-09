import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { Team } from '@shared/types/quiz'

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

// ── Medal colours ────────────────────────────────────────────

const MEDAL_STYLES = [
  { emoji: '🥇', color: 'text-yellow-400' },
  { emoji: '🥈', color: 'text-slate-300'  },
  { emoji: '🥉', color: 'text-amber-500'  },
]

const sizeClasses = ['text-[4.5rem]', 'text-[3.5rem]', 'text-[2.9rem]', 'text-[1.7rem]']

// ── RankingScreen ─────────────────────────────────────────────

const RankingScreen = ({ teams, revealed }: { teams: Team[]; revealed: boolean }) => {
  const { t } = useTranslation()
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score)
  const pts = t('gameScreen.points')

  // Play fanfare + read volume when revealed
  useEffect(() => {
    if (!revealed) return
    Promise.all([
      window.api.getFanfare(),
      window.api.getDefaultVolume()
    ]).then(([sound, volume]) => {
      const src = FANFARES[sound] ?? fanfareFF5
      const audio = new Audio(src)
      audio.volume = volume
      audio.play().catch(() => {/* autoplay blocked */})
    })
  }, [revealed])

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {revealed && <Fireworks />}

      {/* Header — fixed at top */}
      <h1 className="text-[4rem] font-bold text-center pt-8 pb-4 shrink-0" style={{ zIndex: 1 }}>
        {t('gameScreen.ranking')}
      </h1>
      <hr className="border-border shrink-0 mx-8" style={{ zIndex: 1 }} />

      {/* Content — vertically centred in remaining space */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 py-6" style={{ zIndex: 1 }}>
        {sortedTeams.length === 0 ? (
          <div className="text-[4rem]">{t('gameScreen.noTeams')}</div>
        ) : (
          sortedTeams.map((team, index) => {
            const sizeClass = sizeClasses[Math.min(index, 3)]
            const medal = MEDAL_STYLES[index]
            const isPodium = index < 3

            if (isPodium && revealed) {
              return (
                <p key={team.id} className={`${sizeClass} font-semibold text-center ${medal.color}`}>
                  {medal.emoji} {index + 1}. {team.name}: {team.score} {pts}
                </p>
              )
            }

            // Non-podium or pre-reveal
            return (
              <React.Fragment key={team.id}>
                <p className={`${sizeClass} font-semibold text-center`}>
                  {index + 1}. {team.name}: {team.score} {pts}
                </p>
                {index === 2 && sortedTeams.length > 3 && <div className="h-8" />}
              </React.Fragment>
            )
          })
        )}
      </div>
    </div>
  )
}

export default RankingScreen
