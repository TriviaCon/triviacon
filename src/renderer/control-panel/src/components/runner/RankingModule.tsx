import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trophy, ChevronLeft, Eye, Swords, Check } from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import { Button } from '@renderer/components/ui/button'
import { ConfirmDialog } from '@renderer/components/ui/confirm-dialog'
import { useGameState } from '@renderer/hooks/useGameState'
import { tieGroups, totalRevealSteps, revealedIndices } from '@shared/ranking'
import type { Team } from '@shared/types/quiz'

// ── Tiebreaker panel (a group is being resolved) ────────────────────

function TiebreakerPanel({ teams }: { teams: Team[] }) {
  const { t } = useTranslation()
  const pts = t('gameScreen.points')
  const sorted = [...teams].sort((a, b) => b.score - a.score)

  return (
    <div className="w-full rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 space-y-3">
      <div className="flex items-center gap-2 text-amber-600 font-semibold">
        <Swords className="h-5 w-5" />
        {t('runner.tiebreakerActive')}
      </div>
      <ul className="space-y-1">
        {sorted.map((team) => (
          <li key={team.id} className="flex items-center justify-between text-lg">
            <span className="truncate">{team.name}</span>
            <span className="tabular-nums font-semibold ml-3 shrink-0">
              {team.score} {pts}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">{t('runner.tiebreakerHint')}</p>
      <Button className="w-full" variant="outline" onClick={() => window.api.setTiebreaker(null)}>
        <Check className="mr-2 h-4 w-4" />
        {t('runner.tiebreakerDone')}
      </Button>
    </div>
  )
}

// ── Ranking module ──────────────────────────────────────────────────

export function RankingModule() {
  const { t } = useTranslation()
  const { teams, rankingMode, rankingRevealStep, tiebreakerTeamIds } = useGameState()
  const [finishConfirm, setFinishConfirm] = useState(false)
  const [winnerConfirm, setWinnerConfirm] = useState(false)

  const pts = t('gameScreen.points')
  const sorted = [...teams].sort((a, b) => b.score - a.score)

  // ── Regular mode: just the Finish gate ────────────────────────────
  if (rankingMode === 'regular') {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Button
          size="lg"
          className="text-2xl font-bold px-16 py-8 h-auto bg-amber-500 hover:bg-amber-400 text-white shadow-lg"
          onClick={() => setFinishConfirm(true)}
        >
          <Trophy className="mr-3 h-8 w-8" />
          {t('actions.finishQuiz')}
        </Button>
        <ConfirmDialog
          open={finishConfirm}
          title={t('actions.finishQuiz')}
          description={t('actions.finishQuizConfirm')}
          confirmLabel={t('actions.finishQuiz')}
          onConfirm={() => {
            setFinishConfirm(false)
            window.api.finishQuiz()
          }}
          onCancel={() => setFinishConfirm(false)}
        />
      </div>
    )
  }

  // ── Final mode ────────────────────────────────────────────────────
  const total = totalRevealSteps(teams.length)
  const revealed = revealedIndices(teams.length, rankingRevealStep)
  const nextIsWinner = rankingRevealStep === total - 1
  const allRevealed = rankingRevealStep >= total
  const ties = tieGroups(teams)

  const activeTiebreakerTeams =
    tiebreakerTeamIds && tiebreakerTeamIds.length > 0
      ? teams.filter((tm) => tiebreakerTeamIds.includes(tm.id))
      : null

  const placeOf = (group: Team[]): number =>
    Math.min(...group.map((g) => sorted.findIndex((s) => s.id === g.id))) + 1

  const handleRevealNext = () => {
    if (nextIsWinner) setWinnerConfirm(true)
    else window.api.revealNext()
  }

  return (
    <div className="w-full h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-xl flex flex-col gap-5">
        <h2 className="text-xl font-bold">{t('runner.finalResults')}</h2>

        {activeTiebreakerTeams ? (
          <TiebreakerPanel teams={activeTiebreakerTeams} />
        ) : (
          <>
            {/* Ties to resolve */}
            {ties.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('runner.tieGroups')}
                </h3>
                {ties.map((group, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground">
                        {t('runner.tiedForPlace', { place: placeOf(group) })}
                      </div>
                      <div className="truncate font-medium">
                        {group.map((g) => g.name).join(', ')}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => window.api.setTiebreaker(group.map((g) => g.id))}
                    >
                      <Swords className="mr-1 h-4 w-4" />
                      {t('runner.runTiebreaker')}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Reveal stepper */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {allRevealed ? t('runner.revealAllDone') : t('runner.revealNext')}
                </span>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {rankingRevealStep} / {total}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={rankingRevealStep === 0}
                  onClick={() => window.api.revealBack()}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  {t('runner.stepBack')}
                </Button>
                <Button
                  className={cn('flex-1', nextIsWinner && 'bg-amber-500 hover:bg-amber-400 text-white')}
                  disabled={allRevealed}
                  onClick={handleRevealNext}
                >
                  {nextIsWinner ? <Trophy className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}
                  {t('runner.revealNext')}
                </Button>
              </div>
            </div>

            {/* Standings reference */}
            <ol className="space-y-1">
              {sorted.map((team, index) => (
                <li
                  key={team.id}
                  className={cn(
                    'flex items-center justify-between rounded px-2 py-1 text-sm',
                    revealed.has(index) ? 'opacity-100' : 'opacity-40'
                  )}
                >
                  <span className="truncate">
                    {index + 1}. {team.name}
                  </span>
                  <span className="tabular-nums ml-3 shrink-0">
                    {team.score} {pts}
                  </span>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>

      <ConfirmDialog
        open={winnerConfirm}
        title={t('runner.revealWinnerTitle')}
        description={t('runner.revealWinnerConfirm')}
        confirmLabel={t('runner.revealNext')}
        onConfirm={() => {
          setWinnerConfirm(false)
          window.api.revealNext()
        }}
        onCancel={() => setWinnerConfirm(false)}
      />
    </div>
  )
}
