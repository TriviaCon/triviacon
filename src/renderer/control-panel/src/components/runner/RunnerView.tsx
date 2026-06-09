import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import TeamTable from './TeamTable'
import QuestionPreview from './QuestionPreview'
import { RunnerQuestionList } from './RunnerQuestionList'
import { useGameState } from '@renderer/hooks/useGameState'
import { useQuestion } from '@renderer/hooks/useQuestion'
import { useAnswerOptions } from '@renderer/hooks/useAnswerOptions'
import { QueryLoading, QueryError } from '@renderer/components/ui/query-state'
import { usePairQueryState } from '@renderer/hooks/usePairQueryState'
import { GamePhase } from '@shared/types/state'

// ── Category sidebar (runner read-only variant) ─────────────────

function RunnerCategorySidebar({
  categories,
  selectedCategoryId,
  usedQuestions,
  onSelect
}: {
  categories: { id: number; name: string; questionCount: number; sortOrder: number }[]
  selectedCategoryId: number | null
  usedQuestions: number[]
  onSelect: (id: number | null) => void
}) {
  const { t } = useTranslation()

  return (
    <aside className="w-56 shrink-0 border-r border-border flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b border-border shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('actions.categories')}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        <div
          className={cn(
            'flex items-center gap-1 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors select-none',
            selectedCategoryId === null ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
          )}
          onClick={() => onSelect(null)}
        >
          <span className="flex-1">{t('builder.allQuestions')}</span>
        </div>
        {categories.map((cat) => (
          <div
            key={cat.id}
            className={cn(
              'flex items-center gap-1 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors select-none',
              selectedCategoryId === cat.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            )}
            onClick={() => onSelect(cat.id)}
          >
            <span className="flex-1 truncate">{cat.name}</span>
            <span className={cn('text-xs shrink-0 tabular-nums', selectedCategoryId === cat.id ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
              {cat.questionCount}
            </span>
          </div>
        ))}
      </div>
    </aside>
  )
}

// ── Question preview column ─────────────────────────────────────

const PreviewColumn = ({
  id,
  phase,
  selectedQuestionId
}: {
  id: number
  phase: GamePhase
  selectedQuestionId: number | null
}) => {
  const { t } = useTranslation()
  const { revealedAnswers, usedQuestions, activeQuestion } = useGameState()
  const question = useQuestion(id)
  const answerOptions = useAnswerOptions(id)

  const guard = usePairQueryState(question, answerOptions)
  if (!guard.ok) {
    if (guard.loading) return <QueryLoading label={t('builder.loadingQuestion')} />
    if (guard.errorMessage) return <QueryError message={guard.errorMessage} />
    return null
  }

  const markedAnswerId =
    activeQuestion?.question.id === id ? (activeQuestion.markedAnswerId ?? null) : null
  const revealedOptionIds =
    activeQuestion?.question.id === id ? (activeQuestion.revealedOptionIds ?? []) : []

  // "Show on screen" is available when this question is selected (previewed) but not yet active
  const isActiveOnScreen = activeQuestion?.question.id === id
  const isPending = selectedQuestionId === id && !isActiveOnScreen
  const canShow = phase === GamePhase.Questions && isPending

  return (
    <QuestionPreview
      question={question.data!}
      answerOptions={answerOptions.data!}
      answerRevealed={revealedAnswers.includes(id)}
      onRevealAnswer={() => window.api.toggleAnswer(id)}
      markedAnswerId={markedAnswerId}
      onMarkAnswer={(answerId) => window.api.markAnswer(answerId)}
      revealedOptionIds={revealedOptionIds}
      onToggleListOption={(optId) => window.api.toggleListOption(optId)}
      used={usedQuestions.includes(id)}
      onUse={() => window.api.markUsed(id)}
      onShowOnScreen={canShow ? () => window.api.showQuestion(id) : null}
    />
  )
}

// ── Runner view ─────────────────────────────────────────────────

export const RunnerView = () => {
  const { t } = useTranslation()
  const {
    categories,
    usedQuestions,
    selectedQuestionId,
    activeQuestion,
    phase,
    timer,
    quizMeta
  } = useGameState()

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [stickyPreviewId, setStickyPreviewId] = useState<number | null>(null)

  useEffect(() => {
    const currentId = selectedQuestionId ?? activeQuestion?.question.id ?? null
    if (currentId !== null) setStickyPreviewId(currentId)
  }, [selectedQuestionId, activeQuestion?.question.id])

  useEffect(() => {
    if (
      phase === GamePhase.Categories ||
      phase === GamePhase.Splash ||
      phase === GamePhase.Ranking ||
      phase === GamePhase.Idle
    ) {
      setStickyPreviewId(null)
    }
  }, [phase])

  // Keyboard shortcut: Enter = show on screen, Escape = clear selection
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'Enter' && selectedQuestionId !== null && phase === GamePhase.Questions) {
        e.preventDefault()
        window.api.showQuestion(selectedQuestionId)
      } else if (e.key === 'Escape' && selectedQuestionId !== null) {
        e.preventDefault()
        window.api.selectQuestion(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedQuestionId, phase])

  if (!categories.length) return null

  const handleQuestionClick = (id: number) => {
    if (selectedQuestionId === id) {
      window.api.selectQuestion(null)
    } else {
      window.api.selectQuestion(id)
    }
  }

  const timerDuration = quizMeta?.timerSeconds ?? 0
  const isRunning = timer.status === 'running'
  const isPaused = timer.status === 'paused'
  const isExpired = timer.status === 'expired'
  const mm = String(Math.floor(timer.remaining / 60)).padStart(2, '0')
  const ss = String(timer.remaining % 60).padStart(2, '0')

  return (
    <div className="w-full h-full flex flex-col gap-0 overflow-hidden">
      {timerDuration > 0 && (
        <div className="flex items-center gap-2 shrink-0 px-3 py-2 border-b border-border">
          <span className={cn('font-mono text-lg font-semibold tabular-nums w-14', isExpired && 'text-destructive')}>
            {mm}:{ss}
          </span>
          <Button size="sm" variant="outline" onClick={() => window.api.timerStart()} disabled={isRunning || isExpired}>
            <Play className="h-3 w-3" />
            {t('runner.timerStart')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.api.timerPause()} disabled={!isRunning}>
            <Pause className="h-3 w-3" />
            {t('runner.timerPause')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.api.timerReset()} disabled={timer.status === 'idle'}>
            <RotateCcw className="h-3 w-3" />
            {t('runner.timerReset')}
          </Button>
        </div>
      )}

      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Teams */}
        <div className="w-48 shrink-0 border-r border-border overflow-y-auto">
          <TeamTable />
        </div>

        {/* Category sidebar */}
        <RunnerCategorySidebar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          usedQuestions={usedQuestions}
          onSelect={(id) => {
            setSelectedCategoryId(id)
            window.api.selectQuestion(null)
          }}
        />

        {/* Question list */}
        <div className="flex-1 flex flex-col min-h-0 border-r border-border overflow-hidden">
          <RunnerQuestionList
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            activeQuestionId={stickyPreviewId}
            usedQuestions={usedQuestions}
            onSelect={handleQuestionClick}
          />
        </div>

        {/* Question preview */}
        {stickyPreviewId !== null && (
          <div className="w-[380px] shrink-0 overflow-y-auto p-4">
            <PreviewColumn
              id={stickyPreviewId}
              phase={phase}
              selectedQuestionId={selectedQuestionId}
            />
          </div>
        )}
      </div>
    </div>
  )
}
