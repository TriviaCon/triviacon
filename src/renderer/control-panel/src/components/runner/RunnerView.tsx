import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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

  return (
    <BasicQuestionViewer
      question={question.data!}
      answerOptions={answerOptions.data!}
      answerRevealed={revealedAnswers.includes(id)}
      onRevealAnswer={() => window.api.toggleAnswer(id)}
      markedAnswerId={markedAnswerId}
      onMarkAnswer={(answerId) => window.api.markAnswer(answerId)}
      used={usedQuestions.includes(id)}
      onUse={() => window.api.markUsed(id)}
    />
  )
}

export const RunnerView = () => {
  const { categories, usedQuestions, selectedQuestionId, activeQuestion, phase } = useGameState()
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

  return (
    <div className="w-full h-full flex">
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
  )
}
