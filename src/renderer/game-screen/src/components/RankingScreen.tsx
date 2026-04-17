import React from 'react'
import { useTranslation } from 'react-i18next'
import type { Team } from '@shared/types/quiz'

const sizeClasses = [
  'text-[4.5rem]', // 1st
  'text-[3.5rem]', // 2nd
  'text-[2.9rem]', // 3rd
  'text-[1.7rem]' // 4th+
]

const RankingScreen = ({ teams }: { teams: Team[] }) => {
  const { t } = useTranslation()
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score)
  const pts = t('gameScreen.points')

  return (
    <div className="text-center p-8">
      <h1 className="text-[4rem] font-bold">{t('gameScreen.ranking')}</h1>
      <hr className="border-border my-4" />
      {sortedTeams.length === 0 ? (
        <div className="text-[4rem]">{t('gameScreen.noTeams')}</div>
      ) : (
        sortedTeams.map((team, index) => {
          const sizeClass = sizeClasses[Math.min(index, 3)]

          let displayText: string
          if (index === 0)
            displayText = `\u{1F947} ${index + 1}. ${team.name}: ${team.score} ${pts} \u{1F947}`
          else if (index === 1)
            displayText = `\u{1F948} ${index + 1}. ${team.name}: ${team.score} ${pts} \u{1F948}`
          else if (index === 2)
            displayText = `\u{1F949} ${index + 1}. ${team.name}: ${team.score} ${pts} \u{1F949}`
          else displayText = `${index + 1}. ${team.name}: ${team.score} ${pts}`

          return (
            <React.Fragment key={team.id}>
              <p className={`${sizeClass} my-2 font-semibold`}>{displayText}</p>
              {index === 2 && sortedTeams.length > 3 && <div className="h-14" />}
            </React.Fragment>
          )
        })
      )}
    </div>
  )
}

export default RankingScreen
