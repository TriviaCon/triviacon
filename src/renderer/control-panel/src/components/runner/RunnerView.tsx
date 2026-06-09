import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import TeamTable from './TeamTable'
import QuizTree from '../builder/QuizTree'
import { useGameState } from '@renderer/hooks/useGameState'
import { useQuestion } from '@renderer/hooks/useQuestion'
import { useAnswerOptions } from '@renderer/hooks/useAnswerOptions'
import BasicQuestionViewer from './BasicQuestionViewer'
import { QueryLoading, QueryError } from '@renderer/components/ui/query-state'
import { usePairQueryState } from '@renderer/hooks/usePairQueryState'
import { GamePhase } from '@shared/types/state'

const QuestionColumn = ({ id }: { id: number }) => {
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

  return (
    <BasicQuestionViewer
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
    />
  )
}

export const RunnerView = () => {
  const { t } = useTranslation()
  const { categories, usedQuestions, selectedQuestionId, activeQuestion, phase, timer, quizMeta } = useGameState()
  const [stickyPreviewId, setStickyPreviewId] = useState<number | null>(null)

  // Remember whichever id is currently being previewed (selection wins, else active).
  useEffect(() => {
    const currentId = selectedQuestionId ?? activeQuestion?.question.id ?? null
    if (currentId !== null) {
      setStickyPreviewId(currentId)
    }
  }, [selectedQuestionId, activeQuestion?.question.id])

  // Drop sticky preview when host navigates back to category list / splash / ranking.
  useEffect(() => {
    if (phase === GamePhase.Categories || phase === GamePhase.Splash || phase === GamePhase.Ranking || phase === GamePhase.Idle) {
      setStickyPreviewId(null)
    }
  }, [phase])

  const previewQuestionId = stickyPreviewId

  if (!categories.length) return null

  const handleCategoryClicked = (id: number | null) => {
    if (!id) return
    window.api.selectCategory(id)
  }

  const handleQuestionClicked = (id: number | null) => {
    if (!id) return
    window.api.selectQuestion(id)
  }

  const timerDuration = quizMeta?.timerSeconds ?? 0
  const isRunning = timer.status === 'running'
  const isPaused = timer.status === 'paused'
  const isExpired = timer.status === 'expired'
  const mm = String(Math.floor(timer.remaining / 60)).padStart(2, '0')
  const ss = String(timer.remaining % 60).padStart(2, '0')

  return (
    <div className="w-full h-full flex flex-col gap-2">
    {timerDuration > 0 && (
        <div className="flex items-center gap-2 shrink-0 pb-2 border-b border-border">
          <span className={`font-mono text-lg font-semibold tabular-nums w-14 ${isExpired ? 'text-destructive' : ''}`}>
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
      <div className="flex-1 min-h-0 flex">
      <div className="w-1/4 min-w-[240px] border-r border-border pr-3">
        <TeamTable />
      </div>
      <div className="flex-1 pl-3 flex">
        <div className="w-1/3 min-w-[200px]">
          <QuizTree
            categories={categories}
            setSelectedCategory={handleCategoryClicked}
            setSelectedQuestion={handleQuestionClicked}
            editable={false}
            usedQuestions={usedQuestions}
          />
        </div>
        <div className="flex-1 pl-3">
          {previewQuestionId && <QuestionColumn id={previewQuestionId} />}
        </div>
      </div>
      </div>
    </div>
  )
}
