import { useTranslation } from 'react-i18next'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import { useGameState } from '@renderer/hooks/useGameState'

export function RunnerTimer() {
  const { t } = useTranslation()
  const { timer, quizMeta } = useGameState()

  const timerDuration = quizMeta?.timerSeconds ?? 0
  if (timerDuration === 0) return null

  const isRunning = timer.status === 'running'
  const isExpired = timer.status === 'expired'
  const isIdle = timer.status === 'idle'
  const mm = String(Math.floor(timer.remaining / 60)).padStart(2, '0')
  const ss = String(timer.remaining % 60).padStart(2, '0')

  return (
    <div className="flex flex-col items-center justify-center gap-1 px-5 border-l border-border bg-background shrink-0 self-stretch">
      <span
        className={cn(
          'font-mono font-bold tabular-nums leading-none',
          isExpired ? 'text-destructive text-5xl' : 'text-4xl'
        )}
      >
        {mm}:{ss}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          title={t('runner.timerStart')}
          disabled={isRunning || isExpired}
          className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium border border-border hover:bg-accent transition-colors disabled:opacity-40 disabled:pointer-events-none"
          onClick={() => window.api.timerStart()}
        >
          <Play className="h-3 w-3" /> {t('runner.timerStart')}
        </button>
        <button
          type="button"
          title={t('runner.timerPause')}
          disabled={!isRunning}
          className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium border border-border hover:bg-accent transition-colors disabled:opacity-40 disabled:pointer-events-none"
          onClick={() => window.api.timerPause()}
        >
          <Pause className="h-3 w-3" /> {t('runner.timerPause')}
        </button>
        <button
          type="button"
          title={t('runner.timerReset')}
          disabled={isIdle}
          className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium border border-border hover:bg-accent transition-colors disabled:opacity-40 disabled:pointer-events-none"
          onClick={() => window.api.timerReset()}
        >
          <RotateCcw className="h-3 w-3" /> {t('runner.timerReset')}
        </button>
      </div>
    </div>
  )
}
