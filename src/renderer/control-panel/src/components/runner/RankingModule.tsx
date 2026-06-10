import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trophy, ChevronLeft, Eye, Swords, Check } from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import { Button } from '@renderer/components/ui/button'
import { ConfirmDialog } from '@renderer/components/ui/confirm-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@renderer/components/ui/table'
import { useGameState } from '@renderer/hooks/useGameState'
import { placeGroups, totalRevealSteps, revealedGroups } from '@shared/ranking'
import type { Team } from '@shared/types/quiz'

const MEDALS = ['🥇', '🥈', '🥉']

const groupNames = (group: Team[]): string => group.map((tm) => tm.name).join(', ')

// ── Standings table (ties share a row) ──────────────────────────────

function StandingsTable({
  groups,
  revealed,
  dimUnrevealed
}: {
  groups: Team[][]
  revealed: Set<number>
  dimUnrevealed: boolean
}) {
  const { t } = useTranslation()
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-14">#</TableHead>
          <TableHead>{t('runner.teams')}</TableHead>
          <TableHead className="w-20 text-right">{t('runner.score')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {groups.map((group, gi) => (
          <TableRow
            key={group[0].id}
            className={cn(dimUnrevealed && !revealed.has(gi) && 'opacity-35')}
          >
            <TableCell className="font-semibold tabular-nums whitespace-nowrap">
              {MEDALS[gi] ? `${MEDALS[gi]} ` : ''}
              {gi + 1}
            </TableCell>
            <TableCell className="font-medium">{groupNames(group)}</TableCell>
            <TableCell className="text-right tabular-nums">{group[0].score}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// ── Tiebreaker panel (a tier is being resolved) ─────────────────────

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

  const groups = placeGroups(teams)
  const total = totalRevealSteps(groups.length)
  const revealed = revealedGroups(groups.length, rankingRevealStep)
  const isFinal = rankingMode === 'final'

  const tableBlock = (
    <StandingsTable groups={groups} revealed={revealed} dimUnrevealed={isFinal} />
  )

  // ── Regular mode: table + Finish gate ─────────────────────────────
  if (!isFinal) {
    return (
      <div className="w-full h-full overflow-y-auto p-6">
        <div className="mx-auto max-w-xl flex flex-col gap-6">
          {tableBlock}
          <Button
            size="lg"
            className="self-center text-2xl font-bold px-16 py-8 h-auto bg-amber-500 hover:bg-amber-400 text-white shadow-lg"
            onClick={() => setFinishConfirm(true)}
            disabled={teams.length === 0}
          >
            <Trophy className="mr-3 h-8 w-8" />
            {t('actions.finishQuiz')}
          </Button>
        </div>
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
  const nextIsWinner = rankingRevealStep === total - 1
  const allRevealed = rankingRevealStep >= total

  // Tie tiers (2+ teams) with their place number.
  const tieEntries = groups
    .map((group, i) => ({ group, place: i + 1 }))
    .filter((e) => e.group.length >= 2)

  const activeTiebreakerTeams =
    tiebreakerTeamIds && tiebreakerTeamIds.length > 0
      ? teams.filter((tm) => tiebreakerTeamIds.includes(tm.id))
      : null

  const handleRevealNext = () => {
    if (nextIsWinner) setWinnerConfirm(true)
    else window.api.revealNext()
  }

  return (
    <div className="w-full h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-xl flex flex-col gap-5">
        <h2 className="text-xl font-bold">{t('runner.finalResults')}</h2>

        {tableBlock}

        {activeTiebreakerTeams ? (
          <TiebreakerPanel teams={activeTiebreakerTeams} />
        ) : (
          <>
            {tieEntries.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('runner.tieGroups')}
                </h3>
                {tieEntries.map(({ group, place }) => (
                  <div
                    key={group[0].id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground">
                        {t('runner.tiedForPlace', { place })}
                      </div>
                      <div className="truncate font-medium">{groupNames(group)}</div>
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
